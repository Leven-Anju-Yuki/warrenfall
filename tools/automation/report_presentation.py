"""Présentation pure des comptes rendus existants : aucune action métier ou réseau."""
from __future__ import annotations
from collections import Counter
import datetime as dt
import json
import math
import re
import unicodedata
from zoneinfo import ZoneInfo

PARIS = ZoneInfo('Europe/Paris')


def fold(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))


def section(text, heading, last=False):
    pattern = r'^## ' + re.escape(heading) + r'\s*$'
    matches = list(re.finditer(pattern, fold(text), re.M))
    if not matches:
        return ''
    # Chercher sur des lignes évite les différences de longueur Unicode normalisée.
    lines = text.splitlines()
    starts = [i for i, line in enumerate(lines) if fold(line).strip() == '## ' + heading]
    if not starts:
        return ''
    start = starts[-1] if last else starts[0]
    end = next((i for i in range(start + 1, len(lines)) if lines[i].startswith('## ')), len(lines))
    return '\n'.join(lines[start + 1:end]).strip()


def json_section(text, heading):
    try:
        return json.JSONDecoder().raw_decode(section(text, heading).lstrip())[0]
    except (ValueError, TypeError):
        return {}


def number(text, label):
    found = re.search(label + r'\s*:\s*(\d+)', fold(text), re.I)
    return int(found.group(1)) if found else None


def human(text):
    text = str(text).replace('@', '@\u200b')
    # Une erreur technique JSON devient une explication, pas un inventaire à l'écran.
    if '{' in text:
        try:
            data = json.loads(text[text.index('{'):])
            text = text[:text.index('{')] + str(data.get('error') or data.get('reason') or 'Détail technique dans la pièce jointe.')
        except (ValueError, AttributeError):
            pass
    text = re.sub(r'https?://\S+', '[lien dans la pièce jointe]', text)
    text = re.sub(r'assets/img/[^\n]+', lambda m: m.group(0).rsplit('/', 1)[-1], text)
    if text.startswith('Cloudinary manifeste : URL ou identité absente'):
        name = text.split(' — ', 1)[-1]
        return f'{name} : URL ou identité Cloudinary non confirmée. Vérifier son transfert avec le relais Windows.'
    return text.strip()


def errors(text):
    raw = section(text, 'Erreurs', last=True)
    if raw.splitlines() and fold(raw.splitlines()[0].strip()).lower() in ('aucune.', 'aucun.'):
        return []
    return [human(line.lstrip('- ')) for line in raw.splitlines()
                             if line.strip() and not fold(line).startswith('Cartes ignorees :')
                             and not re.search(r' : (?:non )?applique ;', fold(line))
                             and fold(line.strip()).lower() not in ('aucune.', 'aucun.')]


def compact_errors(rows):
    counts, examples = Counter(), {}
    for row in rows:
        key = 'resources' if row.startswith('Cloudinary ressources : inaccessible ou identité différente') else row
        counts[key] += 1
        examples[key] = row
    result = []
    for key, n in counts.items():
        if key == 'resources' and n > 1:
            result.append(f'Contrôle Cloudinary : {n} ressources inaccessibles ou avec une identité différente. Détails dans la pièce jointe.')
        else:
            result.append(examples[key] + (f' ({n} occurrences)' if n > 1 else ''))
    return result


def stamp(text):
    found = re.search(r'(?:Exécution du|Collecte du|Date UTC :)\s*(\d{4}-\d\d-\d\dT[^\s]+)', text)
    if found:
        try:
            return dt.datetime.fromisoformat(found.group(1).replace('Z', '+00:00')).astimezone(PARIS)
        except ValueError:
            pass
    return None


def count(value):
    return str(value) if value is not None else 'non mesuré'


def quantity(value, singular, plural):
    return count(value) + ' ' + (singular if value in (0, 1) else plural)


