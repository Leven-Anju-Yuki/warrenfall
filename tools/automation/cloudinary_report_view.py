"""Listes nominatives et suivi des annonces ; aucune suppression ou synchronisation."""
import datetime as dt
import math
import re
from urllib.parse import urlsplit, quote
from report_presentation import PARIS, header, human


def date(value):
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        return parsed if parsed.tzinfo is not None else None
    except (ValueError, TypeError, AttributeError):
        return None


def upload_view(state, reference=None):
    seen, uncertain, sync_seen = set(), set(), set()
    cutoff = None
    for key, receipt in state.get('notifications', {}).items():
        if not key.startswith(('daily:', 'catchup:')) or not key.endswith(':images'):
            continue
        ids = receipt.get('summary_upload_ids')
        if ids is not None:
            if receipt.get('status') == 'sent' and receipt.get('summary_complete'):
                seen.update(ids)
                sync_seen.add(receipt.get('summary_sync_finished'))
            elif receipt.get('status') in ('sent', 'sending', 'uncertain'):
                uncertain.update(ids)
                sync_seen.add(receipt.get('summary_sync_finished'))
        elif receipt.get('status') == 'sent' and receipt.get('message_id'):
            # Transition depuis les anciens bilans : leurs envois sont historiques.
            try:
                stamp = dt.datetime.fromtimestamp(((int(receipt['message_id']) >> 22) + 1420070400000) / 1000, dt.timezone.utc)
                cutoff = max(cutoff, stamp) if cutoff else stamp
            except (ValueError, OverflowError, OSError):
                pass
    result = {'added': [], 'modified': [], 'unclassified': [], 'uncertain': [], 'historical': 0, 'ids': [], 'legacy': []}
    receipts = {}
    records = list(state.get('ledger', {}).get('assets', {}).values()) + list(state.get('manifest', {}).get('assets', {}).values())
    records += [{**row, 'upload_receipt':row} for row in state.get('manifest', {}).get('report_uploads', {}).values()]
    for record in records:
        row = record.get('upload_receipt')
        if not isinstance(row, dict) or row.get('confirmed') is not True:
            continue
        if any(row.get(k) != record.get(k) for k in ('path', 'public_id', 'hash')):
            continue
        at = date(row.get('at'))
        if not at or not row.get('id') or reference and at > reference:
            continue
        receipts[row['id']] = row
    for key, row in sorted(receipts.items(), key=lambda item: item[1]['at']):
        if key in seen or cutoff and date(row['at']) <= cutoff:
            result['historical'] += 1
        elif key in uncertain:
            result['uncertain'].append(row)
        else:
            result[row['kind'] if row.get('kind') in ('added', 'modified') else 'unclassified'].append(row)
            result['ids'].append(key)
    sync = state.get('local_sync', {})
    finished = date(sync.get('finishedAt'))
    if finished and (not reference or finished <= reference) and (not cutoff or finished > cutoff) and sync.get('finishedAt') not in sync_seen:
        for kind in ('added', 'modified'):
            for item in sync.get('images', {}).get(kind, []):
                if not any(row.get('public_id') == item.get('public_id') for row in receipts.values()):
                    result['legacy'].append({**item, 'kind': kind})
    return result


def name(row, state):
    path = row.get('path')
    if not path:
        pid = row.get('id') or row.get('public_id')
        path = state.get('ledger', {}).get('assets', {}).get(pid, {}).get('path') or pid or 'Image non identifiée'
    return human(path.rsplit('/', 1)[-1])


