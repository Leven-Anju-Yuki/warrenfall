import datetime as dt
import unittest
from schedule_gate import allowed


class ScheduleTests(unittest.TestCase):
    def test_one_slot_per_day_including_clock_changes(self):
        for month, day, hour in [(1, 15, 19), (7, 15, 18), (10, 24, 18), (10, 25, 19), (3, 28, 19), (3, 29, 18)]:
            now = dt.datetime(2026, month, day, 21, tzinfo=dt.timezone.utc)
            results = [allowed('schedule', f'7 {h} * * *', now) for h in (18, 19)]
            self.assertEqual(sum(results), 1)
            self.assertTrue(allowed('schedule', f'7 {hour} * * *', now))

    def test_dispatch_and_unknown_events(self):
        self.assertTrue(allowed('workflow_dispatch'))
        self.assertFalse(allowed('push'))
        self.assertFalse(allowed('schedule', '0 20 * * *'))
