# Warrenfall : préparation du relais Windows / GitHub Actions

## Production et sauvegarde permanente — 23 octobre 2026

Activation autorisée après deux validations réelles Actions (`39951783972`, `39952015467`), puis validation distante des protections de sauvegarde (`39956985759`). Les paragraphes historiques ci-dessous ne décrivent plus l’état d’activation courant.

La sauvegarde permanente reste **`C:\Users\flori\Desktop\clikergame_avec_image`**. Le relais Windows conservé appelle `update-images.mjs --backup-local` ; les deux scripts utilisent explicitement le même dossier. Un original n’est retiré du dossier du jeu qu’après transfert confirmé et copie locale identique vérifiée par SHA-256. Les anciennes versions sont archivées sous `.versions`, avec contrôle de leur copie avant remplacement. Aucune purge de ce dossier n’est prévue.

Contrôle physique avant/après préparation de l’activation : **481 images, aucune absente ni modifiée**. Les suppressions à sept jours concernent uniquement Cloudinary et nécessitent toujours la preuve de sauvegarde exacte. Quatre versions restent bloquées, dont `chef.svg`.

La tâche Windows de 20 h et son rattrapage sont conservés. Windows effectue transferts et sauvegardes ; Actions traite la corbeille distante et les bilans. Le verrou partagé empêche les traitements concurrents, avec attente bornée sans vol de verrou. L’état privé est passé de `ownership=windows` à `ownership=hybrid`, sans réinitialisation des 12 quarantaines ni du point de reprise Trello.

Les nouveaux fichiers uniquement présents sur le PC attendent son prochain relais local. Les bilans et traitements distants sont planifiés à 20 h `Europe/Paris` sur GitHub.

**Mise à jour :** secrets et état privé configurés, deux validations réelles GitHub réussies ; activation de production encore désactivée. Voir [les preuves de validation](VALIDATION_ACTIONS_2026-10-23.md). Les paragraphes ci-dessous décrivent aussi les étapes historiques de préparation.

Diagnostic réel et corrections des rapports au 23 octobre : [rapport de vérification](DIAGNOSTIC_RAPPORTS_2026-10-23.md). Le workflow est publié mais n’a jamais tourné ; activation, secrets et état privé sont encore absents. Le test Discord local des trois pièces jointes a réussi. Le mode manuel `test-discord` permet de valider séparément les notifications sur Actions avant application des traitements.

État au 21 octobre 2026 : code préparé, simulations locales réalisées, **migration non activée et non publiée**. Aucune tâche Windows supprimée, désactivée ou reprogrammée. Aucune opération Cloudinary, Trello ou Discord réelle pendant les essais.

## Architecture actuelle constatée

`chaine_20h.ps1` / `chaine_commune.ps1` exécutent `update-images.mjs --backup-local`, puis l'agent Python, même si les images échouent. Les étapes Node réutilisent `cloudinary-sync.mjs`, `cloudinary-activate.mjs`, `backup-transferred-images.mjs` et `cloudinary-corbeille.mjs`. Le bilan utilise `agent.py`, `suivi_trello.py` et `cloudinary_rapport.py`.

L'état est dans `.cloudinary-local/` : manifeste privé, inventaire, versions connues, quarantaines, transitions Trello et point de reprise. Le verrou Windows protège uniquement les processus qui utilisent le lanceur Windows ; il ne protège pas un runner distant. Le contrôle des sauvegardes ouvre directement le disque Windows. Le bilan écrit actuellement dans un dossier voisin du projet. Ces dépendances interdisent une simple copie du lanceur vers Linux.

Lecture des tâches Windows : Images Cloudinary 20h et Surveillance batterie actives, bilan séparé 21h désactivé. `StartWhenAvailable` est toujours vrai pour la tâche images. La batterie reste locale ; elle n'est pas surveillable par GitHub quand le PC est inaccessible.

## Répartition préparée

| Windows, quand disponible | GitHub, indépendant du portable |
|---|---|
| Détection et transfert des fichiers, manifestes | Vérification des ressources distantes et des références du dépôt |
| Sauvegarde permanente avec arborescence et versions | Quarantaine logique sept jours, restauration, suppression conditionnelle |
| Hash exact des sauvegardes et attestations signées | Vérification des attestations, journal de suppression et reprise |
| Surveillance batterie existante | Analyse Git/Trello avec l'agent existant, bilan Discord complet |

