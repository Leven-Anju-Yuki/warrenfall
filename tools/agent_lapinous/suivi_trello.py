"""Analyse locale pure : aucune écriture, aucun réseau, aucune notification."""
from __future__ import annotations
import difflib
import hashlib
import json
import re
import subprocess
from pathlib import Path

TEXT = {'.py', '.js', '.mjs', '.json', '.md', '.html', '.css', '.ps1', '.cmd', '.txt'}


def git(root, *args):
    result = subprocess.run(['git', '--no-optional-locks', '-C', str(root), *args], capture_output=True, timeout=60)
    if result.returncode:
        raise RuntimeError('Git indisponible ou historique non accessible : ' + ' '.join(args[:2]))
    return result.stdout


def dirty_paths(root):
    """Le format NUL préserve accents, espaces, guillemets et renommages."""
    chunks = git(root, 'status', '--porcelain=v1', '-z', '-uall').decode('utf-8').split('\0')
    paths = set()
    index = 0
    while index < len(chunks):
        entry = chunks[index]
        index += 1
        if not entry:
            continue
        paths.add(entry[3:])
        if 'R' in entry[:2] or 'C' in entry[:2]:
            paths.add(chunks[index])
            index += 1
    return sorted(paths)


def permitted(path):
    parts = Path(path).parts
    return not any(part in {'.git', '.cloudinary-local', '__pycache__', '.venv', 'node_modules'}
                   or part.startswith('.env') for part in parts)


def read_state(file):
    if not file.exists():
        return None
    state = json.loads(file.read_text(encoding='utf-8'))
    if state.get('version') != 1 or not isinstance(state.get('hashes'), dict):
        raise ValueError('Point de reprise invalide : analyse arrêtée sans réinitialisation automatique.')
    return state


