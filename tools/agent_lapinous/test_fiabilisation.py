import json
import ssl
import unittest
from unittest.mock import patch, Mock
import requests
import reseau
import surveillance_batterie as battery
from test_suivi_trello import scratch


class BatteryTests(unittest.TestCase):
    def setUp(self):
        folder = scratch()
        self.state = folder / 'battery.json'
        self.log = folder / 'battery.jsonl'
        self.patches = [patch.object(battery, 'STATE', self.state), patch.object(battery, 'LOG', self.log)]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)

    def run_at(self, percent, plugged=False, fail=False):
        with patch.object(battery, 'lire_batterie', return_value=(percent, plugged)), patch.object(battery, 'envoyer', return_value=204, side_effect=RuntimeError('network') if fail else None) as send:
            result = battery.main()
        return result, send.call_count

    def test_thresholds_once_and_recharge(self):
        for percent in (30, 25, 20, 15):
            self.assertEqual(self.run_at(percent), (0, 1))
            self.assertEqual(self.run_at(percent), (0, 0))
        self.assertEqual(self.run_at(20, True), (0, 0))
        self.assertEqual(len(json.loads(self.state.read_text())['sent']), 4)
        self.run_at(50, True)
        self.assertEqual(json.loads(self.state.read_text())['sent'], [])
        self.assertEqual(self.run_at(30), (0, 1))

    def test_failed_discord_retried_next_control_and_next_check_ignored(self):
        self.state.write_text(json.dumps({'sent': [], 'next_check': '2099-01-01'}))
        self.assertEqual(self.run_at(25, fail=True), (1, 1))
        self.assertEqual(json.loads(self.state.read_text())['sent'], [])
        self.assertEqual(self.run_at(25), (0, 1))
        events = [json.loads(line) for line in self.log.read_text().splitlines()]
        self.assertFalse(events[0]['discord_accepted'])
        self.assertTrue(events[1]['discord_accepted'])
        self.assertEqual(events[1]['thresholds_due'], [30, 25])

    def test_plugged_never_alerts_and_reads_each_time(self):
        self.assertEqual(self.run_at(15, True), (0, 0))
        self.assertEqual(self.run_at(30), (0, 1))
        self.assertEqual(len(self.log.read_text().splitlines()), 2)


class NetworkTests(unittest.TestCase):
    def test_network_recovery_bounded(self):
        response = Mock(status_code=200)
        with patch.object(reseau.requests, 'request', side_effect=[requests.ConnectionError('offline'), response]) as request, patch.object(reseau.time, 'sleep') as sleep:
            self.assertIs(reseau.read_request('GET', 'https://example.invalid'), response)
            self.assertEqual(request.call_count, 2)
            sleep.assert_called_once_with(1)
        with patch.object(reseau.requests, 'request', side_effect=requests.Timeout('offline')) as request, patch.object(reseau.time, 'sleep') as sleep:
            with self.assertRaises(requests.Timeout):
                reseau.read_request('GET', 'https://example.invalid')
            self.assertEqual(request.call_count, 3)
            self.assertEqual([call.args[0] for call in sleep.call_args_list], [1, 3])

    def test_ssl_not_disabled_and_secrets_redacted(self):
        error = requests.exceptions.SSLError('CERTIFICATE_VERIFY_FAILED https://secret.invalid/?token=private')
        with patch.object(reseau.requests, 'request', side_effect=error) as request, patch.object(reseau.time, 'sleep') as sleep:
            with self.assertRaises(requests.exceptions.SSLError):
                reseau.read_request('GET', 'https://example.invalid')
            self.assertNotIn('verify', request.call_args.kwargs)
            sleep.assert_not_called()
        text = reseau.diagnostic(error)
        self.assertIn('CERTIFICATE_VERIFY_FAILED', text)
        self.assertNotIn('private', text)

    def test_writes_not_replayed(self):
        with patch.object(reseau.requests, 'request', side_effect=requests.Timeout()) as request:
            with self.assertRaises(requests.Timeout):
                reseau.read_request('POST', 'https://example.invalid')
            self.assertEqual(request.call_count, 1)


if __name__ == '__main__':
    unittest.main()
