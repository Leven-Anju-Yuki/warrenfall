# Diagnostic du planning Actions et des rapports

## Complément : rapports indépendants, validation du 24 octobre à 23 h 01

Le commit `fedaa52df083e7bc65f889be1594079b4cda6b01` renforce trois fichiers seulement : `remote.py`, `report_fallback.py` et `test_reporting.py`.

Chaque étape produit désormais immédiatement son fichier détaillé sur le runner privé. Une exception métier Cloudinary laisse Trello continuer ; une panne Trello laisse le bilan Cloudinary disponible. Un échec de persistance interrompt les mutations sans libérer le verrou à l’aveugle. Le secours utilise l’instantané de cette exécution ou relit l’état privé et effectue uniquement des lectures Trello : aucun transfert, effacement Cloudinary ou changement Trello. Les rapports disponibles sont conservés. Si les données sont indisponibles, chaque rapport donne son diagnostic propre ; aucun succès ni activité ne sont inventés. Le type d’exception, le fichier et la ligne sont enregistrés sans exposer les secrets. Les anciens rapports ne sont pas présentés comme les traitements du jour.

La [validation GitHub 40130390562](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40130390562) a réussi : 40 tests de résilience, tests de sauvegarde permanente et suite Trello. La première tentative d’envoi a rencontré le verrou temporaire du relais Windows ; aucun message n’avait été tenté. Après libération normale du verrou, seul le job échoué a été relancé. Aucune donnée réinitialisée.

Les trois pièces jointes du test en lecture seule ont été relues via Discord :

| Rapport | Heure de Paris, 24 octobre | Taille |
| --- | --- | --- |
| Bilan | 23:01:37 | 1 136 119 octets |
| Cloudinary | 23:01:42 | 561 190 octets |
| Trello | 23:01:48 | 575 208 octets |

Les trois contiennent l’identifiant de cette exécution. L’analyse réelle des cartes Trello est présente ; il ne s’agit pas du message générique de 1 Ko. L’empreinte métier avant/après est identique : `4f5fdf079d4a4c9a74d62480240f684dfb563af64a407a40ad4f50c57b61d9b0`. Le test ne réalise aucune synchronisation Cloudinary ni suppression et ne valide donc pas une exécution de production planifiée.

## Preuve automatique retrouvée lors du contrôle final

Une lecture ultérieure a retrouvé le [run automatique 40130615438](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40130615438), événement `schedule`, sur le commit corrigé `fedaa52`. Créé le 24 octobre à 20:37:31 UTC, soit 22:37:31 à Paris. Le filtre a retenu le créneau d’été prévu à 18:07 UTC / 20:07 Paris. Le retard d’environ 2 h 30 précède donc la création du run, pas les traitements Cloudinary ou Trello. GitHub n’expose pas dans ces journaux la raison précise de cette distribution tardive. GitHub Status ne signalait pas d’incident public au contrôle.

Les trois rapports automatiques ont été envoyés normalement, puis relus via leurs messages et pièces jointes Discord :

| Rapport automatique | Heure de Paris, 24 octobre | Taille |
| --- | --- | --- |
| Bilan | 22:40:43 | 921 523 octets |
| Cloudinary | 22:40:47 | 555 000 octets |
| Trello | 22:40:52 | 569 295 octets |

Les trois fichiers portent le numéro de ce run automatique. Trello mentionne explicitement « Aucun deplacement justifie. ». Le dernier bilan contient une seule erreur : URL absente pour `assets/img/Ouverture_du_jeu/animations/Warrenfall_ouverture_8_secondes.gif`. Le run est rouge à cause de cette anomalie métier réelle ; aucun autre rapport n’est bloqué et le secours ne remplace pas les rapports normaux. Les trois reçus `daily:2026-10-24:schedule:*` sont confirmés, le verrou est libéré, l’état reste hybride et les 12 quarantaines sont conservées. Les 605 versions de sauvegarde vérifiées sont toujours présentes.

**Limite restante :** le déclenchement automatique et la livraison des trois rapports sont maintenant démontrés avec le code corrigé. La ponctualité autour de 20 h ne l’est pas : les crons sont configurés pour 20:07 Paris avec gestion été/hiver, mais GitHub a livré tardivement cet événement. Ne pas promettre une heure stricte ni une garantie quotidienne absolue à partir de ce seul constat. L’anomalie du GIF reste signalée, sans transfert ou réparation inventés.

## Constats distants

