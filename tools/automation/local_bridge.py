"""Prépare un paquet privé : métadonnées et preuves, jamais les images.
Export seul : pas d'appel Cloudinary/Trello/Discord et aucune suppression locale.
"""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid
from dotenv import load_dotenv
from core import attest, valid_path
from state_store import GitHubStore, LockedState, StateError, wait_for_state

ROOT = Path(__file__).resolve().parents[2]


def read(folder, name):
    return json.loads((folder / name).read_text(encoding='utf-8-sig'))


def export(root, backup, key):
    folder = root / '.cloudinary-local'
    ledger = read(folder, 'versions-connues.json')
    queue = read(folder, 'quarantaine.json')
    manifest = read(folder, 'manifest.json')
    inventory = read(folder, 'inventory.json')
    deletion_policy = read(root / 'tools', 'cloudinary-deletion-policy.json')
    stamp = dt.datetime.now(dt.timezone.utc).isoformat()
    proofs, blocked = {}, []
    for pid, item in ledger['assets'].items():
        if not valid_path(item.get('path', '')):
            blocked.append({'id': pid, 'reason': 'Chemin invalide'})
            continue
        relative = Path(item['path'])
        candidates = [backup / relative, backup / '.versions' / relative / (item['hash'] + relative.suffix)]
        for file in candidates:
            resolved = file.resolve()
            if not resolved.is_relative_to(backup.resolve()) or not file.is_file():
                continue
            if hashlib.sha256(file.read_bytes()).hexdigest() == item['hash']:
                proofs[pid] = attest(item, key, stamp)
                break
        else:
            blocked.append({'id': pid, 'path': item['path'], 'reason': 'Version exacte non retrouvée'})
    commit = subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip()
    # Aucun chemin absolu de sauvegarde ou secret dans le paquet.
    state = {'schema': 1, 'lock': None, 'ownership': 'windows', 'source_commit': commit,
             'exported_at': stamp, 'ledger': ledger, 'quarantine': queue,
             'manifest': manifest, 'inventory': inventory, 'deletion_policy': deletion_policy,
             'attestations': proofs, 'blocked': blocked,
             'operations': {}, 'notifications': {}, 'new_tasks': []}
    for source, dest in [('trello-state.json', 'trello'), ('trello-transitions.json', 'transitions'),
                         ('nightly-report.json', 'local_sync')]:
        if (folder / source).is_file():
            state[dest] = read(folder, source)
    if 'trello' in state:
        state['trello']['root'] = None  # Les chemins restent relatifs au dépôt.
    return state


def main():
    load_dotenv(ROOT / '.env')
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['export', 'run'])
    parser.add_argument('--backup-dir', type=Path, default=os.getenv('LAPINOUS_IMAGE_BACKUP_DIR') or ROOT.parent / 'clikergame_avec_image')
    args = parser.parse_args()
    if not args.backup_dir:
        parser.error('--backup-dir ou LAPINOUS_IMAGE_BACKUP_DIR requis')
    args.backup_dir = args.backup_dir.expanduser().resolve(strict=True)
    if not args.backup_dir.is_dir() or args.backup_dir.is_relative_to(ROOT):
        raise StateError('Sauvegarde permanente requise hors du dépôt du jeu.')
    key = os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', '')
    if args.command == 'run':
        cfg = read(Path(__file__).parent, 'config.json')
        if not cfg['enabled']:
            raise StateError('Relais local non activé ; chaîne Windows historique conservée.')
        store = GitHubStore(os.getenv('WARRENFALL_STATE_REPO'), os.getenv('WARRENFALL_STATE_TOKEN'), cfg['state_branch'], cfg['state_file'])
        locked = wait_for_state(store, 'windows:' + str(uuid.uuid4()))
        if locked.data.get('ownership') != 'hybrid':
            locked.close()
            raise StateError('Passage de relais non validé.')
        folder = ROOT / '.cloudinary-local'
        # La quarantaine distante reste l'autorité : aucun nouveau délai local.
        for name, value in [('quarantaine.json', locked.data['quarantine'])]:
            pending = folder / (name + '.tmp')
            pending.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
            pending.replace(folder / name)
        child_env = {**os.environ, 'WARRENFALL_LOCAL_LOCK_OWNER': locked.owner,
                     'LAPINOUS_IMAGE_BACKUP_DIR': str(args.backup_dir)}
        completed = subprocess.run(['node', 'tools/update-images.mjs', '--backup-local'], cwd=ROOT, env=child_env)
        # Même un transfert échoué est communiqué, sans autoriser la corbeille.
        state = export(ROOT, args.backup_dir, key)
        tombstones = {op['id'] for op in locked.data.get('operations', {}).values() if op.get('status') == 'done'}
        for pid in tombstones:
            state['ledger']['assets'].pop(pid, None)
            state['attestations'].pop(pid, None)
        # Contradiction sur un ID immutable : ne pas écraser l'état distant.
        for pid, item in state['ledger']['assets'].items():
            previous = locked.data['ledger']['assets'].get(pid)
            if previous and any(previous.get(k) != item.get(k) for k in ('hash', 'url', 'path', 'public_id')):
                raise StateError('Version historique contradictoire : relais bloqué.')
        locked.data['ledger']['assets'].update(state['ledger']['assets'])
        for name in ('manifest', 'inventory', 'deletion_policy', 'attestations', 'blocked', 'source_commit', 'exported_at', 'local_sync'):
            if name in state:
                locked.data[name] = state[name]
        # Invalide une ancienne réussite si le processus n'a pas achevé sa passe.
        if completed.returncode:
            locked.data.setdefault('local_sync', {})['syncStatus'] = 'failed'
        locked.save()
        locked.close()
        print('Etat Windows transmis au stockage privé ; aucun bilan/Trello local en mode hybride.')
        return completed.returncode
    state = export(ROOT, args.backup_dir, key)
    target = ROOT / '.cloudinary-local/hybrid-export.json'
    pending = target.with_suffix('.tmp')
    pending.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
    pending.replace(target)
    print(f'Export privé : {len(state["attestations"])} preuves ; {len(state["blocked"])} blocages. Aucun envoi.')


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:
        print('Relais local interrompu : vérifier la configuration et le verrou privé ; aucun déverrouillage forcé.', file=sys.stderr)
        sys.exit(1)
