"""Simulations : aucun secret, aucun accès réseau, aucune image réelle supprimée."""
import copy
import datetime as dt
import hashlib
import json
from pathlib import Path
import tempfile
import sys
import unittest
from unittest.mock import patch
import requests
from core import attest, confirmed, plan, apply_trash, paris_day
from local_bridge import export
from state_store import LockedState, StateError, GitHubStore
from transports import send_discord, request
import remote
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'agent_lapinous'))

KEY = 'fictitious-test-key-not-a-secret-1234567890'
NOW = dt.datetime(2026, 10, 21, 12, tzinfo=dt.timezone.utc)
ITEM = {'path': 'assets/img/test/lapin.png', 'public_id': 'lapinous/test',
        'url': 'https://res.cloudinary.com/test/image/upload/v1/lapinous/test.png',
        'hash': hashlib.sha256(b'original').hexdigest()}


def fixture():
    return {'schema': 1, 'lock': None, 'ownership': 'hybrid', 'source_commit': 'abc',
            'ledger': {'assets': {ITEM['public_id']: copy.deepcopy(ITEM)}},
            'manifest': {'assets': {'active.png': {'path': 'active.png', 'status': 'verified', 'public_id': 'lapinous/active', 'url': 'https://active.invalid'}}},
            'inventory': {'selected': [{'path': 'active.png'}], 'missing': []}, 'quarantine': {'items': {ITEM['public_id']: {
                **ITEM, 'since': '2026-10-13T15:17:00+02:00', 'type': 'logical'}}},
            'attestations': {ITEM['public_id']: attest(ITEM, KEY, NOW.isoformat())},
            'deletion_policy': {'suspended': False}, 'local_sync': {'syncStatus': 'success'}, 'operations': {}}


class Store:
    def __init__(self, value):
        self.data, self.rev = copy.deepcopy(value), 0

    def read(self):
        return copy.deepcopy(self.data), self.rev

    def write(self, value, revision):
        if revision != self.rev:
            raise StateError('Conflit de révision')
        self.data = copy.deepcopy(value)
        self.rev += 1
        return self.rev


class Cloud:
    def __init__(self):
        self.present, self.calls, self.crash = True, 0, False

    def get(self, pid):
        return {'public_id': pid, 'secure_url': ITEM['url'], 'resource_type': 'image', 'type': 'upload'} if self.present else None

    def digest(self, url):
        return ITEM['hash']

    def delete(self, pid):
        self.present = False
        self.calls += 1
        if self.crash:
            raise KeyboardInterrupt('Simulation coupure après réponse distante')


