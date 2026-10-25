# Horaires du bilan et déclenchement après Cloudinary

Diagnostic du 25 octobre 2026. Les heures ci-dessous sont celles de Paris.

## Ce qui s'est réellement passé le 24 octobre

| Événement | Heure Paris (UTC+2 ce jour-là) | Horodatage source UTC |
| --- | --- | --- |
| Dernier lancement de la tâche Windows Images | 22:33:22 | Dernière exécution du Planificateur |
| Fin de la synchronisation publiée par Windows | 22:35:18,683 | `2026-10-24T20:35:18.683Z` |
| Création de l'exécution automatique GitHub | 22:37:31 | `2026-10-24T20:37:31Z` |
| Démarrage de la commande distante | 22:38:32,749 | `2026-10-24T20:38:32.7499057Z` |
| Rapport Bilan confirmé sur Discord | 22:40:43,374 | `2026-10-24T20:40:43.374Z` |
| Rapport Cloudinary confirmé | 22:40:47,926 | `2026-10-24T20:40:47.926Z` |
| Rapport Trello confirmé | 22:40:52,835 | `2026-10-24T20:40:52.835Z` |

Preuve distante : [exécution automatique 40130615438](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40130615438), ses journaux et les confirmations Discord persistées. Les fichiers joints font respectivement 921 523, 555 000 et 569 295 octets.

Il n'y a pas deux heures d'attente après la synchronisation : le premier rapport arrive **5 min 25 s** après sa fin, le dernier **5 min 34 s** après. Comparer `20:35Z` à `22:38` local crée artificiellement deux heures de différence. Le 25 octobre, Paris passe à UTC+1 ; les horaires sont convertis avec `Europe/Paris` plutôt qu'un décalage fixe.

Le retard du planning GitHub est réel et distinct : le créneau sélectionné était 20:07 Paris, mais GitHub n'a créé le run qu'à 22:37:31, soit 2 h 30 min 31 s plus tard. Les journaux ne permettent pas d'attribuer ce retard à une file interne particulière. Le déclencheur était actif, et non absent. Le second cron, réservé à l'autre saison, a été ignoré correctement (run 40134415342). Le défaut d'image GIF signalé par le run n'a pas empêché les trois rapports.

Windows indique un démarrage local à 22:33:22, pas à 20 h. `StartWhenAvailable` est actif, ce qui permet le rattrapage. L'historique opérationnel du Planificateur étant désactivé, la cause exacte de ce lancement tardif (rattrapage ou lancement manuel) n'est pas démontrée. Aucun paramètre de journalisation, veille ou réveil n'a été changé.

## Correction locale effectivement appliquée

Le déclencheur enregistré était `2026-10-08T19:00:00+01:00`. Après le changement d'heure, Windows annonçait le prochain transfert le 25 octobre à **19:00**. La seule propriété corrigée est `StartBoundary`, désormais `2026-10-25T20:00:00`, sans offset fixe, soit **20 h locale**. Le prochain passage calculé par Windows est bien le 25 octobre à 20:00.

La comparaison des XML avant/après confirme que **seul StartBoundary a changé**. Même tâche, action, compte, réglages batterie et sécurité, rattrapage et sauvegardes. L'ancienne définition XML est conservée en privé sous `.cloudinary-local/task-images-before-local-time-20261025-181657.xml`. Le script `tools/automation/repair-local-time.ps1` est en simulation par défaut ; ne pas réinstaller la tâche avec un autre script.

## Liaison immédiate préparée, pas encore publiée

