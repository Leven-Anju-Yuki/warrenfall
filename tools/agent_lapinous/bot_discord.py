"""Bot interactif facultatif Warrenfall (slash commands).

Le bot n'exécute aucune synchronisation ni commande système depuis Discord.
Les bilans planifiés sont envoyés séparément par les webhooks de agent.py.
"""
import os
import asyncio
import datetime as dt
import sys
import argparse
import json
import io
from pathlib import Path

import discord
from discord import app_commands
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
load_dotenv(ROOT / '.env')
load_dotenv(HERE / '.env', override=False)
TOKEN = os.getenv('DISCORD_BOT_TOKEN', '').strip()
OWNER_ID = os.getenv('DISCORD_OWNER_ID', '').strip()
sys.path.insert(0, str(ROOT / 'tools/automation'))
from discord_image_selection import inspect, confirm, authorized, SelectionError
from state_store import GitHubStore, wait_for_state
from remote import references
from bot_reports import stored_report, attachment_parts

class LapinousBot(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        await self.tree.sync()

bot = LapinousBot()


def image_store():
    return GitHubStore(os.getenv('WARRENFALL_STATE_REPO'), os.getenv('WARRENFALL_STATE_TOKEN'))


def inspect_selection(target):
    state, _ = image_store().read()
    return inspect(state, target, references(ROOT), os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', ''))


def apply_selection(selection, request_id, user_id):
    from transports import Cloudinary
    if not authorized(user_id, OWNER_ID):
        raise SelectionError('Commande réservée au propriétaire configuré.')
    cloud = Cloudinary()
    locked = wait_for_state(image_store(), 'discord:' + str(request_id), timeout=0)
    try:
        result = confirm(locked, selection, references(ROOT), os.getenv('WARRENFALL_BACKUP_SIGNING_KEY', ''),
                         cloud, request_id, user_id, OWNER_ID)
    except SelectionError:
        locked.close()  # Refus de validation avant toute opération Cloudinary.
        raise
    # Une panne de stockage garde le verrou ; ne jamais le libérer aveuglément.
    locked.close()
    return result


class ImageConfirmation(discord.ui.View):
    def __init__(self, selection, user_id):
        super().__init__(timeout=180)
        self.selection, self.user_id = selection, user_id
        self.busy = False
        self.created = dt.datetime.now(dt.timezone.utc)

    async def interaction_check(self, interaction):
        if interaction.user.id != self.user_id or not authorized(interaction.user.id, OWNER_ID):
            await interaction.response.send_message('Cette sélection ne t’appartient pas.', ephemeral=True)
            return False
        return True

    @discord.ui.button(label='Confirmer cette sélection', style=discord.ButtonStyle.danger)
    async def approve(self, interaction, button):
        if self.busy:
            await interaction.response.send_message('Cette demande est déjà prise en compte.', ephemeral=True)
            return
        if (dt.datetime.now(dt.timezone.utc) - self.created).total_seconds() > 180:
            await interaction.response.send_message('Sélection expirée : relance /supprime.', ephemeral=True)
            return
        self.busy = True
        await interaction.response.defer(ephemeral=True, thinking=True)
        try:
            result = await asyncio.to_thread(apply_selection, self.selection, interaction.id, interaction.user.id)
            if result['status'] == 'deleted':
                text = 'Image supprimée de Cloudinary. La sauvegarde locale permanente est conservée.'
            elif result['status'] == 'quarantine':
                text = 'Sélection enregistrée. Quarantaine jusqu’au ' + str(result['due']) + ' ; suppression automatique à partir de cette échéance, sous les contrôles habituels. Aucun délai existant réinitialisé.'
            else:
                text = 'Suppression bloquée : ' + result['reason']
            await interaction.followup.send(text, ephemeral=True)
            for child in self.children:
                child.disabled = True
            await interaction.message.edit(view=self)
            self.stop()
        except SelectionError as error:
            await interaction.followup.send(str(error), ephemeral=True)
        except Exception:
            await interaction.followup.send('Opération non confirmée : stockage indisponible, traitement déjà en cours ou contrôle technique en échec. Aucun rejeu automatique de cette commande. Consulter le bilan.', ephemeral=True)

    @discord.ui.button(label='Annuler', style=discord.ButtonStyle.secondary)
    async def cancel(self, interaction, button):
        if self.busy:
            await interaction.response.send_message('Le traitement a déjà commencé ; aucune seconde opération lancée.', ephemeral=True)
            return
        await interaction.response.edit_message(content='Sélection annulée. Aucune image supprimée.', view=None)
        self.stop()


@bot.tree.command(name='supprime', description='Choisir une image Cloudinary, sans supprimer sa sauvegarde locale')
@app_commands.describe(image='Public_id complet, lien exact ou nom unique du rapport Cloudinary')
async def supprime(interaction: discord.Interaction, image: str):
    if not authorized(interaction.user.id, OWNER_ID):
        await interaction.response.send_message('Commande réservée au propriétaire configuré (DISCORD_OWNER_ID).', ephemeral=True)
        return
    await interaction.response.defer(ephemeral=True, thinking=True)
    try:
        selection = await asyncio.to_thread(inspect_selection, image)
        action = 'Suppression Cloudinary après confirmation.' if selection['kind'] == 'delete' else 'Quarantaine conservée ou créée ; suppression prévue à partir du ' + str(selection['due']) + '.'
        text = ('**Image sélectionnée**\n' + discord.utils.escape_markdown(selection['path']) + '\n`' + selection['id'] + '`\n\n' + action + '\nSauvegarde exacte attestée. La copie locale ne sera jamais effacée.\nCette sélection expire dans 3 minutes.')
        await interaction.followup.send(text, ephemeral=True, view=ImageConfirmation(selection, interaction.user.id), allowed_mentions=discord.AllowedMentions.none())
    except SelectionError as error:
        await interaction.followup.send(str(error), ephemeral=True)
    except Exception:
        await interaction.followup.send('État Cloudinary indisponible ou verrouillé : aucune suppression lancée.', ephemeral=True)

@bot.event
async def on_ready():
    print(f'Bot Warrenfall connecté : {bot.user}')

@bot.tree.command(name='statut', description='Vérifier que le bot Warrenfall est connecté')
async def statut(interaction: discord.Interaction):
    await interaction.response.send_message('🐰 Le bot Warrenfall est connecté.', ephemeral=True)

@bot.tree.command(name='bilan', description='Lire le dernier bilan enregistré')
async def bilan(interaction: discord.Interaction):
    await send_stored_report(interaction, 'bilan')

@bot.tree.command(name='images', description='Lire le dernier rapport des images')
async def images(interaction: discord.Interaction):
    await send_stored_report(interaction, 'images')


@bot.tree.command(name='trello', description='Lire le dernier rapport Trello enregistré')
async def trello(interaction: discord.Interaction):
    await send_stored_report(interaction, 'trello')


async def send_stored_report(interaction, channel):
    if not authorized(interaction.user.id, OWNER_ID):
        await interaction.response.send_message('Commande réservée au propriétaire configuré.', ephemeral=True)
        return
    await interaction.response.defer(ephemeral=True, thinking=True)
    try:
        def read():
            state, _ = image_store().read()
            return stored_report(state, channel, interaction.user.id, OWNER_ID)
        text = await asyncio.to_thread(read)
        parts = attachment_parts(text)
        for index, part in enumerate(parts, 1):
            name = channel + (f'-{index}' if len(parts) > 1 else '') + '.md'
            content = (f'📎 Dernier rapport distant enregistré — {channel}. '
                       'Sa date d’exécution est conservée dans le fichier ; aucun traitement relancé.'
                       f' Partie {index}/{len(parts)}.')
            await interaction.followup.send(content, file=discord.File(io.BytesIO(part), filename=name),
                                            ephemeral=True, allowed_mentions=discord.AllowedMentions.none())
    except LookupError as error:
        await interaction.followup.send(str(error), ephemeral=True)
    except Exception:
        await interaction.followup.send('Lecture du rapport distant indisponible. Aucun traitement ni renvoi des bilans quotidiens déclenché.', ephemeral=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Vérifier la configuration sans connexion Discord')
    args = parser.parse_args()
    required = ['DISCORD_BOT_TOKEN', 'DISCORD_OWNER_ID', 'WARRENFALL_STATE_REPO', 'WARRENFALL_STATE_TOKEN',
                'WARRENFALL_BACKUP_SIGNING_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    missing = [name for name in required if not os.getenv(name, '').strip()]
    if OWNER_ID and not OWNER_ID.isdigit():
        missing.append('DISCORD_OWNER_ID (identifiant numérique attendu)')
    if args.check:
        print(json.dumps({'ready': not missing, 'missing': missing, 'commands': [command.name for command in bot.tree.get_commands()],
                          'connected': False, 'cloudinary_actions': False}, ensure_ascii=False))
        raise SystemExit(int(bool(missing)))
    if missing:
        raise SystemExit('Bot non démarré. Configuration requise : ' + ', '.join(missing))
    bot.run(TOKEN)
