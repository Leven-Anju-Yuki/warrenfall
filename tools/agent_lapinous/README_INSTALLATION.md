# Agent Warrenfall - simulation et suivi explicite

Une seule tâche Windows existante à 20 h Europe/Paris lance Cloudinary, puis le bilan global immédiatement après, même en cas d’échec. Le rapport complet part sur Discord après le bilan. Aucun bilan indépendant. La chaîne a passé le test réel autorisé du 15 octobre : synchronisation, bilan et Windows retournent 0 ; les rapports Discord sont confirmés. Trello est activé pour les prochains bilans réels après validation du 15 octobre ; les suppressions définitives restent bloquées.

## Simulation sans effets secondaires

Depuis la racine : `py -B tools/agent_lapinous/agent.py bilan`.

Cette commande lit Git, A_FAIRE, les correspondances et Trello. Le rapport reste dans le terminal : aucun fichier, rapport ou point de reprise ecrit, aucune notification Discord, aucune modification Trello. Une erreur de simulation n'envoie rien non plus.

Le seul `.env` reste a la racine ; il n'est jamais reecrit et les secrets sont masques dans les erreurs.

## Correspondances

`liaisons_trello.json` contient les identifiants des cartes existantes. `chemins` sert au classement, sans constituer une preuve de travail. `automatique: true` et `preuves` sont necessaires pour analyser une carte automatiquement.

Chaque preuve indique un fichier exact et des `motifs` recherches seulement dans ses lignes ajoutees ou retirees. `dedie: true` autorise un fichier entier uniquement s'il est reserve a la fonctionnalite. Sans preuve precise, aucun deplacement. Les pistes manuelles ne sont pas attribuees automatiquement.

## Cases et sous-taches

Une seule case principale par carte, hors section automatique :

```markdown
- [ ] Sauvegardes [trello:IDENTIFIANT_REEL]
  - [x] Export implemente [trello:IDENTIFIANT_REEL:code:export]
  - [ ] Essai telephone [trello:IDENTIFIANT_REEL:manuel:mobile]
```

Les sous-taches affichent l'avancement ; elles ne cochent jamais le parent. Une preuve technique permet de proposer En cours. Le parent explicitement coche, sans sous-tache de code ouverte, permet de proposer A valider en jeu. Cela ne constitue jamais une validation finale. Les cartes Realise, Bloque, Idees et deja A valider restent protegees. Des marqueurs ambigus ou dupliques bloquent l'analyse.

## Git et point de reprise

Les chemins Git sont lus au format NUL, accents et renommages inclus. Les sources de l'agent ne sont plus exclues globalement.

Apres un bilan applique sans erreur Trello, `.cloudinary-local/trello-state.json` conserve les empreintes et textes necessaires aux preuves. Ce dossier est ignore par Git. Les commits suivants sont inclus et un meme contenu n'est pas retraite lors de son commit ulterieur. Une erreur Discord ne rejoue pas les transitions deja traitees.

Au premier passage, l'historique ancien n'est pas arbitrairement attribue. Pour inclure des commits anterieurs, choisir explicitement une reference :

`py -B tools/agent_lapinous/agent.py bilan --depuis-commit REFERENCE_GIT`

La simulation ne cree pas de point de reprise. Une reference de depart ne peut pas ecraser un point existant. Un etat invalide bloque l'analyse sans suppression ni reinitialisation.

## Application future : accord necessaire

`bilan --appliquer` autorise les ecritures locales, transitions permises et notifications. Cette commande n'a pas ete executee sur les services reels pendant les tests. Ne pas l'utiliser avant validation du rapport.

Chaque notification est traitee separement. Les erreurs sont ajoutees au rapport applique ; une panne ne bloque pas les autres canaux. `test-discord` et `initialiser-trello` exigent aussi `--appliquer` pour produire un effet.

Aucun appel ne cree de carte ni ne deplace une carte dans Realise.

## Installateur Windows

