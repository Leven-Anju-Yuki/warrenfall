"""Règles hybrides testables sans réseau ni dépendance Windows."""
from __future__ import annotations
import datetime as dt
import hashlib
import hmac
import json
from pathlib import PurePosixPath
from zoneinfo import ZoneInfo

UTC = dt.timezone.utc
GRACE = dt.timedelta(days=7)


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()


def valid_path(name):
    if not isinstance(name, str):
        return False
    p = PurePosixPath(name)
    return (isinstance(name, str) and name.startswith('assets/img/') and '\\' not in name
            and not p.is_absolute() and '..' not in p.parts and ':' not in name)


def attest(record, key, stamp):
    if not key or len(key) < 32:
        raise ValueError('Clé d’attestation : au moins 32 caractères.')
    payload = {k: record[k] for k in ('path', 'public_id', 'url', 'hash')}
    if not valid_path(payload['path']) or len(payload['hash']) != 64:
        raise ValueError('Version à attester invalide.')
    payload.update(version=1, confirmed_at=stamp)
    return {'payload': payload, 'signature': hmac.new(key.encode(), canonical(payload), hashlib.sha256).hexdigest()}


def confirmed(record, proof, key):
    try:
        payload = proof['payload']
        expected = hmac.new(key.encode(), canonical(payload), hashlib.sha256).hexdigest()
        return (len(key) >= 32 and payload['version'] == 1 and
                hmac.compare_digest(expected, proof['signature']) and
                all(payload[k] == record[k] for k in ('path', 'public_id', 'url', 'hash')))
    except (KeyError, TypeError, AttributeError):
        return False


def paris_day(now):
    return now.astimezone(ZoneInfo('Europe/Paris')).date().isoformat()


def plan(state, references, key, now):
    """Ne change jamais la date d'une quarantaine existante. Aucune écriture ici."""
    result = {'quarantine': [], 'restored': [], 'pending': [], 'delete': [], 'blocked': []}
    for pid, item in state['ledger']['assets'].items():
        base = {'id': pid, 'path': item.get('path')}
        queued = state['quarantine']['items'].get(pid)
        if not valid_path(item.get('path', '')) or not pid.startswith('lapinous/') or item.get('public_id') != pid:
            result['blocked'].append({**base, 'reason': 'Identité ou chemin invalide'})
            continue
        if pid in references or item.get('url') in references:
            if queued:
                result['restored'].append(base)
            continue
        if not confirmed(item, state.get('attestations', {}).get(pid), key):
            result['blocked'].append({**base, 'reason': 'Sauvegarde exacte non attestée ; conservation obligatoire'})
            continue
        if not queued:
            result['quarantine'].append({**base, 'since': now.isoformat(), 'due': (now + GRACE).isoformat()})
            continue
        try:
            since = dt.datetime.fromisoformat(queued['since'].replace('Z', '+00:00'))
            if queued.get('type') != 'logical' or since.tzinfo is None or since > now:
                raise ValueError()
            if any(queued.get(k) != item.get(k) for k in ('hash', 'url', 'path', 'public_id')):
                raise ValueError()
        except (ValueError, KeyError):
            result['blocked'].append({**base, 'reason': 'Date, type ou version de quarantaine incohérente'})
            continue
        row = {**base, 'since': queued['since'], 'due': (since + GRACE).isoformat()}
        result['pending' if now < since + GRACE else 'delete'].append(row)
    for pid in set(state['quarantine']['items']) - set(state['ledger']['assets']):
        result['blocked'].append({'id': pid, 'reason': 'Quarantaine sans historique'})
    return result


def apply_trash(locked, proposed, cloud):
    """Journal durable AVANT DELETE ; absence après crash conciliée, pas de second DELETE."""
    state = locked.data
    journal = state.setdefault('operations', {})
    for row in proposed['restored']:
        state['quarantine']['items'].pop(row['id'], None)
    for row in proposed['quarantine']:
        state['quarantine']['items'][row['id']] = {**state['ledger']['assets'][row['id']], 'since': row['since'], 'type': 'logical'}
    locked.save()
    deleted, errors = [], []
    for row in proposed['delete']:
        pid = row['id']
        item = state['ledger']['assets'][pid]
        opid = hashlib.sha256(canonical([pid, item['hash'], row['since']])).hexdigest()
        op = journal.get(opid)
        try:
            remote = cloud.get(pid)
            if remote is None:
                if not op or op.get('status') not in ('intent', 'done'):
                    raise ValueError('Image absente sans suppression journalisée : contrôle requis')
            else:
                if (remote.get('public_id') != pid or remote.get('secure_url') != item['url'] or
                        remote.get('resource_type') != 'image' or remote.get('type') != 'upload'):
                    raise ValueError('Identité Cloudinary différente : suppression bloquée')
                if cloud.digest(item['url']) != item['hash']:
                    raise ValueError('Contenu distant différent de la sauvegarde attestée')
                journal[opid] = {'id': pid, 'hash': item['hash'], 'since': row['since'], 'status': 'intent'}
                locked.save()  # Un échec de persistance interdit l'appel suivant.
                cloud.delete(pid)
            journal[opid] = {'id': pid, 'hash': item['hash'], 'since': row['since'], 'status': 'done'}
            del state['ledger']['assets'][pid]
            state['quarantine']['items'].pop(pid, None)
            deleted.append(row)
            locked.save()
        except Exception as exc:
            # Les erreurs transport sont normalisées par l'adaptateur, jamais d'URL secrète.
            errors.append({'id': pid, 'error': str(exc)})
            # Une erreur de stockage peut laisser le DELETE déjà effectué : arrêter,
            # conserver le verrou si sa réconciliation n'est pas persistable.
            if exc.__class__.__name__ == 'StateError':
                raise
    return deleted, errors
