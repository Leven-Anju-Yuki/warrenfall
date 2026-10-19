"""Diagnostics sans secrets et reprises bornées des lectures distantes."""
import os
import re
import time
import requests


def sanitize(message):
    message = str(message)
    for key, value in os.environ.items():
        if value and any(word in key.upper() for word in ('TOKEN', 'SECRET', 'WEBHOOK', 'API_KEY')):
            message = message.replace(value, '[MASQUÉ]')
    message = re.sub(r'https?://[^\s\)\]"\']+', '[URL MASQUÉE]', message)
    return re.sub(r'(?i)(token|secret|key|signature)=([^&\s]+)', r'\1=[MASQUÉ]', message)[:700]


def diagnostic(error):
    if isinstance(error, requests.exceptions.SSLError):
        return 'SSL/certificat : ' + sanitize(error)
    if isinstance(error, (requests.ConnectionError, requests.Timeout)):
        return 'Réseau : ' + type(error).__name__ + ' — ' + sanitize(error)
    return type(error).__name__ + ' : ' + sanitize(error)


def read_request(method, url, **kwargs):
    """GET/HEAD only: no replay of writes with an uncertain remote outcome."""
    attempts = 3 if method.upper() in ('GET', 'HEAD') else 1
    for attempt in range(attempts):
        try:
            response = requests.request(method, url, **kwargs)
            if response.status_code not in (429, 502, 503, 504) or attempt == attempts - 1:
                return response
            response.close()
        except requests.exceptions.SSLError:
            raise  # Repeating invalid certificates cannot repair their trust chain.
        except (requests.ConnectionError, requests.Timeout):
            if attempt == attempts - 1:
                raise
        time.sleep((1, 3)[attempt])
