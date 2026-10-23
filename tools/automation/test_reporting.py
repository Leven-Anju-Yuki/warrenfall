import copy
import datetime as dt
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import reporting
import remote
from test_hybrid import fixture, LockedState, Store, KEY, NOW, Cloud
from transports import send_discord


class DetailedReports(unittest.TestCase):
    def test_three_channels_attempted_even_if_first_fails(self):
        locked = Mock(data={})
        reports = {key: 'Détail complet ' * 1000 for key in reporting.CHANNELS}
        env = {name: 'test-' + key for key, name in reporting.CHANNELS.items()}
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, env), \
             patch('reporting.send_discord', side_effect=[RuntimeError(), 'sent', 'sent']) as send:
            outcomes = reporting.deliver(locked, reports, 'daily:date', folder)
            self.assertEqual(send.call_count, 3)
            self.assertEqual(outcomes, {'bilan': 'failed', 'images': 'sent', 'trello': 'sent'})
            for key in reports:
                self.assertEqual((Path(folder) / (key + '.md')).read_text(encoding='utf-8'), reports[key])
            self.assertEqual(len({c.args[1] for c in send.call_args_list}), 3)

    def test_missing_channel_does_not_skip_the_others(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {}, clear=True), \
             patch.dict(os.environ, {'DISCORD_WEBHOOK_TRELLO': 'test'}), \
             patch('reporting.send_discord', return_value='sent'):
            result = reporting.deliver(Mock(), {k: k for k in reporting.CHANNELS}, 'x', folder)
            self.assertEqual(result['bilan'], 'missing-webhook')
            self.assertEqual(result['trello'], 'sent')

    def test_quarantine_countdown_and_dates_are_read_only(self):
        state = fixture()
        before = copy.deepcopy(state)
        proposed = {'pending': [{'id': 'lapinous/x', 'path': 'x.png',
                                'since': '2026-10-20T15:17:00+02:00',
                                'due': '2026-10-27T15:17:00+02:00'}]}
        text = reporting.cloudinary_details(state, proposed, NOW)
        self.assertIn('J-7', text)
        self.assertIn('2026-10-20T15:17:00+02:00', text)
        self.assertIn('historique', text)
        self.assertEqual(state, before)

    def test_attachment_must_be_confirmed_and_long_text_is_not_truncated(self):
        locked = LockedState(Store(fixture()), 'test')
        response = Mock(ok=True)
        response.json.return_value = {'id': '1', 'channel_id': '2',
                                      'attachments': [{'filename': 'images.md'}]}
        text = 'é' * 5000
        with patch('transports.request', return_value=response) as post:
            self.assertEqual(send_discord(locked, 'images', text, 'test', filename='images.md'), 'sent')
            self.assertEqual(post.call_args.kwargs['files']['files[0]'][1], text.encode('utf-8'))
            self.assertEqual(send_discord(locked, 'images', text, 'test'), 'sent')
            self.assertEqual(post.call_count, 1)
        response.json.return_value = {'id': '3', 'attachments': []}
        with patch('transports.request', return_value=response):
            self.assertEqual(send_discord(locked, 'missing-file', text, 'test'), 'uncertain')

    def test_creation_error_does_not_prevent_trello_report(self):
        state = fixture()
        state['new_tasks'] = [{'key': 'test'}]
        locked = LockedState(Store(state), 'test')
        with patch('remote.deletion_allowed', return_value=False), \
             patch('remote.create_explicit_tasks', side_effect=ValueError()), \
             patch('remote.trello', return_value=(0, 'Toutes les cartes analysées')) as trello:
            report, errors = remote.execute(locked, KEY, Cloud(), NOW, '')
        trello.assert_called_once()
        self.assertIn('Toutes les cartes analysées', report)
        self.assertIn('images', locked.data['report_sections'])
        self.assertTrue(any('créations' in error for error in errors))

    def test_trello_exception_keeps_detailed_cloudinary_report(self):
        locked = LockedState(Store(fixture()), 'test')
        with patch('remote.deletion_allowed', return_value=False), patch('remote.trello', side_effect=ValueError()):
            report, errors = remote.execute(locked, KEY, Cloud(), NOW, '')
        result = reporting.bundle(locked.data, report, locked.data['report_sections']['images'])
        self.assertIn('Corbeille', result['images'])
        self.assertIn('ValueError', result['trello'])

    def test_fallback_skips_previous_attempt_and_sends_other_channels(self):
        import report_fallback
        with tempfile.TemporaryDirectory() as folder:
            previous = os.getcwd()
            try:
                os.chdir(folder)
                target = Path('.cloudinary-local/reports')
                target.mkdir(parents=True)
                (target / 'delivery.json').write_text(json.dumps({'bilan': 'uncertain'}))
                with patch('report_fallback.deliver', return_value={'images': 'sent', 'trello': 'sent'}) as send:
                    self.assertEqual(report_fallback.main(), 0)
                    self.assertEqual(set(send.call_args.args[1]), {'images', 'trello'})
            finally:
                os.chdir(previous)

    def test_schedule_and_manual_test_do_not_require_business_mutations(self):
        workflow = (Path(__file__).resolve().parents[2] / '.github/workflows/warrenfall-daily.yml').read_text(encoding='utf-8')
        self.assertIn("cron: '0 20 * * *'", workflow)
        self.assertIn('timezone: Europe/Paris', workflow)
        self.assertIn('test-discord', workflow)
        self.assertIn('report_probe.py --source actions --send', workflow)
        self.assertIn('report_fallback.py', workflow)
        self.assertIn('DISCORD_WEBHOOK_CLOUDINARY:', workflow)
        self.assertIn('DISCORD_WEBHOOK_TRELLO:', workflow)

    def test_validation_runs_persist_without_advancing_business_checkpoints(self):
        import report_probe
        store = Store(fixture())
        before = report_probe.business_fingerprint(store.data)
        with tempfile.TemporaryDirectory() as folder, \
             patch('state_store.GitHubStore', return_value=store), \
             patch('report_probe.collect_reports', return_value={'bilan': 'b', 'images': 'i', 'trello': 't'}), \
             patch('report_probe.deliver', return_value={k: 'sent' for k in reporting.CHANNELS}) as send:
            for run_id in ('first-run', 'second-run'):
                with patch.dict(os.environ, {'GITHUB_RUN_ID': run_id}), \
                     patch('sys.argv', ['probe', '--source', 'actions', '--send', '--output', folder]):
                    self.assertEqual(report_probe.main(), 0)
            self.assertEqual(send.call_count, 2)
            self.assertEqual(store.data['validation_runs'][-1]['previous_run'], 'first-run')
            self.assertTrue(store.data['validation_runs'][-1]['same_as_previous'])
            self.assertEqual(before, report_probe.business_fingerprint(store.data))
            self.assertIsNone(store.data['lock'])
            with patch.dict(os.environ, {'GITHUB_RUN_ID': 'second-run'}), \
                 patch('sys.argv', ['probe', '--source', 'actions', '--send', '--output', folder]):
                self.assertEqual(report_probe.main(), 0)
            self.assertEqual(send.call_count, 2)

    def test_validation_fingerprint_includes_unknown_business_fields(self):
        from report_probe import business_fingerprint
        state = fixture()
        before = business_fingerprint(state)
        state['future_checkpoint'] = {'keep': 'exact'}
        self.assertNotEqual(before, business_fingerprint(state))


if __name__ == '__main__':
    unittest.main()
