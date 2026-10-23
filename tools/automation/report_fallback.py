"""Secours d'envoi après échec précoce ; ne lance aucun traitement métier."""
import json
from pathlib import Path
from reporting import deliver


def main():
    folder = Path('.cloudinary-local/reports')
    receipt = folder / 'delivery.json'
    previous = json.loads(receipt.read_text()) if receipt.exists() else {}
    main_report = Path('.cloudinary-local/hybrid-report.md')
    report = main_report.read_text(encoding='utf-8') if main_report.exists() else (
        '# Bilan Warrenfall — chaîne non exécutée ou interrompue\n'
        'Aucun succès Cloudinary/Trello affirmé. Vérifier la configuration, les tests et les journaux Actions.\n'
        'Aucun journal local ni sauvegarde du PC n’est disponible sur ce runner.')
    reports = {}
    for channel in ('bilan', 'images', 'trello'):
        # Même un envoi ambigu n'est jamais répété à l'aveugle.
        if channel in previous:
            continue
        file = folder / (channel + '.md')
        reports[channel] = file.read_text(encoding='utf-8') if file.exists() else report
    if not reports:
        return 0
    class Receipt:
        data = {'notifications': {}}
        def save(self):
            folder.mkdir(parents=True, exist_ok=True)
            (folder / 'fallback-receipt.json').write_text(json.dumps(self.data), encoding='utf-8')
    outcomes = deliver(Receipt(), reports, 'fallback', folder)
    print(json.dumps(outcomes))
    return int(any(value != 'sent' for value in outcomes.values()))


if __name__ == '__main__':
    raise SystemExit(main())
