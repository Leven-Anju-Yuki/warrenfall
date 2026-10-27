import datetime as dt
import os
import unittest
from unittest.mock import Mock, patch
from state_store import GitHubStore, StateError, StateTransient
from remote import delivery_id
from report_cycle import cycle_id


class Recovery(unittest.TestCase):
    def store(self):
        return GitHubStore('owner/private', 'fake', session=Mock())

    def test_ambiguous_write_already_saved_is_not_repeated(self):
        store=self.store()
        store.request=Mock(side_effect=StateTransient('500'))
        state={'schema':1,'lock':{'owner':'run'}}
        store.read=Mock(return_value=(state,'new-sha'))
        self.assertEqual(store.write(state,'old-sha'),'new-sha')
        self.assertEqual(store.request.call_count,1)

    @patch('state_store.time.sleep')
    def test_unchanged_sha_can_retry_same_payload(self, sleep):
        store=self.store()
        store.request=Mock(side_effect=[StateTransient('500'),{'content':{'sha':'saved'}}])
        store.read=Mock(return_value=({'schema':1},'old'))
        self.assertEqual(store.write({'schema':1,'value':2},'old'),'saved')
        self.assertEqual(store.request.call_args_list[0],store.request.call_args_list[1])

    def test_concurrent_write_is_never_overwritten(self):
        store=self.store()
        store.request=Mock(side_effect=StateTransient('500'))
        store.read=Mock(return_value=({'schema':1,'other':1},'different'))
        with self.assertRaises(StateError):store.write({'schema':1},'old')
        self.assertEqual(store.request.call_count,1)

    @patch('state_store.time.sleep')
    def test_read_retries_transient_failure(self, sleep):
        store=self.store()
        bad=Mock(ok=False,status_code=500)
        good=Mock(ok=True)
        good.json.return_value={'private':True}
        store.http.request.side_effect=[bad,good]
        self.assertEqual(store.request('GET',''),{'private':True})

    def test_delayed_schedule_uses_previous_evening_cycle(self):
        now=dt.datetime(2026,10,26,23,5,tzinfo=dt.timezone.utc)
        state={'local_sync':{'finishedAt':'2026-10-26T19:00:00Z'}}
        with patch.dict(os.environ,{'GITHUB_EVENT_NAME':'schedule'}):
            self.assertEqual(delivery_id(now,state),cycle_id(state,now-dt.timedelta(days=1)))
        with patch.dict(os.environ,{'GITHUB_EVENT_NAME':'push'}):
            self.assertEqual(delivery_id(now,state),cycle_id(state,now))
