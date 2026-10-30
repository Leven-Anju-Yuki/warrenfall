import hashlib
from pathlib import Path
import tempfile
import unittest
from local_bridge import exact_backup


class MovedBackupTest(unittest.TestCase):
    def test_same_name_requires_exact_content_and_preserves_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            wrong = root / 'old' / 'infusion.png'
            right = root / 'new' / 'infusion.png'
            wrong.parent.mkdir(); right.parent.mkdir()
            wrong.write_bytes(b'other version'); right.write_bytes(b'original')
            item = {'path': 'assets/img/previous/infusion.png', 'hash': hashlib.sha256(b'original').hexdigest()}
            self.assertEqual(exact_backup(item, root, {}), right)
            self.assertEqual(wrong.read_bytes(), b'other version')
            self.assertEqual(right.read_bytes(), b'original')

    def test_name_alone_never_attests_a_different_image(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); (root / 'lapin.png').write_bytes(b'different')
            item = {'path': 'assets/img/old/lapin.png', 'hash': hashlib.sha256(b'original').hexdigest()}
            self.assertIsNone(exact_backup(item, root, {}))


if __name__ == '__main__':
    unittest.main()
