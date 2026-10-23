"""Chaîne distante préparée. Simulation par défaut, activation séparée obligatoire."""
from __future__ import annotations
import argparse
import contextlib
import datetime as dt
import hashlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import uuid
from core import plan, apply_trash, paris_day
from state_store import GitHubStore, LockedState, StateError
from transports import Cloudinary, send_discord, request
from reporting import cloudinary_details, bundle, deliver

ROOT = Path(__file__).resolve().parents[2]


def references(root):
    # Inclut le manifeste public, CSS, JS et tous les catalogues. Surprotéger une
    # référence est préférable à effacer une ressource encore utilisée.
    files = [root / 'index.html', *root.glob('*.json'), *root.glob('*.html'),
             *root.glob('assets/js/**/*.js'), *root.glob('assets/js/**/*.mjs'),
             *root.glob('assets/css/**/*.css')]
    return '\n'.join(p.read_text(encoding='utf-8') for p in set(files) if p.is_file())


def trello(locked):
    """Réutilise les règles, commentaires dédupliqués et reprise de l'agent existant."""
    sys.path.insert(0, str(ROOT / 'tools/agent_lapinous'))
    import agent
    from unittest.mock import patch
    with tempfile.TemporaryDirectory() as folder:
        state_file = Path(folder) / 'trello-state.json'
        transition_file = state_file.with_name('trello-transitions.json')
        if locked.data.get('trello'):
            state_file.write_text(json.dumps(locked.data['trello']), encoding='utf-8')
        transition_file.write_text(json.dumps(locked.data.get('transitions', {})), encoding='utf-8')
        original_transitions = agent.write_transitions

        def transitions(value):
            original_transitions(value)
            locked.data['transitions'] = value
            locked.save()  # Intention persistée AVANT mouvement Trello.

        def checkpoint(value):
            value['root'] = None
            locked.data['trello'] = value
            locked.save()

        buffer = io.StringIO()
        sections = locked.data.setdefault('report_sections', {})
        def capture_file(channel, file, text, ok):
            sections[channel] = text
            return True
        def capture_message(channel, message):
            if channel == 'trello':
                sections['trello'] = message
            return True
        # Capturer les rapports avant la disparition du répertoire temporaire.
        try:
            with patch.object(agent, 'STATE_FILE', state_file), patch.object(agent, 'REPORTS', Path(folder)), \
                 patch.object(agent, 'write_transitions', transitions), patch.object(agent, 'save_checkpoint', checkpoint), \
                 patch.object(agent, 'replace_section', lambda *args: None), \
                 patch.object(agent, 'discord', capture_message), patch.object(agent, 'send_report_file', capture_file), \
                 patch.object(agent, 'cloudinary_report', lambda *args, **kwargs: (sections.get('images', 'Cloudinary non vérifié.'), sections.get('_cloud_ok', False))), \
                 contextlib.redirect_stdout(buffer):
                code = agent.bilan(True)
        except StateError:
            raise
        except Exception as exc:
            code = 1
            buffer.write('\nTrello / agent : ' + agent.safe_error(exc))
        # La pièce jointe Trello conserve l'intégralité du bilan de l'agent et ses diagnostics.
        sections['trello'] = buffer.getvalue() + '\n\n' + sections.get('trello', '')
        return code, buffer.getvalue()


