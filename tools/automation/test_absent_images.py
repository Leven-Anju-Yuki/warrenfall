import copy
import unittest
from unittest.mock import patch
from core import apply_trash, plan, reconcile_absences
from test_hybrid import fixture, Store, LockedState, Cloud, NOW, KEY, ITEM


class AbsentImagesTest(unittest.TestCase):
    def test_manual_absence_without_backup_and_reappearance(self):
        state = fixture(); state['attestations'] = {}
        locked = LockedState(Store(state), 'test')
        cloud = Cloud(); cloud.present = False
        before = copy.deepcopy(locked.data['ledger'])
        absent, errors = reconcile_absences(locked, '', KEY, cloud, NOW)
        self.assertEqual((len(absent), errors, cloud.calls), (1, [], 0))
        self.assertEqual(plan(locked.data, '', KEY, NOW)['blocked'], [])
        self.assertEqual(locked.data['ledger'], before)
        self.assertEqual(reconcile_absences(locked, '', KEY, cloud, NOW)[0], [])
        cloud.present = True
        reconcile_absences(locked, '', KEY, cloud, NOW)
        self.assertEqual(len(plan(locked.data, '', KEY, NOW)['blocked']), 1)
        self.assertEqual(cloud.calls, 0)

    def test_failed_existence_check_keeps_blocked_image(self):
        state = fixture(); state['attestations'] = {}
        locked = LockedState(Store(state), 'test')
        with patch.object(Cloud, 'get', side_effect=RuntimeError('HTTP 401')):
            absent, errors = reconcile_absences(locked, '', KEY, Cloud(), NOW)
        self.assertEqual(absent, [])
        self.assertEqual(len(errors), 1)
        self.assertEqual(len(plan(locked.data, '', KEY, NOW)['blocked']), 1)

    def test_absence_is_not_a_delete_and_does_not_erase_history(self):
        state = fixture()
        before = copy.deepcopy(state)
        locked = LockedState(Store(state), 'test')
        cloud = Cloud(); cloud.present = False
        proposed = plan(locked.data, '', KEY, NOW)
        deleted, errors = apply_trash(locked, proposed, cloud)
        self.assertEqual((deleted, errors, cloud.calls), ([], [], 0))
        self.assertEqual(len(proposed['already_absent']), 1)
        self.assertEqual(locked.data['ledger'], before['ledger'])
        self.assertEqual(locked.data['attestations'], before['attestations'])
        self.assertEqual(locked.data['operations'], {})
        self.assertEqual(locked.data['quarantine']['items'], {})
        self.assertEqual(plan(locked.data, '', KEY, NOW)['quarantine'], [])
        # A new version must never inherit a previous version's terminal state.
        locked.data['ledger']['assets'][ITEM['public_id']]['url'] += '?new-version'
        self.assertEqual(len(plan(locked.data, '', KEY, NOW)['blocked']), 1)

    def test_network_failure_does_not_close_quarantine(self):
        locked = LockedState(Store(fixture()), 'test')
        with patch.object(Cloud, 'get', side_effect=RuntimeError('HTTP 503')):
            deleted, errors = apply_trash(locked, plan(locked.data, '', KEY, NOW), Cloud())
        self.assertEqual(len(errors), 1)
        self.assertEqual(len(locked.data['quarantine']['items']), 1)
        self.assertNotIn('cloudinary_absences', locked.data)

    def test_missing_backup_is_still_blocked_before_remote_check(self):
        state = fixture(); state['attestations'] = {}
        proposed = plan(state, '', KEY, NOW)
        self.assertEqual(proposed['delete'], [])
        self.assertEqual(len(proposed['blocked']), 1)


if __name__ == '__main__':
    unittest.main()
