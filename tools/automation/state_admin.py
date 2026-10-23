"""Initialisation/transfert de responsabilité EXPLICITES, jamais appelés par le cron."""
import argparse
import base64
import json
import os
from pathlib import Path
import sys
from dotenv import load_dotenv
from state_store import GitHubStore, LockedState, StateError

ROOT = Path(__file__).resolve().parents[2]


def main():
    load_dotenv(ROOT / '.env')
    p = argparse.ArgumentParser()
    p.add_argument('command', choices=['initialize', 'handoff'])
    p.add_argument('--from-export', type=Path)
    p.add_argument('--simulations-approved', action='store_true')
    a = p.parse_args()
    if not a.simulations_approved:
        p.error('Validation humaine des simulations requise avant publication privée ou relais.')
    cfg = json.loads((Path(__file__).parent / 'config.json').read_text())
    store = GitHubStore(os.getenv('WARRENFALL_STATE_REPO'), os.getenv('WARRENFALL_STATE_TOKEN'), cfg['state_branch'], cfg['state_file'])
    if a.command == 'initialize':
        if not a.from_export:
            p.error('--from-export requis')
        state = json.loads(a.from_export.read_text(encoding='utf-8'))
        if state.get('schema') != 1 or state.get('ownership') != 'windows' or state.get('lock'):
            raise StateError('Export initial invalide.')
        if store.request('GET', '').get('private') is not True:
            raise StateError('Dépôt privé requis.')
        # Création sans SHA : GitHub refuse si le fichier existe déjà.
        store.request('PUT', '/contents/' + store.filename, json={
            'message': 'Initialise le suivi privé Warrenfall sans modifier les échéances',
            'branch': store.branch, 'content': base64.b64encode(json.dumps(state, ensure_ascii=False).encode()).decode()})
        print('Etat privé initialisé, responsabilité Windows conservée.')
    else:
        if not cfg['enabled']:
            raise StateError('Installer et activer le relais local avant de transférer la responsabilité.')
        locked = LockedState(store, 'human-approved-handoff')
        if locked.data.get('ownership') != 'windows':
            locked.close()
            raise StateError('Relais déjà effectué ou état incohérent.')
        locked.data['ownership'] = 'hybrid'
        locked.save()
        locked.close()
        print('Relais confirmé. Activer Actions seulement après contrôle des simulations distantes.')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Administration interrompue ; vérifier le dépôt privé et le verrou, sans forcer.', file=sys.stderr)
        sys.exit(1)
