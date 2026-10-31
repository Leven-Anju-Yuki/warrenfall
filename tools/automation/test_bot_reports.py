import copy
import unittest
from bot_reports import attachment_parts, stored_report


class BotReportsTest(unittest.TestCase):
    def test_all_reports_keep_provenance_and_state(self):
        state = {'last_reports': {key: 'Exécution du 2026-10-27\n' + key for key in ('bilan', 'images', 'trello')}, 'lock': {'owner': 'daily'}}
        before = copy.deepcopy(state)
        for channel in state['last_reports']:
            self.assertEqual(stored_report(state, channel, 123, '123'), state['last_reports'][channel])
        self.assertEqual(state, before)

    def test_owner_required(self):
        for owner in ('', 'abc', '456'):
            with self.assertRaises(PermissionError):
                stored_report({}, 'images', 123, owner)

    def test_no_local_or_old_fallback(self):
        with self.assertRaises(LookupError):
            stored_report({'last_report': 'old'}, 'bilan', 123, '123')

    def test_utf8_parts_are_lossless(self):
        text = '🐰 日本語 é\n' * 100
        chunks = attachment_parts(text, 31)
        self.assertTrue(all(len(chunk) <= 31 for chunk in chunks))
        self.assertEqual(''.join(chunk.decode('utf-8') for chunk in chunks), text)


if __name__ == '__main__':
    unittest.main()
