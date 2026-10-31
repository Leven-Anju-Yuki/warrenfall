# Choisir des images Cloudinary depuis Discord

État au 28 octobre 2026 : commande préparée et testée sur des données fictives, **pas activée**. Aucun jeton de bot ni propriétaire n'est actuellement configuré. Les rapports par webhook restent indépendants.

Les commandes `/bilan`, `/images` et `/trello` lisent les trois derniers rapports
dans le dépôt privé d'état, même si aucun dossier de rapports local n'existe sur
l'hébergement. Elles sont réservées au propriétaire et répondent en privé. La
date d'origine du rapport est conservée ; ces commandes ne relancent aucune
action. Les pièces jointes volumineuses sont découpées sans perte de texte.

## Utilisation prévue

`/supprime image:<public_id complet ou lien exact du rapport>`

Un nom de fichier est accepté seulement s'il identifie une seule version. Exemple : `bain_petales.png` peut désigner une ancienne image dans `magasin/produits` et une image active dans `magasin/apothicaire` ; utiliser alors le public_id ou le lien exact. Aucun joker ou « tout » n'est accepté.

La réponse privée affiche le chemin, l'identifiant, l'action et l'échéance. Le bouton de confirmation expire après trois minutes et seul le propriétaire configuré peut l'utiliser. Cette confirmation porte sur la sélection, pas sur les échéances futures : aucune nouvelle autorisation n'est demandée après les sept jours.

- Image encore référencée ou présente dans le manifeste actif : blocage.
- Sauvegarde exacte non attestée : blocage, même après confirmation.
- Nouvelle sélection inutilisée avec preuve valide : quarantaine de sept jours.
- Quarantaine déjà en cours : date d'origine conservée.
- Quarantaine arrivée à échéance : suppression de la seule version sélectionnée, avec les contrôles Cloudinary existants et journal durable avant DELETE.
- Stockage indisponible ou autre traitement actif : refus sécurisé, aucun vol de verrou.

La commande ne lit, n'efface et ne déplace aucun original dans `C:\Users\flori\Desktop\clikergame_avec_image`.

## Configuration nécessaire

1. Créer une application « Warrenfall » dans le [portail développeur Discord](https://discord.com/developers/applications). Les nouvelles applications disposent déjà d'un utilisateur bot ; ouvrir l'onglet **Bot**.
2. Enregistrer son jeton uniquement dans le `.env` de l'hébergement sous `DISCORD_BOT_TOKEN`. Ne jamais coller ce jeton dans une conversation, un rapport ou Git.
3. Dans Discord, activer le mode développeur, copier son propre identifiant utilisateur et l'enregistrer sous `DISCORD_OWNER_ID`.
4. Inviter l'application dans son serveur avec les portées `bot` et `applications.commands`. Cette fonction ne nécessite ni privilège administrateur, ni permission de gérer les messages, ni accès au contenu des messages.
5. Choisir un hébergement permanent. Le bot utilise une connexion Gateway : son programme doit être disponible pour recevoir les commandes. Le lancer sur le PC ne permet pas de l'utiliser PC éteint. Les workflows GitHub Actions quotidiens ne constituent pas cet hébergement.
6. Sur l'hébergement choisi, installer `python -m pip install -r tools/agent_lapinous/requirements-bot.txt`. Configurer dans son environnement privé le dépôt et jeton d'état, la clé d'attestation et les identifiants Cloudinary existants. Ne pas publier le `.env`.
7. Lancer `python -B tools/agent_lapinous/bot_discord.py`, puis vérifier `/statut` et un refus sur une image active avant toute suppression réelle. Aucun démarrage automatique Windows n'a été créé.

Sur ce PC, les dépendances sont préparées dans `.cloudinary-local/discord-bot-deps`. Le lanceur `powershell -NoProfile -File tools/run-discord-bot.ps1 -Verifier` vérifie la configuration sans connexion Discord ni action Cloudinary. Sans `-Verifier`, il démarre le service seulement si tous les identifiants requis sont renseignés. La fenêtre doit rester active pour cette variante locale ; elle sert aux essais, pas à l'objectif PC éteint.

Si PowerShell interdit les scripts, ne pas modifier la politique d'exécution.
La vérification peut être lancée directement dans le terminal PowerShell :

```powershell
$env:PYTHONPATH = '.cloudinary-local/discord-bot-deps'
python -B tools/agent_lapinous/bot_discord.py --check
```

Tests sans connexion : `python -B -m unittest discover -s tools/automation -p test_bot_reports.py`.

Ne pas activer la commande avant configuration du propriétaire et validation du lieu d'hébergement. Le bot ne peut pas sécuriser de nouvelles sauvegardes locales lorsque le PC est éteint : les suppressions restent limitées aux versions déjà attestées par le relais Windows.
