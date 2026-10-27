"""Etat privé durable : comparaison de SHA, verrou partagé Windows/Actions.
Pas de cache Actions ni d'artifact utilisé comme source de vérité.
"""
from __future__ import annotations
import copy
import json
import re
import time
import requests


class StateError(RuntimeError):
    pass


class StateBusy(StateError):
    pass


class StateTransient(StateError):
    pass


class GitHubStore:
    def __init__(self, repo, token, branch='main', filename='warrenfall-state.json', session=None):
        if not re.fullmatch(r'[\w.-]+/[\w.-]+', repo or '') or not token:
            raise StateError('Dépôt privé et jeton d’état requis.')
        if not re.fullmatch(r'[\w.-]+', branch) or not re.fullmatch(r'[\w.-]+\.json', filename):
            raise StateError('Branche ou fichier d’état invalide.')
        self.base = f'https://api.github.com/repos/{repo}'
        self.branch, self.filename = branch, filename
        self.http = session or requests.Session()
        self.http.headers.update({'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json'})

    def request(self, method, path, **kwargs):
        for attempt in range(3 if method == 'GET' else 1):
            try:
                r = self.http.request(method, self.base + path, timeout=45, **kwargs)
                if r.ok:
                    return r.json()
                if r.status_code not in (429, 500, 502, 503, 504):
                    raise StateError(f'Stockage GitHub HTTP {r.status_code} ; aucun écrasement forcé.')
                issue = f'Stockage GitHub HTTP {r.status_code} ; reprise après vérification.'
            except requests.RequestException:
                issue = 'Stockage GitHub : réseau ou TLS indisponible ; reprise après vérification.'
            if method != 'GET' or attempt == 2:
                raise StateTransient(issue)
            time.sleep(attempt + 1)

    def read(self):
        import base64
        if self.request('GET', '').get('private') is not True:
            raise StateError('Le dépôt d’état doit être privé.')
        value = self.request('GET', '/contents/' + self.filename, params={'ref': self.branch})
        blob = self.request('GET', '/git/blobs/' + value['sha'])
        state = json.loads(base64.b64decode(blob['content']))
        if state.get('schema') != 1:
            raise StateError('Etat absent/incompatible : pas de réinitialisation automatique.')
        return state, value['sha']

    def write(self, state, revision):
        import base64
        payload={'message': 'Enregistre le suivi des automatisations Warrenfall',
                 'branch': self.branch, 'sha': revision,
                 'content': base64.b64encode(json.dumps(state, ensure_ascii=False).encode()).decode()}
        for attempt in range(3):
            try:
                result = self.request('PUT', '/contents/' + self.filename, json=payload)
                return result['content']['sha']
            except StateTransient:
                # Le serveur peut avoir enregistré malgré le HTTP 500 : relire
                # avant toute répétition, sans jamais changer le SHA attendu.
                current, actual = self.read()
                if current == state:
                    return actual
                if actual != revision:
                    raise StateError('Etat modifié simultanément : aucune répétition ni écrasement.') from None
                if attempt == 2:
                    raise
                time.sleep(attempt + 1)


class LockedState:
    def __init__(self, store, owner):
        self.store, self.owner = store, owner
        self.data, self.revision = store.read()
        if self.data.get('lock'):
            raise StateBusy('Traitement déjà verrouillé ; reprise manuelle après vérification du propriétaire.')
        self.data['lock'] = {'owner': owner}
        self.save()

    def save(self):
        if self.data.get('lock', {}).get('owner') != self.owner:
            raise StateError('Propriétaire du verrou incohérent.')
        self.revision = self.store.write(copy.deepcopy(self.data), self.revision)

    def close(self):
        self.data['lock'] = None
        self.revision = self.store.write(self.data, self.revision)

    # Pas d'expiration du verrou : un runner ancien ne peut pas continuer à supprimer
    # après une reprise concurrente. Un crash bloque jusqu'à contrôle explicite.


def wait_for_state(store, owner, timeout=600, interval=10):
    """Attend la fin du relais concurrent, sans voler ni expirer son verrou."""
    deadline = time.monotonic() + timeout
    while True:
        try:
            return LockedState(store, owner)
        except StateBusy:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise StateBusy('Relais encore verrouillé après attente ; aucun traitement concurrent lancé.') from None
            time.sleep(min(interval, remaining))
