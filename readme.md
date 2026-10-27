# 🐰 Warrenfall : Les Chroniques de Garenne

Warrenfall est un jeu de collection et de gestion de lapins virtuels. Le joueur adopte un compagnon, s'occupe de ses besoins, développe son amitié, collectionne de nouveaux lapins grâce aux œufs, joue à des mini-jeux et affronte les boss légumes du jardin.

Le projet fonctionne comme un petit jeu web responsive, avec un univers visuel composé de plusieurs pièces, une encyclopédie, des événements saisonniers et un Dashboard permettant de gérer le contenu sans modifier directement tout le code.

## Suivi du projet

Depuis le 27 octobre 2026, à la demande explicite de Florie, la chaîne Windows existante de 20 h tente d'abord de publier les changements publics sur `main`, puis exécute Cloudinary et demande le bilan distant. Le message de commit décrit les domaines modifiés et les corrections reconnues dans le diff. Aucun commit vide, push forcé ou fusion automatique ; un index préparé manuellement reste intact. Secrets, sauvegardes de joueurs, états privés, batterie et originaux d'images sont exclus. Un échec Git ne bloque pas Cloudinary : reçu dans `.cloudinary-local/nightly-git.json`, repris dans le bilan distant. Le PC doit être allumé pour publier son travail local. Simulation sans publication : `python -B tools/automation/nightly_git.py`.

