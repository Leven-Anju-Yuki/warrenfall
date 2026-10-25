import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch
import report_presentation as ui
import reporting
from transports import send_discord
from test_hybrid import LockedState, Store, fixture


def data():
    state = {'quarantine': {'items': {
        'one': {'since': '2026-10-19T20:32:59.011Z'},
        'two': {'since': '2026-10-21T18:01:28.819Z'}}}, 'blocked': [{'id':'test', 'path':'assets/img/test.png', 'reason':'Sauvegarde exacte absente'}],
        'local_sync': {'finishedAt': '2026-10-24T20:35:18Z', 'syncStatus': 'success',
                       'images': {'added': [], 'modified': [], 'unchanged': [1, 2], 'failed': []}}}
    plan = {'quarantine': [], 'pending': [1, 2], 'delete': [], 'deleted': [], 'restored': [], 'blocked': state['blocked']}
    reports = {'bilan': 'Exécution du 2026-10-24T22:38:33+02:00\n## Quarantaine et échéances\n'
               + json.dumps(plan) + '\n## Erreurs\nCloudinary manifeste : URL ou identité absente — assets/img/a/test.gif',
               'images': '### pending : 2\n### deleted : 0\n### blocked : 1',
               'trello': 'Cartes analysees : 71\nFichiers nouveaux depuis le point de reprise : 3\n'
               'Deplacements proposes : 0\nTransitions traitees avec succes (reprises comprises) : 0\n'
               '## Suivi detaille\n- Carte inchangee a ne pas afficher.\n## Erreurs\nAucune.\n\n'
               'Cartes ignorees : 71 (motifs dans le rapport complet). Erreurs Trello : 0. Erreurs globales : 0.'}
    return reports, state


