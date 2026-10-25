"""Un cycle automatique par jour et résultat local ; relais et planning se dédoublonnent."""
import hashlib
import json
from pathlib import Path
from core import paris_day

CHANNELS = ('bilan', 'images', 'trello')


def cycle_id(state, now):
    sync = state.get('local_sync', {})
    identity = json.dumps(sync, sort_keys=True, ensure_ascii=False)
    return 'daily:' + paris_day(now) + ':cycle:' + hashlib.sha256(identity.encode()).hexdigest()[:24]


def completed(state, event_id):
    return event_id in state.get('completed_report_cycles', {})


def acknowledge_existing(output):
    """Empêche aussi le secours de réexpédier un cycle déjà confirmé."""
    folder = Path(output)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / 'delivery.json').write_text(json.dumps({c: 'sent' for c in CHANNELS}), encoding='utf-8')


def resume_reports(state, event_id):
    if state.get('prepared_report_cycle', {}).get('id') == event_id:
        reports = state.get('last_reports', {})
        if all(isinstance(reports.get(c), str) and reports[c] for c in CHANNELS):
            return reports
    return None


def confirm(locked, event_id, outcomes, stamp, errors):
    if all(outcomes.get(c) == 'sent' for c in CHANNELS):
        locked.data.setdefault('completed_report_cycles', {})[event_id] = {
            'at': stamp, 'errors': len(errors)}
        locked.save()