La tâche Windows reste à son horaire actuel, avec rattrapage. Après activation validée, son lanceur appelle le relais local au lieu de faire aussi le bilan distant. Elle n'est pas supprimée. Les nouveaux transferts ne peuvent avoir lieu quand le PC est éteint : GitHub connaît uniquement les métadonnées déjà transmises.

## Fichiers

- `.github/workflows/warrenfall-daily.yml` : tests hors réseau, lancement manuel et horaire 20h Europe/Paris ; chaîne réelle désactivée par défaut.
- `tools/automation/config.json` : deux gardes désactivées (`enabled`, `remote_apply_validated`).
- `state_store.py` : état dans un **dépôt GitHub privé distinct**, écriture comparant le SHA courant et verrou partagé.
- `local_bridge.py` : export signé sans image ni chemin de sauvegarde absolu ; relais local utilisant les scripts Node actuels sous verrou partagé.
- `core.py` : calcul des échéances, vérification des preuves et journal durable avant suppression.
- `transports.py` : Cloudinary/Discord, TLS normal, reprises limitées des lectures uniquement.
- `remote.py` : orchestrateur Linux, règles Trello existantes, rapports complets et chemins temporaires portables.
- `state_admin.py` : initialisation et relais explicites, jamais invoqués par le cron.
- `test_hybrid.py` : simulations isolées avec faux services.

Les trois points d'entrée historiques adaptés sont `chaine_commune.ps1`, `update-images.mjs` et `cloudinary-corbeille.mjs`. Tant que `enabled=false`, leur fonctionnement de production est conservé. Après activation, la corbeille locale refuse les suppressions et les transferts passent par le verrou partagé.

## État privé et sauvegardes

Les artifacts et caches Actions expirent et ne constituent pas une base durable. Le dépôt privé contient un unique JSON versionné avec manifeste, inventaire, historique, quarantaines inchangées, attestations, journal de suppressions, transitions Trello, point de reprise et confirmations Discord. Les anciens commits permettent d'auditer les changements. Il faut surveiller sa croissance et ses droits ; aucune purge automatique n'est prévue.

Un jeton finement limité donne accès en lecture/écriture au contenu de ce seul dépôt privé. Le `GITHUB_TOKEN` du jeu n'a que `contents: read`. Aucun push automatique n'est effectué vers le dépôt du jeu. Les métadonnées privées, rapports complets et textes du point de reprise ne sont pas exposés en artifact public.

Windows relit les fichiers sauvegardés et calcule leur SHA-256. Une preuve HMAC-SHA256 lie chemin relatif, public_id, URL et hash. La clé reste dans le `.env` racine sur Windows et dans un secret Actions. Une preuve modifiée ou absente bloque toute suppression. Un ancien chemin absolu de point de reprise est neutralisé dans l'export, sans supprimer ses hashes ni ses textes.

Cette preuve confirme une lecture exacte à la date d'attestation. Elle ne peut pas prouver que quelqu'un n'a pas ensuite effacé manuellement le disque de sauvegarde : aucun programme distant ne peut vérifier physiquement un PC éteint. Les scripts ne purgent jamais ces sauvegardes. Avant suppression, le runner relit aussi l'identité Cloudinary et compare le contenu distant au hash attesté. Une différence bloque la suppression.

Les références locales encore non publiées sont protégées par l'inventaire exporté, en plus de celles du dépôt GitHub. Si l'inventaire est incomplet ou la dernière synchronisation en échec, la corbeille est suspendue. Un inventaire ancien peut conserver trop d'images, mais ne doit pas provoquer une suppression injustifiée.

Audit local sans réseau effectué : **330 versions exactes retrouvées, chef.svg non confirmé**, quatre quarantaines conservées et aucune suppression proposée. Les dates d'entrée n'ont pas changé. Leurs échéances restent le **26 octobre 2026 à 21:32:59 heure de Paris** (20:32:59 UTC). La suppression quotidienne ne pourra intervenir qu'à la première passe réussie après l'échéance, pas avant. Le paquet privé fait environ 2,3 Mo, sans les images.

## Concurrence, pannes et doublons

Le groupe `concurrency` Actions empêche les deux runners de cette chaîne de se chevaucher ; le verrou dans le dépôt privé protège également Windows. Une écriture avec SHA périmé échoue au lieu de remplacer un état plus récent.

Une suppression écrit une intention durable avant l'appel. Après une coupure, une ressource absente avec intention correspondante est conciliée sans second DELETE. Sans intention, une absence est signalée. Aucun renommage d'URL ou public_id pendant la quarantaine. Les tombstones évitent de réintroduire une suppression confirmée depuis l'historique local.

