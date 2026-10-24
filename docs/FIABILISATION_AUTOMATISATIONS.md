# Diagnostic des automatisations — 17 octobre 2026

## Causes établies

- Journal `.cloudinary-local/logs/2026-10-17_202717_894_chaine.log` : première erreur « Script execution timed out after 1000ms ». L’inventaire de `cloudinary-sync.mjs` exécutait les définitions des décors dans une VM limitée à une seconde. La première étape dry-run s’est arrêtée ; aucune étape d’activation ou de corbeille n’a été exécutée dans cette chaîne. Ce n’était pas une panne réseau Cloudinary.
- Le bilan a ensuite échoué lors de la lecture Trello avec `requests.SSLError`. Le gestionnaire masquait entièrement le détail ; le certificat concerné et la cause précise (autorité, date, interception réseau, etc.) ne sont pas récupérables dans ce journal historique. Aucune désactivation de TLS n’est envisagée. Un contrôle TLS réel distinct reste nécessaire si l’erreur revient.
- Le compteur du message Trello utilisait toutes les erreurs de chaîne : une erreur SSL Trello et deux descriptions du même échec Cloudinary apparaissaient comme trois erreurs. Les catégories sont désormais distinguées.
- Batterie : tâche réellement répétée toutes les 15 minutes, mais `DisallowStartIfOnBatteries=True` et `StopIfGoingOnBatteries=True`. Ces conditions contredisent l’usage attendu. Le script lisait déjà la batterie avant toute considération de `next_check`, mais ne conditionnait pas l’envoi à l’absence de secteur. Dernier état observé : 100 %, secteur branché ; aucune alerte attendue pour ce contrôle.
- L’installateur batterie proposait encore une répétition de 30 minutes et un enregistrement de tâche. Il est remplacé par une correction limitée des conditions de la tâche existante, avec simulation par défaut, sans création et sans modification du déclencheur de 15 minutes.

## Windows et horaires constatés — lecture seule

- Une tâche Cloudinary quotidienne à 20 h Europe/Paris, `StartWhenAvailable=False`, réveil demandé, exécution sur batterie autorisée. Aucun rattrapage le lendemain ; ce réglage est désormais également conservé par l’installateur du projet.
- Ancien bilan indépendant de 21 h désactivé.
- Dernier lancement Cloudinary signalé par Windows : 20:15:06, retour 1. La chaîne journalisée commence à 20:27:32 ; le bilan a produit son rapport vers 20:44. Il ne faut pas attribuer ces écarts à une cause unique sans trace d’exécution complète.
- Historique opérationnel TaskScheduler désactivé. Aucune activation ni autre modification Windows effectuée pendant ce diagnostic.
- `powercfg /a` : veille moderne S0 connectée au réseau ; hibernation disponible ; S3 indisponible. Les événements Kernel-Power 506/507 montrent plusieurs transitions, notamment autour de 19:44, 20:15 et 20:44. Ils ne prouvent pas à eux seuls le motif exact de chaque retard.
- Minuteurs de réveil autorisés sur secteur et désactivés sur batterie. `WakeToRun=True` ne suffit donc pas à garantir une exécution sur batterie en veille. `powercfg /waketimers` a demandé des droits administrateur ; ce contrôle n’a pas abouti.

## Corrections locales

