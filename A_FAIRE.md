# Warrenfall - suivi des travaux et validations

Mise a jour : 16 octobre 2026.

- [x] Correspondances des fichiers renseignees pour les cartes existantes qui ont du code.
- [x] Reperes `[trello:ID]` ajoutes aux taches ci-dessous.
- [ ] Validation humaine des resultats en jeu : une case technique cochee ne prouve pas le rendu visuel.

Les cases principales des cartes restent ouvertes tant que leur validation ou leur travail est incomplet. L’agent peut proposer En cours ou A valider en jeu ; la liste Realise reste sous validation humaine. Pas de nouvelle carte creee ici.


## Validations humaines reprises de l’export Trello

Export fourni par l’utilisateur : `5VmsAFi7 - clikergame.json`, intégré le 15 octobre 2026. Les 71 identifiants correspondent aux liaisons locales ; aucune nouvelle carte ni correspondance à inventer.

Neuf cases principales ont été cochées localement d’après la liste « Réalisé — code et historique » :

- Équipes favorites — carte marquée terminée et dans Réalisé.
- faire une modal qui souvre avec un bouton image livre pour afficher les regles du jeu — carte marquée terminée et dans Réalisé.
- faire le clicker pour lui donner a manger le brosser — carte marquée terminée et dans Réalisé.
- Barres de besoins et niveau d’amitié — carte marquée terminée et dans Réalisé.
- trouver un gif de lapin heureux — carte marquée terminée et dans Réalisé.
- Retour au Salon et informations du lapin — dans Réalisé, sans marque de fin dueComplete.
- trouver les images — dans Réalisé, sans marque de fin dueComplete.
- faire une zone soin alimentation sommeil et jeu avec des fond différent — carte marquée terminée et dans Réalisé.
- thème sur les lapins — carte marquée terminée et dans Réalisé.

La checklist Trello « niveau » de « Barres de besoins et niveau d’amitié » conserve trois éléments non cochés (niveaux 1, 2 et 3). La validation de la carte ne les coche pas automatiquement. Les validations mobiles et les autres travaux ouverts restent à vérifier. Aucun appel Trello ou Discord, aucune modification du point de reprise Git ni du réglage d’automatisation.

## Correctifs téléphone et installation — 15 octobre 2026

Les précédents tests avec images de contrôle vérifiaient les débordements des panneaux ; ils ne validaient pas le placement des personnages ni la lisibilité. Les captures téléphone ont révélé ces régressions.

- [x] Manifeste installable, orientation paysage, icônes locales et bouton Installer dans l'accueil et les sauvegardes. [trello:6ac39db1a134b35f03b17940:code:installation-pwa]
- [x] Écran de rotation en portrait tactile ; demande de plein écran et verrouillage paysage lorsque le navigateur l'autorise. [trello:6ac39d846f4f8d11b7da6ab0:code:orientation-paysage]
- [x] Scènes du magasin dimensionnées dans la hauteur disponible ; caissière recalée sur le décor, meuble et accompagnatrice visibles en petite hauteur. [trello:6ac75d423df6f3af4d7dffa3:code:paysage-scenes]
- [x] Cache hors connexion limité aux fichiers publics du jeu et à 120 images consultées ; caches des autres applications préservés. [trello:6ac39db1a134b35f03b17940:code:cache-pwa]
- [x] Contrôles automatisés : 72 parcours sans erreur JavaScript ni débordement horizontal des panneaux ; captures avec les vrais médias sur trois formats paysage (844×390, 844×280, 740×320), rotation portrait et rechargement hors connexion vérifiés dans Chrome. Ces contrôles ne remplacent pas le test sur appareil réel. [trello:6ac39d846f4f8d11b7da6ab0:code:tests-paysage]
- [ ] Vérifier sur téléphone Android réel : rotation, lancement depuis l'icône installée, navigation, achats tactiles, animations, fermeture et réouverture. [trello:6ac75d423df6f3af4d7dffa3:manuel:telephone-paysage]
- [ ] Vérifier Safari/iOS : installation via Partager, rotation manuelle et sauvegardes conservées après relancement. [trello:6ac39db1a134b35f03b17940:manuel:installation-ios]
- [ ] Revalider tous les mini-jeux et le combat en paysage sur téléphone ; les captures des scènes ne suffisent pas. [trello:6ac75fbda79c4c777508987e:manuel:jeux-paysage]

L'installation sera disponible sur le site après publication de ces fichiers en HTTPS. Aucun APK n'est produit. Le bilan suit la synchronisation de 20 h sans horaire indépendant ; la chaîne corrigée a passé le test réel autorisé du 15 octobre.


## Reprise mobile après captures du 15 octobre

Les précédents contrôles de débordement et les captures avec un panier vide ne suffisaient pas. Les nouveaux contrôles portent sur les vrais médias, les cartes Memory retournées, le panier rempli, les transitions de la caissière et le combat.

- [x] Œufs déplacés dans une fenêtre dédiée sur téléphone, accessible par le bouton Œufs de la navigation ; mêmes fonctions d’achat et d’ouverture, sans duplication. Lapin principal dégagé et favoris répartis au sol. [trello:6ac39d846f4f8d11b7da6ab0:code:salon-modal-oeufs]
- [x] Bouton Installer accessible pendant la partie ; aide d’installation conservée lorsque le navigateur ne propose pas l’installation native. [trello:6ac39db1a134b35f03b17940:code:installation-accessible]
- [x] Lapin de cuisine séparé des actions ; Chef au-dessus d’un panneau de recettes distinct du décor ; bulles au-dessus des accompagnateurs. [trello:6ac75d423df6f3af4d7dffa3:code:sols-bulles-mobile]
- [x] Panier rempli : objets sur le comptoir, panneaux d’options fermés au départ et ouverture d’un seul à la fois. [trello:6ac75d423df6f3af4d7dffa3:code:panier-options-mobile]
- [x] Plateau puzzle de taille positive en petite hauteur, agrandissement déplaçable pour les nombreuses pièces, coupelle latérale défilante et cartes Memory à proportions fixes avec portraits visibles. [trello:6ac75fbda79c4c777508987e:code:puzzle-memory-mobile]
- [x] Combat : grille d’adversaires lisible, préparation compacte et détails du terrain dépliables ; zones de jeu dégagées des boutons flottants de la maison. [trello:6ac39d8793f1039486b67a20:code:combat-mobile]
- [ ] Refaire les essais sur le Z Flip et un petit téléphone : achats/ouverture des œufs, trois favoris, recettes, déplacements animés, puzzle terminé, Memory complet et combat jusqu’à son résultat. [trello:6ac75fbda79c4c777508987e:manuel:telephone-81]
- [ ] Vérifier le site publié après actualisation : ces changements sont locaux tant qu’ils ne sont pas publiés. [trello:6ac39d846f4f8d11b7da6ab0:manuel:publication-mobile-81]

Fichiers : `assets/css/phone.css`, `assets/js/mobile-ui.js`, `assets/js/shop.js`, `assets/js/installer.js`, `index.html`, `tools/test-landscape-game.mjs`. Correspondances Trello mises à jour localement ; aucune carte déplacée et aucun message envoyé par ce travail.

Contrôles locaux réussis avec médias réels : 844×390, 740×320 et 568×280 ; panier à trois articles, Memory retourné, préparation et début du combat, portrait et rechargement hors connexion. Dernier contrôle 568×280 : trois favoris et puzzle agrandi. La partie complète sur appareil réel reste à vérifier.

## Activation Trello automatique — simulation du 15 octobre

- [x] Vérifier 71 correspondances sur le tableau réel en GET seulement ; simulation : aucun déplacement proposé, aucune erreur Trello. Les cartes déjà dans la liste attendue et les listes protégées restent inchangées. [trello:6ac39f30bfe4848ec3eca940:code:simulation-trello-auto]
- [x] Journal durable des transitions et commentaire identifié : reprise après échec réseau, contrôle de la liste juste avant déplacement, aucun doublon de commentaire au prochain bilan. [trello:6ac39f30bfe4848ec3eca940:code:reprise-trello-auto]
- [x] Rapport Discord prévu : déplacements et raisons, cartes ignorées détaillées dans la pièce jointe, erreurs ; point de reprise Git seulement après traitement réussi. Tests isolés : 30 réussis, sans notification réelle. [trello:6ac39f30bfe4848ec3eca940:code:tests-trello-auto]
- [x] Activation validée par l’utilisateur après simulation le 15 octobre : `tools/agent_lapinous/trello_automatisation.json` contient `actif: true`. Les prochains bilans réels de la chaîne de 20 h peuvent appliquer les transitions Trello autorisées. Aucun lancement immédiat, aucun changement Windows ni Cloudinary. [trello:6ac39f30bfe4848ec3eca940:manuel:activation-trello-auto]

La simulation manuelle complète retourne 1 uniquement car le rapport Cloudinary de ce soir à 20 h n’existe pas encore ; aucun appel de synchronisation n’est lancé. Aucune création de carte autorisée ; Réalisé, Bloqué et Idées à sélectionner protégés. À valider en jeu n’est pas rétrogradé automatiquement. Une case technique seule ne clôture pas une carte.

## Échelle des lapins sur grand écran

- [x] Retirer les plafonds fixes trop petits du lapin actif et des favoris sur PC : leur taille suit maintenant le décor via la hauteur disponible. Les favoris ont une taille proche du lapin actif, avec un léger décalage de profondeur. [trello:6ac39d846f4f8d11b7da6ab0:code:echelle-terrier-pc]
- [x] Séparer les commandes de cuisine du lapin et stabiliser ses pieds au repos ; mêmes proportions pour les pièces de soin. Règles limitées aux grands écrans avec pointeur précis, sans remplacer les règles téléphone. [trello:6ac39d846f4f8d11b7da6ab0:code:sol-terrier-pc]
- [ ] Vérifier à l’œil les proportions avec les meubles sur son écran et avec ses favoris, y compris les lapins événementiels et les GIF de soin. [trello:6ac39d846f4f8d11b7da6ab0:manuel:echelle-terrier-pc]

Contrôles réussis dans Chrome avec les vrais médias : salon avec trois favoris, cuisine, chambre et bain en 1920×1080, 2560×1440 et 3440×1440 ; aucune erreur JavaScript ni débordement détecté. Capture Full HD contrôlée visuellement ; vérifications PWA réussies.

Fichiers : `assets/css/desktop-scene.css`, `index.html`, `tools/test-landscape-game.mjs` (option `--desktop --family`). Correspondance Trello explicite conservée ; aucune carte déplacée par ce correctif. Les fichiers restent locaux jusqu’à publication.

## Succès téléphone et accès à l’installation