def collect(root, state_file, tasks, since=None):
    root = root.resolve()
    old = read_state(state_file)
    if old and old.get('root') not in (None, str(root)):
        raise ValueError('Point de reprise provenant d’un autre projet : analyse arrêtée.')
    head = git(root, 'rev-parse', 'HEAD').decode().strip()
    reference = head
    if since:
        if old:
            raise ValueError('--depuis-commit est réservé au premier passage sans point de reprise.')
        reference = git(root, 'rev-parse', '--verify', '--end-of-options', since + '^{commit}').decode().strip()
    dirty = [p for p in dirty_paths(root) if permitted(p)]
    paths = set(git(root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard')
                .decode('utf-8').split('\0')) - {''}
    text_paths = {'A_FAIRE.md'}
    for task in tasks:
        for rule in task.get('preuves', []):
            if isinstance(rule, dict):
                text_paths.add(rule.get('chemin', ''))
    hashes, texts = {}, {}
    for name in sorted(paths):
        if not permitted(name):
            continue
        file = root / name
        if file.is_symlink() or not file.is_file() or not file.resolve().is_relative_to(root):
            continue
        digest = hashlib.sha256()
        with file.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                digest.update(chunk)
        hashes[name] = digest.hexdigest()
        if name in text_paths and file.suffix in TEXT and file.stat().st_size <= 2_000_000:
            try:
                texts[name] = file.read_text(encoding='utf-8')
            except UnicodeError:
                pass
    warnings = []
    if old:
        changed = sorted(name for name in set(old['hashes']) | set(hashes)
                         if old['hashes'].get(name) != hashes.get(name))
        if old.get('head') != head:
            warnings.append('Les commits depuis le dernier point de reprise sont inclus par comparaison des contenus.')
    else:
        committed = git(root, 'diff', '--name-only', '--no-renames', '-z', reference, head).decode('utf-8').split('\0') if since else []
        changed = sorted(set(dirty) | {p for p in committed if p and permitted(p)})
        warnings.append(('Premier passage depuis le commit explicite ' + reference + '. ' if since else
                         'Premier passage : modifications locales analysées ; historique antérieur non attribué. ')
                        + 'Le premier bilan appliqué établira le point de reprise, jamais la simulation.')
    changes = {}
    for name in changed:
        previous = old.get('texts', {}).get(name) if old else None
        if previous is None and not old:
            show = subprocess.run(['git', '-C', str(root), 'show', reference + ':' + name],
                                  capture_output=True, timeout=30)
            if show.returncode == 0:
                try:
                    previous = show.stdout.decode('utf-8')
                except UnicodeError:
                    pass
            else:
                previous = ''
        current = texts.get(name)
        lines = []
        if previous is not None and current is not None:
            # Seulement les lignes ajoutées/retirées, sans contexte d'autres fonctions.
            for line in difflib.ndiff(previous.splitlines(), current.splitlines()):
                if line.startswith(('+ ', '- ')):
                    lines.append(line[2:])
        changes[name] = {'lignes': lines, 'texte_disponible': previous is not None and current is not None,
                         'existe': name in hashes}
    return changes, {'version': 1, 'root': str(root), 'head': head, 'hashes': hashes, 'texts': texts}, warnings


def progress(todo, card_id):
    main = []
    main_lines = []
    subtask_lines = {}
    subtasks = []
    pattern = re.compile(r'^\s*[-*]\s*\[([ xX])\].*?\[trello:' + re.escape(card_id)
                         + r'(?::(code|manuel):([\w-]+))?\]')
    for line_number, line in enumerate(todo.splitlines(), 1):
        match = pattern.search(line)
        if match:
            checked = match[1].lower() == 'x'
            if match[2]:
                subtasks.append({'type': match[2], 'id': match[3], 'cochee': checked})
                subtask_lines.setdefault((match[2], match[3]), []).append(line_number)
            else:
                main.append(checked)
                main_lines.append(line_number)
    ids = [(s['type'], s['id']) for s in subtasks]
    ambiguous = len(main) != 1 or len(ids) != len(set(ids))
    issues = []
    if not main:
        issues.append('case principale absente')
    elif len(main) > 1:
        issues.append('case principale dupliquée aux lignes ' + ', '.join(map(str, main_lines)))
    for (kind, ident), lines in subtask_lines.items():
        if len(lines) > 1:
            issues.append('sous-tâche ' + kind + ':' + ident + ' dupliquée aux lignes ' + ', '.join(map(str, lines)))
    return {'parent_coche': len(main) == 1 and main[0], 'ambigu': ambiguous,
            'diagnostics': issues, 'lignes_principales': main_lines,
            'sous_taches': subtasks, 'cochees': sum(s['cochee'] for s in subtasks),
            'total': len(subtasks),
            'code_restant': any(s['type'] == 'code' and not s['cochee'] for s in subtasks)}


def evidence(task, changes):
    proofs = []
    if task.get('automatique') is not True:
        return proofs
    for rule in task.get('preuves', []):
        name = rule['chemin']
        if name not in task.get('chemins', []) or name not in changes:
            continue
        change = changes[name]
        patterns = rule.get('motifs', [])
        if patterns:
            matches = [pattern for pattern in patterns
                       if any(re.search(pattern, line, re.I) for line in change['lignes'])]
            if matches:
                proofs.append({'fichier': name, 'motifs': matches})
        elif rule.get('dedie') is True and change['existe']:
            proofs.append({'fichier': name, 'motifs': ['fichier dédié explicitement déclaré']})
    return proofs


def validate_tasks(tasks, todo):
    ids = set()
    for task in tasks:
        cid = task['card_id']
        if not re.fullmatch(r'[a-f0-9]{24}', cid) or cid in ids:
            raise ValueError('Identifiant Trello invalide ou dupliqué : ' + cid)
        ids.add(cid)
        if not isinstance(task.get('chemins', []), list) or not isinstance(task.get('preuves', []), list):
            raise ValueError('Correspondances mal formées : ' + cid)
        if task.get('automatique') is True and not task.get('preuves'):
            raise ValueError('Automatisation sans règle de preuve : ' + cid)
        if progress(todo, cid)['ambigu']:
            raise ValueError('A_FAIRE.md : ' + '; '.join(progress(todo, cid)['diagnostics']) + ' : ' + cid)
        for rule in task.get('preuves', []):
            if not isinstance(rule, dict) or not isinstance(rule.get('motifs', []), list):
                raise ValueError('Règle de preuve mal formée : ' + cid)
            name = rule.get('chemin', '')
            if name not in task.get('chemins', []) or Path(name).is_absolute() or '..' in Path(name).parts:
                raise ValueError('Preuve hors correspondances explicites : ' + cid)
            if not rule.get('motifs') and rule.get('dedie') is not True:
                raise ValueError('Preuve insuffisante : ' + cid)
            for pattern in rule.get('motifs', []):
                re.compile(pattern)


def partition_tasks(tasks, todo):
    """Isole toutes les liaisons ambiguës ; aucune sélection arbitraire d'un doublon."""
    counts = {}
    for task in tasks:
        cid = task.get('card_id', '') if isinstance(task, dict) else ''
        counts[str(cid)] = counts.get(str(cid), 0) + 1
    valid, issues = [], []
    for task in tasks:
        cid = str(task.get('card_id', '')) if isinstance(task, dict) else ''
        try:
            if counts[cid] > 1:
                raise ValueError('liaisons_trello.json : identifiant présent plusieurs fois')
            validate_tasks([task], todo)
        except (ValueError, TypeError, KeyError, AttributeError, re.error) as exc:
            issues.append({'card_id': cid, 'nom': str(task.get('nom', '?')) if isinstance(task, dict) else '?',
                           'detail': str(exc)})
        else:
            valid.append(task)
    return valid, issues
