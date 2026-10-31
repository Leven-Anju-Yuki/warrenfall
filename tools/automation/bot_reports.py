"""Read the stored report; never execute a business operation to serve a command."""
from discord_image_selection import authorized


def stored_report(state, channel, user_id, owner_id):
    if not authorized(user_id, owner_id):
        raise PermissionError('Commande réservée au propriétaire configuré.')
    if channel not in ('bilan', 'images', 'trello'):
        raise ValueError('Type de rapport inconnu.')
    text = state.get('last_reports', {}).get(channel)
    if not isinstance(text, str) or not text.strip():
        raise LookupError('Aucun rapport distant enregistré pour cette rubrique.')
    # Keep the original execution date/provenance and the complete attachment.
    return text


def attachment_parts(text, limit=8_000_000):
    """Stay under Discord's base attachment limit, without losing UTF-8 text."""
    if limit < 4:
        raise ValueError('Limite trop petite.')
    blob = text.encode('utf-8')
    parts = []
    while blob:
        end = min(limit, len(blob))
        while end < len(blob) and blob[end] & 0xc0 == 0x80:
            end -= 1
        parts.append(blob[:end])
        blob = blob[end:]
    return parts