`powershell -NoProfile -ExecutionPolicy Bypass -File tools/agent_lapinous/installer_taches.ps1`

Sans `-Appliquer`, lecture seule et affichage du plan. Les taches existantes sont reconnues par leur nom et leurs actions ; leur nom et leur chemin Windows sont reutilises. Les doublons existants sont refuses, sans suppression.

L’installateur exige exactement une tâche Cloudinary existante : aucune création ni suppression. Avec `-Appliquer`, il sauvegarde sa définition XML, réutilise son nom et son chemin, fixe le déclenchement quotidien à 20:00 Europe/Paris et pointe vers `tools/run-image-schedule.ps1 -AppliquerChaine`. Il propose le rattrapage des horaires manqués (`StartWhenAvailable`), conserve l’état activé/désactivé et désactive les anciens bilans indépendants. Il ne lance pas la tâche. Le compte interactif existant doit disposer d’une session ouverte ; l’installateur ne change pas les identifiants Windows.

## Tests isoles

```powershell
py -B tools/agent_lapinous/test_suivi_trello.py
powershell -NoProfile -ExecutionPolicy Bypass -File tools/agent_lapinous/test_installateur.ps1
```

Faux Trello et Discord uniquement. Les tests Git utilisent `.cloudinary-local/tests-agent` et conservent leurs fichiers. Les commandes d'ecriture du Planificateur sont remplacees par des doublures dans le test PowerShell.

## Chaîne unique de 20 h

`tools/run-image-schedule.ps1`, `chaine_20h.ps1` et l’ancien `synchronisation_20h.ps1` délèguent au même orchestrateur `chaine_commune.ps1`. Sans `-AppliquerChaine`, ils simulent : aucun appel Node, aucune quarantaine réelle, aucune notification ni écriture Trello. Le bilan Python est exécuté en lecture seule et affiché dans le terminal.

En mode réel, l’orchestrateur exécute une seule fois `node tools/update-images.mjs --backup-local` (incluant la corbeille), puis tente toujours `agent.py bilan --appliquer --chaine-base64 CONTEXTE`. Le contexte indique le début et le résultat exacts de cette synchronisation ; un ancien rapport ne peut pas la faire passer pour réussie. Le verrou empêche le chevauchement des lanceurs. Les journaux UTF-8 et `derniere-chaine.json` sont dans `.cloudinary-local/logs/` ; aucun journal antérieur n’est purgé.

Le bilan comprend Git, correspondances et décisions Trello, README/A_FAIRE, rapport Cloudinary détaillé, quarantaine et erreurs. Discord reçoit un résumé et le Markdown complet en pièce jointe. Une notification défaillante n’empêche pas les suivantes ; l’erreur est enregistrée localement et une alerte est tentée séparément. Un échec de synchronisation reste un échec global même si le bilan a pu être envoyé.

### Diagnostic du 14 octobre

La tâche existante a renvoyé `0x800710E0` à 20:37:02 : requête refusée par l’opérateur ou l’administrateur. Aucun journal récent de synchronisation ; dernier rapport disponible daté du 13 octobre. Le journal opérationnel du Planificateur est désactivé : la raison exacte du refus n’est donc pas prouvée. De plus, les anciens scripts exigeaient `-InclureBilan` et l’action Windows ne le transmettait pas. La tâche de bilan abandonnée était désactivée. Les deux problèmes expliquent pourquoi la livraison d’un rapport n’était pas assurée.

### Vérification avant remise en service

```powershell
python -B tools/agent_lapinous/test_suivi_trello.py
powershell -NoProfile -ExecutionPolicy Bypass -File tools/agent_lapinous/test_installateur.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/agent_lapinous/test_chaine.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-image-schedule.ps1
```

La dernière commande produit uniquement la simulation du bilan réel en lecture seule. Les tests de chaîne remplacent sync et bilan par des doublures et ne contactent aucun service. La simulation ne crée pas de journal ni de point de reprise.

