"""Agent Warrenfall : bilan local, suivi Trello explicite et notifications Discord.
Aucun push, aucune modification Cloudinary, aucun effacement de tâches.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
sys.dont_write_bytecode = True
from pathlib import Path
from urllib.parse import quote

import requests
from reseau import diagnostic, sanitize, read_request
from dotenv import load_dotenv
from cloudinary_rapport import build as cloudinary_report
from suivi_trello import collect, dirty_paths, evidence, progress, validate_tasks, partition_tasks

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
load_dotenv(ROOT / '.env')  # Un seul .env, à la racine du projet
ROOT = Path(os.getenv('PROJECT_ROOT') or ROOT).expanduser().resolve()
CONFIG = HERE / 'liaisons_trello.json'
REPORTS = ROOT.parent / 'clikergame_avec_image' / 'rapports'
STATE_FILE = ROOT / '.cloudinary-local' / 'trello-state.json'
REMOTE_WRITES = False
APPLICATION_REQUESTED = False
ALLOWED_LISTS = set()
START = '<!-- LAPINOUS_AGENT_DEBUT -->'
END = '<!-- LAPINOUS_AGENT_FIN -->'
SKIP = {'.git', '.venv', 'node_modules', '__pycache__', '.cloudinary-local', 'rapports'}
BOARD = os.getenv('TRELLO_BOARD_ID', '5VmsAFi7').strip()


def safe_error(exc):
    """N'expose jamais les URL d'API contenant des jetons dans les logs/Discord."""
    if isinstance(exc, requests.HTTPError):
        code = exc.response.status_code if exc.response is not None else '?'
        return f'Erreur HTTP {code} (vérifier identifiants, droits ou ID de carte)'
    return diagnostic(exc)



def api(method, path, params=None):
    if method != 'GET' and os.getenv('LAPINOUS_TRELLO_READ_ONLY') == 'true':
        raise RuntimeError('Trello en lecture seule : ecriture interdite pour cette execution.')
    if method != 'GET':
        if not REMOTE_WRITES:
            raise RuntimeError('Écriture Trello interdite en simulation.')
        move = method == 'PUT' and re.fullmatch(r'cards/[a-f0-9]{24}', path) and set(params or {}) == {'idList'} and params['idList'] in ALLOWED_LISTS
        comment = method == 'POST' and re.fullmatch(r'cards/[a-f0-9]{24}/actions/comments', path)
        if not (move or comment):
            raise RuntimeError('Action Trello interdite : aucune création ni passage dans Réalisé.')
    key = os.getenv('TRELLO_API_KEY', '').strip()
    token = os.getenv('TRELLO_TOKEN', '').strip()
    if not key or not token:
        raise RuntimeError('TRELLO_API_KEY ou TRELLO_TOKEN absent du .env racine')
    response = read_request(
        method, 'https://api.trello.com/1/' + path.lstrip('/'),
        params={**(params or {}), 'key': key, 'token': token}, timeout=25)
    if not response.ok:
        raise RuntimeError(f'Trello HTTP {response.status_code} ({method} {path.split("?")[0]})')
    return response.json() if response.content else {}


def get_lists():
    lists = api('GET', f'boards/{quote(BOARD, safe="")}/lists', {'filter': 'open', 'fields': 'id,name'})
    result = {item['name'].strip().casefold(): item for item in lists}
    if len(result) != len(lists):
        raise ValueError('Noms de listes Trello en double : aucune transition autorisée.')
    return result


def list_id(lists, name):
    aliases = {
        'en cours': ('en cours',),
        'a_valider': ('à valider en jeu', 'a valider en jeu'),
        'realise': ('réalisé — code et historique', 'réalisé - code et historique'),
        'bloque': ('bloqué', 'bloque'),
        'idees': ('idées à sélectionner', 'idees a selectionner'),
    }
    matches = [lists[candidate.casefold()]['id'] for candidate in aliases.get(name, (name,))
               if candidate.casefold() in lists]
    if len(set(matches)) > 1:
        raise ValueError('Plusieurs listes correspondent à : ' + name)
    return matches[0] if matches else None


def git_changes():
    return dirty_paths(ROOT)


def replace_section(path, title, body):
    original = path.read_text(encoding='utf-8') if path.exists() else f'# {title}\n'
    section = f'{START}\n{body.rstrip()}\n{END}'
    if START in original and END in original and original.index(START) < original.index(END):
        begin = original.index(START)
        finish = original.index(END) + len(END)
        updated = original[:begin] + section + original[finish:]
    else:
        updated = original.rstrip() + '\n\n' + section + '\n'
    if updated != original:
        path.write_text(updated, encoding='utf-8')
    return updated != original


def inventory():
    lines = ['### Inventaire automatique', '', '| Dossier | Fichiers | Taille |', '|---|---:|---:|']
    for folder in ('assets', 'docs', 'tools'):
        base = ROOT / folder
        if not base.is_dir():
            continue
        files = [p for p in base.rglob('*') if p.is_file() and not (set(p.relative_to(ROOT).parts) & SKIP)]
        size = sum(p.stat().st_size for p in files)
        lines.append(f'| `{folder}/` | {len(files)} | {size / 1048576:.2f} Mo |')
    lines.extend(['', '_Inventaire local uniquement : les images déjà archivées ne sont pas considérées manquantes._'])
    return '\n'.join(lines)


def load_mappings():
    if not CONFIG.exists():
        return []
    data = json.loads(CONFIG.read_text(encoding='utf-8'))
    tasks = data.get('taches', [])
    return [task for task in tasks if isinstance(task, dict) and
            task.get('card_id') and not str(task['card_id']).startswith('REMPLACER_')]


def task_state(todo, card_id):
    state = progress(todo, card_id)
    if state['ambigu']:
        return None
    return 'termine' if state['parent_coche'] and not state['code_restant'] else 'a_faire'


def get_cards():
    return api('GET', f'boards/{quote(BOARD, safe="")}/cards',
               {'filter': 'all', 'fields': 'id,name,idList,closed,idBoard,shortUrl'})


def initialise():
    """Importe les cartes, sans inventer de correspondances de fichiers."""
    if CONFIG.exists():
        current = json.loads(CONFIG.read_text(encoding='utf-8'))
        if any(not str(t.get('card_id', '')).startswith('REMPLACER_') for t in current.get('taches', [])):
            raise RuntimeError('Des liaisons réelles existent déjà : import annulé pour ne pas les écraser')
    cards = get_cards()
    data = {'taches': [{'card_id': card['id'], 'nom': card['name'], 'chemins': []}
                       for card in cards]}
    CONFIG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(cards)} cartes importées dans {CONFIG.name}.')
    print('Renseigne les chemins de chaque carte concernée. Aucun déplacement sans correspondance explicite.')


def plan_card(task, changes, todo, lists, card):
    """Proposition pure : une correspondance de fichier ne constitue pas une preuve."""
    cid = task['card_id']
    state = progress(todo, cid)
    result = {'id': cid, 'nom': task['nom'], 'depuis': None, 'vers': None,
              'raison': '', 'preuves': evidence(task, changes), 'suivi': state}
    if not card:
        raise ValueError('Carte absente du tableau : ' + cid)
    result['nom'] = card['name']
    result['depuis'] = card['idList']
    if card.get('closed'):
        result['raison'] = 'Carte archivee : protegee.'
    elif card['idList'] in {list_id(lists, key) for key in ('realise', 'idees', 'bloque', 'a_valider')}:
        list_name = next((item['name'] for item in lists.values() if item['id'] == card['idList']), '?')
        result['raison'] = 'Liste protegee (' + list_name + ') : aucun deplacement automatique.'
    elif not task.get('chemins') or task.get('automatique') is not True:
        result['raison'] = 'Suivi manuel : aucune regle automatique explicite.'
    elif state['ambigu']:
        result['raison'] = 'Cases ambigues : aucun deplacement.'
    elif state['parent_coche'] and not state['code_restant']:
        result['vers'] = list_id(lists, 'a_valider')
        result['raison'] = 'Case principale explicitement cochee ; code sans sous-tache ouverte. Validation humaine encore requise.'
    elif result['preuves']:
        result['vers'] = list_id(lists, 'en cours')
        result['raison'] = 'Lignes modifiees pertinentes : ' + ', '.join(p['fichier'] for p in result['preuves'])
    else:
        result['raison'] = 'Aucune preuve precise dans les nouvelles modifications : aucun deplacement.'
    if result['vers'] == result['depuis']:
        result['vers'] = None
        result['raison'] = 'Deja dans la liste correspondante. ' + result['raison']
    return result


def transition_journal():
    return STATE_FILE.with_name('trello-transitions.json')


def read_transitions():
    file = transition_journal()
    return json.loads(file.read_text(encoding='utf-8')) if file.exists() else {}


def write_transitions(items):
    file = transition_journal()
    file.parent.mkdir(parents=True, exist_ok=True)
    pending = file.with_suffix('.pending.json')
    pending.write_text(json.dumps(items, ensure_ascii=False), encoding='utf-8')
    pending.replace(file)


def finish_comment(plan):
    import hashlib
    marker = '[lapinous:' + hashlib.sha256(json.dumps(plan, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:24] + ']'
    actions = api('GET', 'cards/' + plan['id'] + '/actions', {'filter': 'commentCard', 'limit': 1000})
    if not any(marker in item.get('data', {}).get('text', '') for item in (actions or [])):
        api('POST', 'cards/' + plan['id'] + '/actions/comments',
            {'text': 'Warrenfall Agent : ' + plan['raison'] + '\n' + marker})
    items = read_transitions()
    items.pop(plan['id'], None)
    write_transitions(items)


def recover_transitions(lists, blocked_ids=()):
    recovered = []
    for plan in list(read_transitions().values()):
        if plan['id'] in blocked_ids:
            continue  # Conserver le journal ; aucune reprise d'une carte ambiguë.
        card = api('GET', 'cards/' + plan['id'], {'fields': 'idList,closed'})
        protected = {list_id(lists, key) for key in ('realise', 'idees', 'bloque')}
        if card.get('closed') or card['idList'] in protected:
            raise RuntimeError('Reprise suspendue : carte protegee ' + plan['id'])
        if card['idList'] == plan['vers']:
            finish_comment(plan)
        elif card['idList'] == plan['depuis']:
            apply_plan(plan, lists)
        else:
            raise RuntimeError('Reprise suspendue : carte deplacee manuellement ' + plan['id'])
        recovered.append(plan['id'])
    return recovered


def apply_plan(plan, lists):
    """Seulement deux listes cibles ; aucune creation de carte ni validation finale."""
    allowed = {list_id(lists, 'en cours'), list_id(lists, 'a_valider')} - {None}
    if plan['vers'] not in allowed or plan['vers'] == list_id(lists, 'realise'):
        raise ValueError('Transition interdite.')
    current = api('GET', 'cards/' + plan['id'], {'fields': 'idList,closed'})
    if current.get('closed') or current['idList'] != plan['depuis']:
        raise RuntimeError('Carte modifiee depuis analyse : aucune ecriture.')
    items = read_transitions()
    items[plan['id']] = plan
    write_transitions(items)
    api('PUT', 'cards/' + plan['id'], {'idList': plan['vers']})
    finish_comment(plan)


def update_card(task, changes, todo, lists, apply):
    card = api('GET', 'cards/' + task['card_id'], {'fields': 'id,name,idList,closed'})
    plan = plan_card(task, changes, todo, lists, card)
    if not plan['vers']:
        return None
    if apply:
        apply_plan(plan, lists)
    return plan['nom'] + ' : ' + plan['raison'] + ('' if apply else ' [SIMULATION]')


def webhook(channel):
    choices = {
        'bilan': ('DISCORD_WEBHOOK_BILAN',),
        'trello': ('DISCORD_WEBHOOK_TRELLO',),
        'erreurs': ('DISCORD_WEBHOOK_ALERTES', 'DISCORD_WEBHOOK_ERREURS'),
        'images': ('DISCORD_WEBHOOK_CLOUDINARY',),
        'general': ('DISCORD_WEBHOOK_GENERAL',),
    }
    for variable in choices.get(channel, ()):
        value = os.getenv(variable, '').strip()
        if value:
            return value
    return ''


def discord(channel, message):
    url = webhook(channel)
    if not url:
        print(f'Discord {channel} : URL de webhook absente du .env racine')
        return False
    for offset in range(0, len(message), 1800):
        response = requests.post(url, params={'wait':'true'}, json={'content': message[offset:offset + 1800],
                                            'allowed_mentions': {'parse': []}}, timeout=25)
        if not response.ok:
            raise RuntimeError(f'Discord {channel} : HTTP {response.status_code}')
        result = response.json()
        print(f'Discord {channel} : HTTP {response.status_code} ; message {result.get("id", "inconnu")} confirme.')
    return True




def quarantine_discord_summary():
    """Résumé J-X après la synchronisation. Lecture seule, aucun appel Cloudinary."""
    from datetime import datetime, timedelta, timezone
    state = ROOT / '.cloudinary-local'
    queue_file = state / 'quarantaine.json'
    report_file = state / 'corbeille-report.json'
    if not queue_file.exists():
        return '📦 **Corbeille Cloudinary** : suivi non initialisé.'
    try:
        queue = json.loads(queue_file.read_text(encoding='utf-8'))
        items = queue.get('items', {})
        if not isinstance(items, dict):
            raise ValueError('Format items invalide')
        now = datetime.now(timezone.utc)
        lines = ['📦 **Corbeille Cloudinary — suivi quotidien J-X**',
                 f'Images en attente : **{len(items)}**',
                 'Quarantaine logique : URL et public_id inchangés.']
        try:
            hold = json.loads((ROOT / 'tools/cloudinary-deletion-policy.json').read_text(encoding='utf-8')).get('suspended') is not False
        except (OSError, ValueError, AttributeError):
            hold = True
        if hold:
            lines.append('🔒 Suppression définitive suspendue : validation humaine des sauvegardes et autorisations requise.')
        for ident, item in sorted(items.items(), key=lambda pair: pair[1].get('since', '')):
            entered = datetime.fromisoformat(item['since'].replace('Z', '+00:00'))
            if entered.tzinfo is None:
                entered = entered.replace(tzinfo=timezone.utc)
            due = entered + timedelta(days=7)
            remaining = max(0, (due - now).total_seconds())
            # J-7 au départ, J-0 dès échéance ; arrondi supérieur pour ne pas annoncer trop tôt.
            import math
            j = math.ceil(remaining / 86400)
            name = Path(item.get('path') or ident).name
            when = due.astimezone().strftime('%d/%m/%Y %H:%M')
            label = 'J-0 (échéance atteinte)' if j == 0 else f'J-{j}'
            lines.append(f'• **{name}** — **{label}** — échéance : {when}')
        if not items:
            lines.append('Aucune image en attente.')
        if report_file.exists():
            report = json.loads(report_file.read_text(encoding='utf-8'))
            blocked = report.get('blocked', [])
            errors = report.get('errors', [])
            lines.append(f'Images bloquées : **{len(blocked)}** ; erreurs : **{len(errors)}**.')
            for entry in blocked:
                lines.append(f'🔒 {Path(entry.get("path") or entry.get("id", "?")).name} : {entry.get("reason", "bloquée")}')
            for entry in errors:
                lines.append(f'⚠️ {Path(entry.get("path") or entry.get("id", "?")).name} : erreur (voir rapport)')
        lines.append('J-0 ne signifie pas supprimée : la suppression doit être autorisée et confirmée.')
        return '\n'.join(lines)
    except (OSError, ValueError, TypeError, KeyError) as exc:
        return f'⚠️ Suivi J-X indisponible : {type(exc).__name__} (vérifier quarantaine.json).'


def notify_all(jobs):
    """Chaque notification est tentee, meme si une precedente echoue."""
    errors = []
    for label, operation in jobs:
        try:
            if operation() is False:
                raise RuntimeError('Webhook absent ou notification non envoyee.')
        except Exception as exc:
            errors.append('Discord / ' + label + ' : ' + safe_error(exc))
    return errors


def save_checkpoint(snapshot):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    pending = STATE_FILE.with_suffix('.pending.json')
    pending.write_text(json.dumps(snapshot, ensure_ascii=False), encoding='utf-8')
    pending.replace(STATE_FILE)


def bilan(apply, since=None, chain=None):
    global REMOTE_WRITES, ALLOWED_LISTS
    REMOTE_WRITES = False
    trello_read_only = os.getenv('LAPINOUS_TRELLO_READ_ONLY') == 'true'
    tasks = load_mappings()
    todo_file, readme_file = ROOT / 'A_FAIRE.md', ROOT / 'readme.md'
    todo = todo_file.read_text(encoding='utf-8')
    tasks, validation_issues = partition_tasks(tasks, todo)
    blocked_ids = {issue['card_id'] for issue in validation_issues}
    changes, snapshot, warnings = collect(ROOT, STATE_FILE, tasks, since=since)
    stamp = dt.datetime.now().astimezone().strftime('%d/%m/%Y %H:%M')
    plans, errors = [], []
    lists = {}
    try:
        lists = get_lists()
        for key in ('en cours', 'a_valider', 'realise', 'bloque', 'idees'):
            if not list_id(lists, key):
                raise ValueError('Liste absente ou non reconnue : ' + key)
        cards = get_cards()
        cards_by_id = {card['id']: card for card in cards}
        if len(cards_by_id) != len(cards):
            raise ValueError('Cartes en double dans la reponse Trello.')
        for issue in validation_issues:
            card = cards_by_id.get(issue['card_id'], {})
            issue['nom'] = card.get('name', issue['nom'])
            issue['url'] = card.get('shortUrl') or 'https://trello.com/c/' + issue['card_id']
        for task in tasks:
            try:
                plans.append(plan_card(task, changes, todo, lists, cards_by_id.get(task['card_id'])))
            except Exception as exc:
                errors.append("Trello : " + safe_error(exc))
    except Exception as exc:
        errors.append("Trello : " + safe_error(exc))
    updates = [plan for plan in plans if plan['vers']]
    applied = []
    if apply and not trello_read_only and not errors:
        ALLOWED_LISTS = {list_id(lists, 'en cours'), list_id(lists, 'a_valider')}
        REMOTE_WRITES = True
        try:
            recovered = recover_transitions(lists, blocked_ids) if blocked_ids else recover_transitions(lists)
            applied.extend(recovered)
            for plan in updates:
                if plan['id'] in recovered:
                    continue
                try:
                    apply_plan(plan, lists)
                    applied.append(plan['id'])
                except Exception as exc:
                    errors.append('Trello carte ' + plan['id'] + ' : ' + safe_error(exc))
        except Exception as exc:
            errors.append('Reprise Trello : ' + safe_error(exc))
        finally:
            REMOTE_WRITES = False
            ALLOWED_LISTS = set()
    validation_messages = [
        'Trello / intervention requise : ' + issue['nom'] + ' [' + issue['card_id'] + '] ' +
        issue.get('url', 'https://trello.com/c/' + issue['card_id']) + ' ; ' + issue['detail'] +
        ' ; carte exclue des mutations, état et historique conservés.'
        for issue in validation_issues]
    errors.extend(validation_messages)
    names = {item['id']: item['name'] for item in lists.values()}
    cloud_text, cloud_ok = cloudinary_report(ROOT, expected_start=chain.get('startedAt')) if isinstance(chain, dict) else cloudinary_report(ROOT)
    chain_errors = []
    if chain is not None:
        if not isinstance(chain, dict) or type(chain.get('syncExit')) is not int:
            raise ValueError('Contexte de chaine invalide.')
        chain_errors = ['Cloudinary/chaîne : ' + safe_error(RuntimeError(str(item))) for item in chain.get('errors', [])]
        if chain['syncExit'] != 0:
            cloud_ok = False
            chain_errors.append('Cloudinary : la chaîne images comporte une erreur (transfert ou corbeille) : code ' + str(chain['syncExit']) + ' ; consulter les états séparés du rapport Cloudinary.')
        errors.extend(chain_errors)
    quarantine_text = quarantine_discord_summary()
    lines = ['# Bilan Warrenfall - ' + stamp,
             'Mode : ' + ('APPLICATION' if apply else 'SIMULATION STRICTE - aucune ecriture ni notification'),
             'Fichiers nouveaux depuis le point de reprise : ' + str(len(changes)),
             'Cartes analysees : ' + str(len(plans)),
             'Deplacements proposes : ' + str(len(updates)), '', '## Deplacements']
    if apply:
        lines.insert(5, 'Transitions traitees avec succes (reprises comprises) : ' + str(len(applied)))
    if trello_read_only:
        lines.insert(2, 'Trello : LECTURE SEULE ; aucune modification et aucun point de reprise enregistre.')
    for plan in updates:
        lines.append('- ' + plan['nom'] + ' [' + plan['id'] + '] : ' +
                     names.get(plan['depuis'], '?') + ' -> ' + names.get(plan['vers'], '?') +
                     ' ; ' + plan['raison'])
        for proof in plan['preuves']:
            lines.append('  Preuve : ' + proof['fichier'] + ' ; ' + ', '.join(proof['motifs']))
    if not updates:
        lines.append('Aucun deplacement justifie.')
    lines.extend(['', '## Suivi detaille'])
    for plan in plans:
        state = plan['suivi']
        lines.append('- ' + plan['nom'] + ' [' + plan['id'] + '] : ' + plan['raison'] +
                     f" Sous-taches : {state['cochees']}/{state['total']}. Parent coche : {state['parent_coche']}.")
    lines.extend(['', '## Git', *('- ' + name for name in changes), '', '## Points de vigilance',
                  *(warnings or ['Aucun.']), '', '## Chaine de cette execution',
                  json.dumps(chain, ensure_ascii=False) if chain else 'Bilan manuel : aucun contexte de chaine fourni.',
                  '', '## Cloudinary — rapport complet', cloud_text,
                  '', '## Quarantaine', quarantine_text,
                  '', '## Notifications prevues'])
    for channel in ('bilan', 'trello', 'images', 'erreurs'):
        lines.append('- ' + channel + ' : ' + ('configure' if webhook(channel) else 'absent'))
    lines.extend(['', '## Erreurs', *(errors or ['Aucune.'])])
    report = '\n'.join(lines) + '\n'
    print(report)
    if not apply:
        return 1 if errors or not cloud_ok else 0
    # Tous les effets de bord restent au-dessous de ce garde.
    afaire = '### Suivi automatique du projet\n\nDernier bilan : ' + stamp + '\n\n' + report
    REPORTS.mkdir(parents=True, exist_ok=True)
    filename_stamp = dt.datetime.now().strftime('%Y-%m-%d_%H%M%S')
    report_file = REPORTS / (filename_stamp + '_bilan.md')
    cloud_file = REPORTS / (filename_stamp + '_images.md')
    report_file.write_text(report, encoding='utf-8')
    cloud_file.write_text(cloud_text, encoding='utf-8')
    # Une erreur de mise a jour documentaire ne doit pas empecher les notifications.
    try:
        replace_section(todo_file, 'A faire', afaire)
        replace_section(readme_file, 'Warrenfall', inventory())
    except Exception as exc:
        errors.append('Documentation : ' + safe_error(exc))
        report += '\n## Erreurs documentaires\n' + errors[-1] + '\n'
        report_file.write_text(report, encoding='utf-8')
    # Les echecs Discord ne rejouent pas des transitions Trello deja effectuees.
    if not errors and not trello_read_only:
        import hashlib
        for path in (todo_file, readme_file):
            content = path.read_bytes()
            name = path.relative_to(ROOT).as_posix()
            snapshot['hashes'][name] = hashlib.sha256(content).hexdigest()
            if name in snapshot['texts']:
                snapshot['texts'][name] = content.decode('utf-8')
        save_checkpoint(snapshot)
    jobs = [('bilan', lambda: discord('bilan', report[:1600] + '\nRapport complet en piece jointe.')),
            ('bilan complet', lambda: send_report_file('bilan', report_file, report, not errors and cloud_ok)),
            ('images', lambda: send_report_file('images', cloud_file, cloud_text, cloud_ok)),
            ('corbeille', lambda: discord('images', quarantine_text))]
    message = '\n'.join(plan['nom'] + ' : ' + ('applique' if plan['id'] in applied else 'non applique')
                        + ' ; ' + plan['raison'] for plan in updates)
    message += f'\nCartes ignorees : {len(plans) - len(updates)} (motifs dans le rapport complet). Erreurs Trello : {sum('Trello' in error for error in errors)}. Erreurs globales : {len(errors)}.'
    if validation_messages:
        message += '\n' + '\n'.join(validation_messages)
    jobs.append(('trello', lambda: discord('trello', message)))
    if not cloud_ok:
        jobs.append(('alerte Cloudinary', lambda: discord('erreurs', 'Cloudinary : ' + sanitize(cloud_text[:1400]))))
    if errors:
        jobs.append(('erreurs', lambda: discord('erreurs', '\n'.join(errors))))
    notification_errors = notify_all(jobs)
    if notification_errors:
        report_file.write_text(report + '\n## Erreurs de notification\n' + '\n'.join(notification_errors), encoding='utf-8')
        print('\n'.join(notification_errors))
        for failure in notify_all([('alerte notifications', lambda: discord('erreurs', '\n'.join(notification_errors)))]):
            print(failure)
    return 1 if errors or notification_errors or not cloud_ok else 0


def send_report_file(channel, file, text, ok):
    url = webhook(channel)
    if not url:
        print('Webhook images absent ; rapport conservé : ' + str(file))
        return False
    with file.open('rb') as stream:
        label = 'Bilan Warrenfall' if channel == 'bilan' else 'Rapport Cloudinary'
        response = requests.post(url, params={'wait':'true'}, data={'payload_json': json.dumps({'content': ('✅' if ok else '⚠️') + ' ' + label + ' complet en pièce jointe.', 'allowed_mentions': {'parse': []}})}, files={'files[0]': (file.name, stream, 'text/markdown')}, timeout=60)
    if not response.ok:
        raise RuntimeError(f'Discord {channel} : HTTP {response.status_code}')
    result = response.json()
    print(f'Discord {channel} : HTTP {response.status_code} ; message {result.get("id", "inconnu")} ; fichier {file.name} ; pieces jointes {len(result.get("attachments", []))}.')
    return True


def main():
    global APPLICATION_REQUESTED
    parser = argparse.ArgumentParser(description='Agent local Warrenfall')
    parser.add_argument('commande', choices=('bilan', 'test-discord', 'test-trello', 'listes-trello', 'initialiser-trello'))
    parser.add_argument('--appliquer', action='store_true', help='Déplacer réellement les cartes Trello')
    parser.add_argument('--depuis-commit', help='Premier passage : inclure les commits depuis cette référence explicite')
    parser.add_argument('--chaine-base64', help='Contexte de cette synchronisation, transmis par le lanceur unique')
    args = parser.parse_args()
    APPLICATION_REQUESTED = args.appliquer
    if args.commande in ('test-discord', 'initialiser-trello') and not args.appliquer:
        print('Simulation : aucune notification ni modification. Cette commande exige --appliquer.')
        return 0
    if args.commande == 'test-discord':
        jobs = [(channel, lambda channel=channel: discord(channel, 'Test Warrenfall Agent : ' + channel))
                for channel in ('general', 'bilan', 'trello', 'erreurs', 'images') if webhook(channel)]
        errors = notify_all(jobs)
        for error in errors:
            print(error)
        return 1 if errors else 0
    if args.commande == 'test-trello':
        me = api('GET', 'members/me', {'fields': 'username'})
        print('Connexion Trello :', me['username'])
        return 0
    if args.commande == 'listes-trello':
        for item in get_lists().values():
            print(f'{item["name"]} : {item["id"]}')
        return 0
    if args.commande == 'initialiser-trello':
        initialise()
        return 0
    chain = None
    if args.chaine_base64:
        import base64
        chain = json.loads(base64.b64decode(args.chaine_base64, validate=True).decode('utf-8'))
    return bilan(args.appliquer, args.depuis_commit, chain)


if __name__ == '__main__':
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, 'reconfigure'):
            stream.reconfigure(encoding='utf-8', errors='replace')
    try:
        sys.exit(main())
    except Exception as exc:
        error = safe_error(exc)
        print('ERREUR : ' + error, file=sys.stderr)
        if APPLICATION_REQUESTED:
            for notification_error in notify_all([('erreur fatale', lambda: discord('erreurs', error))]):
                print(notification_error, file=sys.stderr)
        sys.exit(1)