Un verrou abandonné **n'est pas volé automatiquement par un délai** : il faut vérifier que le runner ou le processus Windows est réellement arrêté, examiner les intentions puis lever explicitement le verrou privé. Ce choix évite qu'un ancien processus continue après une reprise concurrente ; une panne peut donc demander une intervention.

Discord enregistre l'intention puis l'identifiant du message confirmé. Une notification confirmée n'est pas répétée pour la même journée de Paris. En cas de réponse perdue, l'envoi est marqué incertain et n'est pas répété aveuglément : vérifier Discord avant de le réarmer. Une garantie absolue « exactement une fois » n'est pas possible entre deux API sans transaction commune. Le rapport actualisé reste dans l'état privé même si la notification ne part pas.

Le bilan distingue transfert local, corbeille, ressources, Trello et Discord. Trello est tenté même après erreur de corbeille. Une panne du stockage privé bloque les mutations : on ne poursuit pas sans pouvoir journaliser. Une panne avant accès à l'état ou secrets absents peut empêcher aussi Discord ; GitHub fournit alors le statut d'échec du job.

## Trello

`agent.py` et `suivi_trello.py` restent la source des règles de preuve : fichier partagé seul insuffisant, mouvements seulement vers En cours / À valider en jeu, commentaires dédupliqués, listes Bloqué / Idées / Réalisé protégées. Le point de reprise et le journal des transitions sont persistés dans l'état privé.

Une nouvelle carte exige une tâche explicite dans `new_tasks` : clé stable, nom, liste de priorité et règles `chemins` / `preuves` compatibles avec les liaisons existantes. Le marqueur `[warrenfall-task:cle]` empêche de recréer une carte après reprise. Une création incertaine est bloquée tant que son résultat n'est pas retrouvé. Le système n'invente pas de tâches à partir de `script.js`. Les suggestions ambiguës restent à examiner ; il n'est pas configuré pour créer indistinctement une carte par modification.

Les README/A_FAIRE du runner sont lus et analysés ; leur suivi apparaît dans le bilan. Ils ne sont pas automatiquement poussés dans le dépôt du jeu. Une nouvelle liaison de carte créée doit ensuite être intégrée aux liaisons versionnées pour bénéficier du suivi des mouvements.

## Mise en service à valider, non effectuée

1. Relire les simulations, publier les fichiers de code avec accord humain, laisser toutes les gardes désactivées. Le workflow publié ne fait alors que les tests hors réseau.
2. Créer un dépôt privé d'état initialisé avec une branche `main`, puis un jeton finement limité à son contenu. Créer l'environnement Actions `warrenfall-automation`. Aucune sauvegarde d'image n'y est envoyée.
3. Ajouter au `.env` unique à la racine les quatre noms de `tools/automation/.env.example`. Utiliser une clé aléatoire forte d'au moins 32 caractères ; ne jamais la coller dans les rapports ou les commits.
4. Exécuter `python -B tools/automation/local_bridge.py export --backup-dir "C:\Users\flori\Desktop\clikergame_avec_image"`. Examiner `.cloudinary-local/hybrid-export.json` et comparer toutes les dates de quarantaine.
5. Après validation : `python -B tools/automation/state_admin.py initialize --from-export .cloudinary-local/hybrid-export.json --simulations-approved`. Cette commande crée le fichier privé sans écraser un état existant. Elle ne transfère pas la responsabilité.
6. Configurer la variable d'environnement Actions `WARRENFALL_STATE_REPO` et les secrets `WARRENFALL_STATE_TOKEN`, `WARRENFALL_BACKUP_SIGNING_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `TRELLO_BOARD_ID`, `TRELLO_API_KEY`, `TRELLO_TOKEN`, `DISCORD_WEBHOOK_BILAN`. Ne pas créer de `.env` sur GitHub. Les autres webhooks locaux restent intacts.
7. Avant le relais, attendre la fin des traitements Windows et arrêter les anciens processus `--watch` ; comparer à nouveau état local/privé. Activer `enabled` dans la configuration installée sur Windows et publiée sur GitHub. Ne pas activer encore l'application distante. La tâche Windows utilisera alors le relais ; celui-ci refuse de travailler avant la confirmation de responsabilité, ce qui crée une courte interruption sûre plutôt qu'un double traitement.
8. Avec accord humain, exécuter `state_admin.py handoff --simulations-approved`. Mettre `WARRENFALL_HYBRID_ENABLED=true`. Lancer manuellement la simulation Actions et comparer son résultat à Windows. Le mode simulation ne fait aucun appel Cloudinary, Trello ou Discord.
9. Après validation de cette exécution réelle du workflow : activer `remote_apply_validated` et `WARRENFALL_HYBRID_APPLY_VALIDATED=true`, puis valider une passe réelle supervisée. Aucune tâche Windows ne doit être désactivée sans accord supplémentaire.

