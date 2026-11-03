# Rapprochement Warrenfall — 2 novembre 2026

Lecture réelle du [tableau Warrenfall](https://trello.com/b/5VmsAFi7/warrenfall), des 74 cartes ouvertes, de leur description et des checklists, puis comparaison avec A_FAIRE, les fichiers et les tests du dépôt. Les archives Trello ne font pas partie de ce périmètre. Aucun commentaire, déplacement ou changement de case Trello effectué.

## Situation vérifiée

| Liste Trello | Cartes |
| --- | ---: |
| P1 — Fiabiliser | 4 |
| P2 — Confort et découverte | 0 |
| P3 — Évolutions | 6 |
| En cours | 5 |
| À valider en jeu | 21 |
| Bloqué | 0 |
| Idées à sélectionner | 8 |
| Réalisé — code et historique | 30 |
| **Total** | **74** |

Le commit de départ `a3617119fcae19f157f6dbac00193e33f1969116` est identique au `main` distant lu avec `git ls-remote`. Les anciennes mentions « non publié » doivent donc être interprétées selon leur date. Aucun contrôle du dernier déploiement Pages ni de sa version servie n'a été effectué dans cet audit.

## Écarts importants

1. **Pixel art encore « À faire »** : le mode existe dans `assets/js/pixel-coloring.js` et `assets/css/pixel-coloring.css`, avec progression, album, difficultés et reprise. Tests conversion/reprise/collection réussis. Corriger le descriptif de suivi ; conserver les validations de confort et de rendu.
2. **Expéditions encore décrites comme une idée** : `assets/js/exploration.js` et `lapinous-content.json > exploration` implémentent les temps réels, affinités, destinations, butin et récupération unique. Le test passe. La carte est déjà cochée complète mais reste dans Idées ; aucun déplacement déduit.
3. **Boss distincts déjà développés** : onze effets et protections dans `assets/js/boss-abilities.js`, interface dans `assets/js/script.js`, style dans `assets/css/boss-abilities.css`. La carte contient déjà une actualisation ; la ligne générique « sans correspondance » d'A_FAIRE est ancienne. Équilibrage et essais physiques restent ouverts.
4. **Équipes favorites : réalisation non établie pour l'objectif décrit** : la carte demande trois compositions de combat enregistrables/rappelables. Le code possède `salonFavorites` et une sélection de combat en mémoire `selectedFightTeam`. Ce ne sont pas trois compositions sauvegardées. Le classement humain en Réalisé reste conservé ; clarifier le périmètre avant de déclarer l'objectif satisfait.
5. **Records : réalisation partielle** : les meilleurs coups du Memory et des puzzles ainsi que le meilleur score de quiz sont sauvegardés dans `assets/js/script.js`. Meilleure distance d'agilité et victoire sans K.O. ne sont pas établies. Garder la carte ouverte pour ces objectifs.
6. **Sauvegarde de secours : réalisation partielle** : les mécanismes de récupération, copies de migration, trois Petits nids et rotation sur disque existent. Le rappel périodique d'export décrit dans l'idée n'est pas établi.
7. **Nouveaux consommables : présents ; équilibre non prouvé** : le catalogue comporte 37 articles, avec effets de soins testés. Un inventaire fourni ne valide pas les prix ni l'équilibre sur plusieurs jours.
8. **Langues : travail récent non intégral** : bouton drapeau, 331 traductions exactes et 38 modèles variables par langue étrangère au moment de l'audit ; succès, dialogues et 37 articles couverts par tests. Histoires longues et quiz restent incomplets.
9. **Installation et mobile** : code et tests présents, mais pas de nouvel essai sur téléphone physique dans cet audit. Les anciennes validations humaines et cases cochées sont préservées ; ne pas convertir une réussite automatisée en validation matérielle.
10. **Historique A_FAIRE encombré** : le bilan technique du 21 octobre et les étapes successives de migration restent intégralement conservés. Ils ne décrivent pas l'exécution du 2 novembre. Une synthèse datée a été ajoutée en tête.
11. **Correspondance de chemin ancienne** : la carte juridique référence encore `INSTALLATION_ET_SECURITE.md` à la racine alors que le fichier est dans `docs/`. Aucune règle de déplacement de l'agent modifiée pendant cet audit.

## Structure Trello / A_FAIRE

Le contrôle utilise la fonction réelle `progress()` de `tools/agent_lapinous/suivi_trello.py`.

- Les **71 cartes configurées** dans `liaisons_trello.json` possèdent chacune une case principale unique, sans sous-tâche dupliquée.
- Trois cartes hors configuration n'ont pas de case principale : repère violet, idée Carnet de recettes, idée Bilan illustré. Les deux idées ont des sous-tâches manuelles ; cela ne les rend pas suivies automatiquement. Aucun ajout à l'automatisation réalisé.
- La carte Équipes favorites n'a aucune checklist Trello et sa case principale locale est unique : l'ancienne erreur de doublon n'est pas reproduite.
- Une seule checklist est présente sur le tableau ouvert : **« niveau »**, carte Barres de besoins et niveau d'amitié. Ses trois cases historiques sont non cochées ; elles sont laissées intactes.

## Vérifications effectuées

**18 séries Node réussies** : achievements, auto-nests, auto-nest-files, boss-abilities, exploration, game-economy, feature-visibility, game-languages, quiz-selection, puzzle-collection, pixel-coloring, number-sudoku, lapidoku, team-rules, save-safety, salon-layout, reward-accuracy, apothecary-effects.

Le test `test-team-rules.mjs` échouait car sa partie fictive omettait `speciesNames` et l'accès au catalogue utilisé pour le texte du bilan. La fixture a été complétée ; assertions de récompense unique, petits ennemis, affinités et fin de combat conservées. Aucune logique de jeu changée.

**119 tests Python simulés réussis** dans `tools/automation`. Les premières tentatives dans le bac à sable ne pouvaient pas importer la dépendance `python-dotenv` ; la réussite finale utilise les dépendances de test privées existantes avec les permissions de lecture nécessaires. Aucun envoi Discord, suppression Cloudinary ou déplacement Trello réel déclenché.

Ces tests ne certifient pas l'horaire des prochaines exécutions, l'activation d'un bot, l'installation réelle Android/iOS, l'équilibrage, les droits des médias ou l'anti-triche. Aucune sauvegarde joueur, sauvegarde permanente d'image ou date de quarantaine modifiée.

## Lecture de la matrice

« Historique humain conservé » reprend la liste existante sans refaire une recette complète de la fonction. « Code à valider » distingue l'implémentation de sa validation visuelle. Les chemins sont les correspondances de suivi existantes, pas une preuve que chaque objectif de la carte est entièrement réalisé. Les écarts ci-dessus priment sur les anciens descriptifs.


### P1 — Fiabiliser

| Carte | Constat de rapprochement | Fichiers |
| --- | --- | --- |
| [Repère — violet : À vérifier / À valider](https://trello.com/c/NN3T3N6R/74-rep%C3%A8re-violet-%C3%A0-v%C3%A9rifier-%C3%A0-valider) | Repère informatif. Convention d'étiquette violette ; hors configuration automatique. | — |
| [Repères — feuille de route du 08-10-2026](https://trello.com/c/lTc0Do2e/57-rep%C3%A8res-feuille-de-route-du-08-10-2026) | Statut existant conservé ; recette non rejouée.  | `readme.md`, `A_FAIRE.md`, `tools/agent_lapinous/agent.py`, `tools/agent_lapinous/suivi_trello.py`, `tools/agent_lapinous/installer_taches.ps1`, `tools/run-image-schedule.ps1` |
| [P1 — Équilibrage des boss](https://trello.com/c/mmVo687F/14-p1-%C3%A9quilibrage-des-boss) | Objectif restant. Tests des pouvoirs réussis ; matrice de taux de victoire aux niveaux demandés non établie. | `assets/js/boss-abilities.js`, `tools/test-boss-abilities.mjs` |
| [P1 — Indicateur de difficulté plus fiable](https://trello.com/c/IKQE1aox/15-p1-indicateur-de-difficult%C3%A9-plus-fiable) | Objectif restant. Comparaison de puissance présente ; estimation intégrant PV, techniques, soins et protections non établie. | `assets/js/script.js` |

### P3 — Évolutions

| Carte | Constat de rapprochement | Fichiers |
| --- | --- | --- |
| [Améliorations de soin — ancienne piste à réévaluer](https://trello.com/c/9DGzG9jQ/3-am%C3%A9liorations-de-soin-ancienne-piste-%C3%A0-r%C3%A9%C3%A9valuer) | Statut existant conservé ; recette non rejouée.  | `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json` |
| [P3 — Techniques uniques](https://trello.com/c/4AI6nGEG/26-p3-techniques-uniques) | Statut existant conservé ; recette non rejouée.  | — |
| [P3 — Décorations plaçables](https://trello.com/c/4I2djrCF/28-p3-d%C3%A9corations-pla%C3%A7ables) | Statut existant conservé ; recette non rejouée.  | — |
| [P3 — Branches d’amélioration](https://trello.com/c/gzb0wAUk/29-p3-branches-dam%C3%A9lioration) | Statut existant conservé ; recette non rejouée.  | — |
| [P3 — Mode pixel art](https://trello.com/c/4of2g6Me/31-p3-mode-pixel-art) | Code présent, validation restante. Pixel art, difficultés, album et progression testés. | `assets/js/pixel-coloring.js`, `assets/css/pixel-coloring.css`, `tools/test-pixel-coloring.mjs` |
| [Publication — juridique, droits et paiement](https://trello.com/c/WwK7kp8T/62-publication-juridique-droits-et-paiement) | Statut existant conservé ; recette non rejouée.  Chemin ancien absent : INSTALLATION_ET_SECURITE.md. | `Lapinous_documents_juridiques/`, `docs/INSTALLATION_ET_SECURITE.md`, `INSTALLATION_ET_SECURITE.md` |

### En cours

| Carte | Constat de rapprochement | Fichiers |
| --- | --- | --- |
| [P3 — Nouveaux consommables et équilibre des prix](https://trello.com/c/9KU5XeKS/27-p3-nouveaux-consommables-et-%C3%A9quilibre-des-prix) | Partiel : équilibre restant. 37 articles présents et effets de soins testés ; prix et rythme de progression à mesurer. | `lapinous-shop.json`, `assets/js/apothecary-effects.js`, `tools/test-apothecary-effects.mjs` |
| [P3 — Records supplémentaires](https://trello.com/c/BCeqHOvC/30-p3-records-suppl%C3%A9mentaires) | Partiel. Records Memory/puzzle/quiz présents ; distance maximale et victoire sans K.O. non établies. | `assets/js/script.js`, `assets/js/achievements.js` |
| [P2 — SEO](https://trello.com/c/qXqE8cSX/19-p2-seo) | Statut existant conservé ; recette non rejouée.  | `index.html`, `docs/AUDIT_SEO.md` |
| [P2 — Accessibilité](https://trello.com/c/dFQXGxIh/21-p2-accessibilit%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/css/style.css`, `index.html`, `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/css/mobile.css` |
| [P2 — Performance](https://trello.com/c/vEMkqMbD/22-p2-performance) | Statut existant conservé ; recette non rejouée.  | `assets/css/style.css`, `index.html`, `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/scene-preload.js` |

### À valider en jeu

| Carte | Constat de rapprochement | Fichiers |
| --- | --- | --- |
| [P1 — Progression et déblocage des équipements](https://trello.com/c/r6kcsfXG/4-p1-progression-et-d%C3%A9blocage-des-%C3%A9quipements) | Statut existant conservé ; recette non rejouée.  | `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/js/pantry.js`, `assets/js/script.js` |
| [P1 — Placement des lapins et commandes](https://trello.com/c/sl91vwVJ/12-p1-placement-des-lapins-et-commandes) | Code présent, recette physique restante. Zones des meubles du salon et projection cover testées ; autres scènes et appareils à valider. | `assets/js/salon-layout.js`, `assets/css/salon-layout.css`, `tools/test-salon-layout.mjs` |
| [P1 — Préparation du combat](https://trello.com/c/cCp86Wls/13-p1-pr%C3%A9paration-du-combat) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`, `assets/css/phone.css` |
| [P1 — Sauvegardes](https://trello.com/c/A4kqw1Kz/16-p1-sauvegardes) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/js/save-validation.js`, `assets/js/local-files.js`, `index.html`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs` |
| [P3 — Nouvelles grilles de Lapidoku](https://trello.com/c/XkleNMn5/32-p3-nouvelles-grilles-de-lapidoku) | Code présent et testé. Lapidoku numérique : 12 niveaux 4×4 à 9×9 ; Lapinoudoku à régions distinct, également testé. | `assets/js/number-sudoku.js`, `assets/js/lapidoku.js`, `tools/test-number-sudoku.mjs`, `tools/test-lapidoku.mjs` |
| [P1 — Sons](https://trello.com/c/X8tXE3uk/17-p1-sons) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/audio/` |
| [P2 — Notifications](https://trello.com/c/QTkD89kf/25-p2-notifications) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/js/event-reminders.js`, `tools/test-event-reminders.mjs`, `tools/test-season-banner.mjs` |
| [P2 — Guide de démarrage](https://trello.com/c/K7uhUucP/20-p2-guide-de-d%C3%A9marrage) | Statut existant conservé ; recette non rejouée.  | `index.html`, `assets/js/game-guide.js`, `assets/js/welcome-gift.js`, `assets/css/game-guide.css` |
| [À valider — Puzzle à coupelle et couturière](https://trello.com/c/isWD7HW8/23-%C3%A0-valider-puzzle-%C3%A0-coupelle-et-couturi%C3%A8re) | Statut existant conservé ; recette non rejouée.  | `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/css/mobile.css`, `assets/css/lapidoku.css` |
| [À valider — Boutique et apothicaire](https://trello.com/c/AKZ9otfo/60-%C3%A0-valider-boutique-et-apothicaire) | Statut existant conservé ; recette non rejouée.  | `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`, `assets/css/phone.css` |
| [P2 — Relations des personnages](https://trello.com/c/zT30AVax/24-p2-relations-des-personnages) | Statut existant conservé ; recette non rejouée.  | `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js`, `assets/js/team-rules.js`, `tools/test-team-rules.mjs` |
| [À valider — Memory 30 niveaux](https://trello.com/c/VEqDWjTR/61-%C3%A0-valider-memory-30-niveaux) | Statut existant conservé ; recette non rejouée.  | `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/css/mobile.css` |
| [À valider — Besoins admin et jeux adaptés à l’écran](https://trello.com/c/hoohREhn/63-%C3%A0-valider-besoins-admin-et-jeux-adapt%C3%A9s-%C3%A0-l%C3%A9cran) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/mobile.css` |
| [Valider accueil apothicaire, bouclier et visibilité du Dashboard](https://trello.com/c/oPKKg3vO/64-valider-accueil-apothicaire-bouclier-et-visibilit%C3%A9-du-dashboard) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/shop.js` |
| [Valider puzzles verrouillés et Memory compact](https://trello.com/c/DnnJaGsY/65-valider-puzzles-verrouill%C3%A9s-et-memory-compact) | Statut existant conservé ; recette non rejouée.  | `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/css/mobile.css` |
| [Valider accès Admin aux derniers niveaux et noms après rechargement](https://trello.com/c/6gpi1vnD/66-valider-acc%C3%A8s-admin-aux-derniers-niveaux-et-noms-apr%C3%A8s-rechargement) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js` |
| [Valider cartes puzzles Dashboard et taux des œufs](https://trello.com/c/erHCRg6c/67-valider-cartes-puzzles-dashboard-et-taux-des-%C5%93ufs) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json` |
| [Valider Dashboard en accordéons et catalogue magasin](https://trello.com/c/F2gaLgAC/68-valider-dashboard-en-accord%C3%A9ons-et-catalogue-magasin) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/mobile.css` |
| [Valider Dashboard visuel, taux des œufs et poids README](https://trello.com/c/N3BeVYyA/69-valider-dashboard-visuel-taux-des-%C5%93ufs-et-poids-readme) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `readme.md` |
| [Valider cuisine, Marché et évolutions progressives](https://trello.com/c/0vn9TmSL/70-valider-cuisine-march%C3%A9-et-%C3%A9volutions-progressives) | Statut existant conservé ; recette non rejouée.  | `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/js/pantry.js`, `assets/js/script.js`, `assets/css/mobile.css` |
| [Valider frigo cliquable et nouveaux aliments du Marché](https://trello.com/c/7scBPgFT/71-valider-frigo-cliquable-et-nouveaux-aliments-du-march%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/js/pantry.js`, `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs` |

### Idées à sélectionner

| Carte | Constat de rapprochement | Fichiers |
| --- | --- | --- |
| [Boss à comportements distincts](https://trello.com/c/5AwYo5tK/34-boss-%C3%A0-comportements-distincts) | Code présent, équilibre à valider. Onze capacités et boucliers testés ; mesure d'équilibrage distincte. | `assets/js/boss-abilities.js`, `assets/css/boss-abilities.css`, `tools/test-boss-abilities.mjs` |
| [Défis de combat](https://trello.com/c/6qsN3Kif/35-d%C3%A9fis-de-combat) | Statut existant conservé ; recette non rejouée.  | — |
| [Journal de collection](https://trello.com/c/fJ088co7/36-journal-de-collection) | Statut existant conservé ; recette non rejouée.  | `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js` |
| [Expéditions courtes](https://trello.com/c/QAgoWHei/37-exp%C3%A9ditions-courtes) | Code présent ; descriptif ancien. Voyages réels, butin, affinités et récupération unique testés. Carte complète restée dans Idées. | `assets/js/exploration.js`, `lapinous-content.json`, `tools/test-exploration.mjs` |
| [Albums saisonniers](https://trello.com/c/Czemf5ml/38-albums-saisonniers) | Statut existant conservé ; recette non rejouée.  | — |
| [Sauvegarde de secours](https://trello.com/c/kkkQrUaO/39-sauvegarde-de-secours) | Partiel. Récupération et trois autosauvegardes présentes ; rappel périodique d'export non établi. | `assets/js/save-safety.js`, `assets/js/auto-nests.js`, `assets/js/local-files.js` |
| [Idée — Carnet de recettes et provenance des ingrédients](https://trello.com/c/5ylq7dy5/72-id%C3%A9e-carnet-de-recettes-et-provenance-des-ingr%C3%A9dients) | Idée non achevée. Recettes et stocks existent ; carnet illustré avec provenance des ingrédients non établi. | `assets/js/pantry.js`, `lapinous-shop.json` |
| [Idée — Bilan illustré après chaque mini-jeu](https://trello.com/c/qIuP9Rh6/73-id%C3%A9e-bilan-illustr%C3%A9-apr%C3%A8s-chaque-mini-jeu) | Partiel. Bilans et gains existent dans plusieurs jeux ; présentation illustrée homogène pour chaque mini-jeu non établie. | `assets/js/script.js`, `assets/js/pixel-coloring.js` |

### Réalisé — code et historique

| Carte | Constat de rapprochement | Fichiers |
| --- | --- | --- |
| [Équipes favorites](https://trello.com/c/bK6JARQX/33-%C3%A9quipes-favorites) | Écart avec l'objectif de la carte. Favoris du salon présents ; trois compositions de combat sauvegardées non retrouvées. Classement humain inchangé. | `assets/js/script.js` |
| [faire une modal qui souvre avec un bouton image livre pour afficher les regles du jeu](https://trello.com/c/UL1dj7cB/7-faire-une-modal-qui-souvre-avec-un-bouton-image-livre-pour-afficher-les-regles-du-jeu) | Statut existant conservé ; recette non rejouée.  | `index.html` |
| [faire le clicker pour lui donner a manger le brosser](https://trello.com/c/QFjsacG0/2-faire-le-clicker-pour-lui-donner-a-manger-le-brosser) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [Barres de besoins et niveau d’amitié](https://trello.com/c/Y0jKWOOa/5-barres-de-besoins-et-niveau-damiti%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [trouver un gif de lapin heureux](https://trello.com/c/V4eZZSFF/8-trouver-un-gif-de-lapin-heureux) | Statut existant conservé ; recette non rejouée.  | `assets/js/image-manifest.js`, `assets/js/image-assets.js`, `tools/update-images.mjs`, `tools/cloudinary-sync.mjs`, `tools/backup-transferred-images.mjs` |
| [Retour au Salon et informations du lapin](https://trello.com/c/kEVyBCnU/11-retour-au-salon-et-informations-du-lapin) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [trouver les images](https://trello.com/c/hkvmJvG3/9-trouver-les-images) | Statut existant conservé ; recette non rejouée.  | `assets/js/image-manifest.js`, `assets/js/image-assets.js`, `tools/update-images.mjs`, `tools/cloudinary-sync.mjs`, `tools/backup-transferred-images.mjs` |
| [faire une zone soin alimentation sommeil et jeu avec des fond différent](https://trello.com/c/fYTBwbfO/6-faire-une-zone-soin-alimentation-sommeil-et-jeu-avec-des-fond-diff%C3%A9rent) | Statut existant conservé ; recette non rejouée.  | `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/style.css`, `index.html`, `assets/js/script.js` |
| [thème sur les lapins](https://trello.com/c/CJVVQQTy/1-th%C3%A8me-sur-les-lapins) | Statut existant conservé ; recette non rejouée.  | `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/style.css`, `index.html` |
| [faire un salon avec des bouton de base  pour les diffèrent lieu et une fleche pour revenir en arriere](https://trello.com/c/JylSW5my/10-faire-un-salon-avec-des-bouton-de-base-pour-les-diff%C3%A8rent-lieu-et-une-fleche-pour-revenir-en-arriere) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css` |
| [Adoption, traits, collection et encyclopédie](https://trello.com/c/8nXOSaXF/40-adoption-traits-collection-et-encyclop%C3%A9die) | Statut existant conservé ; recette non rejouée.  | `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js` |
| [Progression indépendante par lapin](https://trello.com/c/VEZIy9Tf/41-progression-ind%C3%A9pendante-par-lapin) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [Combat tactique — équipe, mode manuel et automatique](https://trello.com/c/yvgAXc0K/42-combat-tactique-%C3%A9quipe-mode-manuel-et-automatique) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css` |
| [Ultimes et barres de charge — lapins et boss](https://trello.com/c/iqik5joP/43-ultimes-et-barres-de-charge-lapins-et-boss) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [Listes de 1 à 6 attaques selon la rareté](https://trello.com/c/9zjnS8qi/44-listes-de-1-%C3%A0-6-attaques-selon-la-raret%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html`, `lapinous-content.json` |
| [Fragments — amélioration de la technique choisie](https://trello.com/c/l5petbKm/45-fragments-am%C3%A9lioration-de-la-technique-choisie) | Statut existant conservé ; recette non rejouée.  | `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/js/script.js` |
| [Œufs illustrés — ouverture individuelle et par 10](https://trello.com/c/oLeHPM9I/46-%C5%93ufs-illustr%C3%A9s-ouverture-individuelle-et-par-10) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html` |
| [Décors de saisons jour/nuit et événements prioritaires](https://trello.com/c/aD4Fcxes/47-d%C3%A9cors-de-saisons-jour-nuit-et-%C3%A9v%C3%A9nements-prioritaires) | Statut existant conservé ; recette non rejouée.  | `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/style.css`, `index.html`, `assets/js/script.js` |
| [Admin local — tests rapides et Dashboard](https://trello.com/c/VG00Szpr/48-admin-local-tests-rapides-et-dashboard) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json` |
| [Dashboard — graphiques de rareté harmonisés](https://trello.com/c/7OVezDCu/49-dashboard-graphiques-de-raret%C3%A9-harmonis%C3%A9s) | Statut existant conservé ; recette non rejouée.  | `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json` |
| [Sauvegardes nommées, datées et remplacement confirmé](https://trello.com/c/qoef1nzq/50-sauvegardes-nomm%C3%A9es-dat%C3%A9es-et-remplacement-confirm%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/js/save-validation.js`, `assets/js/local-files.js`, `index.html` |
| [Mini-jeux — Memory 30 niveaux et puzzles cousus](https://trello.com/c/q78aVvOi/51-mini-jeux-memory-30-niveaux-et-puzzles-cousus) | Statut existant conservé ; recette non rejouée.  | `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/js/quiz.js`, `assets/js/quiz-dashboard.js`, `lapinous-quiz.json` |
| [Défis quotidiens, succès et récompenses](https://trello.com/c/fqjTnpY3/52-d%C3%A9fis-quotidiens-succ%C3%A8s-et-r%C3%A9compenses) | Statut existant conservé ; recette non rejouée.  | `assets/js/achievements.js`, `assets/js/script.js`, `assets/css/phone.css`, `tools/test-achievements.mjs`, `tools/test-landscape-game.mjs` |
| [Audio — soins courts, volumes et défaite](https://trello.com/c/IntLayDB/53-audio-soins-courts-volumes-et-d%C3%A9faite) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/audio/` |
| [Audio original livré — ambiance et sommeil](https://trello.com/c/GHIyqnIx/54-audio-original-livr%C3%A9-ambiance-et-sommeil) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/audio/` |
| [Notifications et combat lisible — corrections livrées](https://trello.com/c/dqh8J32R/55-notifications-et-combat-lisible-corrections-livr%C3%A9es) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [Salon — compagnons ensemble et placement corrigé](https://trello.com/c/CNNqjx7K/56-salon-compagnons-ensemble-et-placement-corrig%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/js/script.js`, `assets/css/style.css`, `index.html` |
| [README et arborescence — actualisés le 08-10-2026](https://trello.com/c/i78a1llF/18-readme-et-arborescence-actualis%C3%A9s-le-08-10-2026) | Statut existant conservé ; recette non rejouée.  | `readme.md`, `A_FAIRE.md`, `tools/agent_lapinous/agent.py`, `tools/agent_lapinous/installer_taches.ps1`, `tools/agent_lapinous/liaisons_trello.json`, `tools/agent_lapinous/suivi_trello.py` |
| [Magasin et inventaire — code livré](https://trello.com/c/3OkyHtRt/58-magasin-et-inventaire-code-livr%C3%A9) | Statut existant conservé ; recette non rejouée.  | `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json` |
| [Accompagnateurs et lapins — médias centralisés](https://trello.com/c/srDGoZd3/59-accompagnateurs-et-lapins-m%C3%A9dias-centralis%C3%A9s) | Statut existant conservé ; recette non rejouée.  | `assets/js/image-manifest.js`, `assets/js/image-assets.js`, `tools/update-images.mjs`, `tools/cloudinary-sync.mjs`, `tools/backup-transferred-images.mjs`, `tools/cloudinary-corbeille.mjs` |
