"""Régression doublons A_FAIRE : aucune API réelle, aucune donnée de production."""
import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, Mock
import agent
import suivi_trello as suivi
from test_suivi_trello import TASK, TODO, CID, LISTS

BAD = "b" * 24
BAD_TASK = {**TASK, "card_id": BAD, "nom": "Équipes favorites"}
BAD_LINE = "- [x] Équipes favorites [trello:" + BAD + "]"


class ValidationResilience(unittest.TestCase):
    def test_exact_missing_parent_and_lines(self):
        self.assertEqual(suivi.progress("", CID)["diagnostics"], ["case principale absente"])
        state = suivi.progress(TODO + "\n" + TODO.replace("[ ]", "[x]"), CID)
        self.assertTrue(state["ambigu"])
        self.assertIn("lignes 1, 2", state["diagnostics"][0])

    def test_duplicate_subtask_even_with_different_check_state(self):
        sub = "- [x] export [trello:" + CID + ":code:export]"
        state = suivi.progress(TODO + "\n" + sub + "\n" + sub.replace("[x]", "[ ]"), CID)
        self.assertIn("code:export", state["diagnostics"][0])
        self.assertIn("lignes 2, 3", state["diagnostics"][0])
        self.assertEqual(state["cochees"], 1)

    def test_reference_is_not_a_second_parent(self):
        state = suivi.progress(TODO.replace("[ ]", "[x]") + "\n- Validation cochée : [Carte](https://trello.com/c/" + CID + ")", CID)
        self.assertFalse(state["ambigu"])
        self.assertTrue(state["parent_coche"])

    def test_partition_excludes_all_duplicate_mapping_instances(self):
        valid, issues = suivi.partition_tasks([TASK, TASK, BAD_TASK], TODO + "\n" + BAD_LINE)
        self.assertEqual([t["card_id"] for t in valid], [BAD])
        self.assertEqual(len(issues), 2)

    def test_partition_isolates_invalid_regex_and_missing_parent(self):
        invalid = {**TASK, "preuves": [{"chemin": "shared.js", "motifs": ["["]}]}
        valid, issues = suivi.partition_tasks([invalid, BAD_TASK], TODO)
        self.assertFalse(valid)
        self.assertEqual(len(issues), 2)

    def test_real_mappings_have_one_parent_after_fix(self):
        root = Path(__file__).resolve().parents[2]
        tasks = json.loads((root / "tools/agent_lapinous/liaisons_trello.json").read_text(encoding="utf-8"))["taches"]
        valid, issues = suivi.partition_tasks(tasks, (root / "A_FAIRE.md").read_text(encoding="utf-8"))
        self.assertEqual(issues, [])
        self.assertEqual(len(valid), len(tasks))

    def test_bilan_continues_reports_and_notifies_without_mutating_bad_card(self):
        with tempfile.TemporaryDirectory() as folder, contextlib.ExitStack() as stack:
            root = Path(folder)
            (root / "A_FAIRE.md").write_text(TODO + "\n" + BAD_LINE + "\n" + BAD_LINE, encoding="utf-8")
            (root / "readme.md").write_text("# test", encoding="utf-8")
            cards = [{"id": CID, "name": "Valide", "idList": "todo", "shortUrl": "https://trello.com/c/good"},
                     {"id": BAD, "name": "Équipes favorites", "idList": "done", "shortUrl": "https://trello.com/c/bK6JARQX"}]
            calls = {}
            replacements = {
                "ROOT": root, "REPORTS": root / "reports", "STATE_FILE": root / "state.json",
                "load_mappings": Mock(return_value=[TASK, BAD_TASK]),
                "collect": Mock(return_value=({"shared.js": {"lignes": ["saveGame = 2"], "existe": True}},
                                            {"hashes": {}, "texts": {}}, [])),
                "get_lists": Mock(return_value=LISTS), "get_cards": Mock(return_value=cards),
                "recover_transitions": Mock(return_value=[]), "apply_plan": Mock(),
                "cloudinary_report": Mock(return_value=("Cloudinary intact", True)),
                "quarantine_discord_summary": Mock(return_value="Quarantaine intacte"),
                "replace_section": Mock(), "save_checkpoint": Mock(),
                "discord": Mock(return_value=True), "send_report_file": Mock(return_value=True),
                "inventory": Mock(return_value="inventaire"),
            }
            for name, replacement in replacements.items():
                calls[name] = stack.enter_context(patch.object(agent, name, replacement))
            stack.enter_context(patch.dict(os.environ, {"LAPINOUS_TRELLO_READ_ONLY": "false"}))
            stack.enter_context(patch("requests.sessions.Session.request", side_effect=AssertionError("Réseau interdit")))
            output = stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
            self.assertEqual(agent.bilan(True), 1)  # dégradé, pas de faux succès
            self.assertIn("Cloudinary intact", output.getvalue())
            self.assertIn("lignes 2, 3", output.getvalue())
            self.assertIn("https://trello.com/c/bK6JARQX", output.getvalue())
            calls["apply_plan"].assert_called_once()
            self.assertEqual(calls["apply_plan"].call_args.args[0]["id"], CID)
            calls["recover_transitions"].assert_called_once_with(LISTS, {BAD})
            calls["save_checkpoint"].assert_not_called()
            notified = "\n".join(call.args[1] for call in calls["discord"].call_args_list)
            self.assertIn("intervention requise", notified)
            self.assertIn("Équipes favorites", notified)
            calls["send_report_file"].assert_called()
            self.assertEqual(len(list((root / "reports").glob("*_bilan.md"))), 1)

    def test_recovery_skips_bad_card_and_keeps_journal(self):
        pending = {BAD: {"id": BAD}}
        with patch.object(agent, "read_transitions", return_value=pending), \
             patch.object(agent, "api", side_effect=AssertionError("Carte exclue")), \
             patch.object(agent, "write_transitions") as write:
            self.assertEqual(agent.recover_transitions(LISTS, {BAD}), [])
            write.assert_not_called()
            self.assertIn(BAD, pending)


if __name__ == "__main__":
    unittest.main()
