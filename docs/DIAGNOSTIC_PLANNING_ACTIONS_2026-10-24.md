# Diagnostic du planning Actions et des rapports

## Constats distants

Le 23 octobre, les quatre exécutions manuelles ne prouvaient pas le fonctionnement du planning. Le fichier publié sur `main` contenait `0 20 * * *` et `timezone: Europe/Paris`. Le workflow était actif ; les deux variables d’activation et les deux indicateurs de `config.json` étaient vrais. Les douze noms de secrets de l’environnement étaient présents, sans lecture de leurs valeurs par l’API GitHub.

Une nouvelle lecture le 24 octobre a retrouvé une exécution automatique : [40022886630](https://github.com/Leven-Anju-Yuki/warrenfall/actions/runs/40022886630), événement `schedule`, créée le 23 octobre à 20:55:03 UTC, soit 22:55:03 à Paris. Les tests ont réussi, puis le traitement distant a échoué à 22:57. Les journaux ne permettent pas de déterminer pourquoi le déclenchement n’a pas eu lieu autour de 20 h ; une interprétation UTC et un retard de distribution ne peuvent pas être distingués avec ces seules données. Ne pas présenter une hypothèse comme une cause prouvée.

## Cause de l’interruption reproduite

Une entrée du manifeste est en erreur et ne possède pas d’URL. `remote.execute` évaluait `None not in source`, qui lève `TypeError: 'in <string>' requires string as left operand, not NoneType`. L’erreur a été reproduite hors réseau avec une copie de l’état privé. Le traitement était interrompu avant les rapports détaillés et avait laissé le verrou `actions:40022886630`. Les journaux de secours indiquent trois résultats `sent`, ce qui atteste les envois de secours, pas la production des bilans métier complets.

## Correction préparée, pas encore publiée

- Une URL ou identité absente est signalée par chemin et isolée ; Trello et les rapports suivants continuent.
- Deux déclencheurs UTC explicites : 18:07 et 19:07. `schedule_gate.py` retient uniquement celui correspondant à 20:07 Europe/Paris pour la date concernée. Le déclencheur de l’autre saison n’exécute aucun traitement métier. La comparaison porte sur le cron d’origine et reste valide si le runner démarre en retard.
- Les pièces jointes portent la date de génération et l’URL du run pour éviter toute confusion avec des résultats historiques.
- 34 tests simulés réussis, dont le manifeste sans URL et les bascules été/hiver des 29 mars et 25 octobre 2026. Rejeu hors réseau de l’état réel réussi. Test Node des protections de sauvegarde réussi.

## Protections et suite

605 fichiers de sauvegarde permanente inventoriés et hachés en lecture seule ; toutes les 371 versions attestées ont été retrouvées. Relais Windows de transfert conservé et prêt. Aucun changement aux tâches Windows, aux SHA-256 ou aux règles de quarantaine.

La revue automatique a refusé la publication sur `main` en exigeant une autorisation explicite au regard de l’interdiction de push automatique. Une confirmation a été demandée pour les cinq fichiers de correction, la reprise contrôlée du verrou et le rattrapage. Aucun rattrapage corrigé n’a encore été lancé. Avant libération du verrou : vérifier que le run propriétaire est définitivement terminé, que les journaux d’opérations ne contiennent aucune mutation ambiguë et utiliser la comparaison de révision du stockage privé. Ne pas réinitialiser l’état.

Après publication : vérifier les trois reçus Discord et relire leurs messages et pièces jointes. L’exécution automatique du 23 prouve l’existence du déclencheur ; la réussite du nouveau créneau quotidien nécessite encore une exécution `schedule` avec la version corrigée. Ne pas la déduire d’un rattrapage manuel.