- [x] Succès en lignes compactes sur téléphone : titre, objectif, progression et bouton de récompense côte à côte ; en-tête et onglets réduits, liste défilante. [trello:6ac39f233ae89c6d7a24fb0c:code:succes-mobile-83]
- [x] Défis quotidiens et paliers propres au Memory, aux puzzles cousus et au quiz ; premier lapin adopté récompensé. Anciens identifiants et gains conservés, pas de double récompense. Les compteurs Memory et quiz déjà connus alimentent les paliers permanents ; ils ne valident pas les défis du jour rétroactivement. Les anciens puzzles ne sont pas déduits du compteur historique mélangé aux autres jeux. [trello:6ac39f233ae89c6d7a24fb0c:code:objectifs-actuels-83]
- [x] Bouton Installer dans la navigation téléphone ; invitation native si disponible, aide Chrome/Safari sinon ; indication Installé si l’application est déjà installée. Versions des ressources renouvelées. [trello:6ac39db1a134b35f03b17940:code:installer-navigation-83]
- [ ] Vérifier sur téléphone réel après publication : plusieurs succès visibles, défilement, récompenses, bouton Installer et installation depuis Chrome/Safari. [trello:6ac39f233ae89c6d7a24fb0c:manuel:succes-installation-83]

Tests de logique des succès et du cache PWA réussis. Dernier parcours visuel 568×280 réussi : onglets des succès, bouton Installer et déclenchement simulé de l’invitation ; capture 844×390 vérifiée avec plusieurs lignes visibles. Un parcours élargi de rechargement hors connexion a bloqué après le premier format : il n’est pas déclaré entièrement validé par ce correctif. Les tests d’installation utilisent une invite simulée et n’installent pas réellement l’application. Fichiers : `assets/js/achievements.js`, `assets/js/script.js`, `assets/js/installer.js`, `assets/css/phone.css`, `index.html`, `tools/test-achievements.mjs`, `tools/test-landscape-game.mjs`. Correspondances Trello locales mises à jour ; aucune carte déplacée. Modifications locales à publier.

## Lapidoku, couture et installation — 16 octobre 2026

- [x] Refaire le Lapidoku en vraie grille carrée avec blocs encadrés et chiffres fixes ; pavé numérique tactile, saisie clavier, effacement et répétitions signalées. [trello:6ac39e11e324891dfc4c501a:code:grille-sudoku-84]
- [x] Ajouter 12 niveaux à solution unique : découverte 4×4, intermédiaire 6×6, classique et défis 9×9. Déverrouillage sauvegardé par lapin, ancien nombre de victoires conservé, récompense une seule fois par grille en cours. [trello:6ac39e11e324891dfc4c501a:code:niveaux-sudoku-84]
- [x] Sur téléphone, garder la couturière visible dans son panneau pendant la couture au lieu de masquer son image pour un déplacement hors du plateau ; agrandir son panneau et laisser le GIF de couture jouer trois secondes. Trajet PC conservé. [trello:6ac39db7ff0d2d466b26fe7b:code:couture-mobile-84]
- [x] Garder l’accès Installer dans la navigation même quand le navigateur annonce un pointeur différent de celui d’un téléphone ; label Installé si l’application est déjà installée, aide si l’invite native manque. Ressources versionnées pour publication. [trello:6ac39db1a134b35f03b17940:code:installation-visible-84]
- [ ] Vérifier sur téléphone réel après publication : bouton Installer, GIF de couture avec plusieurs pièces voisines, lisibilité et saisie des trois tailles de Sudoku, reprise des niveaux après fermeture. [trello:6ac39e11e324891dfc4c501a:manuel:telephone-sudoku-84]

Tests de logique : les 12 grilles ont une solution unique, chiffres fixes et conflits vérifiés ; anciens succès préservés. Dernier parcours Chrome isolé 568×280 réussi : niveaux, victoire sans double comptage, déverrouillage jusqu’au 9×9 et couture ; capture du GIF « Je couds ces pièces ! » vérifiée. Captures PC contrôlées jusqu’au format 3440×1440. Cache PWA vérifié avec les nouveaux fichiers. Fichiers principaux : `assets/js/lapidoku.js`, `assets/css/lapidoku.css`, `assets/js/script.js`, `assets/js/installer.js`, `index.html`, `tools/test-lapidoku.mjs`. Aucune publication ni modification distante Trello effectuée.

## Comptoirs, installation et lit — 16 octobre 2026

- [x] Cadre identique pour les rayons du magasin, l’apothicaire et le garde-manger : dimensions selon la fenêtre, contenu interne adapté sans réduire la modale. [trello:6ac75d423df6f3af4d7dffa3:code:cadre-magasin-85]
- [x] Caissière agrandie sur PC ; table des achats avec plateau en bois, tranche et pieds, séparée de la caissière et objets posés sur le dessus. Boucle ResizeObserver des bulles corrigée. [trello:6ac75d423df6f3af4d7dffa3:code:table-caissiere-85]
- [x] Bouton de nourriture agrandi et lapin de chambre placé sur le matelas, avec règles séparées PC et téléphone. [trello:6ac39d846f4f8d11b7da6ab0:code:pomme-lit-85]
- [x] Un seul accès Installer pendant la partie ; suppression du bouton du haut. Après confirmation appinstalled ou lancement en application installée, tous les accès sont masqués et l’état est mémorisé localement. [trello:6ac39db1a134b35f03b17940:code:installation-unique-85]
- [ ] Contrôler le lit avec les différents lapins et GIF, la table avec plusieurs articles, les trajets de caissière, les rayons et le panier sur PC et téléphone réel. [trello:6ac75d423df6f3af4d7dffa3:manuel:comptoir-lit-85]
- [ ] Vérifier l’installation réelle Chrome/Safari, puis la disparition des propositions après lancement de l’application installée. Les essais automatisés utilisent un événement simulé, sans installer réellement l’application. [trello:6ac39db1a134b35f03b17940:manuel:installation-unique-85]

Contrôles réussis dans Chrome isolé en 1920×1080 et 568×280 : dimensions communes des cinq scènes, table avec un article, suppression du doublon Installer, confirmation simulée d’installation puis rechargement sans nouvelle proposition. Syntaxe JavaScript et cache PWA vérifiés. Captures du lit et de la table contrôlées visuellement.

Fichiers : `assets/css/shop-polish.css`, `assets/js/shop.js`, `assets/js/installer.js`, `index.html`, `tools/test-landscape-game.mjs`. Correspondances Trello locales actualisées ; aucune carte déplacée ni publication effectuée.

## Progression et victoire Sudoku — 16 octobre 2026

- [x] Niveaux 9×9 : pourcentage cible de chiffres préremplis abaissé à environ 65 %, 60 %, 55 %, 50 %, 45 % puis 40 % ; pourcentage réel affiché en partie. Tests : nombre d’indices strictement décroissant et solution unique pour chaque niveau. [trello:6ac39e11e324891dfc4c501a:code:indices-sudoku-86]
- [x] Victoire détectée dès la dernière bonne saisie, sans cliquer Vérifier : bandeau de réussite visible, récompense, sauvegarde et niveau suivant. Le verrou de fin empêche de compter la même grille deux fois ; le bouton Vérifier reste disponible pour une grille incomplète ou incorrecte. [trello:6ac39e11e324891dfc4c501a:code:victoire-sudoku-86]
- [ ] Vérifier en jeu après publication : dernière saisie au tactile et au clavier, bandeau de victoire et passage au niveau suivant, puis reprise de la progression. [trello:6ac39e11e324891dfc4c501a:manuel:victoire-sudoku-86]

Fichiers : `assets/js/lapidoku.js`, `assets/js/script.js`, `assets/css/lapidoku.css`, `index.html`, `tools/test-lapidoku.mjs`, `tools/test-landscape-game.mjs`. Liaisons Trello existantes conservées ; aucun déplacement distant et aucune publication.

## Limite d’erreurs Sudoku — 16 octobre 2026

- [x] Limite commune de 3 erreurs, réglable via `LapinousSudoku.mistakeLimit` dans `assets/js/lapidoku.js`. Compteur affiché ; chiffre différent de la solution compté et signalé en rouge. Effacement gratuit et même valeur répétée sans modification non recomptée. [trello:6ac39e11e324891dfc4c501a:code:limite-erreurs-87]
- [x] À la troisième erreur : grille perdue et bloquée, bandeau de défaite, bouton Recommencer ce niveau. Aucune récompense ni déverrouillage après défaite ; recommencer remet les chiffres et le compteur à zéro. Anciennes victoires conservées. [trello:6ac39e11e324891dfc4c501a:code:defaite-sudoku-87]
- [ ] Vérifier en jeu après publication : erreurs au tactile et au clavier, perte à 3 erreurs, compteur à zéro après redémarrage et victoire ensuite. [trello:6ac39e11e324891dfc4c501a:manuel:erreurs-sudoku-87]

Tests de logique : solution unique, seuil d’erreurs, verrouillage, bonnes saisies, effacement et redémarrage. Fichiers : `assets/js/lapidoku.js`, `assets/js/script.js`, `assets/css/lapidoku.css`, `index.html`, `tools/test-lapidoku.mjs`, `tools/test-landscape-game.mjs`. Correspondances Trello existantes conservées. La mission de renommage jointe n’est pas exécutée dans cette correction Sudoku. Aucune modification distante ni publication.

## Identité Warrenfall — 16 octobre 2026

- [x] Nom officiel « Warrenfall : Les Chroniques de Garenne » à l’accueil, dans le titre et le manifest PWA ; nom court Warrenfall pour l’interface, le Dashboard, les messages et documents courants. [trello:6ac39f30bfe4848ec3eca940:code:identite-warrenfall-88]
- [x] Futurs rapports, alertes batterie et messages du bot libellés Warrenfall ; logique Python inchangée. Anciens rapports, PDF et journaux conservés. [trello:6ac39f30bfe4848ec3eca940:code:rapports-warrenfall-88]
- [x] GitHub contrôlé : dépôt déjà renommé en `Leven-Anju-Yuki/warrenfall`, avant cette intervention. Remote origin corrigé vers l’URL officielle et branche main accessible. GitHub Pages indique `https://leven-anju-yuki.github.io/warrenfall/` ; métadonnées actualisées. Aucun push effectué. [trello:6ac39f30bfe4848ec3eca940:code:github-warrenfall-88]
- [x] Conserver les clés lapinous, catalogues JSON, API JavaScript, chemins Cloudinary, sauvegardes, dossiers physiques et noms des tâches Windows. Seuls les noms visibles changent ; aucun appel réel Cloudinary, Trello ou Discord pour tester. [trello:6ac39f30bfe4848ec3eca940:code:compatibilite-warrenfall-88]
- [x] Tests de compatibilité et identité : 30 tests Python, chaîne et installateur simulés, PWA, exports, images, Sudoku, succès, ancienne sauvegarde et parcours quiz sur téléphone. Ancien test quiz archivé expiré ; parcours équivalent actuel réussi. [trello:6ac39f30bfe4848ec3eca940:code:tests-warrenfall-88]
- [ ] Publier les changements puis contrôler le nom de l’application installée, les aperçus sociaux et les futures alertes automatisées. Les caches d’aperçu et les noms des installations existantes peuvent nécessiter une actualisation par leur plateforme. [trello:6ac39f30bfe4848ec3eca940:manuel:publication-warrenfall-88]

Inventaire et compte rendu détaillé : `docs/RENOMMAGE_WARRENFALL.md`. Les noms de fichiers historiques restent volontairement compatibles ; les documents HTML/Markdown actuels portent le nouveau nom. Les PDF historiques ne sont pas réécrits.

