"""Tests Git dans des dépôts temporaires ; aucun GitHub/Cloudinary/Discord."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import nightly_git as task


class NightlyGit(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='warrenfall-git-')
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name).resolve()
        self.root, self.remote = base / 'work', base / 'remote.git'
        self.root.mkdir()
        self.git(self.root, 'init', '-b', 'main')
        self.git(self.root, 'config', 'user.name', 'Warrenfall test')
        self.git(self.root, 'config', 'user.email', 'test@example.invalid')
        self.write('index.html', 'Version initiale')
        self.write('Lapinous sauvegarde/admin.json', '{"private":1}')
        self.write('tools/agent_lapinous/etat_batterie.json', '{}')
        self.write('.gitignore', '.env\n.cloudinary-local/\n')
        self.git(self.root, 'add', '.')
        self.git(self.root, 'commit', '-m', 'Initial')
        self.git(self.root, 'init', '--bare', str(self.remote))
        self.git(self.root, 'remote', 'add', 'origin', str(self.remote))
        self.git(self.root, 'push', '-u', 'origin', 'main')

    def git(self, root, *args):
        return subprocess.check_output(['git', '-C', str(root), *args], stderr=subprocess.DEVNULL, text=True).strip()

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')

    def head(self):
        return self.git(self.root, 'rev-parse', 'HEAD')

    def test_simulation_does_not_stage_commit_or_push(self):
        before = self.head()
        self.write('index.html', 'Nouvelle interface')
        report = task.run(self.root)
        self.assertEqual(report['status'], 'simulation')
        self.assertEqual(report['files'], ['index.html'])
        self.assertEqual(before, self.head())
        self.assertEqual(self.git(self.root, 'diff', '--cached', '--name-only'), '')

    def test_publish_excludes_tracked_saves_battery_and_secrets(self):
        self.write('index.html', 'Nouvelle interface')
        self.write('Lapinous sauvegarde/admin.json', '{"private":10}')
        self.write('tools/agent_lapinous/etat_batterie.json', '{"charge":12}')
        self.write('.env', 'TOKEN=private-value-not-for-github\n')
        report = task.run(self.root, True)
        self.assertEqual(report['status'], 'published')
        self.assertEqual(self.git(self.root, 'show', '--format=', '--name-only', 'HEAD'), 'index.html')
        self.assertIn('admin.json', self.git(self.root, 'status', '--short'))
        self.assertEqual(json.loads((self.root / 'Lapinous sauvegarde/admin.json').read_text())['private'], 10)
        self.assertEqual(self.git(self.root, 'rev-parse', 'HEAD'), self.git(self.remote, 'rev-parse', 'main'))

    def test_unchanged_does_not_create_commit(self):
        before = self.head()
        self.assertEqual(task.run(self.root, True)['status'], 'unchanged')
        self.assertEqual(before, self.head())

    def test_manual_staging_is_preserved(self):
        before = self.head()
        self.write('index.html', 'Version manuelle')
        self.git(self.root, 'add', 'index.html')
        staged = self.git(self.root, 'show', ':index.html')
        self.assertEqual(task.run(self.root, True)['status'], 'blocked')
        self.assertEqual(staged, self.git(self.root, 'show', ':index.html'))
        self.assertEqual(before, self.head())

    def test_secret_in_public_file_blocks_without_disclosing_value(self):
        secret = 'a-private-api-value-with-many-characters'
        self.write('.env', 'API_SECRET=' + secret)
        self.write('index.html', secret)
        report = task.run(self.root, True)
        self.assertEqual(report['status'], 'blocked')
        self.assertNotIn(secret, json.dumps(report))
        self.assertEqual(self.git(self.root, 'diff', '--cached', '--name-only'), '')

    def test_incoming_changes_never_merge_or_force(self):
        peer = self.root.parent / 'peer'
        self.git(self.root, 'clone', '-b', 'main', str(self.remote), str(peer))
        self.git(peer, 'config', 'user.name', 'Peer')
        self.git(peer, 'config', 'user.email', 'peer@example.invalid')
        (peer / 'index.html').write_text('Modification distante')
        self.git(peer, 'commit', '-am', 'Autre modification')
        self.git(peer, 'push')
        before = self.head()
        self.assertEqual(task.run(self.root, True)['status'], 'blocked')
        self.assertEqual(before, self.head())

    def test_existing_private_commit_is_not_pushed(self):
        self.write('Lapinous sauvegarde/admin.json', '{"private":9}')
        self.git(self.root, 'commit', '-am', 'Partie personnelle')
        remote_before = self.git(self.remote, 'rev-parse', 'main')
        self.assertEqual(task.run(self.root, True)['status'], 'blocked')
        self.assertEqual(remote_before, self.git(self.remote, 'rev-parse', 'main'))

    def test_failed_push_is_retried_without_duplicate_commit(self):
        self.write('index.html', 'Travail du soir')
        original = task.git
        def fail_push(root, *args):
            if args[0] == 'push':
                raise RuntimeError('Commande Git non aboutie : push')
            return original(root, *args)
        with patch.object(task, 'git', fail_push):
            self.assertEqual(task.run(self.root, True)['status'], 'blocked')
        committed = self.head()
        self.assertEqual(task.run(self.root, True)['status'], 'published')
        self.assertEqual(committed, self.head())

    def test_message_reflects_modified_features(self):
        text = task.message(['assets/js/quiz.js', 'assets/js/exploration.js'])
        self.assertIn('quiz', text)
        self.assertIn('explorations', text)
        self.assertNotIn('combats', text)
        detailed=task.message(['assets/js/script.js'], {'assets/js/script.js':'const friendshipGained=gainFriendship(3);'})
        self.assertIn('réellement crédités', detailed)
        self.assertNotIn('éclosion interrompue', detailed)


if __name__ == '__main__':
    unittest.main()
