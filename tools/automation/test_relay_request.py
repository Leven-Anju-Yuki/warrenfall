import base64
import copy
import datetime as dt
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
from relay_request import request_report, publish_and_request
from report_cycle import cycle_id, confirm, completed, resume_reports, acknowledge_existing
from schedule_gate import allowed
from test_hybrid import NOW, fixture
import remote


class RelayRequestTests(unittest.TestCase):
    def test_publish_unlock_then_signal_even_after_failed_sync(self):
        for sync_status in ('success', 'failed'):
            calls = []
            locked = Mock(data={'local_sync': {'syncStatus': sync_status}, 'source_commit': 'abc'})
            locked.save.side_effect = lambda: calls.append('save')
            locked.close.side_effect = lambda: calls.append('unlock')
            with tempfile.TemporaryDirectory() as folder, patch('relay_request.request_report',
                    side_effect=lambda *a: calls.append('signal') or 'requested') as signal:
                self.assertEqual(publish_and_request(locked, Mock(), Path(folder) / 'result.json'), 'requested')
                self.assertEqual(signal.call_args.args[1]['syncStatus'], sync_status)
            self.assertEqual(calls, ['save', 'unlock', 'signal'])

    def test_no_signal_if_publish_or_unlock_fails(self):
        for method in ('save', 'close'):
            locked = Mock(data={})
            getattr(locked, method).side_effect = RuntimeError('fictitious storage failure')
            with tempfile.TemporaryDirectory() as folder, patch('relay_request.request_report') as signal:
                with self.assertRaises(RuntimeError):
                    publish_and_request(locked, Mock(), Path(folder) / 'result.json')
                signal.assert_not_called()

    def test_signal_failure_keeps_saved_state_and_no_blind_retry(self):
        locked = Mock(data={})
        with tempfile.TemporaryDirectory() as folder, patch('relay_request.request_report', side_effect=RuntimeError()) as signal:
            self.assertEqual(publish_and_request(locked, Mock(), Path(folder) / 'result.json'), 'request-failed')
            signal.assert_called_once()
            locked.save.assert_called_once()
            locked.close.assert_called_once()

    def test_marker_has_no_state_secrets_and_same_request_does_not_push_twice(self):
        store = Mock(branch='main')
        store.request.side_effect = [{'tree': []}, {}]
        sync = {'finishedAt': '2026-10-24T20:35:18.683Z', 'syncStatus': 'success'}
        self.assertEqual(request_report(store, sync, 'abc'), 'requested')
        payload = store.request.call_args.kwargs['json']
        marker = json.loads(base64.b64decode(payload['content']))
        self.assertEqual(set(marker), {'schema', 'id', 'requested_at', 'sync_finished_at', 'source_commit'})
        store.request.reset_mock()
        store.request.side_effect = [{'tree': [{'path': 'report-request.json', 'sha': 'old'}]},
                                    {'content': payload['content']}]
        self.assertEqual(request_report(store, sync, 'abc'), 'already-requested')
        self.assertEqual([c.args[0] for c in store.request.call_args_list], ['GET', 'GET'])

    def test_marker_replacement_uses_compare_and_swap(self):
        store = Mock(branch='main')
        store.request.side_effect = [{'tree': [{'path': 'report-request.json', 'sha': 'old'}]},
            {'content': base64.b64encode(b'{"id":"older"}').decode()}, {}]
        request_report(store, {}, 'abc')
        self.assertEqual(store.request.call_args.kwargs['json']['sha'], 'old')

    def test_only_private_relay_push_is_allowed(self):
        self.assertTrue(allowed('push', relay=True, repository='owner/state', state_repository='owner/state'))
        self.assertFalse(allowed('push', relay=True, repository='owner/game', state_repository='owner/state'))
        self.assertFalse(allowed('push', relay=False, repository='owner/state', state_repository='owner/state'))
        self.assertFalse(allowed('push', relay=True))

    def test_automatic_relay_and_schedule_share_cycle_manual_remains_separate(self):
        state = fixture()
        with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'push'}):
            relay = remote.delivery_id(NOW, state)
        with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'schedule'}):
            self.assertEqual(relay, remote.delivery_id(NOW, state))
        with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'workflow_dispatch', 'GITHUB_RUN_ID': '123'}):
            self.assertNotEqual(relay, remote.delivery_id(NOW, state))
        changed = copy.deepcopy(state)
        changed['local_sync']['finishedAt'] = '2026-10-21T18:03:00Z'
        self.assertNotEqual(relay, cycle_id(changed, NOW))
        self.assertNotEqual(relay, cycle_id(state, NOW + dt.timedelta(days=1)))

    def test_errors_do_not_prevent_confirmation_but_missing_report_does(self):
        locked = Mock(data={})
        outcomes = dict.fromkeys(('bilan', 'images', 'trello'), 'sent')
        confirm(locked, 'cycle', {**outcomes, 'images': 'uncertain'}, 'now', ['Cloudinary error'])
        self.assertFalse(completed(locked.data, 'cycle'))
        confirm(locked, 'cycle', outcomes, 'now', ['Cloudinary error'])
        self.assertTrue(completed(locked.data, 'cycle'))
        self.assertEqual(locked.data['completed_report_cycles']['cycle']['errors'], 1)

    def test_resume_uses_reports_of_same_cycle_only(self):
        state = {'prepared_report_cycle': {'id': 'a'},
                 'last_reports': dict.fromkeys(('bilan', 'images', 'trello'), 'complete report')}
        self.assertEqual(resume_reports(state, 'a'), state['last_reports'])
        self.assertIsNone(resume_reports(state, 'b'))
        state['last_reports'].pop('images')
        self.assertIsNone(resume_reports(state, 'a'))

    def test_duplicate_writes_local_receipt_to_prevent_fallback(self):
        with tempfile.TemporaryDirectory() as folder:
            acknowledge_existing(folder)
            self.assertEqual(json.loads((Path(folder) / 'delivery.json').read_text()),
                             dict.fromkeys(('bilan', 'images', 'trello'), 'sent'))

    def test_completed_cycle_skips_cloud_trello_and_discord_in_main(self):
        state = fixture()
        with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'schedule'}):
            stamp = cycle_id(state, dt.datetime.now(dt.timezone.utc))
            state['completed_report_cycles'] = {stamp: {'at': 'earlier'}}
            locked = Mock(data=state)
            with tempfile.TemporaryDirectory() as folder, patch('sys.argv', ['remote.py', '--apply', '--output', str(Path(folder) / 'report.md')]), \
                 patch('remote.GitHubStore'), patch('remote.wait_for_state', return_value=locked), \
                 patch('remote.Cloudinary') as cloud, patch('remote.execute') as execute, patch('remote.deliver') as send:
                self.assertEqual(remote.main(), 0)
                cloud.assert_not_called()
                execute.assert_not_called()
                send.assert_not_called()
                locked.close.assert_called_once()

    def test_partial_delivery_resumes_without_replaying_business_operations(self):
        state = fixture()
        with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'schedule'}):
            stamp = cycle_id(state, dt.datetime.now(dt.timezone.utc))
            state['prepared_report_cycle'] = {'id': stamp, 'errors': ['Cloudinary error']}
            state['last_reports'] = dict.fromkeys(('bilan', 'images', 'trello'), 'original report')
            locked = Mock(data=state)
            outcomes = dict.fromkeys(('bilan', 'images', 'trello'), 'sent')
            with tempfile.TemporaryDirectory() as folder, patch('sys.argv', ['remote.py', '--apply', '--output', str(Path(folder) / 'report.md')]), \
                 patch('remote.GitHubStore'), patch('remote.wait_for_state', return_value=locked), \
                 patch('remote.Cloudinary') as cloud, patch('remote.execute') as execute, \
                 patch('remote.deliver', return_value=outcomes) as send:
                self.assertEqual(remote.main(), 1)  # L'erreur réelle n'est pas effacée.
                cloud.assert_not_called()
                execute.assert_not_called()
                self.assertEqual(send.call_args.args[1], state['last_reports'])
                self.assertTrue(completed(state, stamp))
                self.assertEqual(state['last_delivery'], outcomes)

    def test_fallback_also_skips_cycle_already_delivered_by_other_runner(self):
        import report_fallback
        state = fixture()
        state['completed_report_cycles'] = {cycle_id(state, dt.datetime.now(dt.timezone.utc)): {}}
        with tempfile.TemporaryDirectory() as folder, patch('os.getcwd', return_value=folder), \
             patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'schedule', 'WARRENFALL_STATE_TOKEN': 'fictitious',
                                    'WARRENFALL_STATE_REPO': 'owner/state'}), \
             patch('state_store.GitHubStore') as store, patch('report_fallback.deliver') as send, \
             patch('report_fallback.Path', side_effect=lambda p: Path(folder) / p):
            store.return_value.read.return_value = (state, 'revision')
            self.assertEqual(report_fallback.main(), 0)
            send.assert_not_called()

    def test_private_workflow_only_watches_request_and_checks_out_game_repository(self):
        root = Path(__file__).resolve().parents[2]
        template = (root / 'tools/automation/templates/state-relay.yml').read_text(encoding='utf-8')
        public = (root / '.github/workflows/warrenfall-daily.yml').read_text(encoding='utf-8')
        self.assertIn('paths: [report-request.json]', template)
        self.assertIn('branches: [main]', template)
        self.assertNotIn('\n  schedule:', template)
        self.assertIn("github.event_name == 'push' && 'appliquer' || 'simulation'", template)
        self.assertEqual(public.count('uses: actions/checkout@v4'),
                         public.count('repository: Leven-Anju-Yuki/warrenfall'))


if __name__ == '__main__':
    unittest.main()
