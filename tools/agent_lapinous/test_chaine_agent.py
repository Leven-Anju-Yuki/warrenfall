"""Contexte de la chaîne et rapports testés sans réseau ni services réels."""
import sys
sys.dont_write_bytecode = True
import contextlib
import datetime as dt
import io
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch
import agent
import cloudinary_rapport
from test_suivi_trello import repo, TASK, LISTS, CID, scratch


class ChainReports(unittest.TestCase):
    def test_image_changes_and_quarantine_are_named(self):
        import tempfile
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'.cloudinary-local').mkdir()
            now=dt.datetime.now(dt.timezone.utc).isoformat()
            report={'startedAt':now,'status':'success','images':{'added':[{'path':'new.png'}],'modified':[{'path':'changed.gif'}]},'corbeille':{'pending':[{'path':'unused.png','daysRemaining':7}]}}
            (root/'.cloudinary-local/nightly-report.json').write_text(json.dumps(report),encoding='utf-8')
            text,ok=cloudinary_rapport.build(root,now)
            self.assertTrue(ok)
            for expected in ('Nouvelles images envoyées : 1','Images modifiées envoyées : 1','new.png','changed.gif','unused.png','jours restants : 7','Suppression définitive SUSPENDUE'):
                self.assertIn(expected,text)

    def test_read_only_blocks_api_writes_even_when_application_is_allowed(self):
        with patch.dict(os.environ, {'LAPINOUS_TRELLO_READ_ONLY':'true'}), \
             patch.object(agent, 'REMOTE_WRITES', True), \
             patch.object(agent.requests, 'request', side_effect=AssertionError('Reseau interdit')):
            with self.assertRaisesRegex(RuntimeError, 'lecture seule'):
                agent.api('PUT', 'cards/' + CID, {'idList':'working'})

    def test_applied_report_in_read_only_mode_does_not_move_or_checkpoint(self):
        root = repo()
        (root / 'shared.js').write_text('saveGame = 2;\n', encoding='utf-8')
        with patch.dict(os.environ, {'LAPINOUS_TRELLO_READ_ONLY':'true'}), \
             patch.object(agent, 'ROOT', root), patch.object(agent, 'REPORTS', root/'reports'), \
             patch.object(agent, 'STATE_FILE', root/'.cloudinary-local/state.json'), \
             patch.object(agent, 'load_mappings', return_value=[TASK]), \
             patch.object(agent, 'get_lists', return_value=LISTS), \
             patch.object(agent, 'get_cards', return_value=[{'id':CID,'name':'Fictif','idList':'todo'}]), \
             patch.object(agent, 'cloudinary_report', return_value=('Fictif',True)), \
             patch.object(agent, 'api', side_effect=AssertionError('Modification Trello interdite')), \
             patch.object(agent, 'save_checkpoint', side_effect=AssertionError('Point de reprise interdit')), \
             patch.object(agent, 'discord', return_value=True), \
             patch.object(agent, 'send_report_file', return_value=True), \
             contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(agent.bilan(True),0)

    def test_failed_sync_is_not_hidden_by_old_success_or_simulation(self):
        root = repo()
        with patch.object(agent, 'ROOT', root), \
             patch.object(agent, 'STATE_FILE', root / '.cloudinary-local/state.json'), \
             patch.object(agent, 'load_mappings', return_value=[TASK]), \
             patch.object(agent, 'get_lists', return_value=LISTS), \
             patch.object(agent, 'get_cards', return_value=[{'id': CID, 'name': 'Fictif', 'idList': 'todo'}]), \
             patch.object(agent, 'cloudinary_report', return_value=('Ancien succes fictif', True)), \
             patch.object(agent.requests, 'request', side_effect=AssertionError('Reseau interdit')), \
             patch.object(agent.requests, 'post', side_effect=AssertionError('Discord interdit')), \
             patch.object(Path, 'write_text', side_effect=AssertionError('Ecriture interdite')), \
             patch.object(Path, 'mkdir', side_effect=AssertionError('Creation interdite')), \
             contextlib.redirect_stdout(io.StringIO()) as output:
            result = agent.bilan(False, chain={'syncExit': 7, 'errors': ['Node fictif en echec']})
        self.assertEqual(result, 1)
        self.assertIn('code 7', output.getvalue())
        self.assertIn('Quarantaine', output.getvalue())
        self.assertIn('Node fictif en echec', output.getvalue())

    def test_current_run_is_checked_by_timestamp_even_across_midnight(self):
        root = scratch()
        folder = root / '.cloudinary-local'
        folder.mkdir()
        now = dt.datetime.now(dt.timezone.utc)
        source = folder / 'nightly-report.json'
        source.write_text(json.dumps({'startedAt':now.isoformat(),'status':'success'}), encoding='utf-8')
        self.assertTrue(cloudinary_rapport.build(root, (now-dt.timedelta(seconds=5)).isoformat())[1])
        self.assertFalse(cloudinary_rapport.build(root, (now+dt.timedelta(seconds=5)).isoformat())[1])

    def test_notification_failure_does_not_prevent_remaining_jobs(self):
        seen = []
        def failed():
            seen.append('bilan')
            raise RuntimeError('Discord fictif indisponible')
        failures = agent.notify_all([('bilan',failed),('images',lambda:seen.append('images')),('erreurs',lambda:seen.append('erreurs'))])
        self.assertEqual(seen, ['bilan','images','erreurs'])
        self.assertEqual(len(failures),1)

if __name__ == '__main__':
    unittest.main(verbosity=2)