def image_link(row, state):
    """Lien de consultation vers la version connue, jamais une URL reconstruite.

    Un nom identique n'est pas une identité : privilégier l'ID immuable et le
    hash. Ne pas pointer vers une autre version ni vers une URL administrative.
    """
    pid = row.get('public_id') or row.get('id')
    assets = state.get('ledger', {}).get('assets', {})
    candidates = [row]
    if pid:
        if isinstance(assets.get(pid), dict):
            candidates.append(assets[pid])
        candidates.extend(item for item in assets.values() if item.get('public_id') == pid)
    elif row.get('path'):
        record = state.get('manifest', {}).get('assets', {}).get(row['path'])
        if isinstance(record, dict):
            candidates.append(record)
    urls = set()
    for record in candidates:
        if row.get('hash') and record.get('hash') != row['hash']:
            continue
        if row.get('path') and record.get('path') != row['path']:
            continue
        url = record.get('url')
        if not isinstance(url, str) or len(url) > 1000 or any(ord(c) < 32 for c in url):
            continue
        try:
            parsed = urlsplit(url)
            if (parsed.scheme != 'https' or parsed.hostname != 'res.cloudinary.com'
                or parsed.username or parsed.password or parsed.port not in (None, 443)
                or not parsed.path.startswith('/') or parsed.query or parsed.fragment):
                continue
        except ValueError:
            continue
        urls.add(quote(url, safe=':/%~!$&\'*+,;=@-._'))
    # Plusieurs versions pour un ID incomplet : demander une identification exacte.
    if len(urls) != 1:
        return None
    return urls.pop()


def label(row, state):
    title = name(row, state)
    url = image_link(row, state)
    if not url:
        return title
    escaped = re.sub(r'([\\\[\]*_`])', r'\\\1', title)
    return f'[{escaped}](<{url}>)'


def due(item):
    return date(item.get('due')) or ((date(item.get('since')) + dt.timedelta(days=7)) if date(item.get('since')) else None)