## Travaux recents : code livre et points a verifier

- [x] Cloudinary : chemins locaux resolus par le manifeste, transfert des images utilisees et sauvegarde permanente des originaux.
- [x] Synchronisation : absence de nouvelles images sans transfert ; conservation des dossiers et remplacement des originaux homonymes dans la sauvegarde.
- [x] Exports Dashboard : quatre catalogues dans le projet, autorisations, dossier memorise, copie avant remplacement et retention des copies de 7 jours au prochain export.
- [x] Sauvegardes des parties : noms dates uniques, import controle, dossier memorise et actions Charger / Ecraser / Supprimer avec confirmations.
- [x] Cuisine : frigo cliquable, ingredients et plats separes, consommation interdite a barre pleine, recettes centralisees dans lapinous-shop.json.
- [x] Chef : recuperation des ingredients, decoupe pour les salades, wok pour les autres plats et depot sur l’etagere des plats prepares.
- [x] Magasin : fonds par rayon, quatre evolutions sur l’etabli, paliers d’amitie de 5 et ameliorations payantes croissantes.
- [x] Fragments : paiement direct, remboursement de la seule competence choisie, GIFs de marche et assemblage raccordes.
- [x] Dashboard : cartes retournables, recherche, accompagnateurs en accordeons, choix d’images et securite en dernier.
- [x] Salon : compagnon actif et favoris independants selectionnes par etoiles dans l’encyclopedie.
- [x] Mini-jeux : placard illustre et quiz des lapins issu du document alimentation, questions supplementaires et editeur Dashboard.
- [x] Visibilite : magasin, Marche, evolutions, fragments, apothicaire et cuisine publics ; Carottes reserve a l’admin local.
- [ ] Verifier les trajets complets, tailles, sens de marche et poses finales de la caissiere, du forgeron, du specialiste des fragments et de l’apothicaire.
- [ ] Verifier les etageres, objets sur les tables et meubles au parquet sur ordinateur, mobile, petite hauteur et zoom.
- [ ] Tester les exports avec permission refusee, reconnexion, ancien dossier, nouvelle sauvegarde, chargement, ecrasement et suppression.
- [ ] Verifier stocks, achats, recettes, favoris, fragments et noms des lapins apres export/import d’une ancienne et d’une nouvelle partie.
- [ ] Equilibrer les prix actuels, la nourriture de base, les ingredients et les plats ; revoir attaques, defenses et soins avant les bonus speciaux.
- [ ] Verifier le resultat Cloudinary de 20 h et le bilan immédiat après synchronisation, sans doublon de tache Windows ni purge des images sauvegardees.
- [ ] Verifier les mises a jour de cartes Trello en simulation avant application ; ne pas valider automatiquement Realise.
- [ ] Valider le quiz sur mobile, les sources des reponses et la lisibilite des boites des mini-jeux.

## Priorites et travaux ouverts