Le 23 octobre, les quatre exécutions manuelles ne prouvaient pas le fonctionnement du planning. Le fichier publié sur `main` contenait `0 20 * * *` et `timezone: Europe/Paris`. Le workflow était actif ; les deux variables d’activation et les deux indicateurs de `config.json` étaient vrais. Les douze noms de secrets de l’environnement étaient présents, sans lecture de leurs valeurs par l’API GitHub.

Une nouvelle lecture le 24 octobre a retrouvé une exécution automatique : [40022886630](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40022886630), événement `schedule`, créée le 23 octobre à 20:55:03 UTC, soit 22:55:03 à Paris. Les tests ont réussi, puis le traitement distant a échoué à 22:57. Les journaux ne permettent pas de déterminer pourquoi le déclenchement n’a pas eu lieu autour de 20 h ; une interprétation UTC et un retard de distribution ne peuvent pas être distingués avec ces seules données. Ne pas présenter une hypothèse comme une cause prouvée.

## Cause de l’interruption reproduite

Une entrée du manifeste est en erreur et ne possède pas d’URL. `remote.execute` évaluait `None not in source`, qui lève `TypeError: 'in <string>' requires string as left operand, not NoneType`. L’erreur a été reproduite hors réseau avec une copie de l’état privé. Le traitement était interrompu avant les rapports détaillés et avait laissé le verrou `actions:40022886630`. Les journaux de secours indiquent trois résultats `sent`, ce qui atteste les envois de secours, pas la production des bilans métier complets.

## Corrections publiées et vérifiées

- Une URL ou identité absente est signalée par chemin et isolée ; Trello et les rapports suivants continuent.
- Deux déclencheurs UTC explicites : 18:07 et 19:07. `schedule_gate.py` retient uniquement celui correspondant à 20:07 Europe/Paris pour la date concernée. Le déclencheur de l’autre saison n’exécute aucun traitement métier. La comparaison porte sur le cron d’origine et reste valide si le runner démarre en retard.
- Les pièces jointes portent la date de génération et l’URL du run pour éviter toute confusion avec des résultats historiques.
- Le statut Cloudinary ne fait plus apparaître à tort Trello en échec. La quarantaine du rapport Trello utilise le stockage privé Actions, pas un fichier local absent du runner.
- Les reçus de rattrapage et ceux de l’exécution automatique sont distincts : le rattrapage ne consomme pas l’envoi quotidien du soir. Les anciens reçus sont conservés.
- 36 tests simulés réussis, dont le manifeste sans URL, l’indépendance des rapports et les bascules été/hiver des 29 mars et 25 octobre 2026. Rejeu hors réseau de l’état réel réussi. Test Node des protections de sauvegarde réussi.

## Protections et suite

605 fichiers de sauvegarde permanente inventoriés et hachés en lecture seule ; toutes les 371 versions attestées ont été retrouvées. Relais Windows de transfert conservé et prêt. Aucun changement aux tâches Windows, aux SHA-256 ou aux règles de quarantaine.

Après refus initial de la revue automatique, l’utilisateur a explicitement autorisé la publication des cinq fichiers sur `main`, la reprise contrôlée et le rattrapage. La version finale est le commit `584f73f83674d3616a1eab8a2341896cc024b8cd`. Le verrou du run définitivement terminé a été libéré par comparaison de révision, après vérification de l’absence d’opérations Cloudinary et de créations ambiguës. Un audit de reprise a été ajouté au stockage privé. Les états métier n’ont pas été réinitialisés.

Le [rattrapage 40104740385](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40104740385) a envoyé les trois pièces jointes le 24 octobre à 16:59:15, 16:59:21 et 16:59:27, heure de Paris. Messages et fichiers relus directement via Discord : bilan 931 857 octets, Cloudinary 555 541 octets, Trello 579 534 octets, contenu identique aux rapports de cette exécution. Le statut du run reste en échec en raison du GIF d’ouverture sans URL ; les 71 cartes Trello ont été analysées, sans erreur Trello ni déplacement. Le libellé attribuant également cet échec à Trello a été corrigé ensuite. Aucun nouvel envoi n’a été fait pour cette correction.

La [simulation distante finale 40107472743](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40107472743) est réussie avec la version finale : tests, sélection horaire, lecture du stockage privé. Aucun envoi Discord ni mutation Cloudinary/Trello dans cette simulation.

L’exécution automatique du 23 prouve l’existence du déclencheur ; la réussite du nouveau créneau quotidien nécessite encore une exécution `schedule` avec la version corrigée. Prochain créneau attendu : 24 octobre 2026 vers 20:07 Europe/Paris, avec les délais éventuels de GitHub. Ne pas déduire cette validation d’un rattrapage manuel. Le passage à l’heure d’hiver du 25 octobre est couvert par les tests.
