"""Rapports détaillés indépendants ; aucun transfert ni traitement de corbeille ici."""
from __future__ import annotations
import datetime as dt
import json
import math
import os
from pathlib import Path
from transports import send_discord
from report_presentation import summary_lines, chunks

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
    # Modèle de présentation seulement : les rapports complets restent inchangés.
    state = locked.data if isinstance(locked.data, dict) else {}
    for channel, text in reports.items():
        if test:
            text = '# TEST NON DESTRUCTIF — aucune mutation Cloudinary/Trello\n\n' + text
        (output / f'{channel}.md').write_text(text, encoding='utf-8')
        url = os.getenv(CHANNELS[channel])
        if not url:
            outcomes[channel] = 'missing-webhook'
        else:
            try:
                try:
                    lines = summary_lines(channel, reports, state)
                    if test:
                        lines = ['🧪 TEST NON DESTRUCTIF — aperçu des résultats disponibles', *lines]
                    parts = chunks(lines)
                except Exception as exc:
                    # Une panne de mise en forme ne doit jamais retenir le fichier complet.
                    name = {'bilan': 'Bilan général', 'images': 'Cloudinary', 'trello': 'Trello'}[channel]
                    parts = [f'**Warrenfall — {name}**\n⚠️ Résumé indisponible : {type(exc).__name__}.\nLe rapport complet est joint ; aucune action métier n’a été relancée.']
                receipt_key = event_id + ':' + channel
                previous = state.get('notifications', {}).get(receipt_key, {})
                if previous.get('summary_messages'):
                    # Reprise exacte des pages, jamais une nouvelle annonce reformulée.
                    parts = previous['summary_messages']
                metadata = {'summary_messages': parts, 'summary_complete': False}
                if channel == 'images':
                    from cloudinary_report_view import upload_view
                    from report_presentation import stamp
                    uploads = upload_view(state, stamp(reports.get('bilan', '')))
                    metadata.update(summary_upload_ids=uploads['ids'],
                                    summary_sync_finished=state.get('local_sync', {}).get('finishedAt'))
                (output / f'{channel}-message.md').write_text('\n\n---\n\n'.join(parts), encoding='utf-8')
                outcomes[channel] = send_discord(locked, event_id + ':' + channel, text, url,
                    filename=channel + '.md', content=parts[0], receipt_metadata=metadata)
                if outcomes[channel] == 'sent':
                    for index, part in enumerate(parts[1:], 2):
                        status = send_discord(locked, event_id + ':' + channel + ':part:' + str(index), '', url,
                                              filename=None, content=part)
                        if status != 'sent':
                            outcomes[channel] = status
                            break
                if outcomes[channel] == 'sent' and receipt_key in state.get('notifications', {}):
                    state['notifications'][receipt_key]['summary_complete'] = True
                    locked.save()
            except Exception:
                outcomes[channel] = 'failed'
        # Reçu local immédiat : le secours Actions ne renvoie pas un envoi déjà tenté.
        (output / 'delivery.json').write_text(json.dumps(outcomes), encoding='utf-8')
    return outcomes
