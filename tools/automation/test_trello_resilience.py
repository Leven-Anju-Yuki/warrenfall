"""Le relais Actions utilise le même bilan tolérant aux cartes invalides."""
import contextlib
import io
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch
import remote
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "agent_lapinous"))
import agent
from test_suivi_trello import TASK, TODO, CID, LISTS


class RemoteValidation(unittest.TestCase):
    def test_remote_report_keeps_card_diagnostics_and_other_cards(self):
        bad = "b" * 24
        line = "- [x] Favoris [trello:" + bad + "]"
        with tempfile.TemporaryDirectory() as folder, contextlib.ExitStack() as stack:
            root = Path(folder)
            (root / "A_FAIRE.md").write_text(TODO + "\n" + line + "\n" + line, encoding="utf-8")
            locked = Mock()
            locked.data = {"transitions": {}}
            replacements = {
                "ROOT": root,
                "load_mappings": Mock(return_value=[TASK, {**TASK, "card_id": bad, "nom": "Favoris"}]),
                "collect": Mock(return_value=({}, {"hashes": {}, "texts": {}}, [])),
                "get_lists": Mock(return_value=LISTS),
                "get_cards": Mock(return_value=[
                    {"id": CID, "name": "Valide", "idList": "todo"},
                    {"id": bad, "name": "Favoris", "idList": "done", "shortUrl": "https://trello.com/c/bK6JARQX"}]),
                "recover_transitions": Mock(return_value=[]),
                "quarantine_discord_summary": Mock(return_value="inchangée"),
                "inventory": Mock(return_value="inventaire")
            }
            for name, value in replacements.items():
                stack.enter_context(patch.object(agent, name, value))
            stack.enter_context(patch.dict(os.environ, {"LAPINOUS_TRELLO_READ_ONLY": "false"}))
            stack.enter_context(patch("requests.sessions.Session.request", side_effect=AssertionError("Réseau interdit")))
            code, report = remote.trello(locked)
            self.assertEqual(code, 1)
            self.assertIn("Cartes analysees : 1", report)
            self.assertIn("Favoris", report)
            self.assertIn("https://trello.com/c/bK6JARQX", report)
            self.assertIn("lignes 2, 3", report)
            self.assertNotIn("trello", locked.data)  # Pas de checkpoint partiel.
            locked.save.assert_not_called()


if __name__ == "__main__":
    unittest.main()