def lines(data):
    state, reference = data['state'], data['date']
    uploads = upload_view(state, reference)
    plan = data['plan']
    blocked = {}
    for row in plan.get('blocked', []) + state.get('blocked', []):
        key = row.get('id') or row.get('public_id') or row.get('path')
        absence = state.get('cloudinary_absences', {}).get(key, {})
        item = state.get('ledger', {}).get('assets', {}).get(key)
        if (item and absence.get('status') == 'already_absent' and
                all(absence.get(k) == item.get(k) for k in ('path', 'public_id', 'url', 'hash'))):
            continue
        if key not in blocked:
            blocked[key] = {**row, 'reasons': []}
        reason = human(row.get('reason') or row.get('error') or 'Raison non communiquée ; conservation obligatoire.')
        if reason not in blocked[key]['reasons']:
            blocked[key]['reasons'].append(reason)
    sync = data['sync']
    failures = sync.get('images', {}).get('failed', [])
    step_failures = [step for step in sync.get('steps', []) if isinstance(step.get('exitCode'), int) and step['exitCode'] != 0]
    result = header('Cloudinary', bool(data['cloud_errors'] or blocked or failures or step_failures or uploads['uncertain']), data, bool(data['cloud']))
    metrics = data['metrics']
    if metrics:
        result += [f'Ressources contrôlées : {metrics.get("checked", "non mesuré")} · Nouvelles quarantaines : {metrics.get("quarantined", "non confirmé")} · Restaurations : {metrics.get("restored", "non confirmé")}', '']
    elif data['cloud'].get('quarantine') is not None:
        result += [f'Nouvelles quarantaines prévues : {data["cloud"]["quarantine"]} · Restaurations prévues : {data["cloud"].get("restored", "non confirmé")}', '']
    for kind, title in [('added', 'Nouveaux envois confirmés depuis le dernier bilan'), ('modified', 'Images modifiées ou remplacées depuis le dernier bilan')]:
        rows = uploads[kind]
        result += [f'**{title} : {len(rows)}**']
        result += [f'• {label(row, state)} · {date(row["at"]).astimezone(PARIS).strftime("%d/%m à %H h %M")}' for row in rows] or ['Aucun nouveau transfert à annoncer dans cette catégorie.']
    if uploads['unclassified']:
        result += [f'**Transferts confirmés, type à vérifier : {len(uploads["unclassified"])}**', *('• ' + label(row, state) for row in uploads['unclassified'])]
    if uploads['uncertain']:
        result += ['**Annonce précédente à vérifier — pas de réannonce comme nouvel envoi**', *('• ' + label(row, state) for row in uploads['uncertain'])]
    if uploads['legacy']:
        result += ['**Changements du relais sans reçu de nouveau transfert — à vérifier**',
                   *(f'• {name(row, state)} · {"ajout" if row["kind"] == "added" else "modification"} communiqué par le relais.' for row in uploads['legacy'])]
    if uploads['historical']:
        result += [f'{uploads["historical"]} version(s) déjà signalée(s), non réannoncée(s).']
    result += ['Aucun transfert local n’est lancé par ce bilan GitHub.', '']
    rows = data['quarantine_rows']
    result += [f'**Toutes les quarantaines et leurs échéances : {len(rows)}**']
    if rows or blocked:
        result += ['Appuie sur le nom pour voir l’image quand un lien est disponible. Une image absente de Cloudinary peut renvoyer une erreur 404.']
    for row in sorted(rows, key=lambda row: (due(row) or dt.datetime.max.replace(tzinfo=dt.timezone.utc), name(row, state))):
        expiry = due(row)
        if expiry and reference:
            days = max(0, min(7, math.ceil((expiry - reference).total_seconds() / 86400)))
            status = ' · échéance atteinte, suppression en attente' if expiry <= reference else ''
            result += [f'• {label(row, state)} · **J-{days}** · suppression prévue le {expiry.astimezone(PARIS).strftime("%d/%m/%Y à %H h %M")}{status}']
        else:
            result += [f'• {label(row, state)} · date à vérifier, suppression non annoncée.']
    if not rows:
        result += ['Aucune quarantaine.' if data['cloud'].get('pending') == 0 else 'Liste des quarantaines indisponible : aucune échéance inventée.']
    result += ['Échéances Cloudinary uniquement, sous réserve des contrôles techniques et de la sauvegarde exacte attestée.', '']
    deleted = plan.get('deleted', [])
    result += [f'**Images réellement supprimées lors de cette exécution : {len(deleted) if "deleted" in plan else "non confirmé"}**']
    result += ['• ' + name(row, state) for row in deleted]
    if not deleted and 'deleted' in plan:
        result += ['Aucune suppression Cloudinary effectuée.']
    absent = plan.get('already_absent', [])
    if absent:
        result += ['', f'**Images déjà absentes de Cloudinary, attente clôturée : {len(absent)}**',
                   'Absence confirmée par l’API ; aucune suppression effectuée pour ces images. Historique et sauvegardes conservés.']
        result += ['• ' + name(row, state) for row in absent]
    result += ['', f'**Suppressions bloquées : {len(blocked)}**']
    result += [f'• {label(row, state)} — ' + ' / '.join(row['reasons']) for row in blocked.values()] or ['Aucun blocage signalé.']
    result += ['', f'**Erreurs Cloudinary : {data["cloud_error_count"]}**', *('• ' + error for error in data['cloud_errors'])]
    if failures:
        result += ['**Échecs du dernier relais Windows — historique**']
        for row in failures:
            record = state.get('manifest', {}).get('assets', {}).get(row.get('path'), {})
            result += [f'• {name(row, state)} — {human(record.get("error") or "échec signalé ; détail non communiqué") }']
    if step_failures:
        result += ['**Erreurs du dernier relais Windows — historique**']
        for step in step_failures:
            step_label = 'Sauvegarde locale' if 'backup' in step.get('file', '') else 'Transfert' if 'cloudinary-sync' in step.get('file', '') else 'Étape du relais'
            result += [f'• {step_label} — {human(step.get("diagnostic") or "échec signalé sans diagnostic détaillé") }']
    finished = date(sync.get('finishedAt'))
    if finished:
        result += ['', '**Dernier relais Windows — historique :** ' + finished.astimezone(PARIS).strftime('%d/%m à %H h %M'),
                   'Ces anciens résultats ne sont pas présentés comme de nouveaux transferts.']
    result += ['', '**Les sauvegardes locales permanentes ne sont jamais supprimées.**']
    return result
