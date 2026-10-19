"""Surveillance discrète de la batterie Warrenfall (Windows, sans dépendance externe)."""
import ctypes
import datetime as dt
import json
import os
import ssl
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # tools/agent_lapinous/surveillance_batterie.py
STATE = Path(__file__).with_name('etat_batterie.json')
LOG = ROOT / '.cloudinary-local' / 'logs' / 'batterie.jsonl'

class SYSTEM_POWER_STATUS(ctypes.Structure):
    _fields_ = [('ACLineStatus', ctypes.c_byte), ('BatteryFlag', ctypes.c_byte),
                ('BatteryLifePercent', ctypes.c_byte), ('SystemStatusFlag', ctypes.c_byte),
                ('BatteryLifeTime', ctypes.c_ulong), ('BatteryFullLifeTime', ctypes.c_ulong)]

def lire_batterie():
    status = SYSTEM_POWER_STATUS()
    if not ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(status)):
        raise OSError('Lecture de la batterie impossible')
    if status.BatteryLifePercent == -1 or status.ACLineStatus == -1:
        return None, None
    return int(status.BatteryLifePercent), status.ACLineStatus == 1

def lire_env():
    path = ROOT / '.env'
    if not path.exists():
        return
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, val = line.split('=', 1)
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), val)

def envoyer(message):
    lire_env()
    url = os.getenv('DISCORD_WEBHOOK_ERREURS')
    if not url:
        raise RuntimeError('Webhook alertes absent du .env racine')
    data = json.dumps({'content': message, 'allowed_mentions': {'parse': []}}).encode('utf-8')
    request = urllib.request.Request(
        url,
        data=data,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'Lapinous-Agent/1.0 (+Windows; Python)'
        },
        method='POST'
    )   
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            if response.status not in (200, 204):
                raise RuntimeError(f'Discord HTTP {response.status}')
            return response.status

    except urllib.error.HTTPError as erreur:
        error = RuntimeError(f'Discord HTTP {erreur.code} : alerte non confirmée')
        error.http_status = erreur.code
        raise error from None

def journal(event):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open('a', encoding='utf-8') as stream:
        stream.write(json.dumps(event, ensure_ascii=False) + '\n')


def main():
    now = dt.datetime.now().astimezone()
    event = {'checked_at': now.isoformat(), 'percent': None, 'plugged': None,
             'thresholds_due': [], 'discord_accepted': False}
    try:
        pct, plugged = lire_batterie()
        event.update(percent=pct, plugged=plugged)
        if pct is None or plugged is None:
            event['result'] = 'battery_unavailable'
            return 0
        try:
            state = json.loads(STATE.read_text(encoding='utf-8'))
        except (FileNotFoundError, ValueError):
            state = {}
        sent = set(state.get('sent', []))
        if plugged and pct >= 50:
            sent.clear()
        if not plugged:
            crossed = [threshold for threshold in (30, 25, 20, 15) if pct <= threshold and threshold not in sent]
            event['thresholds_due'] = crossed
            if crossed:
                severity = '🚨 CRITIQUE' if pct <= 15 else '🔋 Batterie faible'
                accepted_status = envoyer(f'{severity} — Warrenfall : batterie à **{pct} %**, chargeur débranché. '
                        f'Seuil(s) atteint(s) : {", ".join(map(str, crossed))} %. '
                        'Branche le PC dès que possible pour protéger la synchronisation Cloudinary.')
                event['discord_accepted'] = True
                event['discord_http_status'] = accepted_status
                sent.update(crossed)
        state = {'sent': sorted(sent), 'last_check': now.isoformat(), 'last_percent': pct, 'plugged': plugged}
        temp = STATE.with_suffix('.tmp')
        temp.write_text(json.dumps(state, indent=2), encoding='utf-8')
        temp.replace(STATE)
        event['result'] = 'ok'
        return 0
    except Exception as error:
        # Never include raw HTTP exception text: it may contain the webhook URL.
        event['result'] = 'failed'
        event['error_type'] = type(error).__name__
        event['http_status'] = getattr(error, 'http_status', None)
        reason = getattr(error, 'reason', error)
        event['category'] = 'SSL' if isinstance(reason, ssl.SSLError) else 'Discord/réseau ou script'
        if isinstance(reason, ssl.SSLCertVerificationError):
            event['certificate_code'] = reason.verify_code
        print('Contrôle batterie en échec : ' + type(error).__name__)
        return 1
    finally:
        journal(event)

if __name__ == '__main__':
    raise SystemExit(main())
