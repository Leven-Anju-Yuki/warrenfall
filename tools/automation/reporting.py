"""Rapports détaillés indépendants ; aucun transfert ni traitement de corbeille ici."""
from __future__ import annotations
import datetime as dt
import json
import math
import os
from pathlib import Path
from transports import send_discord

CHANNELS = {'bilan': 'DISCORD_WEBHOOK_BILAN', 'images': 'DISCORD_WEBHOOK_CLOUDINARY',
            'trello': 'DISCORD_WEBHOOK_TRELLO'}


def cloudinary_details(state, proposed, now):
    sync = state.get('local_sync', {})
    lines = ['# Cloudinary — état détaillé', '',
             'Aucun transfert depuis le PC n’est exécuté par ce bilan distant.',
             'Dernier transfert communiqué (historique, pas une réussite de ce soir) :',
             json.dumps(sync, ensure_ascii=False, indent=2), '', '## Corbeille — suivi des 7 jours']
    for kind in ('quarantine', 'pending', 'delete', 'deleted', 'restored', 'blocked', 'errors'):
        rows = proposed.get(kind, [])
        lines.append(f'\n### {kind} : {len(rows)}')
        for row in rows:
            countdown = ''
            if row.get('due'):
                due = dt.datetime.fromisoformat(row['due'].replace('Z', '+00:00'))
                seconds = (due - now).total_seconds()
                countdown = f'J-{math.ceil(seconds / 86400)}' if seconds > 0 else 'ÉCHUE'
            lines.append(f'- {row.get("path", "?")} | {row.get("id", "?")} | {countdown} | '
                         + json.dumps(row, ensure_ascii=False))
    lines += ['', '## Images et points de reprise',
              json.dumps(state.get('manifest', {}), ensure_ascii=False, indent=2),
              '', '## Opérations Cloudinary confirmées ou en attente',
              json.dumps(state.get('operations', {}), ensure_ascii=False, indent=2),
              '', '## Sauvegardes non attestées / blocages du relais',
              json.dumps(state.get('blocked', []), ensure_ascii=False, indent=2)]
    return '\n'.join(lines)


def bundle(state, report, cloud_report):
    sections = state.get('report_sections', {})
    trello = sections.get('trello') or sections.get('bilan') or (
        '# Trello / Git / documentation\nÉtape interrompue ou non exécutée.\n\n' + report)
    return {'bilan': report, 'images': cloud_report, 'trello': trello}


def deliver(locked, reports, event_id, output, *, test=False):
    """Chaque salon est essayé même si le précédent échoue ; pièces jointes intégrales."""
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    outcomes = {}
    for channel, text in reports.items():
        if test:
            text = '# TEST NON DESTRUCTIF — aucune mutation Cloudinary/Trello\n\n' + text
        (output / f'{channel}.md').write_text(text, encoding='utf-8')
        url = os.getenv(CHANNELS[channel])
        if not url:
            outcomes[channel] = 'missing-webhook'
        else:
            try:
                outcomes[channel] = send_discord(locked, event_id + ':' + channel, text, url,
                    filename=channel + '.md', title=('TEST — ' if test else '') + 'Warrenfall — ' + channel)
            except Exception:
                outcomes[channel] = 'failed'
        # Reçu local immédiat : le secours Actions ne renvoie pas un envoi déjà tenté.
        (output / 'delivery.json').write_text(json.dumps(outcomes), encoding='utf-8')
    return outcomes
