"""Rapport détaillé de la dernière synchronisation Cloudinary ; aucune action distante."""
from __future__ import annotations
import datetime as dt
import json
from pathlib import Path


def build(root: Path, expected_start=None):
    base = root / '.cloudinary-local'
    source = base / 'nightly-report.json'
    if not source.exists():
        return 'ÉCHEC : aucun journal Cloudinary disponible. La synchronisation de 20 h est non vérifiable.', False
    try:
        run = json.loads(source.read_text(encoding='utf-8'))
        when = dt.datetime.fromisoformat(run['startedAt'].replace('Z', '+00:00')).astimezone()
    except (OSError, ValueError, KeyError, TypeError) as exc:
        return f'ÉCHEC : journal Cloudinary illisible ({type(exc).__name__}).', False
    today = dt.datetime.now().astimezone().date()
    fresh = when.date() == today and when.hour >= 19
    if expected_start:
        try:
            expected = dt.datetime.fromisoformat(expected_start.replace('Z', '+00:00')).astimezone()
            fresh = expected <= when <= dt.datetime.now().astimezone() + dt.timedelta(minutes=5)
        except (ValueError, TypeError):
            fresh = False
    ok = fresh and run.get('status') == 'success'
    status = 'RÉUSSITE' if ok else ('ÉCHEC' if fresh else 'JOURNAL ABSENT POUR CE SOIR')
    sync_status = run.get('syncStatus')
    if not sync_status:
        steps = run.get('steps', [])
        trash_step = next((s for s in steps if s.get('file') == 'tools/cloudinary-corbeille.mjs'), None)
        sync_status = 'success' if trash_step and all(s.get('exitCode') == 0 for s in steps if s is not trash_step) else run.get('status', 'unknown')
    trash_status = run.get('trashStatus') or ('failed' if (run.get('corbeille') or {}).get('errors') else 'non précisé')
    trash_status = {'success': 'RÉUSSI', 'failed': 'ÉCHEC', 'not-run': 'NON EXÉCUTÉ', 'running': 'EN COURS'}.get(trash_status, trash_status)
    lines = [f'# Cloudinary — {status}',
             f'Synchronisation des images : {"RÉUSSIE" if sync_status == "success" else sync_status}',
             f'Traitement de la corbeille : {trash_status}', f'Début : {when.isoformat()}',
             f'Fin : {run.get("finishedAt", "inconnue")}', f'État déclaré : {run.get("status", "inconnu")}',
             f'Erreur : {run.get("error", "aucune")}', '', '## Étapes exécutées']
    for step in run.get('steps', []):
        lines.append(f'- {step.get("file")} {" ".join(step.get("args", []))} : code {step.get("exitCode")} à {step.get("at")}')
    for kind, title in [('added', 'Nouvelles images envoyées'), ('modified', 'Images modifiées envoyées'), ('unchanged', 'Images inchangées'), ('failed', 'Images non vérifiées')]:
        entries = (run.get('images') or {}).get(kind, [])
        lines.extend(['', f'## {title} : {len(entries)}'])
        if kind != 'unchanged':
            lines.extend(f'- {entry.get("path", "?")}' for entry in entries)
    inv = run.get('inventory') or {}
    lines.extend(['', '## Inventaire complet', f'Sélectionnées : {len(inv.get("selected", []))}',
                  f'Exclues : {len(inv.get("excluded", []))}', f'Introuvables : {len(inv.get("missing", []))}'])
    for kind, title in [('selected', 'Images utilisées'), ('excluded', 'Images exclues'), ('missing', 'Références manquantes')]:
        lines.extend(['', f'### {title}'])
        for item in inv.get(kind, []):
            lines.append(f'- {item.get("path")} | présente : {item.get("sourceExists", "?")} | motif : {item.get("reason", item.get("reasons", item.get("sources", "")))}')
    trash = run.get('corbeille') or {}
    try:
        hold = json.loads((root / 'tools/cloudinary-deletion-policy.json').read_text(encoding='utf-8')).get('suspended') is not False
    except (OSError, ValueError, AttributeError):
        hold = True
    if hold or trash.get('deletionSuspended'):
        lines.append('\nSuppression définitive SUSPENDUE : sauvegardes et autorisations humaines à vérifier.')
    for kind, title in [('quarantine', 'Entrées en corbeille'), ('pending', 'En attente'), ('restored', 'Réactivées'),
                        ('deleted', 'Supprimées définitivement'), ('blocked', 'Suppressions bloquées'), ('errors', 'Erreurs corbeille')]:
        items = trash.get(kind, [])
        lines.extend(['', f'### {title} : {len(items)}'])
        for item in items:
            lines.append(f'- {item.get("path", "?")} | ID : {item.get("id", "?")} | date : {item.get("since", "?")} | jours restants : {item.get("daysRemaining", "?")} | motif : {item.get("reason", "")}')
    # Le journal seul ne peut pas prouver l'exécution de 20 h s'il est ancien.
    if not fresh: lines.append('\nALERTE : aucun résultat valide de la synchronisation prévue ce soir à 20 h.')
    return '\n'.join(line.rstrip() for line in lines) + '\n', ok
