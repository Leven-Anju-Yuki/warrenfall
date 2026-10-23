"""Transports avec TLS normal et erreurs sans secrets. Aucune mutation réessayée aveuglément."""
from __future__ import annotations
import hashlib
import os
import time
from urllib.parse import quote, urlparse
import requests


def request(method, url, *, http=requests, **kwargs):
    attempts = 3 if method in ('GET', 'HEAD') else 1
    for attempt in range(attempts):
        try:
            r = http.request(method, url, timeout=45, **kwargs)
            if r.status_code in (429, 500, 502, 503, 504) and attempt + 1 < attempts:
                time.sleep(2 ** attempt)
                continue
            return r
        except requests.exceptions.SSLError:
            raise RuntimeError('Réseau / SSL : validation du certificat échouée') from None
        except requests.RequestException:
            if attempt + 1 == attempts:
                raise RuntimeError('Réseau : connexion interrompue ; reprise requise') from None
            time.sleep(2 ** attempt)


class Cloudinary:
    def __init__(self):
        self.cloud = os.environ['CLOUDINARY_CLOUD_NAME']
        self.auth = (os.environ['CLOUDINARY_API_KEY'], os.environ['CLOUDINARY_API_SECRET'])
        self.base = 'https://api.cloudinary.com/v1_1/' + quote(self.cloud, safe='') + '/resources/image/upload'

    def get(self, pid):
        r = request('GET', self.base + '/' + quote(pid, safe='/'), auth=self.auth)
        if r.status_code == 404:
            return None
        if not r.ok:
            raise RuntimeError(f'Cloudinary : lecture HTTP {r.status_code}')
        return r.json()

    def digest(self, url):
        parsed = urlparse(url)
        if parsed.scheme != 'https' or parsed.hostname != 'res.cloudinary.com' or not parsed.path.startswith('/' + self.cloud + '/'):
            raise RuntimeError('URL de livraison Cloudinary non autorisée')
        r = request('GET', url, stream=True, allow_redirects=False)
        if r.status_code != 200:
            raise RuntimeError(f'Cloudinary : ressource HTTP {r.status_code}')
        digest, total = hashlib.sha256(), 0
        try:
            for chunk in r.iter_content(1024 * 1024):
                total += len(chunk)
                if total > 100_000_000:
                    raise RuntimeError('Ressource trop volumineuse pour vérification distante')
                digest.update(chunk)
        finally:
            r.close()
        return digest.hexdigest()

    def delete(self, pid):
        r = request('DELETE', self.base, auth=self.auth, data={'public_ids[]': pid, 'invalidate': 'true'})
        if not r.ok or r.json().get('partial') or r.json().get('deleted', {}).get(pid) != 'deleted':
            raise RuntimeError(f'Cloudinary corbeille : suppression non confirmée (HTTP {r.status_code})')


def send_discord(locked, event_id, text, url):
    """Envoi confirmé enregistré ; timeout ambigu bloqué, jamais doublé à l'aveugle."""
    import json
    entries = locked.data.setdefault('notifications', {})
    previous = entries.get(event_id)
    if previous:
        return previous['status']
    entries[event_id] = {'status': 'sending'}
    locked.save()
    try:
        # Rapport complet en pièce jointe : pas de troncature à 2 000 caractères.
        r = request('POST', url, params={'wait': 'true'},
                    data={'payload_json': json.dumps({'content': 'Bilan Warrenfall — rapport détaillé',
                                                      'allowed_mentions': {'parse': []}})},
                    files={'files[0]': ('bilan.md', text.encode(), 'text/markdown')})
        if not r.ok or not r.json().get('id'):
            raise RuntimeError(f'Discord : envoi non confirmé (HTTP {r.status_code})')
        entries[event_id] = {'status': 'sent', 'message_id': r.json()['id']}
    except Exception:
        entries[event_id] = {'status': 'uncertain', 'error': 'Discord : confirmation absente ; vérifier avant de renvoyer'}
    locked.save()
    return entries[event_id]['status']