Documentation actualisée le **25 octobre 2026**. Le suivi repose sur ce README, `A_FAIRE.md` et les correspondances explicites du [Trello du projet](https://trello.com/b/5VmsAFi7/clikergame). GitHub Actions programme les bilans détaillés à 20 h 07 Europe/Paris, été comme hiver ; ses délais de démarrage peuvent décaler l'envoi. Le relais Windows conserve les transferts et sauvegardes d’images, à 20 h locale. **Le signal de fin de synchronisation et la déduplication sont activés après validation humaine**, avec rattrapage réel des trois rapports confirmé le 25 octobre à 22 h 23. Les prochains bilans ne nécessitent pas de confirmation quotidienne. Voir le [diagnostic des horaires et du relais](docs/DIAGNOSTIC_RELAIS_2026-10-25.md).

- [Feuille de route et nouvelles évolutions](A_FAIRE.md)
- [Audit SEO et améliorations à prévoir](docs/AUDIT_SEO.md)
- [Anciennes demandes archivées](docs/archives/a-faire/README.md)
- [Concepts de futurs lapins](liste%20de%20futur%20cr%C3%A9ation/futur_lapin.md) et [futurs boss](liste%20de%20futur%20cr%C3%A9ation/future_boss.md)

## ✨ Fonctionnalités

- **Les escapades du terrier** : depuis le Jardin, le randonneur accompagne les lapins dans quatre zones. Une sortie dure 1, 3, 8 ou 12 heures réelles et continue lorsque le jeu est fermé. Chaque lieu possède ses ingrédients et soins ; les longues sorties, les paliers de niveau et les affinités (Myco en forêt, Nopal dans le désert…) améliorent les probabilités de trouvailles rares et d'œufs. Les taux et le coût en énergie sont affichés avant le départ. Le butin est fixé au départ puis récupérable une seule fois au retour. Configuration : `lapinous-content.json > exploration` ; logique : `assets/js/exploration.js`. Les échéances utilisent l'horloge de l'appareil, sans serveur.
- **Adoption** : choisis un lapin commun au démarrage ou découvre certains compagnons particuliers.
- **Progression indépendante par lapin** : nourriture, sommeil, propreté, amitié, niveau, techniques et progression dans les mini-jeux sont propres à chaque compagnon. Les évolutions des pièces et leurs bonus sont communs à toute la sauvegarde ; la migration garde le meilleur palier déjà acheté pour chaque pièce.
- **Salon vivant** : les lapins possédés apparaissent directement dans la pièce et peuvent devenir le compagnon actif.
- **5 pièces principales** : Salon, Cuisine, Chambre, Salle de bain et Jardin.
- **Besoins du lapin** : nourriture, sommeil, propreté et amitié.
- **Améliorations des pièces** : certaines actions peuvent être améliorées grâce à l'amitié.
- **Mini-jeu d'agilité** : disponible dans le Jardin.
- **Coin jeux dans le Salon** : accès aux mini-jeux depuis un plateau de jeux intégré au décor.
- **Puzzles** : plusieurs images sont proposées avec différents nombres de pièces. Les puzzles et leurs liens avec les lapins sont gérés dans un JSON séparé.
- **Progression des puzzles** : il faut terminer un niveau pour accéder au suivant, et terminer un puzzle pour débloquer le suivant.
- **Memory** : 30 niveaux progressifs, de 3 à 36 paires, avec portraits de lapins et de boss, records par lapin et animation des paires trouvées vers un tas sur le côté.
- **Aventures & combats** : combats contre les boss légumes avec PV, animations d'attaque et jauges de pouvoir critique.
- **Fatigue de combat** : une défaite, ou une fin de combat dans un état critique, peut faire tomber la nourriture, le sommeil et la propreté à 0.
- **Pouvoirs** : le champ `power` du contenu décrit le pouvoir spécial / critique du lapin ou du boss.
- **Œufs et collection** : les carottes permettent d'acheter des œufs et d'obtenir de nouveaux compagnons.
- **Doublons** : un doublon peut servir à renforcer l'attaque du lapin ou être converti en carottes. Une fois le renforcement maximal atteint, les doublons donnent uniquement des carottes.
- **Événements saisonniers** : Halloween, Noël et Pâques, avec lapins spécifiques et périodes configurables.
- **Encyclopédie** : fiches des lapins et boss découverts, informations, pouvoirs, progression d'attaque et puzzles liés.
- **Sauvegardes** : sauvegardes nommées et exportables en JSON.
- **Dashboard administrateur** : gestion des lapins, boss, événements, taux d'œufs, puzzles, statistiques et contrôle des visuels.

## 🎮 Mini-jeux

### Puzzle

Les puzzles sont définis dans `lapinous-puzzles.json` afin de pouvoir en ajouter facilement sans modifier la logique principale du jeu.

Chaque puzzle peut notamment contenir :

- un identifiant ;
- un titre ;
- le chemin de son image ;
- les lapins auxquels il est lié ;
- plusieurs niveaux de difficulté / nombres de pièces.

La progression est sauvegardée séparément pour chaque lapin. Les pièces sont sélectionnées dans une coupelle horizontale sous le plateau et peuvent être placées librement, même au mauvais endroit. Les voisines correctement placées sont reliées par une couture dorée en zigzag, avec déplacement de la couturière et animation de félicitations. [Détails des puzzles](docs/PUZZLES.md).

### Memory et Lapidoku

Memory propose 30 niveaux avec lapins et boss. Le placard contient deux jeux de logique distincts : le sudoku à symboles et le Lapinoudoku à régions colorées, avec croix et têtes de lapins.

### Coloriage et quiz

Les Couleurs du terrier proposent des lapins et de grandes scènes à recolorier par numéros, avec plusieurs difficultés, zoom indépendant de la palette, peinture par glissement et reprise de la progression. Le quiz mélange les questions et les réponses ; la correction reste affichée quinze secondes avant le passage automatique à la suite.

## ⚔️ Combats

Les combats se déroulent directement sur un décor dédié.

Chaque combattant possède :

- des points de vie ;
- une jauge de pouvoir / critique ;
- un pouvoir défini dans le contenu ;
- une difficulté ou puissance ;
- des animations d'attaque et de réaction aux coups.

Les boss utilisent leur propre visuel mystère dans l'Encyclopédie tant qu'ils n'ont pas été rencontrés.

## 🛍️ Magasin

Le magasin et l’inventaire sont en travaux et accessibles en mode administrateur local. Le bouton 🛍️ ouvre les rayons Articles, Fragments, Panier et Carottes. Les consommables affichent leurs images et révèlent leurs détails au survol ou au focus. Le panier regroupe les quantités et garde le total et le paiement visibles.

Les soins achetés vont dans l’inventaire 🌿 indépendant : l’apothicaire récupère un produit dans un tiroir fixe et restaure la barre du lapin actif. Ses sept poses et son GIF de marche sont configurés dans `lapinous-shop.json`, avec le caissier et la couturière. L’extracteur agit sur la compétence et le lapin choisis ; les achats de carottes avec de l’argent réel ne sont pas activés. [Détails du magasin et des accompagnateurs](docs/MAGASIN.md).

Les documents juridiques restent masqués sur la version publique et consultables en local administrateur pour préparation. Leur présence ne signifie pas qu’ils sont prêts pour publication.

## 🥚 Doublons et renforcement

Les compétences se débloquent aux niveaux 1, 10, 20, 30, 40 et 50, selon la rareté du lapin. Les fragments servent uniquement à améliorer les compétences débloquées (jusqu’à 5/5). L’extracteur du magasin rend les fragments d’une compétence sans modifier les autres.


Lorsqu'un lapin déjà possédé ressort d'un œuf :

- le joueur peut récupérer des carottes ;
- ou utiliser le doublon pour renforcer son attaque ;
- un fragment améliore une compétence débloquée d’un cran, jusqu’à 5/5 ;
- une fois la barre de renforcement terminée, les doublons suivants sont automatiquement convertis en carottes.

## 🎃 Événements

Le jeu prévoit des contenus saisonniers, notamment :

- 🎃 Halloween ;
- 🎄 Noël ;
- 🐣 Pâques ;
- 🏮 Nouvel An chinois, avec calendrier variable et médias dédiés ;
- des personnages pouvant appartenir à plusieurs saisons.

Le Dashboard permet de rechercher et filtrer les lapins par événement.

## 🗂️ Structure du projet

### Images hébergées sur Cloudinary

Les **359 images utilisées** sont hébergées sur Cloudinary, dans le cloud `dgrszi9wf`, sous `lapinous/`. Le jeu et le Dashboard utilisent les URL de `assets/js/image-manifest.js`, chargées par le résolveur commun. Les originaux transférés ont été retirés de `assets/img/` ; les dossiers restent disponibles grâce aux `.gitkeep`. Les futures créations et les images non transférées sont conservées.

La tâche Windows **« Lapinous - Images Cloudinary 20h »** conserve les transferts et la sauvegarde permanente des originaux dans `C:/Users/flori/Desktop/clikergame_avec_image/assets/img/`, avec la même arborescence. Le relais vérifie la copie exacte avant de retirer la source du dossier du jeu ; les anciennes versions restent dans `.versions/`. Aucune purge de cette sauvegarde n’est prévue. Les nouveaux fichiers locaux sont transférés lorsque le PC est disponible, avec rattrapage des exécutions manquées. GitHub Actions assure les bilans Discord, Trello et la corbeille Cloudinary vers **20 h, Europe/Paris**, même si le PC est fermé ou éteint. La suppression après sept jours concerne uniquement Cloudinary et reste conditionnée à une preuve de sauvegarde exacte.

Pour lancer le relais manuellement : double-cliquer sur `Synchroniser les images.cmd`, ou exécuter `python -B tools/automation/local_bridge.py run`. Les images doivent être référencées dans le jeu ou un catalogue JSON. Le contrôle du quota reste actif avant tout nouvel envoi. Windows et Actions partagent un verrou ; aucun bilan Windows indépendant n’est programmé.

### Comparaison avant / après

Mesure du **24 octobre 2026**. Les tailles correspondent à la somme des octets des fichiers, sans mesurer l’espace alloué par Windows. Le périmètre comparable exclut `.git`, les dépendances, les configurations locales de l’agent, `.env`, `.cloudinary-local` et `secours-images`, dans les deux copies.

| Référence | Poids | Octets |
| --- | ---: | ---: |
| Ancien chiffre du README, avant migration | 586,52 Mio | 615 007 429 |
| Copie `clikergame_avec_image/`, mesurée sans modification | 754,90 Mio | 791 569 017 |
| Projet actuel, même périmètre | **309,27 Mio** | **324 292 712** |

**Économie par rapport à la copie avec images : 445,63 Mio (467 276 305 octets), soit 59,03 %.** Par rapport au chiffre précédent du README : 277,25 Mio (290 714 717 octets).

### Poids de tous les dossiers à la racine

| Dossier | Poids cumulé | Octets | Périmètre |
| --- | ---: | ---: | --- |
| `.cloudinary-local/` | Non mesuré | — | Local privé, exclu et non parcouru |
| `.git/` | Non mesuré | — | Local privé, exclu et non parcouru |
| `.github/` | 5,4 Kio | 5 505 | Inclus dans le projet |
| `.vscode/` | 44 octets | 44 | Inclus dans le projet |
| `assets/` | 300,83 Mio | 315 442 334 | Inclus dans le projet |
| `docs/` | 2,32 Mio | 2 436 069 | Inclus dans le projet |
| `Lapinous sauvegarde/` | 4,97 Mio | 5 213 731 | Inclus dans le projet |
| `Lapinous_documents_juridiques/` | 84,6 Kio | 86 632 | Inclus dans le projet |
| `liste de futur création/` | 36,2 Kio | 37 031 | Inclus dans le projet |
| `tools/` | 560,2 Kio | 573 679 | Inclus dans le projet |

Les fichiers de Git gardent encore l’historique des anciennes images. Les caches, journaux, états privés et secrets sont exclus et ne sont pas parcourus par ce calcul. Les chiffres ci-dessus décrivent le projet comparable ; ils ne prétendent pas mesurer l’occupation totale du disque.

### Arborescence et poids détaillés

Chaque fichier et chaque sous-dossier du périmètre comparable est indiqué ci-dessous. Les dossiers vides pèsent zéro octet hors métadonnées du système de fichiers. Les détails des caches, secrets et sauvegardes privées sont omis ; leurs dossiers figurent dans le tableau précédent.

```text
Warrenfall/ — 309,27 Mio
├── .github/ — 5,4 Kio
│   └── workflows/ — 5,4 Kio
│       └── warrenfall-daily.yml — 5,4 Kio
├── .vscode/ — 44 octets
│   └── settings.json — 44 octets
├── assets/ — 300,83 Mio
│   ├── audio/ — 17,49 Mio
│   │   ├── action/ — 2,35 Mio
│   │   │   ├── dormir.mp3 — 99,8 Kio
│   │   │   ├── doucher.mp3 — 2,23 Mio
│   │   │   └── manger.mp3 — 18,3 Kio
│   │   ├── combat/ — 605,8 Kio
│   │   │   ├── attaque_magique.mp3 — 5,3 Kio
│   │   │   ├── attaque_physique.mp3 — 23,6 Kio
│   │   │   ├── bouclier_activation.mp3 — 43,5 Kio
│   │   │   ├── cris_monstre_deb_combat.mp3 — 128,3 Kio
│   │   │   ├── critical.mp3 — 22,1 Kio
│   │   │   ├── game-over-mot.mp3 — 47,3 Kio
│   │   │   ├── game-over-sond.mp3 — 27,2 Kio
│   │   │   ├── impact_bouclier.mp3 — 17,3 Kio
│   │   │   ├── soin.mp3 — 162,0 Kio
│   │   │   └── victoire.mp3 — 129,3 Kio
│   │   ├── common/ — 919,1 Kio
│   │   │   ├── click.mp3 — 17,9 Kio
│   │   │   ├── level_up.mp3 — 867,2 Kio
│   │   │   └── purchase.mp3 — 34,0 Kio
│   │   ├── egg/ — 32,3 Kio
│   │   │   ├── egg-crack.mp3 — 32,1 Kio
│   │   │   └── README.txt — 182 octets
│   │   ├── evenements/ — 11,04 Mio
│   │   │   ├── halloween/ — 4,30 Mio
│   │   │   │   ├── piano_angoissant.mp3 — 646,5 Kio
│   │   │   │   └── rire_de_sorciere.mp3 — 3,66 Mio
│   │   │   ├── noel/ — 1,77 Mio
│   │   │   │   ├── ho-ho-ho-merry-christmas.mp3 — 116,3 Kio
│   │   │   │   ├── jingle-bells.mp3 — 1,00 Mio
│   │   │   │   └── mon beau sapin.mp3 — 668,0 Kio
│   │   │   ├── nouvel_an_chinois/ — 998,6 Kio
│   │   │   │   ├── ambience.mp3 — 333,1 Kio
│   │   │   │   ├── djartmusic-chinese-ident-transition-1.mp3 — 309,4 Kio
│   │   │   │   ├── djartmusic-chinese-ident-transition-3.mp3 — 355,9 Kio
│   │   │   │   └── README.txt — 199 octets
│   │   │   └── paques/ — 4,00 Mio
│   │   │       └── ambience.mp3 — 4,00 Mio
│   │   ├── ambience.mp3 — 2,59 Mio
│   │   └── README_AUDIO.txt — 369 octets
│   ├── css/ — 686,7 Kio
│   │   ├── bootstrap.min.css — 227,5 Kio
│   │   ├── boss-abilities.css — 5,0 Kio
│   │   ├── desktop-scene.css — 2,2 Kio
│   │   ├── error-pages.css — 1,9 Kio
│   │   ├── exploration.css — 8,0 Kio
│   │   ├── fight-preparation.css — 7,9 Kio
│   │   ├── game-guide.css — 8,7 Kio
│   │   ├── install-button.css — 2,8 Kio
│   │   ├── lapidoku.css — 6,5 Kio
│   │   ├── legal.css — 3,1 Kio
│   │   ├── mobile.css — 17,2 Kio
│   │   ├── number-sudoku.css — 5,8 Kio
│   │   ├── painted-shop.css — 6,9 Kio
│   │   ├── phone.css — 33,6 Kio
│   │   ├── pixel-coloring.css — 11,3 Kio
│   │   ├── player-controls.css — 950 octets
│   │   ├── scene-proportions.css — 3,5 Kio
│   │   ├── shop-polish.css — 28,6 Kio
│   │   ├── shop.css — 71,2 Kio
│   │   ├── startup.css — 2,0 Kio
│   │   ├── style.css — 219,1 Kio
│   │   └── workshop-layout.css — 12,8 Kio
│   ├── fonts/ — 900,7 Kio
│   │   ├── CinzelDecorative-Bold.ttf — 60,8 Kio
│   │   ├── CinzelDecorative-OFL.txt — 4,3 Kio
│   │   ├── EBGaramond-OFL.txt — 4,3 Kio
│   │   └── EBGaramond.ttf — 831,2 Kio
│   ├── icons/ — 8,07 Mio
│   │   ├── apothecary-balm.svg — 477 octets
│   │   ├── apothecary-bandage.svg — 492 octets
│   │   ├── apothecary-herbs.svg — 487 octets
│   │   ├── apothecary-potion.svg — 440 octets
│   │   ├── error-403.png — 2,57 Mio
│   │   ├── error-404.png — 2,52 Mio
│   │   ├── error-offline.png — 2,37 Mio
│   │   ├── market-table.svg — 1,4 Kio
│   │   ├── vegetable-placeholder.svg — 514 octets
│   │   ├── warrenfall-192.png — 85,4 Kio
│   │   ├── warrenfall-48.png — 6,2 Kio
│   │   └── warrenfall-512.png — 527,9 Kio
│   ├── img/ — 272,92 Mio
│   │   ├── accompagnateurs/ — 1,57 Mio
│   │   │   ├── Apothicaire/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Artisan/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── caissier/ — 1,57 Mio
│   │   │   │   ├── .gitkeep — 0 octets
│   │   │   │   └── exec-030757bc-ec79-452d-83d8-00b99494ec7f.png — 1,57 Mio
│   │   │   ├── Chef/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── couturiere/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Fragments/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   └── Randonneur/ — 0 octets
│   │   │       └── .gitkeep — 0 octets
│   │   ├── az/ — 6,00 Mio
│   │   │   ├── az_assis_de_cote.png — 2,14 Mio
│   │   │   ├── az_cote.png — 865,2 Kio
│   │   │   ├── az_face.png — 1,10 Mio
│   │   │   └── Azazel.png — 1,91 Mio
│   │   ├── Boite_Mini_Jeu/ — 0 octets
│   │   │   └── .gitkeep — 0 octets
│   │   ├── boss/ — 8,14 Mio
│   │   │   ├── carotte_choux_oignon.png — 1,58 Mio
│   │   │   ├── Gemini_Generated_Image_joczczjoczczjocz.jpg — 1 009,5 Kio
│   │   │   ├── Planche de sprites de trois légumes héros-1.png — 2,68 Mio
│   │   │   ├── poivron_courgette_banane.png — 1,42 Mio
│   │   │   └── tomate_ail_mais_aubergine_patate.png — 1,48 Mio
│   │   ├── breeds/ — 7,3 Kio
│   │   │   ├── glouton.svg — 1,0 Kio
│   │   │   ├── grand_sportif.svg — 1,0 Kio
│   │   │   ├── gros_dormeur.svg — 1,0 Kio
│   │   │   ├── maladroit.svg — 1,0 Kio
│   │   │   ├── normal.svg — 1,0 Kio
│   │   │   ├── petit_dormeur.svg — 1,0 Kio
│   │   │   └── petit_mangeur.svg — 1,0 Kio
│   │   ├── Discord/ — 3,38 Mio
│   │   │   ├── Alertes_erreur.png — 262,4 Kio
│   │   │   ├── Badges de lapins enchantés au clair de lune.png — 1,75 Mio
│   │   │   ├── Bilan_quotidien.png — 267,2 Kio
│   │   │   ├── cloudinary_images.png — 268,1 Kio
│   │   │   ├── Serveur.png — 626,5 Kio
│   │   │   └── Trello_taches.png — 246,5 Kio
│   │   ├── fond/ — 13,10 Mio
│   │   │   ├── Halloween/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Magasin/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Noel/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Nouvel_An_Chinois/ — 0 octets
│   │   │   │   ├── jour/ — 0 octets
│   │   │   │   │   └── .gitkeep — 0 octets
│   │   │   │   └── nuit/ — 0 octets
│   │   │   │       └── .gitkeep — 0 octets
│   │   │   ├── Nuit/ — 13,10 Mio
│   │   │   │   ├── Image ChatGPT 30 sept. 2026, 00_29_30-4.png — 1,96 Mio
│   │   │   │   ├── Image ChatGPT 30 sept. 2026, 00_29_33-8.png — 2,29 Mio
│   │   │   │   ├── Image ChatGPT 30 sept. 2026, 00_29_36-11.png — 2,12 Mio
│   │   │   │   ├── Image ChatGPT 30 sept. 2026, 00_29_41-16.png — 2,53 Mio
│   │   │   │   ├── Image ChatGPT 30 sept. 2026, 00_29_44-20.png — 2,11 Mio
│   │   │   │   └── Image ChatGPT 30 sept. 2026, 00_29_48-24.png — 2,08 Mio
│   │   │   ├── Paques/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── randonnée/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   └── Saison/ — 0 octets
│   │   │       ├── jour/ — 0 octets
│   │   │       │   └── .gitkeep — 0 octets
│   │   │       └── nuit/ — 0 octets
│   │   │           └── .gitkeep — 0 octets
│   │   ├── images des futur création/ — 134,01 Mio
│   │   │   ├── boss/ — 21,50 Mio
│   │   │   │   ├── ananas.jpg — 871,3 Kio
│   │   │   │   ├── betterave.png — 2,59 Mio
│   │   │   │   ├── celeri.png — 2,45 Mio
│   │   │   │   ├── cornichon.png — 2,11 Mio
│   │   │   │   ├── fraise.png — 2,12 Mio
│   │   │   │   ├── pissenlit.png — 3,00 Mio
│   │   │   │   ├── poire.png — 1,40 Mio
│   │   │   │   ├── pomme.png — 2,22 Mio
│   │   │   │   ├── raisin.png — 2,37 Mio
│   │   │   │   └── taupinenbour.png — 2,38 Mio
│   │   │   └── lapin/ — 112,51 Mio
│   │   │       ├── commun/ — 12,15 Mio
│   │   │       │   ├── cafe_cote.png — 280,4 Kio
│   │   │       │   ├── cafe_face.png — 294,2 Kio
│   │   │       │   ├── cendre_cote.png — 286,9 Kio
│   │   │       │   ├── cendre_face.png — 280,8 Kio
│   │   │       │   ├── champi_cote.png — 1,09 Mio
│   │   │       │   ├── champi_face.png — 1,09 Mio
│   │   │       │   ├── champi.png — 2,22 Mio
│   │   │       │   ├── fraise_cote.png — 179,8 Kio
│   │   │       │   ├── fraise_cote1.png — 293,6 Kio
│   │   │       │   ├── fraise_face.png — 173,4 Kio
│   │   │       │   ├── fraise_face1.png — 299,4 Kio
│   │   │       │   ├── hibou_cote.png — 303,5 Kio
│   │   │       │   ├── hibou_face.png — 298,8 Kio
│   │   │       │   ├── noisette_cote.png — 224,2 Kio
│   │   │       │   ├── noisette_face.png — 210,7 Kio
│   │   │       │   ├── Premium fantasy rabbit collectible sheet._Display 4 rabbit characters._Each rabbit appears EXACTLY T (1).png — 2,28 Mio
│   │   │       │   ├── Premium fantasy rabbit collectible sheet._Display 4 rabbit characters._Each rabbit appears EXACTLY T.png — 1,65 Mio
│   │   │       │   ├── tournesol_cote.png — 202,9 Kio
│   │   │       │   ├── tournesol_face.png — 195,9 Kio
│   │   │       │   ├── trefle_cote.png — 191,3 Kio
│   │   │       │   └── trefle_face.png — 189,6 Kio
│   │   │       ├── elements/ — 19,23 Mio
│   │   │       │   ├── eclipse_cote.png — 1,04 Mio
│   │   │       │   ├── eclipse_face.png — 1,09 Mio
│   │   │       │   ├── elements.png — 9,65 Mio
│   │   │       │   ├── gaia_cote.png — 1,46 Mio
│   │   │       │   ├── gaia_face.png — 1,41 Mio
│   │   │       │   ├── ignis_cote.png — 1 017,3 Kio
│   │   │       │   ├── ignis_face.png — 1,21 Mio
│   │   │       │   ├── storm_cote.png — 1,14 Mio
│   │   │       │   └── storm_face.png — 1,25 Mio
│   │   │       ├── haloween_2027/ — 45,91 Mio
│   │   │       │   ├── areignée_cote.png — 1,06 Mio
│   │   │       │   ├── areignée_face.png — 1,18 Mio
│   │   │       │   ├── chauve_souris_cote.png — 1,28 Mio
│   │   │       │   ├── chauve_souris_face.png — 1,31 Mio
│   │   │       │   ├── citrouille_cote.png — 1,11 Mio
│   │   │       │   ├── citrouille_face.png — 998,6 Kio
│   │   │       │   ├── faucheur_cote.png — 1,22 Mio
│   │   │       │   ├── faucheur_face.png — 1,21 Mio
│   │   │       │   ├── haloween_2027.png — 23,05 Mio
│   │   │       │   ├── harley_cote.png — 1,12 Mio
│   │   │       │   ├── harley_face.png — 1,21 Mio
│   │   │       │   ├── joker_cote.png — 978,6 Kio
│   │   │       │   ├── joker_face.png — 1,06 Mio
│   │   │       │   ├── lanterne_cote.png — 1 023,6 Kio
│   │   │       │   ├── lanterne_face.png — 1,05 Mio
│   │   │       │   ├── marionett_cote.png — 1,16 Mio
│   │   │       │   ├── marionett_face.png — 1,06 Mio
│   │   │       │   ├── necromencien_cote.png — 1,29 Mio
│   │   │       │   ├── necromencien_face.png — 1,30 Mio
│   │   │       │   ├── sans_visage_cote.png — 1,13 Mio
│   │   │       │   └── sans_visage_face.png — 1,17 Mio
│   │   │       ├── saison/ — 6,48 Mio
│   │   │       │   ├── automne_cote.png — 378,7 Kio
│   │   │       │   ├── automne_face.png — 419,5 Kio
│   │   │       │   ├── ete_cote.png — 407,8 Kio
│   │   │       │   ├── ete_face.png — 410,7 Kio
│   │   │       │   ├── hiver_cote.png — 430,7 Kio
│   │   │       │   ├── hiver_face.png — 442,6 Kio
│   │   │       │   ├── pringtemps_cote.png — 381,1 Kio
│   │   │       │   ├── pringtemps_face.png — 425,3 Kio
│   │   │       │   └── saison.png — 3,26 Mio
│   │   │       ├── banshee_cote.png — 1,19 Mio
│   │   │       ├── banshee_face.png — 1,24 Mio
│   │   │       ├── deesse_des_ames_cote.png — 1 022,4 Kio
│   │   │       ├── deesse_des_ames_face.png — 1,10 Mio
│   │   │       ├── noce_funebre_abimé_cote.png — 1,18 Mio
│   │   │       ├── noce_funebre_abimé_face.png — 1,04 Mio
│   │   │       ├── noce_funebre_bien_cote.png — 1,06 Mio
│   │   │       ├── noce_funebre_bien_face.png — 1,27 Mio
│   │   │       ├── sirene_cote.png — 1,05 Mio
│   │   │       ├── sirene_face.png — 1,07 Mio
│   │   │       ├── ssmmdt.png — 13,72 Mio
│   │   │       ├── succube_cote.png — 680,7 Kio
│   │   │       ├── succube_face.png — 835,9 Kio
│   │   │       ├── triton_cote.png — 1,11 Mio
│   │   │       └── triton_face.png — 1,22 Mio
│   │   ├── lapins_jouables/ — 40,31 Mio
│   │   │   ├── lapin_evenement/ — 32,73 Mio
│   │   │   │   ├── Halloween/ — 12,34 Mio
│   │   │   │   │   ├── bete.png — 1,41 Mio
│   │   │   │   │   ├── fantome.png — 1,25 Mio
│   │   │   │   │   ├── frank.png — 1,28 Mio
│   │   │   │   │   ├── haloween.png — 6,94 Mio
│   │   │   │   │   └── krampus.png — 1,47 Mio
│   │   │   │   ├── Multi_saisons/ — 12,87 Mio
│   │   │   │   │   └── 5_legendes.png — 12,87 Mio
│   │   │   │   ├── Noel/ — 1,30 Mio
│   │   │   │   │   └── noel.png — 1,30 Mio
│   │   │   │   ├── Nouvel_An_Chinois/ — 4,97 Mio
│   │   │   │   │   ├── Feuille de lapins fantastiques et dragon doré.png — 2,89 Mio
│   │   │   │   │   └── Wushi, lapin guerrier mythique.png — 2,09 Mio
│   │   │   │   └── Paques/ — 1,24 Mio
│   │   │   │       ├── paques_cote1.png — 632,9 Kio
│   │   │   │       └── paques_face1.png — 640,6 Kio
│   │   │   └── sans_evenements/ — 7,58 Mio
│   │   │       ├── bceprt.png — 1,86 Mio
│   │   │       ├── Designer (1).png — 1,92 Mio
│   │   │       ├── Designer.png — 2,08 Mio
│   │   │       └── fleur.png — 1,72 Mio
│   │   ├── magasin/ — 5,93 Mio
│   │   │   ├── aliments/ — 5,93 Mio
│   │   │   │   ├── .gitkeep — 0 octets
│   │   │   │   ├── Planche d’icônes culinaires fleuries et colorées.png — 3,10 Mio
│   │   │   │   └── Planche d’icônes gourmandes et fleuries.png — 2,83 Mio
│   │   │   ├── apothicaire/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   └── produits/ — 0 octets
│   │   │       └── .gitkeep — 0 octets
│   │   ├── oeuf/ — 0 octets
│   │   │   └── .gitkeep — 0 octets
│   │   ├── Ouverture_du_jeu/ — 59,32 Mio
│   │   │   ├── animations/ — 40,20 Mio
│   │   │   │   └── Warrenfall_ouverture_8_secondes.gif — 40,20 Mio
│   │   │   ├── erreur/ — 7,46 Mio
│   │   │   │   ├── Azazel devant la porte interdite-2.png — 2,57 Mio
│   │   │   │   ├── Azazel et le signal interrompu-3.png — 2,37 Mio
│   │   │   │   └── Le chemin perdu d’Azazel-1.png — 2,52 Mio
│   │   │   ├── fonds_4K/ — 6,56 Mio
│   │   │   │   ├── 01_apparition_3840x2160.jpg — 442,2 Kio
│   │   │   │   ├── 02_illumination_3840x2160.jpg — 1,44 Mio
│   │   │   │   ├── 03_ouverture_terrier_3840x2160.jpg — 2,38 Mio
│   │   │   │   └── 04_transition_3840x2160.jpg — 2,30 Mio
│   │   │   ├── logo/ — 619,6 Kio
│   │   │   │   ├── icone_192.png — 85,4 Kio
│   │   │   │   ├── icone_48.png — 6,2 Kio
│   │   │   │   └── icone_512.png — 527,9 Kio
│   │   │   ├── poses/ — 2,01 Mio
│   │   │   │   ├── azazel_course/ — 1,16 Mio
│   │   │   │   │   ├── 02.png — 179,3 Kio
│   │   │   │   │   ├── 03.png — 179,3 Kio
│   │   │   │   │   ├── 04.png — 168,1 Kio
│   │   │   │   │   ├── 05.png — 170,8 Kio
│   │   │   │   │   ├── 06.png — 163,8 Kio
│   │   │   │   │   ├── 07.png — 165,4 Kio
│   │   │   │   │   └── 08.png — 159,6 Kio
│   │   │   │   └── carotte_course/ — 871,2 Kio
│   │   │   │       ├── 02.png — 127,2 Kio
│   │   │   │       ├── 03.png — 125,7 Kio
│   │   │   │       ├── 04.png — 114,6 Kio
│   │   │   │       ├── 05.png — 128,0 Kio
│   │   │   │       ├── 06.png — 125,0 Kio
│   │   │   │       ├── 07.png — 131,4 Kio
│   │   │   │       └── 08.png — 119,4 Kio
│   │   │   └── sources_animation/ — 2,48 Mio
│   │   │       ├── azazel_course_planche.png — 1,50 Mio
│   │   │       └── carotte_course_planche.png — 1 003,6 Kio
│   │   ├── puzzle/ — 0 octets
│   │   │   ├── de_base/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Halloween/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Multi_saisons/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Noel/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── Nouvel_An_Chinois/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   └── Paques/ — 0 octets
│   │   │       └── .gitkeep — 0 octets
│   │   ├── Zone_Chambre/ — 66,1 Kio
│   │   │   └── dodo.gif — 66,1 Kio
│   │   ├── Zone_cuisine/ — 60,4 Kio
│   │   │   └── lapin_cuisine.gif — 60,4 Kio
│   │   ├── Zone_jardin/ — 141,1 Kio
│   │   │   └── entrainement.png — 141,1 Kio
│   │   └── Zone_SdB/ — 935,8 Kio
│   │       └── lapin_SdB.gif — 935,8 Kio
│   └── js/ — 812,1 Kio
│       ├── achievements.js — 7,0 Kio
│       ├── apothecary-effects.js — 1,4 Kio
│       ├── auto-nests.js — 1,6 Kio
│       ├── bootstrap.min.js — 59,2 Kio
│       ├── boss-abilities.js — 8,0 Kio
│       ├── connection-notice.js — 1,2 Kio
│       ├── dashboard-access.js — 5,0 Kio
│       ├── dashboard-ui.js — 7,2 Kio
│       ├── dashboard.js — 53,5 Kio
│       ├── event-reminders.js — 1,4 Kio
│       ├── exploration.js — 13,6 Kio
│       ├── game-economy.js — 1,4 Kio
│       ├── game-guide.js — 7,6 Kio
│       ├── grid-stroke.js — 439 octets
│       ├── image-assets.js — 7,7 Kio
│       ├── image-interactions.js — 443 octets
│       ├── image-manifest.js — 89,2 Kio
│       ├── installer.js — 8,3 Kio
│       ├── jquery-3.6.1.min.js — 87,6 Kio
│       ├── lapidoku.js — 3,6 Kio
│       ├── legal.js — 1,5 Kio
│       ├── local-files.js — 8,7 Kio
│       ├── mobile-ui.js — 4,2 Kio
│       ├── number-sudoku.js — 3,3 Kio
│       ├── pantry.js — 16,8 Kio
│       ├── pixel-coloring.js — 18,1 Kio
│       ├── plant-sheets.js — 956 octets
│       ├── puzzle-data.js — 2,4 Kio
│       ├── quiz-dashboard.js — 4,9 Kio
│       ├── quiz.js — 5,9 Kio
│       ├── save-safety.js — 3,5 Kio
│       ├── save-validation.js — 3,9 Kio
│       ├── scene-preload.js — 1,2 Kio
│       ├── script.js — 288,3 Kio
│       ├── shop.js — 61,6 Kio
│       ├── species-data.js — 12,5 Kio
│       ├── startup.js — 7,2 Kio
│       ├── team-rules.js — 1,5 Kio
│       └── welcome-gift.js — 367 octets
├── docs/ — 2,32 Mio
│   ├── archives/ — 38,4 Kio
│   │   └── a-faire/ — 38,4 Kio
│   │       ├── a faire - original.txt — 6,7 Kio
│   │       ├── a faire.txt — 8,0 Kio
│   │       ├── a faire(1).txt — 6,7 Kio
│   │       ├── A_FAIRE_avant_2026-10-14.md — 16,4 Kio
│   │       └── README.md — 536 octets
│   ├── exports/ — 395,8 Kio
│   │   └── 5VmsAFi7 - clikergame.json — 395,8 Kio
│   ├── references/ — 1,70 Mio
│   │   └── allimentation.pdf — 1,70 Mio
│   ├── AUDIT_SEO.md — 3,7 Kio
│   ├── AUDIT_VISUELS_GOOGLE_PLAY.md — 52,9 Kio
│   ├── CUISINE.md — 1,5 Kio
│   ├── DIAGNOSTIC_CLOUDINARY_2026-10-19.md — 5,2 Kio
│   ├── DIAGNOSTIC_PLANNING_ACTIONS_2026-10-24.md — 9,2 Kio
│   ├── DIAGNOSTIC_RAPPORTS_2026-10-23.md — 5,0 Kio
│   ├── DIAGNOSTIC_REVEIL_S0.md — 16,8 Kio
│   ├── FIABILISATION_AUTOMATISATIONS.md — 7,5 Kio
│   ├── INSTALLATION_ET_SECURITE.md — 3,1 Kio
│   ├── Lapinous_publication_et_revenus.pdf — 39,2 Kio
│   ├── MAGASIN.md — 14,3 Kio
│   ├── MIGRATION_CLOUDINARY.md — 6,7 Kio
│   ├── MIGRATION_GITHUB_ACTIONS.md — 17,9 Kio
│   ├── NOUVEL_AN_CHINOIS.md — 3,1 Kio
│   ├── PUZZLES.md — 4,9 Kio
│   ├── RENOMMAGE_WARRENFALL.md — 7,6 Kio
│   ├── SAUVEGARDES_JOUEURS.md — 2,2 Kio
│   └── VALIDATION_ACTIONS_2026-10-23.md — 4,2 Kio
├── Lapinous sauvegarde/ — 4,97 Mio
│   ├── admin.json — 233,3 Kio
│   ├── lapinous-azazel-10-10-2026_21h11.json — 19,7 Kio
│   ├── lapinous-azazel-10-10-2026_23h55.json — 19,7 Kio
│   ├── lapinous-azazel-2026-09-30_21h58.json — 3,8 Kio
│   ├── warrenfall-petit-nid-auto-1.json — 1,57 Mio
│   ├── warrenfall-petit-nid-auto-2.json — 1,57 Mio
│   └── warrenfall-petit-nid-auto-3.json — 1,57 Mio
├── Lapinous_documents_juridiques/ — 84,6 Kio
│   ├── 00_LIRE_AVANT_PUBLICATION.md — 3,6 Kio
│   ├── 01_CGU.html — 7,8 Kio
│   ├── 02_CGV_carottes.html — 8,0 Kio
│   ├── 03_confidentialite.html — 7,9 Kio
│   ├── 04_mentions_legales.html — 2,8 Kio
│   ├── 05_credits_IA_licences.html — 3,1 Kio
│   ├── 06_retractation_remboursement.html — 3,8 Kio
│   ├── 07_suppression_donnees.html — 3,0 Kio
│   ├── 08_registre_ressources.csv — 473 octets
│   ├── 09_integration_codex.md — 2,8 Kio
│   ├── 10_sources.md — 2,4 Kio
│   ├── 11_registre_traitements.csv — 2,1 Kio
│   └── Lapinous_documents_juridiques.pdf — 36,9 Kio
├── liste de futur création/ — 36,2 Kio
│   ├── futur_lapin.md — 25,9 Kio
│   └── future_boss.md — 10,2 Kio
├── tools/ — 560,2 Kio
│   ├── agent_lapinous/ — 156,0 Kio
│   │   ├── .gitignore — 18 octets
│   │   ├── agent.py — 28,9 Kio
│   │   ├── bot_discord.py — 2,4 Kio
│   │   ├── chaine_20h.ps1 — 318 octets
│   │   ├── chaine_commune.ps1 — 5,5 Kio
│   │   ├── cloudinary_rapport.py — 4,8 Kio
│   │   ├── configurer_rapports.ps1 — 1,2 Kio
│   │   ├── etat_batterie.json — 115 octets
│   │   ├── INSTALLATION.md — 732 octets
│   │   ├── installer_batterie.ps1 — 1,3 Kio
│   │   ├── installer_chaine_20h.ps1 — 166 octets
│   │   ├── installer_taches.ps1 — 2,6 Kio
│   │   ├── liaisons_trello.json — 42,4 Kio
│   │   ├── README_INSTALLATION.md — 11,4 Kio
│   │   ├── requirements.txt — 38 octets
│   │   ├── reseau.py — 1,6 Kio
│   │   ├── suivi_trello.py — 10,1 Kio
│   │   ├── surveillance_batterie.py — 4,9 Kio
│   │   ├── synchronisation_20h.ps1 — 213 octets
│   │   ├── test_chaine_agent.py — 6,3 Kio
│   │   ├── test_chaine.ps1 — 2,3 Kio
│   │   ├── test_fiabilisation.py — 4,1 Kio
│   │   ├── test_installateur.ps1 — 2,7 Kio
│   │   ├── test_suivi_trello.py — 15,9 Kio
│   │   ├── test_validation_resilience.py — 5,9 Kio
│   │   └── trello_automatisation.json — 23 octets
│   ├── automation/ — 152,7 Kio
│   │   ├── __pycache__/ — 63,4 Kio
│   │   │   ├── core.cpython-313.pyc — 9,5 Kio
│   │   │   ├── remote.cpython-313.pyc — 25,5 Kio
│   │   │   ├── report_probe.cpython-313.pyc — 9,8 Kio
│   │   │   ├── reporting.cpython-313.pyc — 4,5 Kio
│   │   │   ├── state_store.cpython-313.pyc — 6,9 Kio
│   │   │   └── transports.cpython-313.pyc — 7,1 Kio
│   │   ├── .env.example — 255 octets
│   │   ├── config.json — 177 octets
│   │   ├── core.py — 6,0 Kio
│   │   ├── local_bridge.py — 6,6 Kio
│   │   ├── remote.py — 18,2 Kio
│   │   ├── report_fallback.py — 5,0 Kio
│   │   ├── report_probe.py — 5,6 Kio
│   │   ├── reporting.py — 3,3 Kio
│   │   ├── schedule_gate.py — 1,1 Kio
│   │   ├── state_admin.py — 2,5 Kio
│   │   ├── state_store.py — 3,9 Kio
│   │   ├── test_hybrid.py — 14,1 Kio
│   │   ├── test_permanent_backup.py — 2,4 Kio
│   │   ├── test_reporting.py — 12,6 Kio
│   │   ├── test_schedule.py — 772 octets
│   │   ├── test_trello_resilience.py — 2,4 Kio
│   │   └── transports.py — 4,2 Kio
│   ├── notebooks/ — 11,1 Kio
│   │   └── fichier_inutiliser.ipynb — 11,1 Kio
│   ├── tests-archives/ — 39,7 Kio
│   │   ├── test-cashier-route.mjs — 1,6 Kio
│   │   ├── test-dashboard-cards.mjs — 4,4 Kio
│   │   ├── test-image-assets.mjs — 3,5 Kio
│   │   ├── test-image-backup.mjs — 2,3 Kio
│   │   ├── test-image-browser.mjs — 6,1 Kio
│   │   ├── test-local-files.mjs — 2,1 Kio
│   │   ├── test-market-layout.mjs — 7,7 Kio
│   │   ├── test-pantry-eating.mjs — 3,3 Kio
│   │   ├── test-pantry-route.mjs — 3,5 Kio
│   │   ├── test-quiz.mjs — 3,6 Kio
│   │   └── test-shop-catalog.mjs — 1,6 Kio
│   ├── backup-transferred-images.mjs — 2,9 Kio
│   ├── cloudinary-activate.mjs — 3,6 Kio
│   ├── cloudinary-corbeille.mjs — 9,9 Kio
│   ├── cloudinary-deletion-policy.json — 214 octets
│   ├── cloudinary-deletion-policy.mjs — 275 octets
│   ├── cloudinary-sync.mjs — 15,4 Kio
│   ├── diagnostic-reveil-admin.ps1 — 1,4 Kio
│   ├── image-manifest-store.mjs — 2,4 Kio
│   ├── install-image-schedule.ps1 — 2,3 Kio
│   ├── prepare-lossless-opening.py — 1,8 Kio
│   ├── remote-network.mjs — 1,9 Kio
│   ├── run-image-schedule.ps1 — 334 octets
│   ├── serve-game.py — 1,7 Kio
│   ├── test_serve_game.py — 1,7 Kio
│   ├── test-achievements.mjs — 2,3 Kio
│   ├── test-apothecary-effects.mjs — 3,0 Kio
│   ├── test-audio-events.mjs — 1,5 Kio
│   ├── test-auto-nest-files.mjs — 2,4 Kio
│   ├── test-auto-nests.mjs — 1,6 Kio
│   ├── test-boss-abilities.mjs — 4,9 Kio
│   ├── test-cloudinary-corbeille-api.mjs — 3,2 Kio
│   ├── test-cloudinary-deletion-policy.mjs — 822 octets
│   ├── test-cloudinary-partial.mjs — 1,9 Kio
│   ├── test-combat-facing.cjs — 1,1 Kio
│   ├── test-event-reminders.mjs — 1,9 Kio
│   ├── test-exploration.mjs — 3,3 Kio
│   ├── test-game-economy.mjs — 1,4 Kio
│   ├── test-image-chain-safety.mjs — 1,7 Kio
│   ├── test-install-visibility.mjs — 1,1 Kio
│   ├── test-landscape-game.mjs — 62,6 Kio
│   ├── test-lapidoku.mjs — 2,9 Kio
│   ├── test-mobile-game.mjs — 5,4 Kio
│   ├── test-number-sudoku.mjs — 2,4 Kio
│   ├── test-permanent-backup.mjs — 2,8 Kio
│   ├── test-pixel-coloring.mjs — 2,7 Kio
│   ├── test-pwa.mjs — 4,1 Kio
│   ├── test-quiz-selection.mjs — 1,4 Kio
│   ├── test-remote-network.mjs — 1,2 Kio
│   ├── test-reveil-horodatage.ps1 — 540 octets
│   ├── test-reveil-s0.ps1 — 3,8 Kio
│   ├── test-reveil-s4.ps1 — 1 011 octets
│   ├── test-save-picker.mjs — 1,3 Kio
│   ├── test-save-safety.mjs — 5,5 Kio
│   ├── test-season-banner.mjs — 1,8 Kio
│   ├── test-startup.mjs — 2,0 Kio
│   ├── test-team-rules.mjs — 3,8 Kio
│   ├── test-welcome-gift.mjs — 758 octets
│   ├── update-images.mjs — 8,6 Kio
│   └── update-readme-sizes.mjs — 8,4 Kio
├── .gitignore — 703 octets
├── 403.html — 748 octets
├── 404.html — 760 octets
├── A_FAIRE.md — 205,5 Kio
├── AGENTS.md — 875 octets
├── dashboard.html — 17,5 Kio
├── index.html — 26,2 Kio
├── lapinous-content.json — 83,4 Kio
├── lapinous-puzzles.json — 5,4 Kio
├── lapinous-quiz.json — 38,8 Kio
├── lapinous-shop.json — 32,6 Kio
├── manifest.json — 570 octets
├── offline.html — 805 octets
├── readme.md — 67,9 Kio
├── sw.js — 4,1 Kio
└── Synchroniser les images.cmd — 204 octets
```

Poids total du projet : **309,27 Mio** (324 292 712 octets), calculé le 24 octobre 2026.

Pour recalculer cette section : `node tools/update-readme-sizes.mjs`. Ce script mesure la sauvegarde permanente `clikergame_avec_image` en lecture seule et ne la modifie jamais.

## 🧩 Ajouter un puzzle

Le plus simple est de passer par le Dashboard, mais le fichier peut aussi être édité directement dans `lapinous-puzzles.json`.

Exemple :

```json
{
  "id": "mon_puzzle",
  "title": "Mon puzzle",
  "image": "./assets/img/puzzle/de_base/mon_puzzle.png",
  "linkedSpecies": ["azur", "caramel"]
}
```

Les lapins liés servent à préparer les futures interactions entre les mini-jeux, la progression et les fiches de personnages.

## 🛠️ Dashboard

Le Dashboard permet notamment de :

- ajouter et modifier les lapins ;
- ajouter et modifier les boss ;
- rechercher les personnages ;
- filtrer les lapins par événement ;
- configurer les taux d'œufs ;
- régler la durée des événements ;
- gérer les puzzles et leurs lapins liés ;
- vérifier les visuels manquants ;
- consulter les graphiques de rareté et de difficulté ;
- exporter / importer les JSON de contenu.

## 🚀 Lancer le projet en local

Le jeu charge ses données avec `fetch()`. Il faut donc utiliser un petit serveur local plutôt que d'ouvrir directement `index.html` par double-clic.

### Avec Python

Depuis la racine du projet :

```bash
python tools/serve-game.py --port 8001
```

Puis ouvrir :

```text
http://localhost:8001/
```

## 🌐 Mise en ligne

Le projet peut être hébergé comme site statique, par exemple sur GitHub Pages.

Attention : sur un hébergement Linux, **les majuscules/minuscules dans les chemins de fichiers sont importantes**. Les noms utilisés dans le code doivent correspondre exactement aux dossiers présents, notamment :

```text
Zone_cuisine
Zone_Chambre
Zone_SdB
Zone_jardin
```

Les décors principaux sont désormais en `.png` dans `assets/img/fond/`.

## 💾 Sauvegardes

Les sauvegardes conservent notamment :

- le lapin actif ;
- les lapins possédés ;
- les besoins ;
- le niveau et l'amitié ;
- les carottes et les œufs ;
- les améliorations ;
- les doublons et renforcements ;
- la progression dans les mini-jeux ;
- les boss rencontrés.

## 🔮 Développements prévus

Le projet continue d'évoluer. Parmi les pistes déjà prévues :

- nouveaux défis et équilibrage des 30 niveaux de Memory ;
- nouvelles grilles de Lapidoku ;
- nouveaux puzzles ;
- nouvelles compétences de combat ;
- nouveaux boss ;
- nouveaux lapins communs et événementiels ;
- événements saisonniers supplémentaires ;
- sons et ambiances propres aux événements.

## 🏆 Succès et récompenses

Le bouton 🏆 conserve les records et donne accès à cinq défis quotidiens : revenir jouer, réussir un jeu, vaincre un boss, parcourir au moins 20 m en agilité et ouvrir un œuf. Ils rapportent chacun de 3 à 8 carottes à récupérer manuellement et se renouvellent à minuit selon l’heure de l’appareil.

Les grands succès récompensent la collection, les niveaux, les victoires, les jeux réussis et les œufs ouverts, avec des paliers allant jusqu’à 200 carottes. Chaque palier se récupère une seule fois par partie. Les records existants servent aux objectifs permanents ; les défis quotidiens comptent les actions réalisées depuis leur ajout.

L’historique des jours, la progression et les récompenses récupérées sont conservés dans les sauvegardes et les exports JSON. Une récompense quotidienne gagnée reste récupérable les jours suivants. Charger une ancienne sauvegarde restaure l’état des succès de cette sauvegarde.

## 👩‍💻 Autrice

- [Florie](https://github.com/Leven-Anju-Yuki) — développeuse principale

## 🤖 Utilisation de l’intelligence artificielle

Le projet a bénéficié de l’aide d’outils d’intelligence artificielle :

- **Copilot** : aide à la rédaction des prompts et génération d’images.
- **Gemini** : génération d’images.
- **ChatGPT et Claude** : aide au développement et à l’écriture du code.


## Tests de produits en administrateur

Les curseurs Admin permettent de baisser nourriture, sommeil et propreté du lapin actif ; le bouton 25 % prépare les essais de consommables. La restauration de la partie avant tests reste disponible. Les jeux adaptent leurs grilles à la hauteur de l’écran ; l’aperçu de pièce du puzzle se referme au clic.

### Administration et visibilité

Depuis le bouton Admin, choisir **Ouvrir le Dashboard**. Le raccourci cadenas a été retiré de l’encyclopédie. La section **Visibilité du jeu** configure magasin, apothicairerie, documents juridiques, encyclopédie, puzzles, Memory, Lapidoku et combats. Les choix sont conservés localement ; pour les publier, exporter le contenu du Dashboard et remplacer `lapinous-content.json` à la racine par cet export. Les valeurs `public`, `admin` et `hidden` sont définies dans `visibility`. Cela pilote l’affichage, sans constituer une protection d’accès aux fichiers. Les documents juridiques restent en mode admin par défaut.

Le son `assets/audio/combat/bouclier_activation.mp3` accompagne la création d’une protection (technique, ultime d’équipe et ultime du boss), indépendamment du son d’impact sur un bouclier.

Les puzzles fixent désormais chaque pièce dès sa bonne pose. L’aperçu utilise la zone à droite du plateau. Le Memory utilise des cartes et commandes plus compactes pour limiter le défilement ; disposition vérifiée à 1250 × 720.

Correction des noms au rechargement : `speciesNames` reste la source des noms individuels ; le nom global ancien ne migre que si ce dictionnaire était absent. Le champ de compatibilité `rabbitName` est synchronisé sur le lapin actif lors de l’enregistrement. Admin → **Tester tous les niveaux des jeux** ouvre les derniers niveaux sans modifier les verrous de progression enregistrés.

À l’ouverture d’un œuf ou de dix œufs, les taux par rareté proviennent de `loadEggRates()`. L’enregistrement dans le Dashboard actualise les taux affichés, y compris dans un autre onglet du même site. Pour partager ces réglages avec les joueurs, exporter puis remplacer `lapinous-content.json`. Le catalogue puzzles du Dashboard utilise des cartes illustrées.

Le Dashboard regroupe ses sections dans des accordéons et propose un menu d’accès rapide. Le catalogue magasin peut être édité et exporté dans sa section dédiée ; la version de test locale est stockée sous `lapinous_shop_catalog` et utilisée uniquement sur localhost. Recharge le jeu après enregistrement. La publication utilise toujours le fichier `lapinous-shop.json`.

La cuisine propose une portion gratuite réduite, une réserve d’aliments achetés au Marché et quatre recettes à bonus temporaires. Les évolutions des pièces comptent cinq étapes avec déblocages aux niveaux d’amitié 5/10/15/20 puis achats en carottes. Voir [docs/CUISINE.md](docs/CUISINE.md). Le visuel dédié du Chef reste à fournir ; son entrée est centralisée dans le catalogue.

Mise à jour cuisine : réserve ouverte uniquement au clic sur le frigo ; Marché de fraises, poires, courgettes et fleurs. Les plats spéciaux et bonus sont suspendus par `recipesEnabled: false`, en attendant la refonte du combat. Les données et stocks restent conservés.

<!-- LAPINOUS_AGENT_DEBUT -->
### Inventaire automatique

| Dossier | Fichiers | Taille |
|---|---:|---:|
| `assets/` | 272 | 312.89 Mo |
| `docs/` | 16 | 0.18 Mo |
| `tools/` | 70 | 0.31 Mo |

_Inventaire local uniquement : les images déjà archivées ne sont pas considérées manquantes._
<!-- LAPINOUS_AGENT_FIN -->


### Installer le jeu sur téléphone

Ouvrir Warrenfall en HTTPS dans Chrome et utiliser **Installer le jeu** (accueil ou sauvegardes). Sur Safari : **Partager → Sur l’écran d’accueil**. L’application demande le paysage ; si le navigateur refuse le verrouillage, tourner le téléphone. Les modifications locales doivent être publiées avant d'apparaître sur le site.

Le service worker conserve les fichiers publics du jeu et les 120 dernières images consultées. Les autres images nécessitent Internet. Il ne copie pas les sauvegardes dans le cache et ne remplace pas les exports JSON personnels. Les caches sont isolés par chemin du projet, pour préserver les autres applications du même domaine.


### Automatisation du soir

Une seule tâche Windows Images existante à **20 h Europe/Paris** conserve Cloudinary et les sauvegardes permanentes. En mode hybride actif, les bilans et traitements Trello/corbeille sont distants, avec un signal de fin de synchronisation actif et un planning GitHub de secours à 20 h 07 quand le PC est indisponible. Aucun accord quotidien n'est requis ; les cycles déjà livrés sont reconnus pour éviter les doublons. Le rapport complet couvre Cloudinary, Git, Trello, README, A_FAIRE, quarantaine et erreurs, puis part sur Discord. La corbeille Cloudinary conserve sa règle de sept jours et les attestations exactes de sauvegarde ; aucune purge locale. Voir le [diagnostic du relais](docs/DIAGNOSTIC_RELAIS_2026-10-25.md) et `tools/agent_lapinous/README_INSTALLATION.md`.

Le serveur `tools/serve-game.py` renvoie les illustrations Warrenfall avec les vrais codes HTTP 403/404, même sans service worker installé. Après remplacement d’un ancien serveur `python -m http.server`, arrêter celui-ci (Ctrl+C dans son terminal), puis lancer la commande ci-dessus. GitHub Pages utilise le fichier racine `404.html` après publication.

## Règles et présentation — 19 octobre 2026

- Mini-jeux : 2 carottes par partie réussie, 3 à partir du quatrième niveau, y compris en rejouant un niveau. L’amitié reste la récompense principale. Quiz : paliers de score ; agilité : paliers de distance à partir de 20 m.
- Victoires sur les boss : max(6, arrondi(difficulté × 0,45)) carottes et 35 % de chance de recevoir un ingrédient du Marché. Le butin rejoint l’inventaire partagé utilisé par la Cuisine.
- Évolutions des pièces : communes à tous les lapins, palier maximum existant conservé lors de la migration. Besoins, amitié, techniques et niveaux restent individuels.
- Ingrédients et repas : réserve de Cuisine. Soins : tiroirs de l’apothicaire. Les deux stocks sont communs à la partie.
- Le GIF d’introduction est joué une fois dans une nouvelle session d’onglet ; un rechargement affiche directement le fond de chargement. Les ressources nécessaires à l’accueil, aux soins, au magasin et aux animations des accompagnateurs sont préparées avant l’entrée. Une ressource requise indisponible maintient l’écran de chargement avec un bouton Réessayer ; les décors alternatifs inutilisés ne sont pas tous téléchargés.
- Les sons d’événement suspendent temporairement l’ambiance. Le tutoriel utilise le parchemin du jeu et présente le mage des fragments.


## Technologies utilisées et raisons de ces choix

| Technologie | Rôle dans Warrenfall | Pourquoi ce choix |
| --- | --- | --- |
| HTML5 et CSS3 (Grid, Flexbox, media queries) | Écrans, décors, modales et adaptations aux dimensions | Garder un jeu accessible dans un navigateur et adapter les commandes au téléphone comme au PC. |
| JavaScript natif | Règles, mini-jeux, économie, animations et Dashboard | Partager directement les données et fonctions du jeu, sans chaîne de compilation obligatoire. |
| Bootstrap local | Structure des dialogues et composants d’interface | Réutiliser les composants existants sans dépendre de leur CDN au lancement. |
| JSON | Catalogues, niveaux, réglages, manifeste des images et exports de sauvegarde | Séparer contenu et logique ; rendre les données éditables et exportables. |
| localStorage, IndexedDB et File System Access API selon disponibilité | Conservation locale et accès aux sauvegardes | Reprendre la partie et mémoriser les accès autorisés ; prévoir export/import lorsque le navigateur ne permet pas l’accès aux dossiers. |
| PWA : manifeste, Service Worker et Cache API | Installation et cache des ressources | Ouvrir le jeu comme une application et réutiliser les ressources mises en cache ; cela ne garantit pas que tout le catalogue soit disponible hors connexion. |
| GIF, PNG/JPEG et API audio du navigateur | Décors, personnages animés, effets et ambiances | Employer les créations visuelles et sonores du projet, avec préchargement et gestion de la superposition. |
| Node.js et scripts `.mjs` | Préparation des médias, synchronisation et tests | Automatiser les outils du projet en JavaScript, séparément du jeu exécuté dans le navigateur. |
| Cloudinary | Hébergement et distribution des images | Centraliser les médias distants et leurs versions ; sauvegarde locale permanente et quarantaine logique de sept jours conservées. |
| Python (`requests`, `python-dotenv`) | Agent de bilan, suivi Git/Trello, rapports Discord et surveillance batterie | Regrouper les contrôles, diagnostics réseau et rapports ; isoler les secrets dans l’environnement. |
| PowerShell et Planificateur Windows | Chaîne quotidienne et démarrage des scripts | Réutiliser les tâches existantes, leurs journaux et protections contre les exécutions simultanées. |
| Git, API Trello et webhooks Discord | Historique, suivi des cartes et notifications | Relier le suivi aux modifications prouvées et transmettre les résultats sans publier automatiquement le code. |
| Tests Node/Python/PowerShell et Chrome headless | Tests de règles, simulations et contrôles de rendu | Vérifier les régressions avec des doublures des services distants, sans synchronisation réelle. |

### Rattrapage Windows réactivé — 19 octobre 2026

La tâche existante « Lapinous - Images Cloudinary 20h » conserve son déclenchement quotidien à 20 h Europe/Paris. `StartWhenAvailable=True` permet de rattraper une exécution manquée dès que Windows le permet, y compris le lendemain. Ce réglage ne garantit ni le réveil de la veille S0 ni l’exécution capot fermé ; les autres conditions Windows restent applicables.

La seule modification de la définition Windows est ce booléen, vérifiée par comparaison XML. La tâche reste active, `MultipleInstances=IgnoreNew` est conservé et la chaîne garde son verrou exclusif `chaine.lock`. Cloudinary reste suivi immédiatement du bilan global, de Trello et de Discord, même en cas d’échec. Aucune synchronisation n’a été lancée pour ce contrôle. Quarantaine, sauvegardes, actions et autres tâches inchangées. Attention : l’ancien installateur fixe encore le rattrapage à faux ; ne pas le réappliquer pour ce seul réglage.

Typographie : Cinzel Decorative (titres fantasy proches du lettrage du logo) et EB Garamond (texte de livre), fichiers locaux dans `assets/fonts/`, licences SIL OFL conservées. Le tutoriel utilise l’image de page fournie comme fond, sans panneaux colorés superposés.

« Les petits secrets du terrier » accompagne la découverte en 8 courtes étapes illustrées : soins, sources d’amitié, niveaux, carottes, boss et préparation de combat, puis rôles des accompagnateurs. Une couverture se déplie à l’ouverture (sans animation si mouvement réduit). Les soins restaurent les besoins ; l’amitié est gagnée en jouant et lors des victoires.

Le GIF d’ouverture utilise une copie web de 7,8 Mo (640 × 360, 15 images/s, 8 secondes) compatible avec la limite de transfert Cloudinary de 10 Mo constatée ; original intact. Le bilan distingue les nouvelles images, les versions modifiées, les échecs et la quarantaine avec jours restants. Un transfert partiellement refusé conserve les autres réussites mais interdit activation et quarantaine jusqu’à une synchronisation complète.

Sécurité du 19 octobre : les suppressions Cloudinary sont explicitement suspendues par `tools/cloudinary-deletion-policy.json`, y compris si le fichier est absent ou illisible. Les échéances de quarantaine ne valent pas autorisation de suppression. Voir `docs/DIAGNOSTIC_CLOUDINARY_2026-10-19.md` pour la limite de taille de l’ouverture et les tests de qualité sans transfert.

Consigne actuelle confirmée le 19 octobre : suppression Cloudinary automatique réactivée après sept jours de quarantaine, sans nouvelle confirmation par image. Elle reste conditionnée à une synchronisation réussie, une sauvegarde exacte et tous les contrôles techniques ; les simulations restent sans suppression. Cette autorisation remplace le gel demandé plus tôt le même jour.

Interface 113 : catalogue actuel avec recettes activées ; sélecteur de plats en fiches, présentation séparée des plats prêts. Tiroirs : une touche décrit le soin, double touche rapide l’utilise. Œuf de bienvenue confirmé par reçu dans chaque sauvegarde ; rattrapage unique des anciennes parties dont le verrou navigateur bloquait le cadeau. Le trophée signale les récompenses disponibles avec un point d’exclamation. Chargement limité à quatre images simultanées, nouvelle tentative automatique puis bouton de reprise ; visuels non répertoriés du catalogue exclus du préchargement anticipé.

### Premières aventures et affinités — 21 octobre 2026

Dans Jardin → Aventure, les petits légumes précèdent les boss : Radis Fripon, Navet Bougon et Petit Pois Malicieux. Ils sont adaptés aux premiers niveaux. Une victoire donne 3 points d’amitié par participant et 4, 4 ou 5 carottes ; aucun ingrédient ni succès de boss. Les boss conservent leurs propres récompenses.

Avant le combat, « Les liens de ton équipe » affiche les amis et les rivalités : +5 % ou −5 % de puissance pour chaque paire concernée, limité à ±10 % par lapin. Cela ne modifie pas les niveaux, les besoins ou l’amitié de la sauvegarde. Les effets sont identiques en manuel et en automatique. Exemples : Azur/Bambou et Caramel/Flamme s’encouragent ; Azur/Flamme et Mocha/Spark ont des rivalités. Les lapins d’un événement actif remontent dans les listes, sans changer les taux d’œufs.

Visuels à fournir : dans `lapinous-content.json`, rubrique `opponents`, remplacer `faceImg` et `coteImg` par les futurs chemins d’images. Les champs `imageSlot` identifient les trois emplacements (`radis`, `navet`, `petit_pois`). Chemins suggérés pour les futures images : `assets/img/adversaires/radis.png`, `navet.png`, `petit_pois.png`. Ces fichiers ne sont pas encore requis : une image neutre « Visuel à venir » est affichée en attendant. L’export/import du Dashboard conserve cette rubrique.

Installation mobile : le bouton Installer est accessible sur l’écran de rotation et en haut du jeu, hors de la navigation encombrée. Il déclenche l’invitation native si le navigateur la fournit ; sinon l’aide donne le menu à utiliser et permet de copier le lien. Une ancienne confirmation enregistrée ne suffit plus à cacher l’installation. Dans l’application autonome, aucune nouvelle installation n’est proposée. Les fichiers locaux doivent être publiés avant de tester le correctif sur le site public ; ne pas effacer les données ou les sauvegardes pour corriger une icône.

Vérifications : `node tools/test-team-rules.mjs`, `node tools/test-install-visibility.mjs`, `node tools/test-pwa.mjs`, puis `node tools/test-landscape-game.mjs --quick --family --ui-only --adventure` (ajouter `--desktop` pour le PC). Les tests utilisent un profil isolé ; aucune partie réelle ni service distant n’est modifié.

### Rappels des événements

À partir de cinq jours avant le début de chaque période événementielle, un rappel apparaît dans le jeu avec la date de début. Il respecte les fenêtres du Dashboard, Pâques et le Nouvel An chinois. Si le jeu était fermé à J−5, le rappel peut encore apparaître à la prochaine visite avant le début. Un seul rappel par événement et par année est mémorisé dans le navigateur, quel que soit le lapin ; effacer les données du navigateur efface aussi cette mémoire. Pas de notification système jeu fermé : un service push serait nécessaire. Tests : `node tools/test-event-reminders.mjs`.

Le bandeau d’annonce de saison est compact et refermable ; il disparaît après sept secondes et ne réapparaît pas à chaque actualisation dans la même session. Les décors et lapins d’événement restent actifs. Test : `node tools/test-season-banner.mjs`.


### Mettre à jour l’application Chrome sans la désinstaller

Sauvegarde la partie, ouvre Warrenfall avec Internet pour récupérer les nouveaux fichiers, puis ferme complètement l’application et tous les onglets Warrenfall dans Chrome avant de rouvrir le jeu. Une nouvelle version du cache peut attendre la fermeture des anciennes fenêtres ; un second lancement peut donc être nécessaire. Le jeu essaie le réseau avant son cache hors connexion pour les scripts et pages. Ses mises à jour ne purgent ni localStorage ni IndexedDB des joueurs. Ne pas désinstaller ni effacer les données du site pour mettre à jour. L’icône et le nom Android suivent le mécanisme WebAPK de Chrome et peuvent changer plus tard que le contenu du jeu.

Références : https://web.dev/articles/service-worker-lifecycle et https://web.dev/learn/pwa/update .


### Compatibilité et protection des parties

Les formats anciens, intermédiaires et actuels sont migrés sur une copie, avec conservation des champs inconnus et de la progression. Une archive source distincte est enregistrée avant chaque migration d’ancienne partie ; la sauvegarde précédente est conservée avant remplacement. Une autre fenêtre ayant modifié la partie ou une erreur de stockage bloque l’écriture et affiche une alerte.

Un fichier illisible ou provenant d’une version future ne déclenche pas une partie neuve par-dessus : un écran permet de télécharger l’original et de restaurer la copie de secours. La déconnexion crée une sauvegarde nommée avant de retirer la reprise automatique ; elle est annulée si cette copie échoue. Le cache PWA ne purge pas les sauvegardes des joueurs.

Ces protections ne remplacent pas un export JSON hors du navigateur : effacement des données du site, nettoyage du système ou panne du stockage peuvent détruire les copies locales. Conserver une copie externe avant une désinstallation ou un changement d’appareil. Tests : `node tools/test-save-safety.mjs` et `node tools/test-landscape-game.mjs --quick --ui-only --save-compat` ; ajouter `--save-corrupt` pour vérifier la récupération.
## Automatisations hybrides : relais GitHub Actions actif

Le relais Windows / GitHub Actions est **activé**. Windows conserve les transferts Cloudinary, la sauvegarde locale permanente et la surveillance de batterie. Actions exécute les bilans détaillés Discord, le suivi Trello et la corbeille Cloudinary vers 20 h Europe/Paris. L’état privé conserve les quarantaines, attestations HMAC-SHA256, confirmations Discord et points de reprise ; un verrou partagé coordonne les deux environnements.

Technologies : Python (`requests`, `python-dotenv`, `zoneinfo`), Node.js pour les transferts existants, PowerShell pour le lanceur local, YAML GitHub Actions pour le cron `Europe/Paris`, API GitHub Contents/Blobs pour la persistance privée avec comparaison de SHA. Les images et sauvegardes privées ne sont pas envoyées à GitHub. Aucun push automatique du dépôt du jeu.

Voir [l’architecture et les validations](docs/MIGRATION_GITHUB_ACTIONS.md). Deux validations distantes ont confirmé les trois pièces jointes Discord et la persistance entre runners, sans suppression Cloudinary ni modification Trello. Les tâches Windows et leurs horaires sont conservés. La sauvegarde permanente n’est jamais purgée ; seule Cloudinary applique les échéances de sept jours après contrôle des preuves.
# Emplacement des autosauvegardes

Les trois Petits nids restent dans le navigateur et sont aussi copiés dans « Lapinous sauvegarde » après sélection et autorisation du dossier via le menu Sauvegardes. Trois fichiers tournants réservés conservent le nom, le jour et l’heure, sans supprimer les fichiers manuels. Sur les navigateurs sans accès aux dossiers, utiliser l’export manuel. Voir [les limites et le fonctionnement des sauvegardes](docs/SAUVEGARDES_JOUEURS.md), notamment la validation serveur nécessaire pour empêcher la triche.

