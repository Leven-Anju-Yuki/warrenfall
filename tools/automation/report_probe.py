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
from unittest.mock import patch
from reporting import deliver, cloudinary_details

ROOT = Path(__file__).resolve().parents[2]


def collect_reports(source):
    sys.path.insert(0, str(ROOT / 'tools/agent_lapinous'))
    import agent
    now = dt.datetime.now(dt.timezone.utc)
    cloud = 'Aucun journal de transfert local disponible sur ce runner. Aucun transfert local exécuté.'
    if source == 'local':
        cloud, _ = agent.cloudinary_report(ROOT)
    elif os.getenv('WARRENFALL_STATE_REPO') and os.getenv('WARRENFALL_STATE_TOKEN'):
        from state_store import GitHubStore
        from core import plan
        from remote import references
        state, _ = GitHubStore(os.environ['WARRENFALL_STATE_REPO'], os.environ['WARRENFALL_STATE_TOKEN']).read()
        proposed = plan(state, references(ROOT), os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', ''), now)
        cloud = cloudinary_details(state, proposed, now)
    buffer = io.StringIO()
    try:
        with patch.object(agent, 'cloudinary_report', return_value=(cloud, False)), \
             patch.dict(os.environ, {'LAPINOUS_TRELLO_READ_ONLY': 'true'}), contextlib.redirect_stdout(buffer):
            agent.bilan(False)
    except Exception as exc:
        buffer.write('\nCollecte Trello interrompue : ' + type(exc).__name__)
    trello = buffer.getvalue() or 'Aucune donnée Trello collectée.'
    header = '# TEST NON DESTRUCTIF Warrenfall\n\nDate UTC : ' + now.isoformat()
    return {'bilan': header + '\n\n' + cloud + '\n\n' + trello, 'images': cloud, 'trello': trello}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--send', action='store_true')
    parser.add_argument('--source', choices=['local', 'actions'], default='actions')
    parser.add_argument('--output', type=Path, default=ROOT / '.cloudinary-local/discord-probe')
    args = parser.parse_args()
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
    receipt = Receipt()
    outcomes = deliver(receipt, reports, 'test:' + str(uuid.uuid4()), args.output, test=True)
    print(json.dumps({'outcomes': outcomes, 'confirmations': receipt.data['notifications']}, ensure_ascii=False))
    return int(any(status != 'sent' for status in outcomes.values()))


if __name__ == '__main__':
    raise SystemExit(main())
