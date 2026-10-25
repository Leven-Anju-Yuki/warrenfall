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

## Liaison immédiate publiée, activation en attente de validation humaine

1. La tâche Windows existante transfère les images et vérifie les copies permanentes, sans nouvelle tâche.
2. Le relais publie l'état privé et les attestations puis libère son verrou.
3. Il écrit un petit `report-request.json` dans le dépôt privé d'état avec le jeton limité existant. Ce signal ne contient ni image, ni secret, ni inventaire. Il est publié aussi après une synchronisation en échec, pour obtenir son diagnostic.
4. Un workflow privé ne surveillant que ce fichier appelle le workflow public réutilisable. Les écritures ordinaires d'état et de notifications ne le redéclenchent pas.
5. Le workflow traite Cloudinary et Trello puis transmet les trois bilans détaillés. Le planning public **20:07 Europe/Paris** est conservé comme secours si le PC est éteint ou si la demande échoue. Aucun transfert local ni sauvegarde locale n'est inventé quand le PC est indisponible.

Le signal évite d'attendre le prochain cron ; il ne garantit pas un démarrage instantané du runner GitHub. Les tests et les traitements restent exécutés avant l'envoi. La durée de traitement normale et une éventuelle attente GitHub restent possibles.

### Déduplication et reprise

Le relais et le planning utilisent la même identité de cycle : jour Paris + empreinte du résultat de synchronisation Windows. Un cycle n'est terminé que si les trois envois et toutes leurs pages sont confirmés. Une erreur métier reste visible et le run peut être rouge ; elle ne provoque pas un deuxième bilan une fois ses trois rapports livrés. Le secours reconnaît également ces cycles.

Après une livraison partielle, les rapports préparés sont repris sans rejouer les opérations Cloudinary/Trello. Un envoi ambigu n'est jamais renvoyé à l'aveugle. Le verrou privé et les journaux d'opérations continuent de protéger les mutations. Un autre résultat de synchronisation ou un nouveau jour ouvre un nouveau cycle. Un rattrapage manuel explicite reste distinct de l'envoi automatique.

### Publication et simulation réalisées avec autorisation

- Les 24 fichiers autorisés ont été publiés sur `main` dans le [commit 90454ec](https://github.com/Leven-Anju-Yuki/warrenfall/commit/90454ecb43426d6033a53e5f0d15ed128ad88066). Les sauvegardes de joueurs et l'état batterie modifiés en arrière-plan sont exclus du commit.
- Le workflow privé `.github/workflows/warrenfall-relay.yml` a été publié dans le dépôt d'état. Les deux workflows publiés correspondent aux fichiers contrôlés avec actionlint.
- Les onze secrets ont été réutilisés depuis `.env` et chiffrés avec la clé publique GitHub Actions du dépôt privé : deux secrets d'état/attestation, trois Cloudinary, trois Trello et trois Discord. Aucune valeur ni jeton administrateur n'a été publié.
- Le dépôt privé contient `WARRENFALL_HYBRID_ENABLED=true` et **`WARRENFALL_HYBRID_APPLY_VALIDATED=false`**. Les indicateurs du planning public existant n'ont pas changé.
- La [simulation distante 40227382731](https://github.com/Leven-Anju-Yuki/warrenfall-automation-state/actions/runs/40227382731), lancée le 25 octobre à 20:43:32 Paris, est **réussie**. Les journaux confirment le checkout du commit public 90454ec, 75 tests d'automatisation, 46 tests Trello, le test Node des sauvegardes fictives et le calcul distant du bilan en mode `simulation`, avec application désactivée. Le secours d'envoi et le test Discord sont ignorés.
- L'état est strictement identique avant/après : même blob `5f3ae0b84a14b094c660bb525350aada6aa0870d`, même empreinte SHA-256, 375 versions, 371 attestations toutes valides, 12 quarantaines, 15 confirmations de notification et zéro opération Cloudinary. Aucun verrou abandonné, aucune date ni reprise réinitialisée.
- Le signal a également été testé avec le jeton limité du relais Windows et une demande marquée comme validation. Le [run push 40227674619](https://github.com/Leven-Anju-Yuki/warrenfall-automation-state/actions/runs/40227674619) est bien créé, puis **ignoré**, comme prévu tant que l'application n'est pas validée. L'état métier reste identique. Aucun transfert, mutation Trello ou envoi Discord de test n'a eu lieu.

### Validation humaine restante

Après validation humaine de ces résultats, activer le relais privé puis vérifier le prochain signal réel Windows, son exécution GitHub et ses trois confirmations Discord. Vérifier ensuite que le secours reconnaît ce cycle et n'expédie pas de doublon. Le test du push ignoré démontre le chemin du signal et le garde-fou ; il ne prétend pas démontrer une exécution réelle de production.

**État actuel :** heure Windows réparée ; corrections publiées, secrets chiffrés configurés et simulation GitHub réussie. Le nouveau déclencheur reste désactivé dans l'attente de la validation humaine. Le planning public de secours reste actif. Aucun nouveau rapport de test n'a été envoyé sur Discord.

## Protections conservées

La sauvegarde permanente `C:\Users\flori\Desktop\clikergame_avec_image` reste sous la responsabilité du relais Windows et n'est jamais purgée par ces changements. Aucune image ni sauvegarde de joueur n'a été supprimée. Les échéances de quarantaine de sept jours, preuves exactes SHA-256 et signatures d'attestation ne sont pas réinitialisées. Aucune ancienne tâche Windows n'a été supprimée ou activée.