def model(reports, state=None):
    state = state or {}
    main, cloud, trello = (reports.get(k, '') for k in ('bilan', 'images', 'trello'))
    plan = json_section(main, 'Quarantaine et echeances')
    cloud_counts = {k: len(v) for k, v in plan.items() if isinstance(v, list)}
    for key in ('quarantine', 'pending', 'delete', 'deleted', 'restored', 'blocked', 'errors'):
        found = re.search(r'^### ' + key + r' : (\d+)', cloud, re.M)
        if found:
            cloud_counts.setdefault(key, int(found.group(1)))
    all_errors = errors(main)
    cloud_errors = [e for e in all_errors if e.startswith('Cloudinary') or 'Cloudinary non confirmée' in e]
    trello_errors = [e for e in all_errors if 'Trello' in e]
    trello_errors += [e for e in errors(trello) if e not in trello_errors]
    intervention = []
    for line in trello.splitlines():
        if 'Trello / intervention requise :' in line:
            cleaned = human(line.split('Trello / intervention requise :', 1)[1])
            cleaned = re.sub(r'\s*\[[0-9a-f]{24}\]', '', cleaned)
            if cleaned not in intervention:
                intervention.append(cleaned)
    changes = []
    for line in trello.splitlines():
        if re.search(r' : applique ;', fold(line)):
            changes.append(human(line))
    sync = state.get('local_sync') or json_section(main, 'Transferts locaux')
    metrics = state.get('report_sections', {}).get('summary_images', {})
    rows = list(state.get('quarantine', {}).get('items', {}).values())
    if not rows:
        rows = plan.get('pending', []) + plan.get('delete', [])
    if not rows:
        for line in cloud.splitlines():
            if not line.startswith('- ') or '{' not in line:
                continue
            try:
                row = json.loads(line[line.index('{'):])
                if row.get('due') and row not in rows:
                    rows.append(row)
            except ValueError:
                pass
    return {'date': stamp(main) or stamp(cloud) or stamp(trello), 'cloud': cloud_counts, 'plan': plan,
            'cloud_errors': compact_errors(cloud_errors), 'cloud_error_count': len(cloud_errors),
            'trello_errors': compact_errors(list(dict.fromkeys(trello_errors))),
            'trello_error_count': number(trello, 'Erreurs Trello') if number(trello, 'Erreurs Trello') is not None else len(set(trello_errors)),
            'errors': compact_errors(all_errors), 'error_count': len(all_errors), 'intervention': intervention, 'changes': list(dict.fromkeys(changes)),
            'analyzed': number(trello, 'Cartes analysees'),
            'files': number(trello, 'Fichiers nouveaux depuis le point de reprise'),
            'proposed': number(trello, 'Deplacements proposes'),
            'moved': number(trello, r'Transitions traitees avec succes \(reprises comprises\)'),
            'sync': sync, 'metrics': metrics, 'state': state,
            'quarantine_rows': rows,
            'readonly': 'TEST NON DESTRUCTIF' in main or 'Mode : lecture seule' in main}


def header(title, issue, data, known=True):
    status = '⚠️ À vérifier' if issue else '✅ Terminé'
    if data['readonly']:
        status = '🧪 Lecture seule' + (' — points à vérifier' if issue else '')
    elif not known:
        status = '⚪ Résultat incomplet — consulter le diagnostic'
    date = data['date'].strftime('%d/%m/%Y à %H h %M') if data['date'] else 'Horodatage non disponible'
    return [f'**Warrenfall — {title}**', f'{date} · Europe/Paris', status, '']


def quarantine_lines(data):
    groups, unknown = Counter(), 0
    items = data['quarantine_rows']
    for item in items:
        try:
            due = dt.datetime.fromisoformat(item['due'].replace('Z', '+00:00')) if item.get('due') else dt.datetime.fromisoformat(item['since'].replace('Z', '+00:00')) + dt.timedelta(days=7)
            if due.tzinfo is None:
                raise ValueError()
            groups[due] += 1
        except (KeyError, TypeError, ValueError):
            unknown += 1
    lines = []
    for due, n in sorted(groups.items()):
        remaining = (due - data['date']).total_seconds() if data['date'] else None
        label = ('échéance dépassée' if remaining <= 0 else 'J-' + str(math.ceil(remaining / 86400))) if remaining is not None else 'compte à rebours indisponible'
        lines.append(f'• {quantity(n, "image", "images")} · **{label}** · {due.astimezone(PARIS).strftime("%d/%m à %H h %M")}')
    if unknown:
        lines.append(f'• {unknown} date(s) de quarantaine à vérifier ; aucune date corrigée automatiquement.')
    if not items:
        pending = data['cloud'].get('pending')
        lines.append('Aucune quarantaine.' if pending == 0 else 'Échéances : voir la pièce jointe ; dates non disponibles dans cet aperçu.')
    return lines


