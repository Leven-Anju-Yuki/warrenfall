"""Signal privé après publication et libération du verrou Windows ; aucune action métier."""
import base64
import datetime as dt
import hashlib
import json
from pathlib import Path


def request_report(store, sync, source_commit):
    """Un push PAT sur ce seul fichier déclenche le relais Actions privé.

    Écriture CAS unique : une réponse réseau ambiguë n'est pas répétée à l'aveugle.
    Le planning distant reste le secours si ce signal ne peut pas être publié.
    """
    identity = json.dumps({'sync': sync, 'source_commit': source_commit}, sort_keys=True)
    request_id = hashlib.sha256(identity.encode()).hexdigest()
    name = 'report-request.json'
    tree = store.request('GET', '/git/trees/' + store.branch)
    entry = next((row for row in tree['tree'] if row['path'] == name), None)
    if entry:
        blob = store.request('GET', '/git/blobs/' + entry['sha'])
        previous = json.loads(base64.b64decode(blob['content']))
        if previous.get('id') == request_id:
            return 'already-requested'
    marker = {'schema': 1, 'id': request_id,
              'requested_at': dt.datetime.now(dt.timezone.utc).isoformat(),
              'sync_finished_at': sync.get('finishedAt'), 'source_commit': source_commit}
    payload = {'message': 'Demande le bilan après le relais Windows', 'branch': store.branch,
               'content': base64.b64encode(json.dumps(marker).encode()).decode()}
    if entry:
        payload['sha'] = entry['sha']
    store.request('PUT', '/contents/' + name, json=payload)
    return 'requested'


def publish_and_request(locked, store, output):
    """L'état et ses attestations sont durables avant tout signal de fin."""
    locked.save()
    locked.close()
    try:
        status = request_report(store, locked.data.get('local_sync', {}),
                                locked.data.get('source_commit'))
    except Exception:
        # Ne pas masquer une synchro sauvegardée, ni exposer une exception contenant un jeton.
        status = 'request-failed'
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({'status': status,
        'at': dt.datetime.now(dt.timezone.utc).isoformat()}), encoding='utf-8')
    return status