- [ ] Améliorations de soin — ancienne piste à réévaluer [trello:6661a537b3df7e377ba31643] - [Carte](https://trello.com/c/6661a537b3df7e377ba31643)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`
- [ ] P3 — Techniques uniques [trello:6ac39dc1946e5c8a5488c49b] - [Carte](https://trello.com/c/6ac39dc1946e5c8a5488c49b)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] P3 — Nouveaux consommables et équilibre des prix [trello:6ac39dc482f20ad66d405a8b] - [Carte](https://trello.com/c/6ac39dc482f20ad66d405a8b)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`
- [ ] P3 — Décorations plaçables [trello:6ac39e052e962c5a09b17704] - [Carte](https://trello.com/c/6ac39e052e962c5a09b17704)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] P3 — Branches d’amélioration [trello:6ac39e08cece9041c78cab09] - [Carte](https://trello.com/c/6ac39e08cece9041c78cab09)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] P3 — Records supplémentaires [trello:6ac39e0b9caa6864a646e480] - [Carte](https://trello.com/c/6ac39e0b9caa6864a646e480)
  Fichiers : `assets/js/achievements.js`
- [ ] P3 — Mode pixel art [trello:6ac39e0ec39e56083669ea25] - [Carte](https://trello.com/c/6ac39e0ec39e56083669ea25)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] P3 — Nouvelles grilles de Lapidoku [trello:6ac39e11e324891dfc4c501a] - [Carte](https://trello.com/c/6ac39e11e324891dfc4c501a)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] Publication — juridique, droits et paiement [trello:6ac75d44734881469f896152] - [Carte](https://trello.com/c/6ac75d44734881469f896152)
  Fichiers : `Lapinous_documents_juridiques/`, `docs/INSTALLATION_ET_SECURITE.md`, `INSTALLATION_ET_SECURITE.md`
- [ ] P1 — Progression et déblocage des équipements [trello:6661a5d73e3f5fce205eae72] - [Carte](https://trello.com/c/6661a5d73e3f5fce205eae72)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/js/pantry.js`, `assets/js/script.js`
- [ ] P1 — Placement des lapins et commandes [trello:6ac39d846f4f8d11b7da6ab0] - [Carte](https://trello.com/c/6ac39d846f4f8d11b7da6ab0)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [ ] P1 — Préparation du combat [trello:6ac39d8793f1039486b67a20] - [Carte](https://trello.com/c/6ac39d8793f1039486b67a20)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [ ] P1 — Sauvegardes [trello:6ac39d911abc6a7d2a71273e] - [Carte](https://trello.com/c/6ac39d911abc6a7d2a71273e)
  Fichiers : `assets/js/script.js`, `assets/js/save-validation.js`, `assets/js/local-files.js`, `index.html`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [ ] P1 — Sons [trello:6ac39d93be4e45379ca8247f] - [Carte](https://trello.com/c/6ac39d93be4e45379ca8247f)
  Fichiers : `assets/js/script.js`, `assets/audio/`
- [ ] P2 — Notifications [trello:6ac39dbef4faf8125adc099b] - [Carte](https://trello.com/c/6ac39dbef4faf8125adc099b)
  Fichiers : `assets/js/script.js`
- [x] Équipes favorites [trello:6ac39e147db15f1edab9c326] - [Carte](https://trello.com/c/6ac39e147db15f1edab9c326)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] P1 — Équilibrage des boss [trello:6ac39d8a40c2a66ada563abc] - [Carte](https://trello.com/c/6ac39d8a40c2a66ada563abc)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [ ] P1 — Indicateur de difficulté plus fiable [trello:6ac39d8ef2a33d8d5e748be8] - [Carte](https://trello.com/c/6ac39d8ef2a33d8d5e748be8)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [ ] P2 — SEO [trello:6ac39d99f4eb044b2a42d449] - [Carte](https://trello.com/c/6ac39d99f4eb044b2a42d449)
  Fichiers : `index.html`, `docs/AUDIT_SEO.md`
- [ ] P2 — Guide de démarrage [trello:6ac39daf6e132da85a61925d] - [Carte](https://trello.com/c/6ac39daf6e132da85a61925d)
  Fichiers : `index.html`
- [ ] P2 — Accessibilité [trello:6ac39db1a134b35f03b17940] - [Carte](https://trello.com/c/6ac39db1a134b35f03b17940)
  Fichiers : `assets/css/style.css`, `index.html`, `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/css/mobile.css`
- [ ] P2 — Performance [trello:6ac39db49bd7456ac00b5038] - [Carte](https://trello.com/c/6ac39db49bd7456ac00b5038)
  Fichiers : `assets/css/style.css`, `index.html`, `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/scene-preload.js`, `assets/js/script.js`
- [ ] P2 — Relations des personnages [trello:6ac39dbb2c736f2180aee1ec] - [Carte](https://trello.com/c/6ac39dbb2c736f2180aee1ec)
  Fichiers : `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js`

## Fonctionnalites existantes : validations

- [x] faire une modal qui souvre avec un bouton image livre pour afficher les regles du jeu [trello:6661a8eefa746159ea2700da] - [Carte](https://trello.com/c/6661a8eefa746159ea2700da)
  Fichiers : `index.html`
- [x] faire le clicker pour lui donner a manger le brosser [trello:6661a4b7b41cd821c331d689] - [Carte](https://trello.com/c/6661a4b7b41cd821c331d689)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [x] Barres de besoins et niveau d’amitié [trello:6661a5ec1e0c59351bd18a52] - [Carte](https://trello.com/c/6661a5ec1e0c59351bd18a52)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [x] trouver un gif de lapin heureux [trello:6661a91283b1bf3c205e457c] - [Carte](https://trello.com/c/6661a91283b1bf3c205e457c)
  Fichiers : `assets/js/image-manifest.js`, `assets/js/image-assets.js`, `tools/update-images.mjs`, `tools/cloudinary-sync.mjs`, `tools/backup-transferred-images.mjs`
- [x] Retour au Salon et informations du lapin [trello:6669758ceb6d2b877ef431fa] - [Carte](https://trello.com/c/6669758ceb6d2b877ef431fa)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [x] trouver les images [trello:6661b309ac71b719ebc63fd7] - [Carte](https://trello.com/c/6661b309ac71b719ebc63fd7)
  Fichiers : `assets/js/image-manifest.js`, `assets/js/image-assets.js`, `tools/update-images.mjs`, `tools/cloudinary-sync.mjs`, `tools/backup-transferred-images.mjs`
- [x] faire une zone soin alimentation sommeil et jeu avec des fond différent [trello:6661a6149952d95e5c048f9a] - [Carte](https://trello.com/c/6661a6149952d95e5c048f9a)
  Fichiers : `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/style.css`, `index.html`, `assets/js/script.js`
- [x] thème sur les lapins [trello:6661a423f3b0f23f486d3590] - [Carte](https://trello.com/c/6661a423f3b0f23f486d3590)
  Fichiers : `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/style.css`, `index.html`
- [x] faire un salon avec des bouton de base  pour les diffèrent lieu et une fleche pour revenir en arriere [trello:6661b4124754141925b73499] - [Carte](https://trello.com/c/6661b4124754141925b73499)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css`
- [x] Adoption, traits, collection et encyclopédie [trello:6ac39e3c28d335cd92c8cc95] - [Carte](https://trello.com/c/6ac39e3c28d335cd92c8cc95)
  Fichiers : `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js`
- [x] Progression indépendante par lapin [trello:6ac39e3f09478ebeda38c92d] - [Carte](https://trello.com/c/6ac39e3f09478ebeda38c92d)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [x] Combat tactique — équipe, mode manuel et automatique [trello:6ac39e4258234f0f6df5def5] - [Carte](https://trello.com/c/6ac39e4258234f0f6df5def5)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`, `assets/css/mobile.css`
- [x] Ultimes et barres de charge — lapins et boss [trello:6ac39e452732a48b7581df6e] - [Carte](https://trello.com/c/6ac39e452732a48b7581df6e)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [x] Listes de 1 à 6 attaques selon la rareté [trello:6ac39e5cff0d2d466b27ecbb] - [Carte](https://trello.com/c/6ac39e5cff0d2d466b27ecbb)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`, `lapinous-content.json`
- [x] Fragments — amélioration de la technique choisie [trello:6ac39e5fd921b05e95245ff0] - [Carte](https://trello.com/c/6ac39e5fd921b05e95245ff0)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/js/script.js`
- [x] Œufs illustrés — ouverture individuelle et par 10 [trello:6ac39e61cbe7415819b24df8] - [Carte](https://trello.com/c/6ac39e61cbe7415819b24df8)
  Fichiers : `assets/js/script.js`, `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`
- [x] Décors de saisons jour/nuit et événements prioritaires [trello:6ac39efb4988b40cec255170] - [Carte](https://trello.com/c/6ac39efb4988b40cec255170)
  Fichiers : `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/style.css`, `index.html`, `assets/js/script.js`
- [x] Admin local — tests rapides et Dashboard [trello:6ac39efeb8e60614e640ad49] - [Carte](https://trello.com/c/6ac39efeb8e60614e640ad49)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`
- [x] Dashboard — graphiques de rareté harmonisés [trello:6ac39f0129a42ce3c535a196] - [Carte](https://trello.com/c/6ac39f0129a42ce3c535a196)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`
- [x] Sauvegardes nommées, datées et remplacement confirmé [trello:6ac39f0465d01dcee2c8411d] - [Carte](https://trello.com/c/6ac39f0465d01dcee2c8411d)
  Fichiers : `assets/js/script.js`, `assets/js/save-validation.js`, `assets/js/local-files.js`, `index.html`
- [x] Mini-jeux — Memory 30 niveaux et puzzles cousus [trello:6ac39f1ffd16599635e62ae9] - [Carte](https://trello.com/c/6ac39f1ffd16599635e62ae9)
  Fichiers : `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/js/quiz.js`, `assets/js/quiz-dashboard.js`, `lapinous-quiz.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [x] Défis quotidiens, succès et récompenses [trello:6ac39f233ae89c6d7a24fb0c] - [Carte](https://trello.com/c/6ac39f233ae89c6d7a24fb0c)
  Fichiers : `assets/js/achievements.js`
- [x] Audio — soins courts, volumes et défaite [trello:6ac39f2681968bcd0d9b086d] - [Carte](https://trello.com/c/6ac39f2681968bcd0d9b086d)
  Fichiers : `assets/js/script.js`, `assets/audio/`
- [x] Audio original livré — ambiance et sommeil [trello:6ac39f295fcf0100cf51e1cd] - [Carte](https://trello.com/c/6ac39f295fcf0100cf51e1cd)
  Fichiers : `assets/js/script.js`, `assets/audio/`
- [x] Notifications et combat lisible — corrections livrées [trello:6ac39f2b43bb87374c9f2e22] - [Carte](https://trello.com/c/6ac39f2b43bb87374c9f2e22)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [x] Salon — compagnons ensemble et placement corrigé [trello:6ac39f2fa02c69b499e17ea8] - [Carte](https://trello.com/c/6ac39f2fa02c69b499e17ea8)
  Fichiers : `assets/js/script.js`, `assets/css/style.css`, `index.html`
- [ ] Repères — feuille de route du 08-10-2026 [trello:6ac39f30bfe4848ec3eca940] - [Carte](https://trello.com/c/6ac39f30bfe4848ec3eca940)
  Fichiers : `readme.md`, `A_FAIRE.md`, `tools/agent_lapinous/agent.py`, `tools/agent_lapinous/suivi_trello.py`, `tools/agent_lapinous/installer_taches.ps1`, `tools/run-image-schedule.ps1`, `tools/agent_lapinous/chaine_20h.ps1`, `tools/agent_lapinous/installer_chaine_20h.ps1`

## Tests manuels a effectuer

- [x] À valider — Puzzle à coupelle et couturière [trello:6ac39db7ff0d2d466b26fe7b] - [Carte](https://trello.com/c/6ac39db7ff0d2d466b26fe7b)
  Fichiers : `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/css/mobile.css`
- [ ] À valider — Boutique et apothicaire [trello:6ac75d423df6f3af4d7dffa3] - [Carte](https://trello.com/c/6ac75d423df6f3af4d7dffa3)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [x] À valider — Memory 30 niveaux [trello:6ac75d4306880ab48923dd1c] - [Carte](https://trello.com/c/6ac75d4306880ab48923dd1c)
  Fichiers : `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/css/mobile.css`
- [ ] À valider — Besoins admin et jeux adaptés à l’écran [trello:6ac75fbda79c4c777508987e] - [Carte](https://trello.com/c/6ac75fbda79c4c777508987e)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [x] Valider accueil apothicaire, bouclier et visibilité du Dashboard [trello:6ac761f58b664d27cb2e9cd5] - [Carte](https://trello.com/c/6ac761f58b664d27cb2e9cd5)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/shop.js`, `assets/js/script.js`
- [x] Valider puzzles verrouillés et Memory compact [trello:6ac763f9346a0a7e6149d7fb] - [Carte](https://trello.com/c/6ac763f9346a0a7e6149d7fb)
  Fichiers : `assets/js/puzzle-data.js`, `lapinous-puzzles.json`, `assets/js/script.js`, `assets/css/mobile.css`
- [x] Valider accès Admin aux derniers niveaux et noms après rechargement [trello:6ac7652bc8ce084387e31ecc] - [Carte](https://trello.com/c/6ac7652bc8ce084387e31ecc)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js`
- [x] Valider cartes puzzles Dashboard et taux des œufs [trello:6ac76646894f17c16d8646d1] - [Carte](https://trello.com/c/6ac76646894f17c16d8646d1)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`
- [x] Valider Dashboard en accordéons et catalogue magasin [trello:6ac76741ba45b4cc22e9893c] - [Carte](https://trello.com/c/6ac76741ba45b4cc22e9893c)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`, `assets/js/local-files.js`
- [x] Valider Dashboard visuel, taux des œufs et poids README [trello:6ac76ac51940e93ee2c2d397] - [Carte](https://trello.com/c/6ac76ac51940e93ee2c2d397)
  Fichiers : `assets/js/dashboard.js`, `assets/js/dashboard-ui.js`, `dashboard.html`, `assets/js/species-data.js`, `lapinous-content.json`, `readme.md`
- [ ] Valider cuisine, Marché et évolutions progressives [trello:6ac775a5d9cc9195c78cfc47] - [Carte](https://trello.com/c/6ac775a5d9cc9195c78cfc47)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/js/pantry.js`, `assets/js/script.js`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`
- [x] Valider frigo cliquable et nouveaux aliments du Marché [trello:6ac7808c657c947629f42e6e] - [Carte](https://trello.com/c/6ac7808c657c947629f42e6e)
  Fichiers : `assets/js/pantry.js`, `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`, `assets/css/mobile.css`, `tools/test-mobile-game.mjs`, `assets/js/script.js`

## Idees conservees

- [ ] Boss à comportements distincts [trello:6ac39e1702dcc73d8bd079c2] - [Carte](https://trello.com/c/6ac39e1702dcc73d8bd079c2)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] Défis de combat [trello:6ac39e1aaf413db2ee993e59] - [Carte](https://trello.com/c/6ac39e1aaf413db2ee993e59)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] Journal de collection [trello:6ac39e2f7f2924d04ff78274] - [Carte](https://trello.com/c/6ac39e2f7f2924d04ff78274)
  Fichiers : `assets/js/species-data.js`, `lapinous-content.json`, `assets/js/script.js`
- [ ] Expéditions courtes [trello:6ac39e33093ac1a6041de63f] - [Carte](https://trello.com/c/6ac39e33093ac1a6041de63f)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] Albums saisonniers [trello:6ac39e3688258482918621e0] - [Carte](https://trello.com/c/6ac39e3688258482918621e0)
  Fichiers : idee ou travail futur sans correspondance de code ; aucun deplacement automatique.
- [ ] Sauvegarde de secours [trello:6ac39e3935def311b21d9772] - [Carte](https://trello.com/c/6ac39e3935def311b21d9772)
  Fichiers : `assets/js/script.js`, `assets/js/save-validation.js`, `assets/js/local-files.js`, `index.html`

## Suivi historique et code livre

- [x] README et arborescence — actualisés le 08-10-2026 [trello:6ac39d96335bf1dad3b0d2f2] - [Carte](https://trello.com/c/6ac39d96335bf1dad3b0d2f2)
  Fichiers : `readme.md`, `A_FAIRE.md`, `tools/agent_lapinous/agent.py`, `tools/agent_lapinous/installer_taches.ps1`, `tools/agent_lapinous/liaisons_trello.json`, `tools/agent_lapinous/suivi_trello.py`
- [x] Magasin et inventaire — code livré [trello:6ac75d3f821f8ecfbfefd1b3] - [Carte](https://trello.com/c/6ac75d3f821f8ecfbfefd1b3)
  Fichiers : `assets/js/shop.js`, `assets/css/shop.css`, `lapinous-shop.json`
- [x] Accompagnateurs et lapins — médias centralisés [trello:6ac75d402925f959a3e9afbc] - [Carte](https://trello.com/c/6ac75d402925f959a3e9afbc)
  Fichiers : `assets/js/image-manifest.js`, `assets/js/image-assets.js`, `tools/update-images.mjs`, `tools/cloudinary-sync.mjs`, `tools/backup-transferred-images.mjs`, `tools/cloudinary-corbeille.mjs`, `tools/run-image-schedule.ps1`

## Criteres de validation conserves

- [x] Combats : equipes de 1/2/3, niveaux 1/20/40/60/80/100, puissance lisible, ultimes, soins, protections et difficulte reelle.
- [x] Progression : plafond 100, oeufs 20/40/60/80/100 et fragments d’Azazel sans recompense repetee au chargement.
- [x] Memory : 30 niveaux, 36 paires, records et anciennes sauvegardes ; puzzles : verrouillage, evenements, clavier/toucher et couturiere.
- [x] Audio : game over double, bouclier, soins courts, volumes et sons saisonniers sans superposition incorrecte.
- [x] Evenements : dates du Nouvel An chinois apres 2028, vue de face de Yuehua, calendrier et filtres Dashboard.
- [ ] Publication : droits des images et musiques, documents juridiques, confidentialite et paiement avant ouverture des packs Carottes.
- [ ] Randonneur : nouvelles images a integrer si confirmees dans une fonctionnalite ; ne pas supprimer les creations futures.


## Adaptation telephone - 14 octobre 2026

- [x] Feuille responsive commune `assets/css/mobile.css` chargee par le jeu et le Dashboard ; champs a 16 px, boutons principaux tactiles, marges et deplacements compatibles avec les petits ecrans.
- [x] Fenetres et sauvegardes : hauteur bornee au viewport, contenu defilant, commandes qui se replient ; carte [Sauvegardes](https://trello.com/c/6ac39d911abc6a7d2a71273e).
- [x] Cuisine : trois provisions par etagere sur telephone, six sur ordinateur ; etageres et plats separables et recettes defilantes ; carte [Cuisine / Marche / evolutions](https://trello.com/c/6ac775a5d9cc9195c78cfc47).
- [x] Fragments et magasin : commandes tactiles plus grandes, liste des lapins sur deux colonnes, dialogues defilants en paysage ; carte [Boutique et apothicaire](https://trello.com/c/6ac75d423df6f3af4d7dffa3).
- [x] Combat : preparation et commandes empilees en portrait, liste equipe defilante et terrain compact ; carte [Preparation du combat](https://trello.com/c/6ac39d8793f1039486b67a20).
- [x] Mini-jeux : panneaux contenus dans le viewport et defilement conserve en petite hauteur ; carte [Memory et puzzles](https://trello.com/c/6ac39f1ffd16599635e62ae9).
- [x] Test de la page reelle avec profils Chrome isoles et emulation tactile : `tools/test-mobile-game.mjs`. Les images sont remplacees par une image de controle : ce test mesure les panneaux et les erreurs JavaScript, pas la qualite des illustrations.
- [x] Emulation Chrome : 24 etats ouverts dans chacun des formats 390 x 844, 360 x 640 et 844 x 390 ; aucun debordement horizontal des panneaux controles ni erreur JavaScript. Ne valide pas une partie complete ni le rendu avec les vraies illustrations.
- [ ] Sur un vrai Android Chrome et un iPhone Safari, valider le toucher, le clavier virtuel, les textes longs, les encoches et la rotation pendant une partie ; carte [Placement et commandes](https://trello.com/c/6ac39d846f4f8d11b7da6ab0).
- [ ] Tester tous les niveaux des puzzles et du Memory, y compris 36 paires, puis Lapidoku, quiz et agilite sur appareil reel ; carte [Jeux adaptes a l ecran](https://trello.com/c/6ac75fbda79c4c777508987e).
- [x] Jouer un combat complet en manuel et automatique avec 1/2/3 lapins et verifier attaques, logs, fin de combat et recompenses ; carte [Preparation du combat](https://trello.com/c/6ac39d8793f1039486b67a20).
- [ ] Verifier la consommation et la preparation de chaque recette, les animations des accompagnateurs et les informations au toucher ; carte [Frigo et Marche](https://trello.com/c/6ac7808c657c947629f42e6e).
- [ ] Valider le telechargement/import JSON de secours sur les navigateurs mobiles sans acces aux dossiers ; carte [Sauvegardes](https://trello.com/c/6ac39d911abc6a7d2a71273e).
- [ ] Tester les accordeons, les cartes retournees et tous les champs du Dashboard sur telephone ; carte [Dashboard et catalogue](https://trello.com/c/6ac76741ba45b4cc22e9893c).

## Bilan quotidien

- [x] Horaires de reference : Cloudinary à 20 h Europe/Paris, puis bilan global et Discord immédiatement après, même en cas d’échec.
- [ ] Au bilan : Git, README et poids, A_FAIRE, correspondances Trello, Discord et resultat Cloudinary ; aucun push automatique.

<!-- LAPINOUS_AGENT_DEBUT -->
### Suivi automatique du projet

Dernier bilan : 17/10/2026 20:42

# Bilan Warrenfall - 17/10/2026 20:42
Mode : APPLICATION
Fichiers nouveaux depuis le point de reprise : 100
Cartes analysees : 0
Deplacements proposes : 0
Transitions traitees avec succes (reprises comprises) : 0

## Deplacements
Aucun deplacement justifie.

## Suivi detaille

## Git
- .gitignore
- 403.html
- 404.html
- AGENTS.md
- A_FAIRE.md
- Lapinous_documents_juridiques/00_LIRE_AVANT_PUBLICATION.md
- Lapinous_documents_juridiques/01_CGU.html
- Lapinous_documents_juridiques/02_CGV_carottes.html
- Lapinous_documents_juridiques/03_confidentialite.html
- Lapinous_documents_juridiques/04_mentions_legales.html
- Lapinous_documents_juridiques/05_credits_IA_licences.html
- Lapinous_documents_juridiques/06_retractation_remboursement.html
- Lapinous_documents_juridiques/07_suppression_donnees.html
- assets/css/lapidoku.css
- assets/css/shop-polish.css
- assets/css/startup.css
- assets/icons/error-403.png
- assets/icons/error-404.png
- assets/icons/error-offline.png
- assets/icons/warrenfall-192.png
- assets/icons/warrenfall-48.png
- assets/icons/warrenfall-512.png
- assets/img/Ouverture_du_jeu/animations/Warrenfall_ouverture_8_secondes.gif
- assets/img/Ouverture_du_jeu/animations/azazel_course.gif
- assets/img/Ouverture_du_jeu/animations/carotte_course.gif
- assets/img/Ouverture_du_jeu/erreur/Azazel devant la porte interdite-2.png
- assets/img/Ouverture_du_jeu/erreur/Azazel et le signal interrompu-3.png
- assets/img/Ouverture_du_jeu/erreur/Le chemin perdu d’Azazel-1.png
- assets/img/Ouverture_du_jeu/fonds_4K/01_apparition_3840x2160.jpg
- assets/img/Ouverture_du_jeu/fonds_4K/02_illumination_3840x2160.jpg
- assets/img/Ouverture_du_jeu/fonds_4K/03_ouverture_terrier_3840x2160.jpg
- assets/img/Ouverture_du_jeu/fonds_4K/04_transition_3840x2160.jpg
- assets/img/Ouverture_du_jeu/fonds_4K/05_chargement_3840x2160.jpg
- assets/img/Ouverture_du_jeu/logo/Warrenfall_logo_transparent.png
- assets/img/Ouverture_du_jeu/logo/icone_192.png
- assets/img/Ouverture_du_jeu/logo/icone_48.png
- assets/img/Ouverture_du_jeu/logo/icone_512.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/01.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/02.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/03.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/04.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/05.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/06.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/07.png
- assets/img/Ouverture_du_jeu/poses/azazel_course/08.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/01.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/02.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/03.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/04.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/05.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/06.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/07.png
- assets/img/Ouverture_du_jeu/poses/carotte_course/08.png
- assets/img/Ouverture_du_jeu/sources_animation/azazel_course_planche.png
- assets/img/Ouverture_du_jeu/sources_animation/carotte_course_planche.png
- assets/img/Zone_Chambre/sommeil.gif
- assets/img/Zone_Chambre/sommeil.png
- assets/img/Zone_SdB/toilette_oreilles.gif
- assets/img/Zone_SdB/toilette_oreilles.png
- assets/img/Zone_cuisine/faim.gif
- assets/img/Zone_cuisine/faim.png
- assets/img/Zone_jardin/entrainement.gif
- assets/img/Zone_jardin/entrainement.png
- assets/img/lapin_soin.gif
- assets/js/connection-notice.js
- assets/js/installer.js
- assets/js/lapidoku.js
- assets/js/local-files.js
- assets/js/script.js
- assets/js/shop.js
- assets/js/startup.js
- dashboard.html
- docs/AUDIT_SEO.md
- docs/AUDIT_VISUELS_GOOGLE_PLAY.md
- docs/MAGASIN.md
- docs/PUZZLES.md
- docs/RENOMMAGE_WARRENFALL.md
- index.html
- lapinous-quiz.json
- liste de futur création/futur_lapin.md
- manifest.json
- offline.html
- readme.md
- sw.js
- tools/agent_lapinous/INSTALLATION.md
- tools/agent_lapinous/README_INSTALLATION.md
- tools/agent_lapinous/agent.py
- tools/agent_lapinous/bot_discord.py
- tools/agent_lapinous/etat_batterie.json
- tools/agent_lapinous/installer_batterie.ps1
- tools/agent_lapinous/liaisons_trello.json
- tools/agent_lapinous/surveillance_batterie.py
- tools/serve-game.py
- tools/test-landscape-game.mjs
- tools/test-lapidoku.mjs
- tools/test-pwa.mjs
- tools/test-save-picker.mjs
- tools/test-startup.mjs
- tools/test_serve_game.py
- tools/update-readme-sizes.mjs

## Points de vigilance
Les commits depuis le dernier point de reprise sont inclus par comparaison des contenus.

## Chaine de cette execution
{"startedAt": "2026-10-17T20:27:32.4635898+02:00", "syncExit": 1, "bilanExit": 1, "errors": ["Synchronisation echouee (code 1)."], "trelloReadOnly": false, "cloudinaryDeleteDisabled": true, "syncFinishedAt": "2026-10-17T20:33:49.5712499+02:00"}

## Cloudinary — rapport complet
# Cloudinary — ÉCHEC
Début : 2026-10-17T20:31:27.669000+02:00
Fin : 2026-10-17T18:32:41.136Z
État déclaré : failed
Erreur : Étape interrompue : tools/cloudinary-sync.mjs (code 1)

## Étapes exécutées
- tools/cloudinary-sync.mjs dry-run : code 1 à 2026-10-17T18:32:41.048Z

## Inventaire complet
Sélectionnées : 323
Exclues : 166
Introuvables : 0

### Images utilisées
- assets/img/Ouverture_du_jeu/animations/azazel_course.gif | présente : True | motif : ['Référence : index.html', 'Référence : assets/js/startup.js']
- assets/img/Ouverture_du_jeu/animations/carotte_course.gif | présente : True | motif : ['Référence : index.html', 'Référence : assets/js/startup.js']
- assets/img/Ouverture_du_jeu/animations/Warrenfall_ouverture_8_secondes.gif | présente : True | motif : ['Référence : assets/js/startup.js']
- assets/img/Ouverture_du_jeu/fonds_4K/05_chargement_3840x2160.jpg | présente : True | motif : ['Référence : index.html', 'Référence : assets/js/startup.js']
- assets/img/Ouverture_du_jeu/logo/Warrenfall_logo_transparent.png | présente : True | motif : ['Référence : index.html', 'Référence : assets/js/startup.js']
- assets/img/Ouverture_du_jeu/poses/azazel_course/01.png | présente : True | motif : ['Référence : index.html']
- assets/img/Ouverture_du_jeu/poses/carotte_course/01.png | présente : True | motif : ['Référence : index.html']
- assets/img/accompagnateurs/Fragments/marche_droite.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Fragments/assemblage_cristaux.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/01_accroupie.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/02_attraper_haut.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/03_attraper_hauteur.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/04_bonjour.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/05_attente_droite.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/06_remise_produit.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/caissier/07_marche_lapine_artisane.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Artisan/Cycle de marche en six poses-7.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Artisan/Lapin forgeron brun, pose confiante-4.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Artisan/Lapin forgeron en salut respectueux-1.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Artisan/Le lapin forgeron présente son engrenage-3.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Artisan/Sprite sheet d’un lapin forgeron-9.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Fragments/Artisan lapin mystique en révérence-2.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Fragments/Lapin mystique blanc, bras croisés-5.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Fragments/Lapin mystique offrant un cristal d’améthyste-6.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/Comptoir.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/Atelier de forge mystique au terrier-2.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/Petite forge chaleureuse dans un terrier-1.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/Boutique chaleureuse aux trois niches vides-1.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/Marche.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/Boite_Mini_Jeu/Lapidoku.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/Boite_Mini_Jeu/Memory.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/Boite_Mini_Jeu/puzzles.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/Boite_Mini_Jeu/Quiz-1.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/herboristerie.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/fond/Magasin/Garde-manger.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/surprise_apple.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Tartelette.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/01_accroupie.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/02_attraper_haut.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/03_attraper_hauteur.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/04_bonjour.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/05_attente_droite.png | présente : False | motif : ['Référence : lapinous-shop.json', 'Référence : assets/js/pantry.js']
- assets/img/accompagnateurs/Chef/06_remise_produit.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/07_marche.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/08_decoupe_legumes.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Chef/09_wok.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/aneth.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/bleuet.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/camomille.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/celeri.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/Concombre.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/coriandre.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/courgette.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/fenouil.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/foin.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/fraise.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/herbes.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/laitue.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/menthe.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/myrtilles.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/pissenlit.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/poire.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/rose.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/aliments/soucis.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Boules_de_foin_fleuries.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/bouquet_gourmand.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Brochettes_fruitees_du_verger.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Concombre_farci.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Cœurs_de_foin_fleuris.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/delice_fruit_des_bois.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Galettes_vegetales_aux_herbes.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Melange_gourmand_aux_fruit.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Mosaique_du_potager_fleuri.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Nid_foin_aux_fleurs.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Nid_foin_aux_legumes.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/salade_concombre.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Salade_croquante_du_lapin.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/Salade_fleurie_du_jardin.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/salade_fruite_du_verger.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/salade_verte_printemps.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/01_accroupie.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/02_attraper_haut.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/03_attraper_hauteur.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/04_bonjour.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/05_attente_droite.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/06_remise_produit.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/Apothicaire/07_marche.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/couturiere/couturiere.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/couturiere/couturiere_felicitation.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/couturiere/cout_les_pieces.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/couturiere/deplace_tabouret.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/accompagnateurs/couturiere/marche_vers.gif | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/az/az_assis_de_face.png | présente : False | motif : ['Référence : index.html', 'Référence : dashboard.html']
- assets/img/boss/ail_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/ail_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/aubergine_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/aubergine_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/banane.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/carotte_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/carotte_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/choux_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/choux_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/courgette_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/courgette_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/mais_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/mais_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/mystery_boss.svg | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/boss/oignon_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/oignon_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/patate_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/patate_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/piment_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/piment_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/tomate_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/boss/tomate_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/fond/chambre.png | présente : False | motif : ['Référence : assets/css/style.css', 'Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/combat.png | présente : False | motif : ['Référence : assets/css/style.css', 'Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/cuisine.png | présente : False | motif : ['Référence : assets/css/style.css', 'Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Halloween/Chambre_halloween.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Halloween/Combat_halloween.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Halloween/Cuisine_halloween.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Halloween/Jardin_halloween.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Halloween/salle_de_bain_halloween.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Halloween/Salon_halloween.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/jardin.png | présente : False | motif : ['Référence : assets/css/style.css', 'Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Noel/Chambre_noel.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Noel/Combat_noel.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Noel/Cuisine_noel.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Noel/Jardin_noel.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Noel/salle_de_bain_noel.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Noel/Salon_noel.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/jour/Chambre_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/jour/Combat_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/jour/Cuisine_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/jour/Jardin_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/jour/salle_de_bain_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/jour/Salon_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/nuit/Chambre_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/nuit/Combat_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/nuit/Cuisine_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/nuit/Jardin_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/nuit/salle_de_bain_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Nouvel_An_Chinois/nuit/Salon_Nouvel_An_Chinois.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Paques/Chambre_paques.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Paques/Conbat_paques.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Paques/Cuisine_paques.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Paques/Jardin_paques.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Paques/salle_de_bain_paques.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Paques/Salon_paques.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/chambre_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/chambre_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/chambre_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/chambre_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/combat_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/combat_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/combat_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/combat_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/cuisine_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/cuisine_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/cuisine_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/cuisine_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/jardin_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/jardin_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/jardin_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/jardin_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salle_de_bain_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salle_de_bain_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salle_de_bain_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salle_de_bain_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salon_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salon_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salon_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/jour/salon_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/chambre_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/chambre_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/chambre_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/chambre_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/combat_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/combat_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/combat_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/combat_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/cuisine_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/cuisine_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/cuisine_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/cuisine_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/jardin_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/jardin_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/jardin_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/jardin_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salle_de_bain_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salle_de_bain_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salle_de_bain_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salle_de_bain_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salon_automne.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salon_ete.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salon_hiver.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/Saison/nuit/salon_printemps.png | présente : False | motif : ['Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/salle_de_bain.png | présente : False | motif : ['Référence : assets/css/style.css', 'Décor dynamique : événements/saisons/jour/nuit']
- assets/img/fond/salon.png | présente : False | motif : ['Référence : assets/js/shop.js', 'Référence : assets/css/style.css', 'Décor dynamique : événements/saisons/jour/nuit']
- assets/img/lapins_jouables/lapin_evenement/Halloween/bete_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/bete_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/fantome_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/fantome_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/frank_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/frank_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/krampus_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/krampus_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/peatch_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/peatch_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/squelette_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/squelette_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/vampi_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Halloween/vampi_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/fee_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/fee_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/frost_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/frost_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/reve_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/reve_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/cerf_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/cerf_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/Klaus_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/Klaus_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/lutin_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/lutin_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/Mnoel_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/Mnoel_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/Pnoel_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Noel/Pnoel_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/chance_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/chance_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/dragon_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/dragon_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/empereur_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/empereur_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/imperatrice_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/imperatrice_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/lanterne_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/lanterne_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/Lapin tigre en costume festif-2.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/Lapin tigre festif au tambour-1.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Paques/oeuf_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Paques/oeuf_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Paques/paques_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/lapin_evenement/Paques/paques_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/abeille_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/abeille_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/archy_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/archy_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/azazel_cote.png | présente : False | motif : ['Référence : assets/js/species-data.js']
- assets/img/lapins_jouables/sans_evenements/azazel_face.png | présente : False | motif : ['Référence : assets/js/species-data.js']
- assets/img/lapins_jouables/sans_evenements/blanc_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/blanc_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/cactus_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/cactus_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/caramel_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/caramel_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/champi_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/champi_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/chocolat_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/chocolat_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/eclair_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/eclair_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/etoile_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/etoile_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/fleur_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/fleur_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/lune_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/lune_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/mystery.svg | présente : False | motif : ['Référence : assets/js/dashboard.js', 'Référence : assets/js/script.js', 'Référence : assets/js/shop.js']
- assets/img/lapins_jouables/sans_evenements/panda_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/panda_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/pirate_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/pirate_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/renard_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/renard_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/soleil_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/soleil_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/tigre_cote.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/lapins_jouables/sans_evenements/tigre_face.png | présente : False | motif : ['Référence : lapinous-content.json']
- assets/img/magasin/produits/bain_petales.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/extracteur_fragments.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/infusion_douce.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/magasin/produits/panier_gourmand.png | présente : False | motif : ['Référence : lapinous-shop.json']
- assets/img/oeuf/commun.png | présente : False | motif : ['Chemin dynamique EGG_IMAGES']
- assets/img/oeuf/divin.png | présente : False | motif : ['Chemin dynamique EGG_IMAGES']
- assets/img/oeuf/epique.png | présente : False | motif : ['Chemin dynamique EGG_IMAGES']
- assets/img/oeuf/legendaire.png | présente : False | motif : ['Chemin dynamique EGG_IMAGES']
- assets/img/oeuf/mythique.png | présente : False | motif : ['Chemin dynamique EGG_IMAGES']
- assets/img/oeuf/rare.png | présente : False | motif : ['Chemin dynamique EGG_IMAGES']
- assets/img/page.jpg | présente : False | motif : ['Référence : assets/css/style.css']
- assets/img/puzzle/de_base/les_aventuriers.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/de_base/les_communs.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/de_base/les_scientifiques.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/de_base/Nature.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/de_base/voie_lactee.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Halloween/fantome.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Halloween/frankenshtein.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Halloween/lapin_bete.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Halloween/Squelette.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Halloween/VampireVSNonne.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Multi_saisons/reve.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Noel/Noel.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Nouvel_An_Chinois/Gardienne lapine au lac des lanternes-3.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Nouvel_An_Chinois/La grande célébration des lapins-6.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Nouvel_An_Chinois/Lapin porte-bonheur sous les lanternes-4.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Nouvel_An_Chinois/Le couple impérial au palais fleuri-1.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Nouvel_An_Chinois/Le lapin-dragon sur le pont céleste-2.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Nouvel_An_Chinois/Wushi, le lapin tigre en fête-5.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/puzzle/Paques/pacques.png | présente : False | motif : ['Référence : lapinous-puzzles.json']
- assets/img/regle.png | présente : False | motif : ['Référence : index.html']
- assets/img/Zone_Chambre/dodo.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_Chambre/lit.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_Chambre/panier.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_cuisine/carotte.png | présente : False | motif : ['Référence : lapinous-shop.json', 'Référence : assets/js/script.js']
- assets/img/Zone_cuisine/pomme.png | présente : False | motif : ['Référence : lapinous-shop.json', 'Référence : assets/js/script.js']
- assets/img/Zone_jardin/agilite.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_jardin/cliker.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_jardin/entrenement.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_SdB/brosse.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_SdB/lapin_SdB.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_SdB/pommeau.png | présente : False | motif : ['Référence : assets/js/script.js']
- assets/img/Zone_cuisine/lapin_cuisine.png | présente : False | motif : ['Référence : assets/js/script.js']

### Images exclues
- assets/img/accompagnateurs/caissier/exec-030757bc-ec79-452d-83d8-00b99494ec7f.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/accompagnateurs/Randonneur/07_marche_lapin_randonneur.gif | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/accompagnateurs/Randonneur/Lapin randonneur aux jumelles-4.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/accompagnateurs/Randonneur/Lapin randonneur debout avec sac à dos-3.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/accompagnateurs/Randonneur/Lapin randonneur saluant joyeusement-5.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/accompagnateurs/Randonneur/Lapin randonneur, carte et boussole-1.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/az/Azazel.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/az/az_assis_de_cote.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/az/az_cote.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/az/az_face.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Boite_Mini_Jeu/LapinouDoku.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/boss/carotte_choux_oignon.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/boss/Gemini_Generated_Image_joczczjoczczjocz.jpg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/boss/poivron_courgette_banane.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/boss/tomate_ail_mais_aubergine_patate.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/glouton.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/grand_sportif.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/gros_dormeur.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/maladroit.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/normal.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/petit_dormeur.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/breeds/petit_mangeur.svg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Discord/Alertes_erreur.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Discord/Badges de lapins enchantés au clair de lune.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Discord/Bilan_quotidien.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Discord/cloudinary_images.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Discord/Serveur.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Discord/Trello_taches.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/fond/Nuit/Image ChatGPT 30 sept. 2026, 00_29_30-4.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/fond/Nuit/Image ChatGPT 30 sept. 2026, 00_29_33-8.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/fond/Nuit/Image ChatGPT 30 sept. 2026, 00_29_36-11.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/fond/Nuit/Image ChatGPT 30 sept. 2026, 00_29_41-16.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/fond/Nuit/Image ChatGPT 30 sept. 2026, 00_29_44-20.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/fond/Nuit/Image ChatGPT 30 sept. 2026, 00_29_48-24.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/images des futur création/boss/ananas.jpg | présente : ? | motif : Création future
- assets/img/images des futur création/boss/betterave.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/celeri.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/cornichon.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/fraise.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/pissenlit.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/poire.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/pomme.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/raisin.png | présente : ? | motif : Création future
- assets/img/images des futur création/boss/taupinenbour.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/banshee_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/banshee_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/cafe_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/cafe_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/cendre_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/cendre_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/champi.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/champi_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/champi_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/fraise_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/fraise_cote1.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/fraise_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/fraise_face1.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/hibou_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/hibou_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/noisette_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/noisette_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/Premium fantasy rabbit collectible sheet._Display 4 rabbit characters._Each rabbit appears EXACTLY T (1).png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/Premium fantasy rabbit collectible sheet._Display 4 rabbit characters._Each rabbit appears EXACTLY T.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/tournesol_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/tournesol_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/trefle_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/commun/trefle_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/deesse_des_ames_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/deesse_des_ames_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/eclipse_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/eclipse_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/elements.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/gaia_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/gaia_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/ignis_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/ignis_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/storm_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/elements/storm_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/areignée_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/areignée_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/chauve_souris_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/chauve_souris_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/citrouille_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/citrouille_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/faucheur_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/faucheur_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/haloween_2027.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/harley_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/harley_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/joker_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/joker_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/lanterne_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/lanterne_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/marionett_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/marionett_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/necromencien_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/necromencien_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/sans_visage_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/haloween_2027/sans_visage_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/noce_funebre_abimé_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/noce_funebre_abimé_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/noce_funebre_bien_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/noce_funebre_bien_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/automne_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/automne_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/ete_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/ete_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/hiver_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/hiver_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/pringtemps_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/pringtemps_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/saison/saison.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/sirene_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/sirene_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/ssmmdt.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/succube_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/succube_face.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/triton_cote.png | présente : ? | motif : Création future
- assets/img/images des futur création/lapin/triton_face.png | présente : ? | motif : Création future
- assets/img/lapins_jouables/lapin_evenement/Halloween/bete.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Halloween/fantome.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Halloween/frank.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Halloween/haloween.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Halloween/krampus.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Multi_saisons/5_legendes.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Noel/noel.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/Feuille de lapins fantastiques et dragon doré.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Nouvel_An_Chinois/Wushi, lapin guerrier mythique.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Paques/paques_cote1.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/lapin_evenement/Paques/paques_face1.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/sans_evenements/bceprt.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/sans_evenements/Designer (1).png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/sans_evenements/Designer.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapins_jouables/sans_evenements/fleur.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/lapin_soin.gif | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/magasin/aliments/Cinq bouquets floraux fantastiques colorés.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/magasin/aliments/Planche botanique d’herbes et fleurs remarquables (1).png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/magasin/aliments/Planche d’icônes culinaires fleuries et colorées.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/magasin/aliments/Planche d’icônes gourmandes et fleuries.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/fonds_4K/01_apparition_3840x2160.jpg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/fonds_4K/02_illumination_3840x2160.jpg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/fonds_4K/03_ouverture_terrier_3840x2160.jpg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/fonds_4K/04_transition_3840x2160.jpg | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/logo/icone_192.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/logo/icone_48.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/logo/icone_512.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/02.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/03.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/04.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/05.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/06.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/07.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/azazel_course/08.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/02.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/03.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/04.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/05.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/06.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/07.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/poses/carotte_course/08.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/sources_animation/azazel_course_planche.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Ouverture_du_jeu/sources_animation/carotte_course_planche.png | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Zone_Chambre/dodo.gif | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Zone_cuisine/lapin_cuisine.gif | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Zone_jardin/entrenement.gif | présente : ? | motif : Aucune référence active ou dynamique identifiée
- assets/img/Zone_SdB/lapin_SdB.gif | présente : ? | motif : Aucune référence active ou dynamique identifiée

### Références manquantes

### Entrées en corbeille : 0

### En attente : 0

### Réactivées : 0

### Supprimées définitivement : 0

### Suppressions bloquées : 0

### Erreurs corbeille : 0


## Quarantaine
📦 **Corbeille Cloudinary — suivi quotidien J-X**
Images en attente : **6**
Quarantaine logique : URL et public_id inchangés.
• **caissier_merci.png** — **J-3** — échéance : 20/10/2026 15:17
• **caissier_presentation.png** — **J-3** — échéance : 20/10/2026 15:17
• **Pomme_surprise_au_foin.png** — **J-3** — échéance : 20/10/2026 15:17
• **Comptoir vide dans un terrier chaleureux-4.png** — **J-3** — échéance : 20/10/2026 15:17
• **Cycle de marche à droite-8.png** — **J-3** — échéance : 20/10/2026 15:17
• **Lapin assemblant des cristaux violets-10.png** — **J-3** — échéance : 20/10/2026 15:17
Images bloquées : **1** ; erreurs : **0**.
🔒 chef.svg : Version exacte absente de la sauvegarde permanente
J-0 ne signifie pas supprimée : la suppression doit être autorisée et confirmée.

## Notifications prevues
- bilan : configure
- trello : configure
- images : configure
- erreurs : configure

## Erreurs
Erreur réseau SSLError (détails masqués)
RuntimeError : Synchronisation echouee (code 1).
La synchronisation de cette execution a echoue : code 1
<!-- LAPINOUS_AGENT_FIN -->

## Audit Trello et agent - 15 octobre 2026

Le bilan indépendant est abandonné. La chaîne unique de 20 h a passé le test réel autorisé du 15 octobre ; Trello est activé pour les prochains bilans réels après validation du 15 octobre ; les suppressions définitives restent bloquées. Aucun deplacement Trello ni message Discord reel pendant les tests.

- [x] Simulation sans ecriture de fichiers, rapports ou point de reprise, et sans notification. [trello:6ac39f30bfe4848ec3eca940:code:simulation-agent]
- [x] Preuves ciblees dans les lignes modifiees ; un fichier partage ne suffit plus. [trello:6ac39f30bfe4848ec3eca940:code:preuves-agent]
- [x] Git au format NUL, accents et renommages, commits depuis un point de reprise et contenus deja traites non rejoues. [trello:6ac39f30bfe4848ec3eca940:code:git-agent]
- [x] Sous-taches code et manuel comptees separement ; parent jamais coche automatiquement. [trello:6ac39f30bfe4848ec3eca940:code:sous-taches-agent]
- [x] Installateur en simulation par defaut, reutilisation des noms existants et maintien du bilan desactive. [trello:6ac39f30bfe4848ec3eca940:code:planification-agent]
- [x] Notifications independantes : une erreur ne bloque pas les autres canaux. [trello:6ac39f30bfe4848ec3eca940:code:discord-agent]
- [ ] Examiner humainement le rapport de simulation avant toute application Trello. [trello:6ac39f30bfe4848ec3eca940:manuel:accord-agent]
- [ ] Choisir une reference Git explicite si des commits anterieurs au premier point de reprise doivent etre attribues. [trello:6ac39f30bfe4848ec3eca940:manuel:baseline-agent]
- [ ] Valider la simulation avant remise en service de la seule chaîne de 20 h ; aucun bilan indépendant. [trello:6ac39f30bfe4848ec3eca940:manuel:reprise-agent]

### Tests de l audit agent

- [x] Tests Python de surete, Git, sous-taches et transitions avec faux services ; tests PowerShell sans commande reelle du Planificateur.
- [x] Simulation complete en lecture seule : 71 cartes analysees, aucun deplacement propose, aucune notification et aucun point de reprise cree.
- [x] Ancienne tâche de bilan conservée désactivée ; seule la tâche Cloudinary de 20 h sert de point d’entrée.

- [x] Ancien enchaînement optionnel remplacé : le mode réel de la chaîne appelle systématiquement le bilan après la synchronisation ; simulation par défaut avant validation.

## Chaîne unique de 20 h — diagnostic du 15 octobre 2026

- [x] Tâche existante inspectée en lecture seule : dernier essai le 14/10 à 20:37:02, résultat 0x800710E0 (requête refusée par l’opérateur ou l’administrateur). Dernier journal Cloudinary : 13/10. Journal opérationnel Windows désactivé : aucun événement détaillé disponible pour prouver la raison exacte du refus. [trello:6ac39f30bfe4848ec3eca940:code:diagnostic-chaine]
- [x] Orchestrateur unique : sync puis bilan dans finally ; pas de seconde exécution de la corbeille déjà incluse dans update-images.mjs. Journaux UTF-8, code d’échec remonté et verrou anti-chevauchement en mode réel. [trello:6ac39f30bfe4848ec3eca940:code:chaine-20h]
- [x] Rapport complet Cloudinary, Git, Trello, documentation, quarantaine et erreurs joint au bilan Discord ; les notifications suivantes restent tentées en cas d’échec d’un canal. [trello:6ac39f30bfe4848ec3eca940:code:rapport-chaine]
- [x] Résultats des simulations acceptés et actualisation de l’action existante avec -AppliquerChaine autorisée pour le test réel du 15 octobre. Aucune réactivation d’un bilan indépendant. [trello:6ac39f30bfe4848ec3eca940:manuel:remise-service-chaine]

- [x] Tests du 15/10 : 24 tests Python, 7 scénarios de chaîne et 5 scénarios d’installateur isolés réussis. Simulation réelle du lanceur : 71 cartes, 0 déplacement, aucun envoi ; code 1 attendu car dernier rapport Cloudinary périmé. [trello:6ac39f30bfe4848ec3eca940:code:tests-chaine-20h]

## Test réel Windows et Discord — 15 octobre 2026

- [x] Une seule exécution manuelle de la tâche existante, de 11:09:22 à 11:09:50 ; retour Windows 0, synchronisation 0 et bilan 0. Déclencheur quotidien inchangé, prochain passage à 20 h Europe/Paris. [trello:6ac39f30bfe4848ec3eca940:code:test-reel-windows]
- [x] Utilisateur flori/session interactive/droits standards, chemins valides, batterie autorisée et arrêt sur batterie désactivé. Action corrigée et rattrapage des démarrages manqués activé ; ancien bilan indépendant désactivé. [trello:6ac39f30bfe4848ec3eca940:code:parametres-windows]
- [x] Discord a confirmé quatre messages HTTP 200 : résumé, bilan complet joint, rapport Cloudinary joint et quarantaine. [trello:6ac39f30bfe4848ec3eca940:code:discord-reel]
- [x] 71 cartes Trello identiques avant/après ; aucun point de reprise consommé. Aucune suppression Cloudinary, six quarantaines à J-6 (arrondi supérieur), échéance commune 20/10/2026 15:17 Paris. [trello:6ac39f30bfe4848ec3eca940:code:securite-test-reel]
- [ ] Historique opérationnel Windows : activation tentée, refusée avec « Accès refusé ». À activer ultérieurement depuis une session administrateur autorisée ; aucun contournement effectué. [trello:6ac39f30bfe4848ec3eca940:manuel:historique-windows]
- [ ] Confirmer dans Discord la lisibilité des deux pièces jointes reçues. [trello:6ac39f30bfe4848ec3eca940:manuel:lecture-discord]

Après validation du 15 octobre, Trello peut appliquer les transitions autorisées lors des prochains bilans réels. La simulation reste en lecture seule et Cloudinary reste sans suppression définitive. L’ancien refus 0x800710E0 n’a pas été reproduit ; sa cause historique précise reste inconnue faute de journal opérationnel activé. `chef.svg` demeure bloqué faute de copie exacte dans la sauvegarde permanente ; aucune protection n’a été assouplie.


### Ouverture du jeu — 16 octobre 2026

- [x] Écran initial avec les cinq images, progression des ressources et lapin poursuivant une carotte, avant adoption ou reprise. [trello:6ac39db49bd7456ac00b5038:code:startup-89]
- [ ] Valider sur téléphone réel la séquence et la reprise hors connexion. [trello:6ac39db49bd7456ac00b5038:manuel:startup-phone-89]

Suivi du 16 octobre : tableau [Warrenfall](https://trello.com/b/5VmsAFi7/warrenfall) vérifié ; description de la carte [P2 — Performance](https://trello.com/c/vEMkqMbD) actualisée avec les fichiers, les tests réussis et les validations restantes. Carte non marquée terminée.

- [x] Visuels fournis intégrés : logo transparent, fonds 4K et GIF de course Azazel/carotte ; poses fixes si animations réduites. GIF complet de 14 Mo conservé sans chargement automatique. [trello:6ac39db49bd7456ac00b5038:code:startup-art-90]

- [x] Chargement immédiat sur le fond dédié avec logo et course lapin/carotte ; suppression du passage obligatoire par les quatre images d’introduction, préchargement prioritaire du fond. Visuels originaux conservés. [trello:6ac39db49bd7456ac00b5038:code:startup-direct-91]

- [x] Demande corrigée : introduction via le GIF fourni (une lecture de 3 secondes), puis fond spécial 05_chargement fixe avec progression et course ; aucun défilement des images 4K. Introduction ignorée si animations réduites ou GIF indisponible. Remplace le choix précédent de ne pas charger le GIF. [trello:6ac39db49bd7456ac00b5038:code:startup-gif-92]

- [x] Import au lancement : ouverture directe du sélecteur JSON dans le dossier mémorisé, sinon Téléchargements ; aucune demande préalable de dossier ni création de dossier pendant un import. Le navigateur conserve également le dernier emplacement du sélecteur. [trello:6ac39db1a134b35f03b17940:code:save-picker-93]

- [x] Nouveau logo fourni : favicon 48 px, icônes PWA 192/512 px, icône Apple et aperçu de partage ; icônes incluses dans le cache hors connexion. Anciennes images conservées. [trello:6ac39db1a134b35f03b17940:code:brand-icons-94]

- [x] Introduction corrigée : nouveau fichier Warrenfall_ouverture_8_secondes.gif, lecture complète de 8 secondes au lieu du lien obsolète vers le GIF de 3 secondes absent. Fond de chargement fixe conservé après la lecture. [trello:6ac39db49bd7456ac00b5038:code:startup-duration-95]

### Zones et erreurs — 17 octobre 2026

- [x] Nouveaux visuels faim, sommeil, toilette des oreilles et entraînement ; GIF pendant 4 secondes au clic puis retour à l’image fixe. Changement de pièce annule le retour différé. [trello:6ac39d846f4f8d11b7da6ab0:code:zone-actions-97]
- [x] Lapin placé dans la douche ; écrans 403/404/sans Internet plein écran, boutons accessibles et ressources d’erreur mises en cache. [trello:6ac39db1a134b35f03b17940:code:fullscreen-errors-97]
- [ ] Valider en jeu les pieds dans la douche et les animations sur téléphone réel ; le premier accès hors connexion nécessite une visite préalable en ligne. [trello:6ac39d846f4f8d11b7da6ab0:manuel:zone-actions-97]

- [x] Serveur local dédié : vraie réponse HTTP 404 illustrée même à la première visite sur /iindex.html ou un chemin imbriqué ; 403 pour fichiers cachés. README corrigé pour remplacer le serveur Python standard. [trello:6ac39db1a134b35f03b17940:code:local-errors-98]

- [x] Bouton Nettoyer rétabli : panneau des actions de bain positionné explicitement dans la scène, largeur bornée et défilement interne sur petit écran. [trello:6ac39d846f4f8d11b7da6ab0:code:wash-button-99]

## Fiabilisation des automatisations — 17 octobre 2026

- [x] Diagnostic documenté dans FIABILISATION_AUTOMATISATIONS.md : timeout VM inventaire, SSL Trello distinct et conditions Windows batterie contradictoires. [trello:6ac39f30bfe4848ec3eca940:code:automation-diagnostic-100]
- [x] Reprises réseau limitées, certificats vérifiés, diagnostic enfant conservé et compteurs d’erreurs séparés. Tests isolés sans service réel. [trello:6ac39f30bfe4848ec3eca940:code:automation-network-100]
- [x] Contrôle batterie à chaque appel, secteur exclu, seuils confirmés après HTTP accepté, journal local ; installateur limité à la tâche existante. [trello:6ac39f30bfe4848ec3eca940:code:battery-reliability-100]
- [ ] Valider les simulations puis appliquer uniquement les conditions Windows batterie ; historique opérationnel et test de veille contrôlé à effectuer. Aucun horaire ni réglage d’alimentation modifié. [trello:6ac39f30bfe4848ec3eca940:manuel:automation-windows-100]

## Réveil S0 — diagnostic et essai réel à poursuivre

- [x] Capacités S0, capot, minuteurs AC/DC et tâches vérifiés en lecture seule ; protocole et tâche temporaire préparés sans opération distante. Voir DIAGNOSTIC_REVEIL_S0.md. [trello:6ac39f30bfe4848ec3eca940:code:wake-s0-diagnostic-101]
- [ ] Armer puis effectuer réellement le test sur secteur, capot fermé ; corréler horodatage et événements S0 avant de conclure. Aucun succès présumé. [trello:6ac39f30bfe4848ec3eca940:manuel:wake-s0-real-101]

- [x] 19/10 : seule activation RTCWAKE sur batterie autorisée et appliquée ; tâches existantes inchangées. Test ponctuel armé à 09:32:22, résultat en attente de vérification après essai capot fermé. [trello:6ac39f30bfe4848ec3eca940:code:wake-s0-armed-102]

- [x] Essai S0 réel du 19/10 vérifié : capot fermé à 09:27:50, échéance 09:32:22, aucun horodatage ; dernier lancement déclaré 11:57:01 après ouverture, code 0x41306. Action de contrôle éveillé OK à 11:59:30. Test temporaire désactivé, production inchangée. [trello:6ac39f30bfe4848ec3eca940:code:wake-s0-result-103]
- [ ] Réveil autonome sur batterie non validé : diagnostic SleepStudy administrateur nécessaire, puis essai corrigé ou architecture sur machine toujours disponible. [trello:6ac39f30bfe4848ec3eca940:manuel:wake-s0-followup-103]

## Accueil et premiers pas — 19 octobre 2026

- [x] Lapins abaissés dans le Salon, la Cuisine, la douche et sur téléphone ; bouton Installer sorti des onglets serrés et rétabli quand le navigateur propose une nouvelle installation. [trello:6ac39d846f4f8d11b7da6ab0:code:floor-install-104]
- [x] Guide illustré en cinq étapes, phrases courtes, boutons précédent/suivant ; règles Lapidoku et sauvegardes actualisées. [trello:6ac39daf6e132da85a61925d:code:guide-104]
- [x] Œuf de bienvenue unique à la première adoption sur ce navigateur ; mêmes probabilités que les œufs habituels, aucune rareté élevée garantie. Protection dans le navigateur et la sauvegarde ; absence de serveur : effacer toutes les données du navigateur supprime cette protection locale. [trello:6ac39daf6e132da85a61925d:code:welcome-egg-104]
- [ ] Valider sur téléphone réel les appuis au sol, l’installation et la lisibilité du guide. [trello:6ac39d846f4f8d11b7da6ab0:manuel:onboarding-phone-104]

- [x] Carnet illustré enrichi : trois sources réelles de carottes, portraits et rôles des six accompagnateurs (marchande, Chef, apothicaire, artisan, spécialiste des fragments, couturière), lieux et étapes pratiques ; ouverture automatique au premier chargement après cette mise à jour, relecture par le livre. [trello:6ac39daf6e132da85a61925d:code:guide-companions-105]

- [x] Guide 105 vérifié en navigateur : ouverture automatique après chargement, navigation et portraits sur 568×280 et 1920×1080 ; bouton Lire le texte pour les pages défilantes. PWA testée avec le nouveau style. [trello:6ac39daf6e132da85a61925d:code:guide-105-tests]

## Règles et cohérence du terrier — 19 octobre 2026

- [x] Introduction une fois par session d’onglet, pas au rechargement ; attente des ressources requises et des animations d’accompagnateurs, nouvelle tentative au lieu d’entrée incomplète. [trello:6ac39db49bd7456ac00b5038:code:startup-strict-106]
- [x] Mini-jeux : 2/3 carottes par niveau récompensé, à chaque nouvelle partie réussie, même sur un niveau déjà terminé ; amitié principale conservée. Combats revalorisés, 35 % de butin ingrédient partagé de Cuisine. [trello:6ac39dc482f20ad66d405a8b:code:economy-106]
- [x] Évolutions et bonus communs à la sauvegarde ; fusion du meilleur palier des anciennes progressions. Besoins et techniques individuels conservés. [trello:6ac75d423df6f3af4d7dffa3:code:shared-evolutions-106]
- [x] Carnet en parchemin, mage des fragments, explications corrigées pour les stocks, évolutions et gains ; police de titres serif et texte de lecture. [trello:6ac39daf6e132da85a61925d:code:guide-rules-106]
- [x] Ambiance suspendue pendant le son d’événement ; GIF de course dans l’agilité, obstacles et fond cohérents ; nom de pièce retiré, œufs repositionnés, favicon Dashboard et icônes remplacés. [trello:6ac39d846f4f8d11b7da6ab0:code:world-polish-106]
- [x] Apothicairerie : fond complet, armoire ancrée au sol, bulle au-dessus du personnage. [trello:6ac75d423df6f3af4d7dffa3:code:apothecary-floor-106]
- [ ] Valider en jeu réel le chargement sur réseau lent, l’audio d’événement, la course et le placement de l’apothicairerie sur téléphone. [trello:6ac39d846f4f8d11b7da6ab0:manuel:world-106]

- [x] Œufs regroupés dans leur fenêtre dédiée sur PC et téléphone, ouverte depuis la navigation ; le panneau ne flotte plus au-dessus du décor et ne cache plus le lapin principal. [trello:6ac39d846f4f8d11b7da6ab0:code:eggs-dialog-106]

- [x] Ouverture corrigée : GIF avant le fond et la barre de chargement, aucun écran de chargement visible avant l’introduction ; petites récompenses des mini-jeux renouvelées à chaque partie réussie. [trello:6ac39db49bd7456ac00b5038:code:opening-order-107]