def summary_lines(channel, reports, state=None):
    data = model(reports, state)
    c, metrics = data['cloud'], data['metrics']
    blocked = c.get('blocked', len(data['state']['blocked']) if 'blocked' in data['state'] else None)
    if channel == 'trello':
        lines = header('Trello', bool(data['trello_errors'] or data['intervention']), data, data['analyzed'] is not None)
        lines += [f'**Cartes analysées : {count(data["analyzed"])}** · Fichiers nouveaux : {count(data["files"])}',
                  f'Déplacements proposés : {count(data["proposed"])} · Transitions traitées : {count(data["moved"])}',
                  f'Erreurs Trello : {data["trello_error_count"]}']
        lines += data['changes'] or (['Aucun déplacement nécessaire ; les cartes inchangées sont détaillées dans la pièce jointe.'] if data['proposed'] == 0 else ['Les propositions et leur résultat figurent dans la pièce jointe ; aucun déplacement supplémentaire effectué par ce message.'])
        if data['intervention']:
            lines += ['', '**Ton intervention est nécessaire :**', *('• ' + e for e in data['intervention'])]
        elif not data['trello_errors']:
            lines += ['Aucune intervention Trello signalée.']
        lines += ['• ' + e for e in data['trello_errors'] if not any(e.endswith(i) for i in data['intervention'])]
    elif channel == 'images':
        from cloudinary_report_view import lines as cloud_lines
        lines = cloud_lines(data)
    else:
        lines = header('Bilan général', bool(data['errors'] or blocked or data['intervention']), data, bool(c) and data['analyzed'] is not None)
        total = len(data['quarantine_rows']) if data['quarantine_rows'] else c.get('pending')
        lines += [f'**Cloudinary :** {quantity(c.get("deleted"), "suppression confirmée", "suppressions confirmées")}, {quantity(total, "image en quarantaine", "images en quarantaine")}, {quantity(blocked, "image bloquée", "images bloquées")}.',
                  f'**Trello :** {count(data["analyzed"])} cartes analysées, {quantity(data["moved"], "transition traitée", "transitions traitées")}, {quantity(len(data["intervention"]), "intervention demandée", "interventions demandées")}.',
                  f'**Suivi des fichiers :** {quantity(data["files"], "fichier nouveau", "fichiers nouveaux")} depuis le point de reprise.',
                  f'**Erreurs : {data["error_count"]}**', *('• ' + e for e in data['errors'])]
        if not data['errors'] and data['moved'] == 0 and c.get('deleted') == 0:
            lines += ['Aucune modification nécessaire : les vérifications ont été effectuées.']
        if blocked:
            lines += [f'À faire : sécuriser les sauvegardes exactes des {blocked} images bloquées.']
        lines += ['Les transferts Windows historiques sont séparés des opérations distantes dans le message Cloudinary.']
        publication=data['state'].get('local_git', {})
        if publication:
            lines += [f'**Dernière publication Windows avant Cloudinary** ({publication.get("finishedAt", "date inconnue")}) : {publication.get("status", "inconnu")}.']
            if publication.get('reason'):
                lines += ['À vérifier : ' + publication['reason']]
    return lines + ['', '📎 Rapport complet joint : détails techniques, historique et inventaires.']


def units(text):
    return len(text.encode('utf-16-le')) // 2


def chunks(lines, limit=1800):
    """Découpe sans perdre de texte ; marge pour les titres de continuation Discord."""
    result, current = [], ''
    for line in lines:
        fragments, part = [], ''
        for char in line:
            if units(part + char) > limit:
                fragments.append(part)
                part = ''
            part += char
        fragments.append(part)
        for fragment in fragments:
            candidate = current + ('\n' if current else '') + fragment
            if units(candidate) > limit:
                body, separator, heading = current.rpartition('\n')
                if separator and heading.startswith('**') and heading.endswith('**') and units(heading + '\n' + fragment) <= limit:
                    result.append(body)
                    current = heading + '\n' + fragment
                else:
                    result.append(current)
                    current = fragment
            else:
                current = candidate
    if current:
        result.append(current)
    title = next((line.strip('*') for line in lines if line.startswith('**Warrenfall — ')), 'Warrenfall')
    return [part if i == 0 else f'**{title} — suite {i + 1}/{len(result)}**\n' + part for i, part in enumerate(result)]
