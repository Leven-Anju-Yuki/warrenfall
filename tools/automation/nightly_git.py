"""Publication du travail local avant Cloudinary ; simulation par défaut."""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[2]


def git(root, *args):
    try:
        result = subprocess.run(['git', *args], cwd=root, capture_output=True, timeout=90)
    except subprocess.TimeoutExpired:
        raise RuntimeError('Délai Git dépassé : ' + args[0]) from None
    if result.returncode:
        # Ne jamais recopier les URL authentifiées ou messages contenant un secret.
        raise RuntimeError('Commande Git non aboutie : ' + args[0])
    return result.stdout.decode('utf-8', errors='strict')


def publishable(name):
    path = PurePosixPath(name)
    folded = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    if path.is_absolute() or '..' in path.parts or '\\' in name:
        return False
    if any(part.startswith('.') for part in path.parts) and not (name.startswith('.github/workflows/') or name == '.gitignore'):
        return False
    if any(word in folded for word in ('sauvegarde', 'backup', 'credential', 'nightly-report', 'etat_batterie', 'warrenfall-state', 'hybrid-export')):
        return False
    if path.name.startswith(('.env', 'etat_', 'trello-state', 'trello-transitions')):
        return False
    if len(path.parts) == 1:
        return name in {'index.html', '404.html', '403.html', 'offline.html', 'readme.md', 'README.md', 'A_FAIRE.md', 'AGENTS.md', 'lapinous-content.json', 'lapinous-shop.json', 'manifest.json', 'manifest.webmanifest', 'sw.js', 'service-worker.js', 'package.json', 'package-lock.json', '.gitignore'}
    if name.startswith('assets/js/'):
        return path.suffix in {'.js', '.mjs', '.json'}
    if name.startswith('assets/css/'):
        return path.suffix == '.css'
    if name.startswith('tools/'):
        return path.suffix in {'.py', '.mjs', '.ps1', '.json'} and path.name not in {'inventory.json', 'manifest.json', 'quarantaine.json', 'versions-connues.json'}
    if name.startswith('docs/'):
        return path.suffix == '.md' and not name.startswith(('docs/exports/', 'docs/references/'))
    return name.startswith('.github/workflows/') and path.suffix in {'.yml', '.yaml'}


def changed(root):
    entries = git(root, 'status', '--porcelain=v1', '-z', '--untracked-files=all').split('\0')
    accepted, excluded = set(), set()
    index = 0
    while index < len(entries):
        row = entries[index]
        index += 1
        if not row:
            continue
        paths = [row[3:]]
        if 'R' in row[:2] or 'C' in row[:2]:
            paths.append(entries[index])
            index += 1
        (accepted if all(publishable(p) for p in paths) else excluded).update(paths)
    return sorted(accepted), sorted(excluded)


def secrets(root):
    env = root / '.env'
    if not env.is_file():
        return []
    values = []
    for line in env.read_text(encoding='utf-8-sig').splitlines():
        if '=' not in line or line.lstrip().startswith('#'):
            continue
        key, value = line.split('=', 1)
        value = value.strip().strip('\"\'')
        if re.search(r'token|secret|password|key|webhook|signing|cloudinary_url', key, re.I) and len(value) >= 12:
            values.append(value)
    return values


def check_text(raw, private_values):
    text = raw.decode('utf-8', errors='strict') if isinstance(raw, bytes) else raw
    if any(value in text for value in private_values) or re.search(r'-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|https://(?:discord(?:app)?\.com)/api/webhooks/\d+/[\w-]{20,}', text):
        raise RuntimeError('Publication bloquée : identifiant privé détecté ; aucune valeur affichée.')