1. La tâche Windows existante transfère les images et vérifie les copies permanentes, sans nouvelle tâche.
2. Le relais publie l'état privé et les attestations puis libère son verrou.
3. Il écrit un petit `report-request.json` dans le dépôt privé d'état avec le jeton limité existant. Ce signal ne contient ni image, ni secret, ni inventaire. Il est publié aussi après une synchronisation en échec, pour obtenir son diagnostic.
4. Un workflow privé ne surveillant que ce fichier appelle le workflow public réutilisable. Les écritures ordinaires d'état et de notifications ne le redéclenchent pas.
5. Le workflow traite Cloudinary et Trello puis transmet les trois bilans détaillés. Le planning public **20:07 Europe/Paris** est conservé comme secours si le PC est éteint ou si la demande échoue. Aucun transfert local ni sauvegarde locale n'est inventé quand le PC est indisponible.

Le signal évite d'attendre le prochain cron ; il ne garantit pas un démarrage instantané du runner GitHub. Les tests et les traitements restent exécutés avant l'envoi. La durée de traitement normale et une éventuelle attente GitHub restent possibles.

### Déduplication et reprise

Le relais et le planning utilisent la même identité de cycle : jour Paris + empreinte du résultat de synchronisation Windows. Un cycle n'est terminé que si les trois envois et toutes leurs pages sont confirmés. Une erreur métier reste visible et le run peut être rouge ; elle ne provoque pas un deuxième bilan une fois ses trois rapports livrés. Le secours reconnaît également ces cycles.

Après une livraison partielle, les rapports préparés sont repris sans rejouer les opérations Cloudinary/Trello. Un envoi ambigu n'est jamais renvoyé à l'aveugle. Le verrou privé et les journaux d'opérations continuent de protéger les mutations. Un autre résultat de synchronisation ou un nouveau jour ouvre un nouveau cycle. Un rattrapage manuel explicite reste distinct de l'envoi automatique.

### Publication requise et validation restante

- Publier les corrections de `warrenfall-daily.yml`, `local_bridge.py`, `remote.py`, `schedule_gate.py`, `report_fallback.py`, les modules de signal/cycle et leurs tests sur `main`. Inclure les modules de présentation déjà préparés dont `reporting.py` dépend, sans les sauvegardes de joueurs ni l'état batterie modifiés en arrière-plan.
- Dans **le dépôt privé d'état**, publier le modèle `tools/automation/templates/state-relay.yml` sous `.github/workflows/warrenfall-relay.yml`.
- Y configurer les mêmes onze secrets chiffrés utilisés par la chaîne publique : deux secrets d'état/attestation, trois Cloudinary, trois Trello et trois Discord. Les réutiliser depuis `.env` sans afficher leur valeur. Configurer `WARRENFALL_STATE_REPO` et les deux indicateurs d'activation. Aucun jeton administrateur ne doit être copié dans l'automatisation.
- D'abord régler `WARRENFALL_HYBRID_ENABLED=true` et `WARRENFALL_HYBRID_APPLY_VALIDATED=false` dans le dépôt privé, puis lancer son déclenchement manuel de simulation ; il n'envoie pas Discord. Les signaux Windows sont ignorés tant que l'application n'est pas validée. Vérifier les checkouts du dépôt du jeu, les secrets, le verrou et l'état persistant, sans suppression ni mutation Trello.
- Après validation humaine de la simulation, activer le relais privé et vérifier le prochain signal Windows, son exécution GitHub et ses trois confirmations Discord. Vérifier ensuite que le secours reconnaît ce cycle et n'expédie pas de doublon.

**État actuel :** heure Windows réparée ; liaison et déduplication testées localement, pas encore déployées. Aucun nouveau rapport de test n'a été envoyé. La preuve de fonctionnement du signal distant attend sa publication et sa validation, elle ne peut pas être remplacée par des tests locaux.

## Protections conservées

La sauvegarde permanente `C:\Users\flori\Desktop\clikergame_avec_image` reste sous la responsabilité du relais Windows et n'est jamais purgée par ces changements. Aucune image ni sauvegarde de joueur n'a été supprimée. Les échéances de quarantaine de sept jours, preuves exactes SHA-256 et signatures d'attestation ne sont pas réinitialisées. Aucune ancienne tâche Windows n'a été supprimée ou activée.