class HybridTests(unittest.TestCase):
    def setUp(self):
        guard = patch('remote.deletion_allowed', return_value=True)
        guard.start()
        self.addCleanup(guard.stop)

    def test_disabled_configuration_makes_no_network_call(self):
        with patch('sys.argv', ['remote.py']), patch('pathlib.Path.read_text', return_value='{"enabled":false}'), \
             patch('requests.sessions.Session.request') as call:
            self.assertEqual(remote.main(), 0)
            call.assert_not_called()

    def test_private_store_refuses_public_repository_and_conflict(self):
        http = unittest.mock.Mock()
        http.headers = {}
        response = unittest.mock.Mock(ok=True)
        response.json.return_value = {'private': False}
        http.request.return_value = response
        store = GitHubStore('test/private', 'fictitious-token', session=http)
        with self.assertRaises(StateError):
            store.read()
        self.assertEqual(http.request.call_count, 1)
        response.ok = False
        response.status_code = 409
        with self.assertRaises(StateError):
            store.write(fixture(), 'obsolete-sha')
        self.assertEqual(http.request.call_args.kwargs['json']['sha'], 'obsolete-sha')

    def test_existing_trello_card_without_marker_is_not_duplicated(self):
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'agent_lapinous'))
        import agent
        import suivi_trello
        locked = LockedState(Store(fixture()), 'one')
        locked.data['new_tasks'] = [{'key': 'saves', 'name': 'Sauvegardes', 'list': 'Priorité 1',
            'automatique': True, 'chemins': ['shared.js'], 'preuves': [{'chemin': 'shared.js', 'motifs': ['saveGame']}]}]
        changes = {'shared.js': {'lignes': ['saveGame = 2'], 'existe': True}}
        with patch.object(suivi_trello, 'collect', return_value=(changes, {}, [])), \
             patch.object(agent, 'get_lists', return_value={'priorité 1': {'id': 'priority'}}), \
             patch.object(agent, 'api', return_value=[{'id': 'existing', 'name': 'SAUVEGARDES', 'desc': ''}]) as api:
            result = remote.create_explicit_tasks(locked)
        self.assertEqual(result[0]['status'], 'existing')
        self.assertTrue(all(call.args[0] == 'GET' for call in api.call_args_list))

    def test_ambiguous_trello_creation_is_not_retried(self):
        import agent
        import suivi_trello
        locked = LockedState(Store(fixture()), 'one')
        locked.data['new_tasks'] = [{'key': 'saves', 'name': 'Sauvegardes', 'list': 'Priorité 1',
            'automatique': True, 'chemins': ['shared.js'], 'preuves': [{'chemin': 'shared.js', 'motifs': ['saveGame']}]}]
        changes = {'shared.js': {'lignes': ['saveGame = 2'], 'existe': True}}
        with patch.object(suivi_trello, 'collect', return_value=(changes, {}, [])), \
             patch.object(agent, 'get_lists', return_value={'priorité 1': {'id': 'priority'}}), \
             patch.object(agent, 'api', return_value=[]), \
             patch.dict('os.environ', {'TRELLO_API_KEY': 'fake', 'TRELLO_TOKEN': 'fake'}), \
             patch('remote.request', side_effect=RuntimeError('Réponse perdue')) as transport:
            with self.assertRaises(RuntimeError):
                remote.create_explicit_tasks(locked)
            self.assertEqual(locked.data['creations']['saves']['status'], 'intent')
            result = remote.create_explicit_tasks(locked)
            self.assertEqual(result[0]['status'], 'blocked')
            self.assertEqual(transport.call_count, 1)

    def test_local_unpublished_reference_prevents_deletion(self):
        state = fixture()
        state['manifest']['assets'][ITEM['path']] = {**ITEM, 'status': 'verified'}
        state['inventory']['selected'].append({'path': ITEM['path'], 'hash': ITEM['hash']})
        locked, cloud = LockedState(Store(state), 'one'), Cloud()
        with patch('remote.trello', return_value=(0, 'OK')):
            text, errors = remote.execute(locked, KEY, cloud, NOW, '')
        self.assertEqual(cloud.calls, 0)
        self.assertNotIn(ITEM['public_id'], locked.data['quarantine']['items'])

    def test_dates_and_no_state_mutation_in_simulation(self):
        state = fixture()
        before = copy.deepcopy(state)
        p = plan(state, '', KEY, NOW)
        self.assertEqual(len(p['delete']), 1)
        self.assertEqual(p['delete'][0]['since'], '2026-10-13T15:17:00+02:00')
        self.assertEqual(state, before)
        state['quarantine']['items'][ITEM['public_id']]['since'] = '2026-10-19T15:17:00+02:00'
        self.assertEqual(len(plan(state, '', KEY, NOW)['pending']), 1)

    def test_unconfirmed_and_tampered_backup_stay_blocked(self):
        for key in ('', 'wrong-key' * 8):
            self.assertEqual(len(plan(fixture(), '', key, NOW)['blocked']), 1)
        state = fixture()
        state['attestations'][ITEM['public_id']]['payload']['hash'] = '0' * 64
        self.assertEqual(len(plan(state, '', KEY, NOW)['blocked']), 1)
        self.assertFalse(confirmed(ITEM, None, KEY))

    def test_restored_and_unknown_queue(self):
        state = fixture()
        self.assertEqual(len(plan(state, ITEM['url'], KEY, NOW)['restored']), 1)
        state['quarantine']['items']['unknown'] = {}
        self.assertEqual(len(plan(state, '', KEY, NOW)['blocked']), 1)

    def test_success_and_state_survives_new_process(self):
        store = Store(fixture())
        locked, cloud = LockedState(store, 'test'), Cloud()
        deleted, errors = apply_trash(locked, plan(locked.data, '', KEY, NOW), cloud)
        self.assertEqual(len(deleted), 1)
        self.assertEqual(errors, [])
        locked.close()
        second = LockedState(store, 'second')
        self.assertEqual(plan(second.data, '', KEY, NOW)['delete'], [])
        self.assertEqual(cloud.calls, 1)
        second.close()

    def test_crash_after_delete_is_not_deleted_twice(self):
        store, cloud = Store(fixture()), Cloud()
        locked = LockedState(store, 'test')
        cloud.crash = True
        with self.assertRaises(KeyboardInterrupt):
            apply_trash(locked, plan(locked.data, '', KEY, NOW), cloud)
        self.assertEqual(next(iter(store.data['operations'].values()))['status'], 'intent')
        with self.assertRaises(StateError):
            LockedState(store, 'automatic-steal-forbidden')
        # Seul le contrôle humain du processus mort autorise cette récupération.
        store.data['lock'] = None
        recovered = LockedState(store, 'recovered-after-confirmation')
        deleted, errors = apply_trash(recovered, plan(recovered.data, '', KEY, NOW), cloud)
        self.assertEqual(len(deleted), 1)
        self.assertEqual(cloud.calls, 1)
        self.assertEqual(errors, [])

    def test_parallel_writers_and_persistence_failure(self):
        store = Store(fixture())
        before, rev = store.read()
        locked = LockedState(store, 'one')
        with self.assertRaises(StateError):
            store.write(before, rev)
        with self.assertRaises(StateError):
            LockedState(store, 'two')
        cloud = Cloud()
        with patch.object(store, 'write', side_effect=StateError('disque indisponible')):
            with self.assertRaises(StateError):
                apply_trash(locked, plan(locked.data, '', KEY, NOW), cloud)
        self.assertEqual(cloud.calls, 0)

    def test_exact_content_mismatch_blocks_delete(self):
        locked, cloud = LockedState(Store(fixture()), 'one'), Cloud()
        with patch.object(cloud, 'digest', return_value='0' * 64):
            deleted, errors = apply_trash(locked, plan(locked.data, '', KEY, NOW), cloud)
        self.assertEqual(deleted, [])
        self.assertEqual(len(errors), 1)
        self.assertEqual(cloud.calls, 0)

    def test_ssl_and_network_errors_are_sanitized(self):
        for exc in (requests.exceptions.SSLError('https://secret.invalid/token'), requests.ConnectionError('token')):
            with patch('transports.requests.request', side_effect=exc), patch('transports.time.sleep'):
                with self.assertRaises(RuntimeError) as caught:
                    request('GET', 'https://example.invalid')
            self.assertNotIn('secret.invalid', str(caught.exception))
            self.assertNotIn('token', str(caught.exception))

    def test_discord_failure_and_confirmed_delivery_are_not_duplicated(self):
        locked = LockedState(Store(fixture()), 'one')
        with patch('transports.request', side_effect=RuntimeError('Coupure')) as transport:
            self.assertEqual(send_discord(locked, 'day', 'rapport', 'fake'), 'uncertain')
            self.assertEqual(send_discord(locked, 'day', 'rapport', 'fake'), 'uncertain')
            self.assertEqual(transport.call_count, 1)
        response = unittest.mock.Mock(ok=True)
        response.json.return_value = {'id': '123'}
        with patch('transports.request', return_value=response) as transport:
            self.assertEqual(send_discord(locked, 'other-day', 'rapport', 'fake'), 'sent')
            self.assertEqual(send_discord(locked, 'other-day', 'rapport', 'fake'), 'sent')
            self.assertEqual(transport.call_count, 1)

    def test_partial_cloud_failure_still_attempts_trello_and_produces_report(self):
        locked, cloud = LockedState(Store(fixture()), 'one'), Cloud()
        with patch.object(cloud, 'get', side_effect=RuntimeError('SSL')), \
             patch('remote.trello', return_value=(0, 'Cartes ignorées : aucune preuve')) as trello:
            text, errors = remote.execute(locked, KEY, cloud, NOW, '')
        self.assertTrue(errors)
        self.assertIn('Cartes ignorées', text)
        trello.assert_called_once()

    def test_summer_winter_and_transition_at_20_paris(self):
        from zoneinfo import ZoneInfo
        paris = ZoneInfo('Europe/Paris')
        for month, day, hour in [(3, 28, 19), (3, 29, 18), (10, 24, 18), (10, 25, 19)]:
            local = dt.datetime(2026, month, day, 20, tzinfo=paris)
            self.assertEqual(local.astimezone(dt.timezone.utc).hour, hour)
            self.assertEqual(paris_day(local), local.date().isoformat())

    def test_export_preserves_dates_and_never_contains_original_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder) / 'project'
            backup = Path(folder) / 'private'
            state_dir = root / '.cloudinary-local'
            state_dir.mkdir(parents=True)
            (root / 'tools').mkdir()
            (root / 'tools/cloudinary-deletion-policy.json').write_text('{"suspended": false}')
            file = backup / ITEM['path']
            file.parent.mkdir(parents=True)
            file.write_bytes(b'original')
            state = fixture()
            for filename, data in [('versions-connues.json', state['ledger']), ('quarantaine.json', state['quarantine']), ('manifest.json', state['manifest']), ('inventory.json', state['inventory'])]:
                (state_dir / filename).write_text(json.dumps(data), encoding='utf-8')
            with patch('local_bridge.subprocess.check_output', return_value='abc\n'):
                package = export(root, backup, KEY)
            self.assertEqual(package['quarantine'], state['quarantine'])
            self.assertTrue(confirmed(ITEM, package['attestations'][ITEM['public_id']], KEY))
            self.assertNotIn(str(backup), json.dumps(package))
            self.assertEqual(file.read_bytes(), b'original')


if __name__ == '__main__':
    unittest.main()