def message(paths, patches=None):
    topics = []
    rules = [('les jeux et la progression', ('script.js', 'achievements.js', 'species-data.js', 'lapinous-content.json')),
             ('les quiz', ('quiz',)), ('le coloriage', ('coloring',)),
             ('les explorations', ('exploration',)), ('les sauvegardes', ('save-', 'auto-nest')),
             ('le marché et les accompagnateurs', ('shop', 'workshop-layout')),
             ('les fenêtres et l’affichage mobile', ('mobile-ui', 'scene-proportions', 'phone', '.css', 'index.html')),
             ('le tutoriel', ('game-guide',)), ('les automatisations et rapports', ('tools/automation/', 'tools/agent_lapinous/', '.github/')),
             ('les vérifications', ('test-', 'test_')), ('la documentation', ('.md',))]
    for label, matches in rules:
        if any(any(marker in name for marker in matches) for name in paths):
            topics.append(label)
    subject = 'Met à jour ' + ', '.join(topics[:2] or ['Warrenfall'])
    if len(subject) > 100:
        subject = 'Améliore Warrenfall et son suivi quotidien'
    details=[]
    for filename, marker, description in [
        ('assets/js/script.js', 'friendshipGained', 'Affiche les gains d’amitié réellement crédités.'),
        ('assets/js/script.js', 'friendshipGoal', 'Précise le seuil du prochain niveau.'),
        ('assets/js/script.js', 'lastSavedRaw=null', 'Corrige la sauvegarde après déconnexion et nouvelle adoption.'),
        ('assets/js/script.js', 'pendingEgg', 'Conserve le tirage des œufs pour reprendre une éclosion interrompue.'),
        ('assets/js/mobile-ui.js', 'LapinousEggView', 'Garde l’éclosion dans la fenêtre des œufs.'),
        ('assets/js/exploration.js', 'dernier compagnon', 'Prévient avant le départ du dernier compagnon disponible.'),
        ('assets/js/pixel-coloring.js', 'discovery-bunny-v1', 'Ajoute un petit coloriage pour découvrir les pinceaux.'),
        ('assets/js/species-data.js', 'parents=', 'Relie les blocages administrateur aux fonctions associées.')]:
        if marker in (patches or {}).get(filename, ''):
            details.append(description)
    body='\n'.join('- ' + text for text in details) if details else '\n'.join('- Mise à jour : ' + label + '.' for label in topics)
    return subject + '\n\n' + body + '\n\nDomaines concernés : ' + ', '.join(topics) + '.\n\nFichiers concernés :\n' + '\n'.join('- ' + name for name in paths)


def run(root, apply=False):
    report = {'startedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'status': 'simulation', 'committed': False, 'pushed': False}
    try:
        if git(root, 'branch', '--show-current').strip() != 'main':
            raise RuntimeError('Branche autre que main : publication automatique ignorée.')
        paths, excluded = changed(root)
        patches={name:'\n'.join(line[1:] for line in git(root, 'diff', '--no-ext-diff', '--unified=0', '--', name).splitlines() if line.startswith('+') and not line.startswith('+++')) for name in paths if name.startswith('assets/js/')}
        report.update(files=paths, excludedCount=len(excluded), message=message(paths, patches) if paths else None)
        if git(root, 'diff', '--cached', '--name-only').strip():
            raise RuntimeError('Index déjà préparé manuellement : laissé intact.')
        private_values = secrets(root)
        for name in paths:
            file = root / name
            if file.is_symlink():
                raise RuntimeError('Lien symbolique non publiable automatiquement.')
            if file.is_file():
                check_text(file.read_bytes(), private_values)
        if not apply:
            return report
        git(root, 'fetch', '--quiet', 'origin', 'main')
        if git(root, 'rev-list', 'HEAD..refs/remotes/origin/main').strip():
            raise RuntimeError('GitHub contient des changements absents du PC : aucun merge ou push forcé.')
        # Vérifier aussi les commits locaux déjà créés, sans les renommer.
        for sha in git(root, 'rev-list', 'refs/remotes/origin/main..HEAD').split():
            for name in git(root, 'diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha).splitlines():
                if not publishable(name):
                    raise RuntimeError('Un commit en attente contient un fichier privé ou hors périmètre.')
                if git(root, 'ls-tree', sha, '--', name).strip():
                    check_text(git(root, 'show', sha + ':' + name), private_values)
        if paths:
            git(root, 'add', '--all', '--', *paths)
            if set(git(root, 'diff', '--cached', '--name-only').splitlines()) - set(paths):
                raise RuntimeError('Index modifié simultanément : aucun commit automatique.')
            for name in paths:
                if git(root, 'ls-files', '--stage', '--', name).strip():
                    check_text(git(root, 'show', ':' + name), private_values)
            git(root, 'commit', '--quiet', '-m', report['message'])
            report['committed'] = True
        outgoing = git(root, 'rev-list', 'refs/remotes/origin/main..HEAD').split()
        if outgoing:
            git(root, 'push', '--porcelain', 'origin', 'HEAD:refs/heads/main')
            report.update(pushed=True, commit=git(root, 'rev-parse', 'HEAD').strip(), status='published')
        else:
            report['status'] = 'unchanged'
    except (RuntimeError, OSError, UnicodeError):
        # Les erreurs Git brutes restent masquées pour ne pas exposer les identifiants.
        import sys
        error = sys.exc_info()[1]
        report.update(status='blocked', reason=str(error) if isinstance(error, RuntimeError) else 'Lecture ou exécution Git impossible.')
    finally:
        report['finishedAt'] = dt.datetime.now(dt.timezone.utc).isoformat()
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    report = run(ROOT, args.apply)
    if args.apply:
        target = ROOT / '.cloudinary-local/nightly-git.json'
        target.parent.mkdir(exist_ok=True)
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return int(report['status'] == 'blocked')


if __name__ == '__main__':
    raise SystemExit(main())
