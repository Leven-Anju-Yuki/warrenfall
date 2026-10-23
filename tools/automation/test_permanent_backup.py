import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from test_hybrid import Store, fixture
from state_store import LockedState, StateBusy, wait_for_state
import local_bridge


class PermanentBackup(unittest.TestCase):
    def test_local_relay_passes_same_backup_path_to_node_and_attestation(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)/'project'
            backup=Path(temp)/'permanent'
            (root/'tools/automation').mkdir(parents=True)
            (root/'.cloudinary-local').mkdir()
            backup.mkdir()
            (root/'tools/automation/config.json').write_text('{"enabled":true,"state_branch":"main","state_file":"warrenfall-state.json"}')
            store=Store(fixture())
            package={**fixture(),'blocked':[],'attestations':{}}
            with patch.object(local_bridge,'ROOT',root),patch.object(local_bridge,'load_dotenv'), \
                 patch.object(local_bridge,'read',return_value={'enabled':True,'state_branch':'main','state_file':'warrenfall-state.json'}), \
                 patch.object(local_bridge,'GitHubStore',return_value=store), \
                 patch.object(local_bridge,'export',return_value=package) as export, \
                 patch.object(local_bridge.subprocess,'run') as run, \
                 patch('sys.argv',['bridge','run','--backup-dir',str(backup)]):
                run.return_value.returncode=0
                self.assertEqual(local_bridge.main(),0)
            self.assertEqual(run.call_args.args[0],['node','tools/update-images.mjs','--backup-local'])
            self.assertEqual(run.call_args.kwargs['env']['LAPINOUS_IMAGE_BACKUP_DIR'],str(backup.resolve()))
            self.assertEqual(export.call_args.args[1],backup.resolve())
            self.assertIsNone(store.data['lock'])

    def test_concurrent_relay_waits_without_stealing_lock(self):
        store=Store(fixture())
        first=LockedState(store,'windows')
        with patch('state_store.time.sleep',side_effect=lambda _:first.close()):
            second=wait_for_state(store,'actions',timeout=10,interval=1)
        self.assertEqual(second.data['lock']['owner'],'actions')
        second.close()

    def test_stuck_lock_is_preserved(self):
        store=Store(fixture())
        LockedState(store,'windows')
        with self.assertRaises(StateBusy):
            wait_for_state(store,'actions',timeout=0)
        self.assertEqual(store.data['lock']['owner'],'windows')