def create_explicit_tasks(locked):
    """Seules des tâches explicitement mappées sont créées ; marqueur stable anti-doublon."""
    sys.path.insert(0, str(ROOT / 'tools/agent_lapinous'))
    import agent
    from suivi_trello import collect, evidence
    with tempfile.TemporaryDirectory() as folder:
        seed = Path(folder) / 'trello-state.json'
        if locked.data.get('trello'):
            seed.write_text(json.dumps(locked.data['trello']), encoding='utf-8')
        changes, _, _ = collect(ROOT, seed, locked.data.get('new_tasks', []),
                                 since=None if seed.exists() else locked.data['source_commit'])
    lists = agent.get_lists()
    cards = agent.api('GET', 'boards/' + agent.BOARD + '/cards',
                      {'filter': 'all', 'fields': 'id,name,desc,idList,closed'})
    results = []
    for task in locked.data.get('new_tasks', []):
        marker = '[warrenfall-task:' + task['key'] + ']'
        import unicodedata
        normalize = lambda name: ' '.join(''.join(c for c in unicodedata.normalize('NFKD', name.casefold()) if not unicodedata.combining(c)).split())
        matches = [c for c in cards if marker in c.get('desc', '') or normalize(c['name']) == normalize(task['name'])]
        if len(matches) > 1:
            raise RuntimeError('Trello : marqueur déjà en double, création bloquée')
        if matches:
            results.append({'id': matches[0]['id'], 'name': task['name'], 'status': 'existing'})
            continue
        target = lists.get(task.get('list', '').casefold())
        # Aucune création dans les listes protégées ni validation automatique.
        if not target or not task['list'].casefold().startswith(('priorité', 'priorite')):
            raise ValueError('Trello : liste de priorité explicite requise')
        if not task.get('preuves') or not evidence(task, changes):
            results.append({'name': task['name'], 'status': 'ignored', 'reason': 'Preuves de fichiers absentes'})
            continue
        ops = locked.data.setdefault('creations', {})
        if task['key'] in ops:
            # Après timeout, seul un marqueur retrouvé permet de conclure : ne pas
            # recréer une carte dont la création pourrait avoir abouti.
            results.append({'name': task['name'], 'status': 'blocked', 'reason': 'Création précédente non confirmée'})
            continue
        ops[task['key']] = {'status': 'intent'}
        locked.save()
        r = request('POST', 'https://api.trello.com/1/cards', data={
            'key': os.environ['TRELLO_API_KEY'], 'token': os.environ['TRELLO_TOKEN'],
            'idList': target['id'], 'name': task['name'], 'desc': task.get('description', '') + '\n' + marker})
        if not r.ok:
            raise RuntimeError(f'Trello : création non confirmée HTTP {r.status_code}')
        card = r.json()
        ops[task['key']] = {'status': 'done', 'id': card['id']}
        cards.append(card)
        results.append({'id': card['id'], 'name': task['name'], 'status': 'created'})
        locked.save()
    return results


def render(state, proposed, errors, details=''):
    lines = ['# Bilan hybride Warrenfall', '', '## Transferts locaux',
             json.dumps(state.get('local_sync', {'status': 'aucun transfert local communiqué'}), ensure_ascii=False, indent=2),
             '', '## Quarantaine et échéances', json.dumps(proposed, ensure_ascii=False, indent=2),
             '', '## Sauvegardes locales attestées',
             *[f'- {p["payload"]["path"]} — SHA-256 {p["payload"]["hash"]}' for p in state.get('attestations', {}).values()],
             '', '## Opérations persistées / reprises', json.dumps(state.get('operations', {}), ensure_ascii=False, indent=2),
             '', '## Notifications', json.dumps(state.get('notifications', {}), ensure_ascii=False, indent=2),
             '', '## Trello / Git / documentation', details or 'Non exécuté en simulation.',
             '', '## Erreurs', *errors]
    return '\n'.join(lines)


def deletion_allowed(state):
    try:
        policy = json.loads((ROOT / 'tools/cloudinary-deletion-policy.json').read_text(encoding='utf-8'))
        return policy.get('suspended') is False and state.get('deletion_policy', {}).get('suspended') is False
    except (ValueError, OSError):
        return False


