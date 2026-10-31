"""Sélection explicite depuis Discord, avec les protections de la corbeille existante.

L'adaptateur Discord fournit les références du code courant ; le manifeste actif
est toujours protégé aussi. Aucun accès aux fichiers de sauvegarde locaux.
"""
import datetime as dt
import hashlib
from pathlib import PurePosixPath
from core import canonical, plan, apply_trash


class SelectionError(ValueError):
    pass


def authorized(user_id, owner_id):
    return str(owner_id).isdigit() and str(user_id) == str(owner_id)


def inspect(state, target, references, signing_key, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    target = target.strip()
    if not target or len(target) > 1500 or target in ('*', 'tout', 'all'):
        raise SelectionError('Indique une image précise, jamais une suppression globale.')
    assets = state.get('ledger', {}).get('assets', {})
    matches = [(pid, item) for pid, item in assets.items() if target in (pid, item.get('url'), item.get('path'))]
    if not matches:
        matches = [(pid, item) for pid, item in assets.items() if PurePosixPath(item.get('path', '')).name == target]
    if len(matches) != 1:
        raise SelectionError('Image introuvable ou nom ambigu. Utilise le public_id complet ou le lien exact du rapport.')
    pid, item = matches[0]
    # Même un bot démarré avant un déploiement ne peut ignorer le manifeste actif.
    active = '\n'.join(str(asset.get(field, '')) for asset in state.get('manifest', {}).get('assets', {}).values() for field in ('public_id', 'url'))
    proposed = plan(state, references + '\n' + active, signing_key, now)
    selected = None
    for kind in ('blocked', 'quarantine', 'pending', 'delete'):
        row = next((r for r in proposed[kind] if r.get('id') == pid), None)
        if row:
            selected = (kind, row)
            break
    if selected is None:
        raise SelectionError('Cette version est encore utilisée par le jeu : suppression bloquée.')
    kind, row = selected
    if kind == 'blocked':
        raise SelectionError(row['reason'])
    fingerprint = hashlib.sha256(canonical([item, state.get('attestations', {}).get(pid), state['quarantine']['items'].get(pid)])).hexdigest()
    return {'id': pid, 'path': item['path'], 'kind': kind, 'due': row.get('due'),
            'fingerprint': fingerprint, 'row': row}


def confirm(locked, selection, references, signing_key, cloud, request_id, user_id, owner_id, now=None):
    if not authorized(user_id, owner_id):
        raise SelectionError('Commande réservée au propriétaire configuré.')
    now = now or dt.datetime.now(dt.timezone.utc)
    audit = locked.data.setdefault('discord_image_requests', {})
    previous = audit.get(str(request_id))
    if previous and previous.get('status') == 'done':
        if previous.get('image') != selection['id'] or previous.get('user') != str(user_id):
            raise SelectionError('Identifiant de demande déjà utilisé pour une autre sélection.')
        return previous['result']
    current = inspect(locked.data, selection['id'], references, signing_key, now)
    if (current['fingerprint'], current['kind']) != (selection['fingerprint'], selection['kind']):
        raise SelectionError('L’image ou sa situation a changé. Relance /supprime pour vérifier la version actuelle.')
    audit[str(request_id)] = {'user': str(user_id), 'image': selection['id'], 'at': now.isoformat(), 'status': 'intent'}
    locked.save()  # Aucun traitement si l'intention n'est pas persistée.
    proposed = {key: [] for key in ('quarantine', 'pending', 'delete', 'restored', 'blocked')}
    proposed[current['kind']] = [current['row']]
    deleted, errors = apply_trash(locked, proposed, cloud)
    if errors:
        result = {'status': 'blocked', 'reason': errors[0]['error'], 'image': selection['id']}
    else:
        result = {'status': 'deleted' if deleted else 'quarantine', 'due': current['due'], 'image': selection['id']}
    audit[str(request_id)]['status'] = 'done'
    audit[str(request_id)]['result'] = result
    locked.save()
    return result