- `tools/cloudinary-sync.mjs` : VM d’inventaire limitée à 10 secondes au lieu de 1 ; vérification DNS avant API ; erreurs réseau/TLS identifiables ; certificats toujours vérifiés.
- `tools/remote-network.mjs` : lectures GET/HEAD bornées à trois tentatives, attentes 1 puis 3 secondes, timeout réseau de 30 secondes par lecture ; reprise DNS et HTTP temporaires 429/502/503/504. Les écritures ne sont pas rejouées par ce mécanisme ; les protections et reprises de transfert déjà existantes sont conservées. Une erreur de certificat interrompt la lecture sans contournement.
- `tools/update-images.mjs` : capture bornée et nettoyée du diagnostic enfant dans le rapport, au lieu du seul code 1. L’arrêt avant activation/corbeille en cas d’échec reste obligatoire. Sauvegarde permanente et quarantaine de sept jours inchangées ; suppression distante désactivée dans la chaîne quotidienne comme avant.
- `tools/agent_lapinous/reseau.py` et `agent.py` : reprises des lectures Trello uniquement, diagnostics SSL utiles et expurgés des secrets, catégories Trello/Cloudinary/Discord distinctes, compteur Trello limité à ses erreurs. Une notification défaillante n’interrompt pas les autres.
- `surveillance_batterie.py` : lecture à chaque passage, aucun blocage `next_check`, alertes seulement hors secteur, seuils 30/25/20/15 uniques, réinitialisation uniquement en recharge à 50 % ou plus ; état enregistré après confirmation HTTP 200/204. Journal JSONL dans `.cloudinary-local/logs/batterie.jsonl` : heure, pourcentage, secteur, seuils dus, acceptation Discord et erreurs sans webhook.
- `installer_batterie.ps1` : simulation puis, avec `-Appliquer`, modification des deux conditions batterie de la tâche existante uniquement ; sauvegarde XML préalable, aucun changement des horaires ni des paramètres d’alimentation/réveil.
- `installer_taches.ps1` : ne réactive plus le rattrapage d’une synchronisation manquée.

## Tests sans services réels

- 36 tests Python : suivi Trello et point de reprise, chaîne, notifications isolées, SSL, réseau, batterie aux quatre seuils, non-répétition, recharge, échec Discord puis reprise, `next_check` ancien ignoré.
- 7 scénarios PowerShell de chaîne et 5 scénarios d’installateur : doublures de toutes les opérations ; aucune tâche réelle modifiée.
- Tests Node `test-remote-network.mjs` : réseau transitoire/persistant, DNS, SSL sans contournement et absence de rejeu des écritures.
- Tests Node `test-image-chain-safety.mjs` : synchronisation réussie fictive, échec avec diagnostic SSL conservé, aucune activation/corbeille après échec. Système de fichiers et processus simulés.
- Les premiers essais PowerShell dans une session restreinte ont été refusés par la politique d’exécution. Les scénarios ont ensuite réussi dans la session d’exécution autorisée, sans modifier cette politique.
- Un premier essai du nouveau test batterie utilisait une réponse Discord fictive non sérialisable ; la doublure retourne maintenant HTTP 204. Les tests finaux passent.

Aucun appel Cloudinary, Trello ou Discord réel effectué pendant ces tests ; aucune synchronisation réelle lancée, aucun déplacement de carte et aucune suppression d’image. Les tests n’écrivent que dans leurs fichiers isolés et journaux locaux.

## À valider avant intervention Windows

La correction Windows encore nécessaire est l’autorisation de démarrer et continuer sur batterie. Après validation des simulations : `& ./tools/agent_lapinous/installer_batterie.ps1 -Appliquer`. Le déclencheur de quinze minutes est préservé.

Pour investiguer le réveil : activer l’historique opérationnel depuis une session administrateur autorisée, contrôler les minuteurs et réaliser un essai de veille contrôlé. Aucun réglage d’alimentation ne doit être changé sans accord explicite.

En attendant, l’exécution la plus fiable repose sur un PC éveillé et connecté à 20 h. Les contrôles batterie ne peuvent pas être garantis pendant la veille ou l’hibernation. Une machine toujours disponible peut héberger la synchronisation distante, mais ne pourra pas mesurer la batterie du portable endormi. Aucune solution distante n’a été déployée.

Une indisponibilité Discord empêche par définition la livraison immédiate du rapport : les diagnostics restent disponibles localement. Le prochain contrôle batterie réessaie les seuils non confirmés ; aucune synchronisation manquée n’est reportée au matin.
