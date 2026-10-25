"""Secours d'envoi après échec précoce ; ne lance aucun traitement métier."""
import json
import datetime as dt
import os
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from reporting import deliver


def recover_reports(folder):
    """Collecte de secours en lecture seule ; jamais de rejeu des traitements."""
    now = dt.datetime.now(dt.timezone.utc)
    header = ('Exécution de secours du ' + now.isoformat() + '\nSource : https://github.com/'
              + os.getenv('GITHUB_REPOSITORY', '') + '/actions/runs/' + os.getenv('GITHUB_RUN_ID', '')
              + '\nMode : lecture seule ; aucune mutation Cloudinary/Trello.\n\n')
    state, issue = None, 'État indisponible : aucune conclusion métier possible.'
    try:
        snapshot = folder / 'run-state.json'
        if snapshot.exists():
            state = json.loads(snapshot.read_text(encoding='utf-8'))
        elif os.getenv('WARRENFALL_STATE_TOKEN') and os.getenv('WARRENFALL_STATE_REPO'):
            from state_store import GitHubStore
            state, _ = GitHubStore(os.environ['WARRENFALL_STATE_REPO'], os.environ['WARRENFALL_STATE_TOKEN']).read()
    except Exception as exc:
        issue = 'Lecture de l’état impossible : ' + type(exc).__name__ + '. Aucun état réinitialisé.'
    reports = {}
    if state is not None:
        try:
            from core import plan
            from remote import references, ROOT
            from reporting import cloudinary_details
            proposed = plan(state, references(ROOT), os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', ''), now)
            reports['images'] = header + ('# Cloudinary — état et échéances de secours\n'
                'Pas de transfert, suppression ou contrôle des URL exécuté par ce secours.\n\n'
                + cloudinary_details(state, proposed, now))
        except Exception as exc:
            reports['images'] = header + '# Cloudinary — diagnostic\nCollecte impossible : ' + type(exc).__name__
        try:
            from remote import trello
            state['report_sections'] = {'images': reports['images'], '_cloud_ok': False}
            # Le verrou reste intact ; seules les lectures Trello sont autorisées.
            local = SimpleNamespace(data=state, save=lambda: None)
            with patch.dict(os.environ, {'LAPINOUS_TRELLO_READ_ONLY': 'true'}):
                code, details = trello(local)
            reports['trello'] = header + (state.get('report_sections', {}).get('trello') or details)
            if code:
                reports['trello'] += '\nCollecte Trello avec erreurs ; voir diagnostics ci-dessus.'
        except Exception as exc:
            reports['trello'] = header + '# Trello — diagnostic\nLecture impossible : ' + type(exc).__name__
    else:
        reports['images'] = header + '# Cloudinary — diagnostic\n' + issue + '\nAucun transfert ou effacement tenté.'
        reports['trello'] = header + '# Trello — diagnostic\n' + issue + '\nAucune modification tentée.'
    failure = folder / 'failure.json'
    for channel in ('images', 'trello'):
        completed = folder / (channel + '.md')
        if completed.exists():
            reports[channel] = completed.read_text(encoding='utf-8')
    diagnostic = failure.read_text(encoding='utf-8') if failure.exists() else 'Consulter l’étape en échec dans les journaux Actions.'
    reports['bilan'] = header + '# Bilan de secours détaillé\n' + diagnostic + '\n\n' + reports['images'] + '\n\n' + reports['trello']
    return reports


def main():
    folder = Path('.cloudinary-local/reports')
    receipt = folder / 'delivery.json'
    if not receipt.exists() and os.getenv('WARRENFALL_STATE_TOKEN') and os.getenv('WARRENFALL_STATE_REPO'):
        try:
            from state_store import GitHubStore
            from remote import delivery_id
            from report_cycle import completed, acknowledge_existing
            state, _ = GitHubStore(os.environ['WARRENFALL_STATE_REPO'], os.environ['WARRENFALL_STATE_TOKEN']).read()
            if completed(state, delivery_id(dt.datetime.now(dt.timezone.utc), state)):
                acknowledge_existing(folder)
                print('Cycle déjà livré : aucun rapport de secours en doublon.')
                return 0
        except Exception:
            pass  # Le secours détaillé reste disponible si l'état n'est pas lisible.
    previous = json.loads(receipt.read_text()) if receipt.exists() else {}
    old_receipt = folder / 'fallback-receipt.json'
    old_notifications = json.loads(old_receipt.read_text()).get('notifications', {}) if old_receipt.exists() else {}
    for key, value in old_notifications.items():
        if key.startswith('fallback:'):
            previous.setdefault(key.split(':', 1)[1], value['status'])
    recovered = None
    reports = {}
    for channel in ('bilan', 'images', 'trello'):
        # Même un envoi ambigu n'est jamais répété à l'aveugle.
        if channel in previous:
            continue
        file = folder / (channel + '.md')
        if file.exists():
            reports[channel] = file.read_text(encoding='utf-8')
        else:
            if recovered is None:
                recovered = recover_reports(folder)
            reports[channel] = recovered[channel]
    if not reports:
        return 0
    class Receipt:
        data = {'notifications': old_notifications}
        def save(self):
            folder.mkdir(parents=True, exist_ok=True)
            (folder / 'fallback-receipt.json').write_text(json.dumps(self.data), encoding='utf-8')
    outcomes = deliver(Receipt(), reports, 'fallback', folder)
    receipt.write_text(json.dumps({**previous, **outcomes}), encoding='utf-8')
    print(json.dumps(outcomes))
    return int(any(value != 'sent' for value in outcomes.values()))


if __name__ == '__main__':
    raise SystemExit(main())
