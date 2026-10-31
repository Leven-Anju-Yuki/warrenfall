# Langues de Warrenfall

Le choix de langue est disponible dans chaque pièce avec un petit bouton rond
affichant le drapeau actuel. Un clic ouvre les drapeaux et les noms des langues ;
un choix, un clic à l'extérieur ou Échap referme la liste. Langues : français,
anglais, espagnol, allemand et japonais. Il est conservé localement sous la clé
`warrenfall.language`, indépendamment de la progression. Le français reste la
langue par défaut et le repli pour toute phrase sans traduction.

`assets/js/game-languages.js` est le moteur d'affichage. Il ne contient plus les
traductions : celles-ci sont dans `assets/i18n/en.json`, `es.json`, `de.json` et
`ja.json`. Seule la langue choisie est téléchargée, puis réutilisée en mémoire.
Le service worker permet de réutiliser hors connexion une langue déjà chargée.
Une langue jamais chargée demande une connexion ; en cas d'échec, le choix
précédent reste actif. Aucun service externe ne reçoit les textes du jeu.
Le code ne modifie ni identifiants de contenu, ni valeurs des formulaires, ni
fichiers de sauvegarde. Les noms personnalisés doivent être marqués
`translate="no"` ou `data-no-translate` lorsqu'un nouveau composant est ajouté.

Cette première version traduit les principaux libellés de navigation, actions,
soins, coloriage, combat, exploration et une partie de l'accueil. **Ce n'est pas
encore une traduction intégrale du jeu** : les longues fiches de personnages,
les questions et explications du quiz, les recettes détaillées,
les annonces de combat et plusieurs textes dynamiques restent en français.
Les quatre catalogues couvrent aussi les succès quotidiens et permanents,
la sélection des lapins, les dialogues des accompagnateurs et les noms et
descriptions des 37 provisions et remèdes. Les phrases variables utilisent
des modèles explicites (`{n}`, `{rabbit}`, `{item}`) : nombres et noms personnels
restent intacts, et les noms de produits intégrés aux dialogues sont traduits.
Les segments séparés par « · » sont traduits individuellement. Les tests vérifient
les vrais objectifs et produits du jeu dans les quatre langues. Les autres textes
restent en français tant que leur traduction n'est pas ajoutée au catalogue.
Aucune API Google n'est appelée.

## Catalogue source et comptage

`assets/i18n/fr.json` est une **liste générée** de textes français destinés aux
joueurs. Une phrase n'y figure qu'une fois, même si plusieurs écrans l'utilisent.
Le français étant déjà présent dans l'interface, ce fichier de préparation n'est
pas téléchargé pendant une partie. Une liste évite aussi de doubler chaque longue
histoire en l'écrivant à la fois comme clé et comme valeur.

Le générateur suit les destinations d'affichage (`textContent`, HTML, messages,
petites fabriques de boutons), leurs variables locales et les champs des
catalogues effectivement affichés : fiches, quiz, boutique, puzzles et tutoriel.
Il conserve les repères `{0}`, `{1}` des valeurs ajoutées à l'exécution. Il exclut
les attributs techniques, les URL d'images, le CSS, les consoles, les blocs admin,
les templates inactifs et les seules étiquettes d'accessibilité non visibles.

Les cas indirects vérifiés à la lecture du code sont dans
`tools/player-text-review.json` : fichier, ligne indicative, empreinte du texte et
décision. Le texte n'est pas recopié dans ce fichier. Toute nouvelle chaîne
ambiguë apparaît dans le rapport privé pour vérification, au lieu d'être
silencieusement comptée comme du texte joueur.

Au 30 octobre 2026 : **2 278 textes uniques, 87 878 caractères** ; **342
occurrences répétées** sont évitées dans le catalogue. Pour quatre traductions,
le volume identifié est de **351 512 caractères**. C'est un inventaire statique
du périmètre chargé par le jeu, pas la preuve que toutes les branches possibles
de chaque partie ont été parcourues. Les textes provenant d'une modification
locale du Dashboard, les noms inventés par les joueurs et les futures créations
ne sont pas envoyés à la traduction.

Préparation des analyseurs, seulement pour les outils (aucune dépendance ajoutée
au navigateur) :

```powershell
npm install --prefix .cloudinary-local/translation-audit --no-save --package-lock=false --ignore-scripts acorn@8.19.0 parse5@8.0.1
node tools/build-player-texts.mjs
```

Le détail des textes, de leurs emplacements et des décisions à revoir est écrit
dans `.cloudinary-local/translation-audit/`. Les deux anciens compteurs bruts,
qui mélangeaient code et textes, sont remplacés par ce seul générateur.

Pour compléter une langue, ajouter les traductions dans son fichier JSON avec
la clé française normalisée (minuscules, espaces normalisés, Unicode NFC).
Garder les repères des valeurs variables et les identifiants métier intacts.

## Lire et maintenir le moteur

- `loadLanguage` charge et valide le catalogue ; deux demandes simultanées
  partagent le même téléchargement.
- `translate` cherche une traduction et garde le français si elle manque.
- `updateText` mémorise la source et le rendu : changer de langue ne traduit pas
  une traduction et ne perd pas le texte d'origine.
- `scan` parcourt uniquement les éléments d'interface autorisés ; noms de lapins,
  champs de saisie et valeurs des formulaires sont protégés.
- `setLanguage` attend le chargement, puis applique le choix. Le dernier choix
  gagne si les réponses réseau arrivent dans le désordre.
- L'observateur de mutations traite les nouveaux panneaux. Il est suspendu
  pendant nos propres écritures pour éviter une boucle.

Validation : `node tools/test-player-texts.mjs` et
`node tools/test-game-languages.mjs`.

## Nettoyage vérifié dans ce lot

- Deux anciens compteurs remplacés par le générateur unique.
- Suppression d'un calcul `meals` jamais lu dans le garde-manger ; les recettes et
  les images restent dans les catalogues et continuent à être utilisées.
- Une seule déclaration UTF-8 dans l'en-tête HTML.
- Suppression de jQuery 3.6.1, qui n'était chargé par aucune page et n'était utilisé
  par aucun script propre au jeu. Bootstrap reste nécessaire aux fenêtres et est
  conservé ; sa détection facultative de jQuery ne signifie pas qu'il en dépend.

Les autres modules ne sont pas déclarés inutiles au seul motif qu'un outil ne
trouve pas leur nom : beaucoup de fonctions sont appelées depuis les boutons
générés, les catalogues ou l'objet `window`. Les supprimer sans suivre ces appels
casserait des écrans. Ce lot ne certifie donc pas l'absence de tout code mort dans
l'ensemble du projet.

Vérification des liens après nettoyage : `node tools/test-player-assets.mjs`.
