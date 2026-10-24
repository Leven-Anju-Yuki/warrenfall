"""Deux déclencheurs UTC ; un seul est retenu selon Europe/Paris (été/hiver)."""
import datetime as dt
import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo


def allowed(event, cron='', now=None):
    if event == 'workflow_dispatch':
        return True
    if event != 'schedule':
        return False
    day = (now or dt.datetime.now(dt.timezone.utc)).astimezone(ZoneInfo('Europe/Paris')).date()
    target = dt.datetime.combine(day, dt.time(20, 7), ZoneInfo('Europe/Paris'))
    utc_hour = target.astimezone(dt.timezone.utc).hour
    # Compare le déclencheur, pas l'heure de démarrage : accepte un runner retardé.
    return cron == f'7 {utc_hour} * * *'


def main():
    event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text(encoding='utf-8'))
    run = allowed(os.environ['GITHUB_EVENT_NAME'], event.get('schedule', ''))
    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as out:
        out.write('run=' + str(run).lower() + '\n')
    print('Europe/Paris 20:07 : ' + ('créneau retenu' if run else 'autre saison, traitement ignoré'))


if __name__ == '__main__':
    main()
