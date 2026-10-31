import copy
import datetime as dt
import unittest
from core import attest
from discord_image_selection import inspect, confirm, authorized, SelectionError
from state_store import StateTransient
from test_hybrid import fixture, ITEM, KEY, NOW, Store, LockedState, Cloud


class ImageSelection(unittest.TestCase):
    def setUp(self):
        self.state=fixture()
        self.pid=ITEM['public_id']

    def selection(self, state=None, references=''):
        return inspect(state or self.state,self.pid,references,KEY,NOW)

    def test_owner_only_and_missing_configuration_denied(self):
        self.assertFalse(authorized(123,''))
        self.assertFalse(authorized(123,'456'))
        self.assertTrue(authorized(123,'123'))
        locked=LockedState(Store(self.state),'test')
        with self.assertRaises(SelectionError):confirm(locked,self.selection(),'',KEY,Cloud(),'req',123,'456',NOW)
        self.assertNotIn('discord_image_requests',locked.data)

    def test_referenced_image_is_never_selectable(self):
        with self.assertRaisesRegex(SelectionError,'utilisée'):self.selection(references=ITEM['url'])
        self.state['manifest']['assets']['current']=copy.deepcopy(ITEM)
        with self.assertRaisesRegex(SelectionError,'utilisée'):self.selection()

    def test_same_filename_requires_exact_id(self):
        second={**ITEM,'public_id':'lapinous/other','path':'assets/img/other/lapin.png'}
        self.state['ledger']['assets']['lapinous/other']=second
        with self.assertRaisesRegex(SelectionError,'ambigu'):inspect(self.state,'lapin.png','',KEY,NOW)
        self.assertEqual(self.selection()['id'],self.pid)

    def test_missing_backup_remains_blocked(self):
        self.state['attestations']={}
        with self.assertRaisesRegex(SelectionError,'attestée'):self.selection()

    def test_pending_quarantine_keeps_original_deadline(self):
        self.state['quarantine']['items'][self.pid]['since']=(NOW-dt.timedelta(days=2)).isoformat()
        selection=self.selection()
        before=copy.deepcopy(self.state['quarantine'])
        locked=LockedState(Store(self.state),'test')
        cloud=Cloud()
        result=confirm(locked,selection,'',KEY,cloud,'req',123,'123',NOW)
        self.assertEqual(result['status'],'quarantine')
        self.assertEqual(locked.data['quarantine'],before)
        self.assertEqual(cloud.calls,0)

    def test_new_quarantine_uses_seven_days(self):
        self.state['quarantine']['items']={}
        selection=self.selection()
        locked=LockedState(Store(self.state),'test')
        result=confirm(locked,selection,'',KEY,Cloud(),'req',123,'123',NOW)
        self.assertEqual(result['status'],'quarantine')
        self.assertEqual(locked.data['quarantine']['items'][self.pid]['since'],NOW.isoformat())
        self.assertEqual(dt.datetime.fromisoformat(result['due']),NOW+dt.timedelta(days=7))

    def test_only_selected_image_deleted_and_retry_deduplicated(self):
        other={**ITEM,'public_id':'lapinous/another','path':'assets/img/another.png'}
        self.state['ledger']['assets'][other['public_id']]=other
        self.state['attestations'][other['public_id']]=attest(other,KEY,NOW.isoformat())
        self.state['quarantine']['items'][other['public_id']]={**other,'since':'2026-10-13T15:17:00+02:00','type':'logical'}
        selection=self.selection()
        locked=LockedState(Store(self.state),'test')
        cloud=Cloud()
        result=confirm(locked,selection,'',KEY,cloud,'req',123,'123',NOW)
        self.assertEqual(result['status'],'deleted')
        calls=cloud.calls
        self.assertEqual(confirm(locked,selection,'',KEY,cloud,'req',123,'123',NOW),result)
        self.assertEqual(cloud.calls,calls)
        self.assertNotIn(self.pid,locked.data['ledger']['assets'])
        self.assertIn(other['public_id'],locked.data['ledger']['assets'])

    def test_changed_version_cannot_use_old_confirmation(self):
        selection=self.selection()
        self.state['ledger']['assets'][self.pid]['hash']='a'*64
        self.state['quarantine']['items'][self.pid]['hash']='a'*64
        self.state['attestations'][self.pid]=attest(self.state['ledger']['assets'][self.pid],KEY,NOW.isoformat())
        locked=LockedState(Store(self.state),'test')
        with self.assertRaisesRegex(SelectionError,'changé'):confirm(locked,selection,'',KEY,Cloud(),'req',123,'123',NOW)

    def test_storage_failure_prevents_cloud_call(self):
        selection=self.selection()
        locked=LockedState(Store(self.state),'test')
        def fail():raise StateTransient('state unavailable')
        locked.save=fail
        cloud=Cloud()
        with self.assertRaises(StateTransient):confirm(locked,selection,'',KEY,cloud,'req',123,'123',NOW)
        self.assertEqual(cloud.calls,0)

    def test_transient_failure_recording_delete_intent_stops_processing(self):
        selection=self.selection()
        locked=LockedState(Store(self.state),'test')
        original=locked.save
        count=0
        def fail_intent():
            nonlocal count
            count+=1
            if count==3:raise StateTransient('intent not confirmed')
            original()
        locked.save=fail_intent
        cloud=Cloud()
        with self.assertRaises(StateTransient):confirm(locked,selection,'',KEY,cloud,'req',123,'123',NOW)
        self.assertEqual(cloud.calls,0)
