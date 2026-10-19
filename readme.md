# 🐰 Warrenfall : Les Chroniques de Garenne

Warrenfall est un jeu de collection et de gestion de lapins virtuels. Le joueur adopte un compagnon, s'occupe de ses besoins, développe son amitié, collectionne de nouveaux lapins grâce aux œufs, joue à des mini-jeux et affronte les boss légumes du jardin.

Le projet fonctionne comme un petit jeu web responsive, avec un univers visuel composé de plusieurs pièces, une encyclopédie, des événements saisonniers et un Dashboard permettant de gérer le contenu sans modifier directement tout le code.

## Suivi du projet

Documentation actualisée le **8 octobre 2026**. Après chaque évolution, mettre à jour ce README, `A_FAIRE.md` et les cartes concernées du [Trello du projet](https://trello.com/b/5VmsAFi7/clikergame). Le suivi est synchronisé lors des interventions, sans automatisation en arrière-plan.

- [Feuille de route et nouvelles évolutions](A_FAIRE.md)
- [Audit SEO et améliorations à prévoir](docs/AUDIT_SEO.md)
- [Anciennes demandes archivées](docs/archives/a-faire/README.md)
- [Concepts de futurs lapins](liste%20de%20futur%20cr%C3%A9ation/futur_lapin.md) et [futurs boss](liste%20de%20futur%20cr%C3%A9ation/future_boss.md)

## ✨ Fonctionnalités

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

Memory propose 30 niveaux avec lapins et boss. Lapidoku propose une grille 4×4 utilisant les lapins comme symboles.

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

Les **245 images utilisées** sont hébergées sur Cloudinary, dans le cloud `dgrszi9wf`, sous `lapinous/`. Le jeu et le Dashboard utilisent les URL de `assets/js/image-manifest.js`, chargées par le résolveur commun. Les originaux transférés ont été retirés de `assets/img/` ; les dossiers restent disponibles grâce aux `.gitkeep`. Les futures créations et les images non transférées sont conservées.

La tâche Windows existante **« Lapinous - Images Cloudinary 20h »** lance la synchronisation chaque jour à **20 h, Europe/Paris**, puis le bilan global et Discord dès sa fin. Son nom technique historique est conservé. Elle transfère les nouvelles versions, puis déplace les fichiers locaux vérifiés dans `secours-images/`. Ce dossier est ignoré par Git et utilisable en secours uniquement en local. Sans nouvelle image utilisée, aucun appel Cloudinary n’est effectué. Le PC doit être allumé, éveillé et la session ouverte. Les anciennes images déjà supprimées n’ont pas été retéléchargées dans ce dossier.

Pour lancer la même opération manuellement : double-cliquer sur `Synchroniser les images.cmd`, ou exécuter `node tools/update-images.mjs --backup-local`. Les images doivent être référencées dans le jeu ou un catalogue JSON. Le contrôle du quota gratuit reste actif avant tout nouvel envoi. La tâche des images est distincte du bilan documentaire de 23 h.

### Comparaison avant / après

Mesure du **8 octobre 2026**. Les tailles correspondent à la somme des octets des fichiers, sans mesurer l’espace alloué par Windows. Le périmètre comparable exclut `.git`, les dépendances, les configurations locales de l’agent, `.env`, `.cloudinary-local` et `secours-images`, dans les deux copies.

| Référence | Poids | Octets |
| --- | ---: | ---: |
| Ancien chiffre du README, avant migration | 586,52 Mio | 615 007 429 |
| Copie `clikergame_avec_image/`, mesurée sans modification | 586,52 Mio | 615 009 524 |
| Projet actuel, même périmètre | **219,22 Mio** | **229 869 990** |

**Économie par rapport à la copie avec images : 367,30 Mio (385 139 534 octets), soit 62,62 %.** Par rapport au chiffre précédent du README : 367,30 Mio (385 137 439 octets).

### Poids de tous les dossiers à la racine

| Dossier | Poids cumulé | Octets | Périmètre |
| --- | ---: | ---: | --- |
| `_a_verifier_avant_suppression/` | 173,4 Kio | 177 538 | Inclus dans le projet |
| `.cloudinary-local/` | 44,44 Mio | 46 603 737 | Local, exclu du total comparable |
| `.git/` | 634,01 Mio | 664 811 621 | Local, exclu du total comparable |
| `.vscode/` | 44 octets | 44 | Inclus dans le projet |
| `assets/` | 218,54 Mio | 229 152 226 | Inclus dans le projet |
| `docs/` | 146,2 Kio | 149 748 | Inclus dans le projet |
| `Lapinous_documents_juridiques/` | 84,6 Kio | 86 604 | Inclus dans le projet |
| `liste de futur création/` | 36,9 Kio | 37 750 | Inclus dans le projet |
| `sauvegarde/` | 21,3 Kio | 21 795 | Inclus dans le projet |
| `secours-images/` | 0 octets | 0 | Local, exclu du total comparable |
| `tools/` | 44,7 Kio | 45 803 | Inclus dans le projet |

Les fichiers de Git gardent encore l’historique des anciennes images. Les journaux et sauvegardes locales ne sont pas envoyés avec les fichiers du projet. L’occupation locale totale, historique et fichiers privés compris, est **897,68 Mio** (941 285 466 octets), contre 1 220,22 Mio pour la copie avec images : 322,54 Mio de moins. Cette occupation locale est distincte du poids comparable du projet.

### Arborescence et poids détaillés

Chaque fichier et chaque sous-dossier du périmètre comparable est indiqué ci-dessous. Les dossiers vides pèsent zéro octet hors métadonnées du système de fichiers. Les détails des caches, secrets et sauvegardes privées sont omis ; leurs dossiers figurent dans le tableau précédent.

```text
Warrenfall/ — 219,22 Mio
├── _a_verifier_avant_suppression/ — 173,4 Kio
│   └── assets/ — 173,4 Kio
│       ├── img/ — 162,1 Kio
│       │   ├── entrenement 3.gif — 29,0 Kio
│       │   └── entrenement2.gif — 133,1 Kio
│       └── js/ — 11,3 Kio
│           └── a revoi.js — 11,3 Kio
├── .vscode/ — 44 octets
│   └── settings.json — 44 octets
├── assets/ — 218,54 Mio
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
│   ├── css/ — 453,3 Kio
│   │   ├── bootstrap.min.css — 227,5 Kio
│   │   ├── legal.css — 3,1 Kio
│   │   ├── shop.css — 32,5 Kio
│   │   └── style.css — 190,2 Kio
│   ├── img/ — 200,01 Mio
│   │   ├── accompagnateurs/ — 0 octets
│   │   │   ├── Apothicaire/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   ├── caissier/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   └── couturiere/ — 0 octets
│   │   │       └── .gitkeep — 0 octets
│   │   ├── az/ — 6,00 Mio
│   │   │   ├── az_assis_de_cote.png — 2,14 Mio
│   │   │   ├── az_cote.png — 865,2 Kio
│   │   │   ├── az_face.png — 1,10 Mio
│   │   │   └── Azazel.png — 1,91 Mio
│   │   ├── boss/ — 5,46 Mio
│   │   │   ├── carotte_choux_oignon.png — 1,58 Mio
│   │   │   ├── Gemini_Generated_Image_joczczjoczczjocz.jpg — 1 009,5 Kio
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
│   │   ├── fond/ — 13,10 Mio
│   │   │   ├── Halloween/ — 0 octets
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
│   │   ├── magasin/ — 0 octets
│   │   │   ├── aliments/ — 0 octets
│   │   │   │   └── .gitkeep — 0 octets
│   │   │   └── produits/ — 0 octets
│   │   │       └── .gitkeep — 0 octets
│   │   ├── oeuf/ — 0 octets
│   │   │   └── .gitkeep — 0 octets
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
│   │   ├── Zone_jardin/ — 91,0 Kio
│   │   │   └── entrenement.gif — 91,0 Kio
│   │   ├── Zone_SdB/ — 935,8 Kio
│   │   │   └── lapin_SdB.gif — 935,8 Kio
│   │   └── lapin_soin.gif — 14,1 Kio
│   ├── js/ — 554,3 Kio
│   │   ├── achievements.js — 5,3 Kio
│   │   ├── bootstrap.min.js — 59,2 Kio
│   │   ├── dashboard-access.js — 5,0 Kio
│   │   ├── dashboard.js — 46,6 Kio
│   │   ├── image-assets.js — 6,7 Kio
│   │   ├── image-manifest.js — 59,6 Kio
│   │   ├── jquery-3.6.1.min.js — 87,6 Kio
│   │   ├── legal.js — 1,5 Kio
│   │   ├── puzzle-data.js — 2,4 Kio
│   │   ├── script.js — 234,7 Kio
│   │   ├── shop.js — 35,0 Kio
│   │   └── species-data.js — 10,7 Kio
│   └── cloudinary-images.json — 46,5 Kio
├── docs/ — 146,2 Kio
│   ├── archives/ — 22,0 Kio
│   │   └── a-faire/ — 22,0 Kio
│   │       ├── a faire - original.txt — 6,7 Kio
│   │       ├── a faire.txt — 8,0 Kio
│   │       ├── a faire(1).txt — 6,7 Kio
│   │       └── README.md — 536 octets
│   ├── AUDIT_SEO.md — 3,6 Kio
│   ├── AUDIT_VISUELS_GOOGLE_PLAY.md — 53,1 Kio
│   ├── CUISINE.md — 1,5 Kio
│   ├── Lapinous_publication_et_revenus.pdf — 39,2 Kio
│   ├── MAGASIN.md — 14,3 Kio
│   ├── MIGRATION_CLOUDINARY.md — 4,6 Kio
│   ├── NOUVEL_AN_CHINOIS.md — 3,1 Kio
│   └── PUZZLES.md — 4,9 Kio
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
├── liste de futur création/ — 36,9 Kio
│   ├── futur_lapin.md — 26,7 Kio
│   └── future_boss.md — 10,2 Kio
├── sauvegarde/ — 21,3 Kio
│   ├── admin.json — 17,4 Kio
│   └── lapinous-azazel-2026-09-30_21h58.json — 3,8 Kio
├── tools/ — 44,7 Kio
│   ├── backup-transferred-images.mjs — 1,9 Kio
│   ├── clean-transferred-images.mjs — 2,4 Kio
│   ├── cloudinary-activate.mjs — 3,6 Kio
│   ├── cloudinary-sync.mjs — 13,3 Kio
│   ├── install-image-schedule.ps1 — 1,1 Kio
│   ├── run-image-schedule.ps1 — 466 octets
│   ├── test-image-assets.mjs — 3,5 Kio
│   ├── test-image-backup.mjs — 2,2 Kio
│   ├── test-image-browser.mjs — 4,3 Kio
│   ├── update-images.mjs — 3,7 Kio
│   └── update-readme-sizes.mjs — 8,2 Kio
├── .gitignore — 119 octets
├── A_FAIRE.md — 15,4 Kio
├── AGENTS.md — 667 octets
├── dashboard.html — 17,2 Kio
├── fichier_inutiliser.ipynb — 11,1 Kio
├── index.html — 25,2 Kio
├── lapinous-content.json — 74,6 Kio
├── lapinous-puzzles.json — 5,4 Kio
├── lapinous-shop.json — 8,0 Kio
├── readme.md — 36,0 Kio
└── Synchroniser les images.cmd — 74 octets
```

Poids total du projet : **219,22 Mio** (229 869 990 octets), calculé le 8 octobre 2026.

Pour recalculer cette section : `node tools/update-readme-sizes.mjs`. La copie `clikergame_avec_image` sert uniquement de référence et reste intacte.

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
| `assets/` | 279 | 319.84 Mo |
| `docs/` | 15 | 0.17 Mo |
| `tools/` | 53 | 0.27 Mo |

_Inventaire local uniquement : les images déjà archivées ne sont pas considérées manquantes._
<!-- LAPINOUS_AGENT_FIN -->


### Installer le jeu sur téléphone

Ouvrir Warrenfall en HTTPS dans Chrome et utiliser **Installer le jeu** (accueil ou sauvegardes). Sur Safari : **Partager → Sur l’écran d’accueil**. L’application demande le paysage ; si le navigateur refuse le verrouillage, tourner le téléphone. Les modifications locales doivent être publiées avant d'apparaître sur le site.

Le service worker conserve les fichiers publics du jeu et les 120 dernières images consultées. Les autres images nécessitent Internet. Il ne copie pas les sauvegardes dans le cache et ne remplace pas les exports JSON personnels. Les caches sont isolés par chemin du projet, pour préserver les autres applications du même domaine.


### Automatisation du soir

Une seule tâche Windows existante à **20 h Europe/Paris** lance Cloudinary puis, dès sa fin, le bilan Python, même si la synchronisation échoue. Le rapport complet couvre Cloudinary, Git, Trello, README, A_FAIRE, quarantaine et erreurs, puis part sur Discord. Aucun bilan indépendant. La chaîne corrigée a passé le test réel autorisé du 15 octobre et est active, avec mises à jour Trello autorisées après validation du 15 octobre, simulation en lecture seule et suppressions Cloudinary bloquées ; consulter `tools/agent_lapinous/README_INSTALLATION.md`.

Le serveur `tools/serve-game.py` renvoie les illustrations Warrenfall avec les vrais codes HTTP 403/404, même sans service worker installé. Après remplacement d’un ancien serveur `python -m http.server`, arrêter celui-ci (Ctrl+C dans son terminal), puis lancer la commande ci-dessus. GitHub Pages utilise le fichier racine `404.html` après publication.

## Règles et présentation — 19 octobre 2026

- Mini-jeux : 2 carottes par partie réussie, 3 à partir du quatrième niveau, y compris en rejouant un niveau. L’amitié reste la récompense principale. Quiz : paliers de score ; agilité : paliers de distance à partir de 20 m.
- Victoires sur les boss : max(6, arrondi(difficulté × 0,45)) carottes et 35 % de chance de recevoir un ingrédient du Marché. Le butin rejoint l’inventaire partagé utilisé par la Cuisine.
- Évolutions des pièces : communes à tous les lapins, palier maximum existant conservé lors de la migration. Besoins, amitié, techniques et niveaux restent individuels.
- Ingrédients et repas : réserve de Cuisine. Soins : tiroirs de l’apothicaire. Les deux stocks sont communs à la partie.
- Le GIF d’introduction est joué une fois dans une nouvelle session d’onglet ; un rechargement affiche directement le fond de chargement. Les ressources nécessaires à l’accueil, aux soins, au magasin et aux animations des accompagnateurs sont préparées avant l’entrée. Une ressource requise indisponible maintient l’écran de chargement avec un bouton Réessayer ; les décors alternatifs inutilisés ne sont pas tous téléchargés.
- Les sons d’événement suspendent temporairement l’ambiance. Le tutoriel utilise le parchemin du jeu et présente le mage des fragments.