Après accord humain seulement : `powershell -NoProfile -ExecutionPolicy Bypass -File tools/agent_lapinous/installer_taches.ps1 -Appliquer`. Tant que cette commande n’a pas été autorisée et exécutée, l’action Windows existante reste inchangée et appelle le lanceur sans `-AppliquerChaine`, donc en simulation. Une machine arrêtée ou un refus du Planificateur ne peut pas être signalé par un script qui n’a pas démarré.

## Résultat du test réel autorisé

Le 15/10/2026, lancement unique via Start-ScheduledTask, à configuration identique au passage quotidien : synchronisation à 11:09:28, fin à 11:09:30, bilan achevé à 11:09:50. Codes sync/bilan/Windows : 0. Discord confirme quatre messages et deux pièces jointes. Les 71 cartes Trello contrôlées sont inchangées ; aucune suppression distante. Six quarantaines J-6, échéance 20/10/2026 15:17 Paris.

Action existante actualisée avec -AppliquerChaine et StartWhenAvailable activé, sans modifier le déclencheur, le compte ou les conditions d’alimentation. Ancien bilan indépendant toujours désactivé. Historique opérationnel : activation refusée (accès refusé), à traiter séparément avec des droits administrateur autorisés. Le refus historique n’a pas été reproduit.

Le réglage validé `trello_automatisation.json` contient `actif: true` : l’orchestrateur autorise Trello uniquement dans la chaîne réelle (`-AppliquerChaine`). La simulation impose toujours LAPINOUS_TRELLO_READ_ONLY=true. LAPINOUS_CLOUDINARY_DELETE_DISABLED=true reste imposé dans tous les cas. Le point de reprise Git n’avance qu’après traitement Trello réussi ; aucune suppression Cloudinary n’est autorisée par cette activation.

## Activation Trello validée le 15 octobre

Le fichier `trello_automatisation.json` contient `actif: true`, après accord explicite de l’utilisateur sur la simulation : son bilan réel (`--appliquer`) peut traiter les transitions autorisées au prochain passage de la chaîne de 20 h. Aucun changement de tâche Windows ni de commande planifiée n’est nécessaire. La simulation reste sans écriture, quel que soit ce réglage. La protection Cloudinary contre les suppressions reste imposée. Aucun test réel supplémentaire n’est lancé lors de cette activation.

L’agent ne crée aucune carte. Il ne cible que En cours et À valider en jeu, avec preuves précises et correspondances explicites. Réalisé, Bloqué et Idées à sélectionner restent protégés. Les cartes déjà à valider ne sont pas rétrogradées. Le journal local `.cloudinary-local/trello-transitions.json` reprend les commentaires interrompus, sans déplacer une seconde fois les cartes déjà déplacées. Une erreur Trello empêche l’avancement du point de reprise Git. Les erreurs Discord ne rejouent pas les transitions Trello réussies.

Simulation du 15 octobre : 71 cartes analysées, zéro déplacement proposé, aucune erreur Trello ; aucun message Discord envoyé. L’alerte Cloudinary avant 20 h est attendue dans le bilan manuel sans contexte de synchronisation.


## Réglage actuel du rattrapage — 19 octobre 2026

À la demande explicite de Florie, `StartWhenAvailable=True` a été réactivé sur la tâche existante « Lapinous - Images Cloudinary 20h ». L’export XML avant/après confirme que seule cette propriété a changé. Prochaine échéance relevée : 19 octobre 2026 à 20:00, tâche active, `MultipleInstances=IgnoreNew`. Le verrou exclusif de la chaîne protège aussi contre les doubles exécutions. Aucune synchronisation de test ; actions, déclencheurs, compte, alimentation, quarantaine et autres tâches inchangés. Le rattrapage peut avoir lieu le lendemain selon disponibilité de Windows ; ce n’est pas une garantie de réveil en veille S0. L’ancien installateur contient toujours `StartWhenAvailable=$false` : ne pas le relancer pour appliquer ce réglage isolé.
