"""Test explicite : lectures uniquement, puis envoi Discord sur demande. Jamais de bilan --apply."""
from __future__ import annotations
import argparse
import contextlib
import datetime as dt
import io
import json
import os
from pathlib import Path
import sys
import uuid
import hashlib
import tempfile
from unittest.mock import patch
from reporting import deliver, cloudinary_details

ROOT = Path(__file__).resolve().parents[2]


def business_fingerprint(state):
    excluded = {'lock', 'notifications', 'validation_runs'}
    return hashlib.sha256(json.dumps({k: value for k, value in state.items() if k not in excluded},
                                    sort_keys=True, ensure_ascii=False).encode('utf-8')).hexdigest()


def collect_reports(source, state=None):
    sys.path.insert(0, str(ROOT / 'tools/agent_lapinous'))
    import agent
    now = dt.datetime.now(dt.timezone.utc)
    cloud = 'Aucun journal de transfert local disponible sur ce runner. Aucun transfert local exécuté.'
    if source == 'local':
        cloud, _ = agent.cloudinary_report(ROOT)
    elif state is not None:
        from core import plan
        from remote import references
        proposed = plan(state, references(ROOT), os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', ''), now)
        cloud = cloudinary_details(state, proposed, now)
    buffer = io.StringIO()
    try:
        with tempfile.TemporaryDirectory() as folder, contextlib.ExitStack() as stack:
            checkpoint = Path(folder) / 'trello-state.json'
            if state is not None and state.get('trello'):
                checkpoint.write_text(json.dumps(state['trello']), encoding='utf-8')
            if state is not None:
                stack.enter_context(patch.object(agent, 'STATE_FILE', checkpoint))
            stack.enter_context(patch.object(agent, 'cloudinary_report', return_value=(cloud, False)))
            stack.enter_context(patch.dict(os.environ, {'LAPINOUS_TRELLO_READ_ONLY': 'true'}))
            stack.enter_context(contextlib.redirect_stdout(buffer))
            agent.bilan(False)
    except Exception as exc:
        buffer.write('\nCollecte Trello interrompue : ' + type(exc).__name__)
    trello = buffer.getvalue() or 'Aucune donnée Trello collectée.'
    header = '# TEST NON DESTRUCTIF Warrenfall\n\nDate UTC : ' + now.isoformat()
    if os.getenv('GITHUB_RUN_ID'):
        header += '\nExécution GitHub Actions : ' + os.environ['GITHUB_RUN_ID']
    if state is not None:
        header += '\nEmpreinte de l’état métier lu : ' + business_fingerprint(state)
    return {'bilan': header + '\n\n' + cloud + '\n\n' + trello,
            'images': header + '\n\n' + cloud, 'trello': header + '\n\n' + trello}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--send', action='store_true')
    parser.add_argument('--source', choices=['local', 'actions'], default='actions')
    parser.add_argument('--output', type=Path, default=ROOT / '.cloudinary-local/discord-probe')
    args = parser.parse_args()
    locked = None
    before = None
    run_id = os.getenv('GITHUB_RUN_ID', str(uuid.uuid4()))
    if args.source == 'actions':
        from state_store import GitHubStore, LockedState
        store = GitHubStore(os.getenv('WARRENFALL_STATE_REPO'), os.getenv('WARRENFALL_STATE_TOKEN'))
        if args.send:
            locked = LockedState(store, 'validation:' + run_id)
            state = locked.data
            previous = next((r for r in state.get('validation_runs', []) if r['run_id'] == run_id), None)
            if previous:
                locked.close()
                print('Validation déjà enregistrée pour ce run ; aucun nouvel envoi.')
                return int(any(s != 'sent' for s in previous['outcomes'].values()))
        else:
            state, _ = store.read()
        before = business_fingerprint(state)
        reports = collect_reports(args.source, state)
    else:
        reports = collect_reports(args.source)
    args.output.mkdir(parents=True, exist_ok=True)
    for channel, text in reports.items():
        (args.output / (channel + '.md')).write_text(text, encoding='utf-8')
    if not args.send:
        print('Rapports générés ; aucune mutation ni notification.')
        return 0
    # Ce reçu local ne modifie pas l'état de production ni les clés quotidiennes.
    class Receipt:
        data = {'notifications': {}}
        def save(self):
            (args.output / 'receipt.json').write_text(json.dumps(self.data), encoding='utf-8')
    receipt = locked or Receipt()
    outcomes = deliver(receipt, reports, 'validation:' + run_id, args.output, test=True)
    if locked:
        after = business_fingerprint(locked.data)
        if before != after:
            raise RuntimeError('État métier modifié pendant la validation ; verrou conservé.')
        previous = locked.data.get('validation_runs', [])
        entry = {'run_id': run_id, 'at': dt.datetime.now(dt.timezone.utc).isoformat(),
                 'fingerprint_before': before, 'fingerprint_after': after,
                 'previous_run': previous[-1]['run_id'] if previous else None,
                 'same_as_previous': previous[-1]['fingerprint_after'] == before if previous else None,
                 'outcomes': outcomes}
        locked.data.setdefault('validation_runs', []).append(entry)
        locked.save()
        locked.close()
        print(json.dumps({'validation': entry, 'business_state_unchanged': True}, ensure_ascii=False))
    else:
        print(json.dumps({'outcomes': outcomes, 'confirmations': receipt.data['notifications']}, ensure_ascii=False))
    return int(any(status != 'sent' for status in outcomes.values()))


if __name__ == '__main__':
    raise SystemExit(main())