def execute(locked, key, cloud, now, source):
    state = locked.data
    state['report_sections'] = {}
    errors, details = [], ''
    # Protège aussi les références locales non encore publiées sur GitHub.
    inventory = state.get('inventory', {})
    active_local = []
    inventory_ok = isinstance(inventory.get('selected'), list) and bool(inventory['selected']) and inventory.get('missing') == []
    for item in inventory.get('selected', []):
        record = state['manifest']['assets'].get(item.get('path'))
        if not record or record.get('status') != 'verified' or (item.get('hash') and item['hash'] != record.get('hash')):
            inventory_ok = False
        elif record.get('public_id') and record.get('url'):
            active_local.extend([record['public_id'], record['url']])
    source += '\n' + '\n'.join(active_local)
    try:
        proposed = plan(state, source, key, now)
    except Exception as exc:
        proposed = {'blocked': [{'reason': 'Plan de corbeille invalide : ' + type(exc).__name__}]}
        inventory_ok = False
        errors.append('Cloudinary : plan interrompu ; aucune suppression tentée.')
    policy_ok = deletion_allowed(state)
    if not policy_ok or os.getenv('LAPINOUS_CLOUDINARY_DELETE_DISABLED') == 'true':
        errors.append('Cloudinary corbeille : politique de suppression suspendue ou non confirmée.')
    elif not inventory_ok:
        errors.append('Cloudinary inventaire : état actif incomplet ; corbeille suspendue.')
    elif state.get('local_sync', {}).get('syncStatus') != 'success':
        errors.append('Cloudinary synchronisation : dernier transfert non confirmé ; corbeille suspendue.')
    else:
        try:
            proposed['deleted'], trash_errors = apply_trash(locked, proposed, cloud)
            errors.extend('Cloudinary corbeille : ' + json.dumps(e, ensure_ascii=False) for e in trash_errors)
        except StateError:
            raise  # Stockage cassé : conserver le verrou, aucune nouvelle mutation.
        except Exception:
            errors.append('Cloudinary corbeille : erreur de script ; reprise nécessaire.')
    # Vérification quotidienne des URL actives, indépendante du traitement corbeille.
    for item in state['manifest']['assets'].values():
        if item.get('url') not in source:
            continue
        try:
            remote = cloud.get(item['public_id'])
            if not remote or remote.get('secure_url') != item['url']:
                raise ValueError()
        except Exception:
            errors.append('Cloudinary ressources : inaccessible ou identité différente — ' + item['path'])
    state['report_sections']['images'] = cloudinary_details(state, proposed, now)
    state['report_sections']['_cloud_ok'] = not any(e.startswith('Cloudinary') for e in errors)
    creations = []
    try:
        creations = create_explicit_tasks(locked) if state.get('new_tasks') else []
    except StateError:
        raise
    except Exception as exc:
        errors.append('Trello créations : ' + type(exc).__name__ + ' ; bilan des cartes maintenu.')
    try:
        code, details = trello(locked)
        details += '\nCartes nouvelles : ' + json.dumps(creations, ensure_ascii=False)
        if code:
            errors.append('Trello / agent : étape en échec ; voir le détail du bilan.')
    except StateError:
        raise
    except Exception as exc:
        errors.append('Trello / script : ' + type(exc).__name__ + ' ; point de reprise conservé.')
    return render(state, proposed, errors, details), errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--input', type=Path, help='Export privé local, simulation sans réseau')
    parser.add_argument('--output', type=Path, default=ROOT / '.cloudinary-local/hybrid-report.md')
    args = parser.parse_args()
    cfg = json.loads((Path(__file__).parent / 'config.json').read_text())
    key = os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', '')
    now = dt.datetime.now(dt.timezone.utc)
    if args.input:
        if args.apply:
            parser.error('Application interdite depuis un fichier sans verrou distant.')
        state = json.loads(args.input.read_text(encoding='utf-8'))
        report = render(state, plan(state, references(ROOT), key, now), ['SIMULATION : aucun appel distant.'])
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding='utf-8')
        print('Simulation enregistrée ; aucune mutation distante.')
        return 0
    if not cfg['enabled']:
        print('Migration préparée, activation non validée : aucun appel distant.')
        return 0
    store = GitHubStore(os.getenv('WARRENFALL_STATE_REPO'), os.getenv('WARRENFALL_STATE_TOKEN'), cfg['state_branch'], cfg['state_file'])
    if not args.apply:
        state, _ = store.read()
        report = render(state, plan(state, references(ROOT), key, now), ['SIMULATION : lecture du stockage privé uniquement.'])
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding='utf-8')
        return 0
    if not cfg['remote_apply_validated']:
        raise StateError('Application distante non validée.')
    locked = LockedState(store, 'actions:' + os.getenv('GITHUB_RUN_ID', str(uuid.uuid4())))
    if locked.data.get('ownership') != 'hybrid':
        locked.close()
        raise StateError('Relais Windows non validé : refus de double traitement.')
    # Si le processus s'interrompt, le verrou reste présent. Aucun finally qui
    # libérerait un verrou après une écriture distante non réconciliée.
    try:
        cloud = Cloudinary()
    except KeyError:
        class UnavailableCloud:
            def get(self, *args):
                raise RuntimeError('Cloudinary : configuration absente')
        cloud = UnavailableCloud()
    report, errors = execute(locked, key, cloud, now, references(ROOT))
    locked.data['last_report'] = report
    locked.save()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(report, encoding='utf-8')
    reports = bundle(locked.data, report, locked.data['report_sections'].get('images', report))
    locked.data['last_reports'] = reports
    locked.save()
    outcomes = deliver(locked, reports, 'daily:' + paris_day(now), args.output.parent / 'reports')
    locked.data['last_delivery'] = outcomes
    errors.extend('Discord ' + channel + ' : ' + status for channel, status in outcomes.items() if status != 'sent')
    locked.save()
    locked.close()
    return int(bool(errors))


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as exc:
        # Pas de traceback de requests susceptible de contenir un webhook/token.
        print('Chaîne hybride interrompue : ' + (str(exc) if isinstance(exc, StateError) else 'erreur de script ou configuration ; état privé conservé.'), file=sys.stderr)
        raise SystemExit(1)