Les permissions du jeton, les secrets, l'accès au dépôt privé et le fonctionnement effectif d'Actions ne peuvent pas être validés sans cette mise en service. Les essais de transport actuels sont des doublures, pas des opérations de production réussies.

## Horaires et limites GitHub

Le workflow utilise `cron: '0 20 * * *'` avec `timezone: Europe/Paris`, désormais pris en charge par GitHub : 18h UTC en été et 19h UTC en hiver. Les transitions de mars et octobre sont testées. Lancement manuel disponible.

Un horaire Actions peut être retardé, voire perdu en période de charge ; ce n'est pas une garantie à la minute. Les workflows planifiés doivent être sur la branche par défaut et sont désactivés après 60 jours d'inactivité d'un dépôt public. La chaîne nécessite aussi Internet et la disponibilité de GitHub, Cloudinary, Trello et Discord. Prévoir un contrôle externe d'absence de bilan si une alerte sur panne totale de GitHub devient indispensable. Aucun quota payant n'a été activé pendant cette préparation.

Références officielles : [planification et fuseaux](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [concurrence](https://docs.github.com/en/actions/concepts/workflows-and-actions/concurrency), [rétention et limites](https://docs.github.com/en/actions/reference/limits).

## Vérifications reproductibles

```text
python -B -m unittest discover -s tools/automation -p "test_*.py" -v
cd tools/agent_lapinous
python -B -m unittest test_suivi_trello test_chaine_agent test_fiabilisation
```

Depuis la racine : `node tools/test-cloudinary-corbeille-api.mjs`, `node tools/test-cloudinary-partial.mjs`, `node tools/test-cloudinary-deletion-policy.mjs` et `tools/agent_lapinous/test_chaine.ps1`.

Sur ce poste, l'exécution directe des deux fichiers de tests PowerShell est bloquée par la politique d'exécution actuelle. Cette politique n'a pas été modifiée. L'analyse syntaxique du lanceur PowerShell a réussi ; les scénarios Python/Node ont été exécutés. Les tests PowerShell complets restent à exécuter dans une session autorisée avant activation.

Aucun de ces tests n'effectue de transfert, de suppression distante, de déplacement Trello ni d'envoi Discord réel. La batterie et les paramètres de veille sont hors migration.

## Correction de validation Trello — 22 octobre 2026

Incident : la carte Équipes favorites (6ac39e147db15f1edab9c326) était référencée
par deux cases principales cochées dans A_FAIRE.md (lignes 171 et 372 avant correction).
La carte Trello elle-même n'a aucune checklist. La validation porte sur le Markdown local,
pas sur des cases Trello. Le récapitulatif humain répétait aussi 29 autres parents cochés.

Les 30 mentions du récapitulatif deviennent des renvois textuels « Validation humaine cochée ».
Les cases principales canoniques, leurs états et toutes les sous-tâches restent intactes.
Aucune mutation Trello, aucun commentaire ni historique modifié.

partition_tasks valide chaque liaison séparément et exclut toutes les occurrences des identifiants
de liaison dupliqués. L'erreur précise carte, URL, fichier et numéros de lignes pour les doublons.
Une carte invalide n'est ni déplacée ni reprise depuis le journal des transitions.
Les cartes valides continuent à être analysées et peuvent suivre leurs règles existantes.
Le bilan complet et ses notifications sont produits avec statut dégradé ; le point de reprise
global n'avance pas en présence d'anomalies, pour conserver les preuves des cartes exclues.
Les protections des listes Réalisé / Idées / Bloqué restent inchangées.

Le relais remote.trello appelle ce même agent ; les diagnostics sont inclus dans le rapport
hybride complet envoyé par le transport Discord existant. Tests hors réseau :
test_validation_resilience et tools/automation/test_trello_resilience.py.
Le workflow ajoute la nouvelle suite au contrôle avant lancement quotidien.
Aucune activation, publication, reprogrammation ou modification de garde de migration.

Les tests sont exécutés sur une copie temporaire sans secrets, avec faux services.
Aucun réglage Windows, fichier de quarantaine ou sauvegarde permanente n'est modifié.