class Presentation(unittest.TestCase):
    def test_real_status_and_counts_without_inventories_or_unchanged_cards(self):
        reports, state = data()
        before = copy.deepcopy((reports, state))
        general = '\n'.join(ui.summary_lines('bilan', reports, state))
        trello = '\n'.join(ui.summary_lines('trello', reports, state))
        cloud = '\n'.join(ui.summary_lines('images', reports, state))
        self.assertIn('24/10/2026 à 22 h 38', general)
        self.assertIn('⚠️', general)
        self.assertIn('✅', trello)
        self.assertIn('71', trello)
        self.assertIn('Aucun déplacement nécessaire', trello)
        self.assertNotIn('Carte inchangee', trello)
        self.assertIn('J-2', cloud)
        self.assertIn('J-4', cloud)
        self.assertIn('historique', cloud)
        self.assertIn('24/10 à 22 h 35', cloud)
        self.assertIn('test.gif', cloud)
        self.assertNotIn('assets/img/', cloud)
        self.assertNotIn('https://res.cloudinary.com', cloud)
        self.assertEqual(before, (reports, state))

    def test_missing_data_never_becomes_success(self):
        for ch in reporting.CHANNELS:
            result = '\n'.join(ui.summary_lines(ch, {}))
            self.assertIn('Résultat incomplet', result)
            self.assertNotIn('✅', result)
            self.assertNotIn('Aucune modification nécessaire', result)

    def test_planned_quarantine_not_presented_as_confirmed(self):
        reports, state = data()
        reports['images'] += '\n### quarantine : 3'
        reports['bilan'] = reports['bilan'].replace('"quarantine": []', '"quarantine": [1, 2, 3]')
        result = '\n'.join(ui.summary_lines('images', reports, state))
        self.assertIn('Nouvelles quarantaines prévues : 3', result)
        state['report_sections'] = {'summary_images': {'checked': 80, 'quarantined': 0, 'restored': 0}}
        result = '\n'.join(ui.summary_lines('images', reports, state))
        self.assertIn('Ressources contrôlées : 80', result)
        self.assertIn('Nouvelles quarantaines : 0', result)

    def test_interventions_and_applied_changes_are_visible(self):
        reports, state = data()
        reports['trello'] += '\nRécompenses : applique ; preuves vérifiées.\nTrello / intervention requise : Équipes [6ac39e147db15f1edab9c326] ; case principale absente.'
        text = '\n'.join(ui.summary_lines('trello', reports, state))
        self.assertIn('Récompenses : applique', text)
        self.assertIn('Ton intervention est nécessaire', text)
        self.assertIn('case principale absente', text)
        self.assertNotIn('Carte inchangee', text)

    def test_long_messages_keep_all_essential_errors_and_utf16_limits(self):
        lines = ['🐰' * 2200] + [f'Erreur importante {i} : corriger la carte {i}.' for i in range(300)]
        parts = ui.chunks(lines)
        self.assertGreater(len(parts), 1)
        self.assertTrue(all(ui.units(p) <= 2000 for p in parts))
        for line in lines[1:]:
            self.assertIn(line, '\n'.join(parts))

    def test_readonly_test_is_explicit(self):
        reports, state = data()
        reports['bilan'] = '# TEST NON DESTRUCTIF\n' + reports['bilan']
        self.assertIn('Lecture seule', '\n'.join(ui.summary_lines('trello', reports, state)))

    def test_hundreds_of_resource_errors_are_counted_without_listing_paths(self):
        reports, state = data()
        reports['bilan'] += '\n' + '\n'.join(f'Cloudinary ressources : inaccessible ou identité différente — assets/img/rabbit-{i}.png' for i in range(200))
        result = '\n'.join(ui.summary_lines('images', reports, state))
        self.assertIn('Erreurs Cloudinary : 201', result)
        self.assertIn('200 ressources inaccessibles', result)
        self.assertNotIn('rabbit-199.png', result)

    def test_large_summaries_send_continuations_with_one_full_attachment(self):
        locked = LockedState(Store(fixture()), 'test')
        response = Mock(ok=True)
        response.json.return_value = {'id': '1', 'attachments': [{'filename': 'bilan.md'}]}
        reports, _ = data()
        reports['bilan'] += '\n' + '\n'.join('Erreur ' + str(i) + ' : une intervention est nécessaire.' for i in range(150))
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {'DISCORD_WEBHOOK_BILAN': 'test'}), \
             patch('transports.request', return_value=response) as post:
            result = reporting.deliver(locked, {'bilan': reports['bilan']}, 'preview', folder)
            self.assertEqual(result['bilan'], 'sent')
            self.assertGreater(post.call_count, 1)
            self.assertEqual(sum('files' in call.kwargs for call in post.call_args_list), 1)
            for call in post.call_args_list:
                self.assertLessEqual(ui.units(json.loads(call.kwargs['data']['payload_json'])['content']), 2000)
            self.assertEqual(Path(folder, 'bilan.md').read_text(encoding='utf-8'), reports['bilan'])
            self.assertIn('Erreur 149', Path(folder, 'bilan-message.md').read_text(encoding='utf-8'))

    def test_transport_refuses_unbounded_content_before_any_send(self):
        locked = LockedState(Store(fixture()), 'test')
        with patch('transports.request') as post, self.assertRaises(ValueError):
            send_discord(locked, 'oversize', '', 'test', content='🐰' * 1001)
        post.assert_not_called()
        self.assertNotIn('oversize', locked.data.get('notifications', {}))

    def test_presentation_bug_does_not_prevent_full_attachment(self):
        locked = LockedState(Store(fixture()), 'test')
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, {'DISCORD_WEBHOOK_TRELLO': 'test'}), \
             patch('reporting.summary_lines', side_effect=ValueError()), \
             patch('reporting.send_discord', return_value='sent') as send:
            outcome = reporting.deliver(locked, {'trello': 'Rapport complet conservé'}, 'format-test', folder)
        self.assertEqual(outcome['trello'], 'sent')
        self.assertEqual(send.call_args.args[2], 'Rapport complet conservé')
        self.assertIn('Résumé indisponible', send.call_args.kwargs['content'])
