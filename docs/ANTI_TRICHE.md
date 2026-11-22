# Anti-triche Warrenfall — audit du 19 novembre 2026

## Avancement — premier lot local

Mise à jour lot 185 : publication demandée des correctifs d'affichage et de lecture économique ci-dessous, avec le rétablissement du frigo. Une garde supplémentaire vérifie les nouveaux départs d'exploration : préparation émise par le module, paramètres inchangés, niveau réel, préparation récente, reçu à usage unique et copie indépendante de l'objet stocké. Une sauvegarde refusée restaure l'énergie et le voyage précédent ; le reçu reste utilisable pour réessayer.

Cette garde s'applique seulement aux nouveaux départs. Les voyages déjà présents dans une ancienne partie restent récupérables et ne nécessitent aucun reçu en mémoire. Les délais, taux, coûts et formats sauvegardés ne changent pas. La confirmation du dernier compagnon intervient avant le tirage et la datation du départ, pour ne pas compter le temps passé dans cette confirmation.

Les tests `test-exploration-departure-safety.mjs` et `test-exploration.mjs` couvrent les falsifications de préparation, le rejeu, la mutation par référence, les retours arrière après échec et la récupération unique de voyages anciens. Cela ne certifie ni l'horloge de l'appareil, ni un client complètement modifié, ni la provenance de tous les butins importés. Les cartes restent ouvertes pour ce périmètre restant.

Les noms sont désormais échappés dans 40 expressions HTML du jeu, sans modifier leurs valeurs dans les sauvegardes. Deux tests dédiés vérifient l'affichage littéral de balises, guillemets et Unicode, ainsi que la conservation des données de partie.

Les prix, taux d'œufs et fenêtres d'événements des brouillons locaux sont ignorés sur le site public. L'édition locale reste possible sur localhost, IPv4 et IPv6. Les valeurs stockées ne sont ni supprimées ni remplacées. Le contrôle repose sur l'hôte, pas sur une classe CSS.

Les deux cartes concernées restent ouvertes : l'audit de l'ensemble des textes/URL/identifiants et des surcharges de personnages, boss et puzzles n'est pas terminé. Ces dernières sont conservées pour ne pas rendre indisponible un ancien compagnon personnalisé avant étude de compatibilité. Les autres catégories ci-dessous restent des tâches à réaliser.

Aucune modification du format de sauvegarde, aucun filtrage rétroactif des stocks ou de la collection, aucun changement des coûts publiés, de la rotation des copies ou des règles de progression. Treize séries de tests ciblés réussies pour le premier lot. Contrôle visuel physique restant ; publication demandée avec le lot 185.

Cet inventaire recense les principales familles de contournement identifiables dans le code actuel. Ce n'est pas une garantie exhaustive ni une annonce de corrections déjà réalisées. Aucun essai ne modifie une partie réelle.

Les tâches sont dans la liste **Anti-triche — à sécuriser** du [tableau Warrenfall](https://trello.com/b/5VmsAFi7/warrenfall). Elles sont reliées à A_FAIRE et au suivi manuel de l'agent, avec fichiers et critères de validation. Aucun déplacement automatique en Réalisé.

## Ce que le jeu protège déjà

- Validation des types, nombres non finis, stocks négatifs et propriétés dangereuses.
- Copie de secours et refus d'écrasement en cas de conflit de sauvegarde.
- Tirage d'œuf en attente conservé avant l'animation.
- Garde de récupération unique des expéditions et de plusieurs résultats de jeu.
- Limitations locales de visibilité et outils Admin réservés à l'environnement local.

Ces protections doivent être conservées et testées. Elles n'authentifient pas un client contrôlé par son propriétaire.

## Limites et décisions

Un jeu solo entièrement local ne peut pas garantir qu'un joueur n'a pas modifié son navigateur, ses fichiers ou son horloge. Encoder, compresser ou chiffrer avec une clé contenue dans le client décourage certaines modifications faciles, sans fournir une preuve anti-triche absolue. Un éventuel mode vérifié nécessite une autorité de confiance ; le mode hors connexion et les anciennes parties doivent avoir une politique explicite de compatibilité.

Les catégories « constaté » désignent un fait visible dans les fichiers. Les cartes « à vérifier » demandent une reproduction avant de parler de faille. Aucun exploit réel contre un joueur, aucun appel Cloudinary, aucun changement des taux ou des coûts n'est effectué.

## Tâches ouvertes

### P1 — Sauvegardes — authenticité des gains et modification locale

[Carte Trello](https://trello.com/c/U7gTgugC)

**Constat :** Constaté dans le code : les nombres sont contrôlés, mais aucune provenance de gains n’est attestée. Une quantité positive cohérente ne prouve pas une progression légitime. Le stockage du navigateur et les fichiers importés sont sous le contrôle du joueur.

**Remède attendu :** Définir un mode local libre et, si nécessaire, un mode vérifié par serveur. Un format compressé/encodé peut décourager l’édition simple, mais une clé livrée au navigateur n’est pas une preuve fiable. Prévoir migration et récupération des anciennes parties sans perte.

**Validation :** Importer des montants plausibles mais sans provenance ; vérifier refus ou classement non vérifié dans le futur mode sécurisé. Maintenir les sauvegardes anciennes.

Fichiers : `assets/js/save-validation.js`, `assets/js/save-safety.js`, `assets/js/script.js`.

### P1 — Horloge — durées d’exploration, bonus et défis quotidiens

[Carte Trello](https://trello.com/c/ZdgvXg3e)

**Constat :** Constaté : échéances d’exploration, jours des succès et bonus utilisent l’heure de l’appareil. Une avance ou un recul d’horloge peut modifier l’éligibilité ; le stockage local ne fournit pas d’heure de confiance.

**Remède attendu :** Détecter les sauts d’horloge sans supprimer de progression. Définir une politique hors connexion et, pour le mode vérifié, une heure serveur. Ne pas bloquer les vrais changements de fuseau et le passage été/hiver.

**Validation :** Avance/recul, changement de fuseau, heure été/hiver, reprise après plusieurs jours hors ligne et absence de récompense quotidienne multiple.

Fichiers : `assets/js/exploration.js`, `assets/js/achievements.js`, `assets/js/script.js`.

### P1 — Reprise d’anciennes copies — rejeu des tirages et des récompenses

[Carte Trello](https://trello.com/c/FXV8KCGl)

**Constat :** Limite locale confirmée : un import ou un Petit nid restaure aussi l’historique des récompenses. Le tirage d’œuf en attente est déjà sauvegardé, ce qui protège un simple rechargement ; restaurer une copie antérieure est un cas distinct.

**Remède attendu :** Définir ce qui reste autorisé en solo. Pour une progression vérifiée, journal d’opérations côté serveur, identifiants uniques et politique explicite de restauration. Conserver les copies de secours et éviter toute réinitialisation punitive.

**Validation :** Retour avant éclosion, avant réclamation de succès et avant retour d’expédition ; vérifier qu’un mode vérifié ne réattribue pas la même opération.

Fichiers : `assets/js/save-safety.js`, `assets/js/auto-nests.js`, `assets/js/script.js`.

### P1 — Catalogues locaux — séparer les réglages Admin du jeu public

[Carte Trello](https://trello.com/c/R5Sr11KU)

**Constat :** Constaté : des surcharges locales de lapins, boss, taux d’œufs et catalogues sont relues dans le navigateur. Masquer le Dashboard ne constitue pas un contrôle d’intégrité des réglages.

**Remède attendu :** Auditer chaque lecture de surcharge. N’appliquer les brouillons Admin que dans un contexte local autorisé et conserver les catalogues publiés comme référence du jeu public. Un navigateur entièrement modifié reste hors garantie sans serveur.

**Validation :** Brouillons injectés dans un profil public : prix, taux, puissance et niveaux doivent rester ceux du catalogue public ; édition locale légitime conservée.

Fichiers : `assets/js/species-data.js`, `assets/js/shop.js`, `assets/js/dashboard.js`, `lapinous-content.json`.

### P1 — Textes importés — empêcher l’interprétation de HTML dans les noms

[Carte Trello](https://trello.com/c/Bczoj9Av)

**Constat :** Constaté par lecture : certains noms issus de la partie sont interpolés dans des chaînes innerHTML ; d’autres vues utilisent déjà un échappement. Risque d’injection d’affichage et potentiellement de script via une sauvegarde partagée ; ce point relève aussi de la sécurité du joueur.

**Remède attendu :** Utiliser textContent pour les noms/textes et un échappement commun aux endroits où le HTML est nécessaire. Auditer aussi attributs et URL. Ne pas interdire arbitrairement les accents ou noms légitimes.

**Validation :** Noms contenant des balises inertes, guillemets, esperluettes et caractères internationaux : affichage littéral, aucune création de balise ni exécution ; import/export intact.

Fichiers : `assets/js/script.js`, `assets/js/save-validation.js`, `assets/js/shop.js`.

### P1 — Actions directes — revérifier coûts, possession et déblocages

[Carte Trello](https://trello.com/c/cD9BTIyV)

**Constat :** Surface à vérifier : les fonctions de jeu restent appelables côté client. Un bouton désactivé ou masqué n’est pas un contrôle métier. Plusieurs gardes existent déjà ; aucun contournement universel n’est démontré.

**Remède attendu :** Vérifier les préconditions dans chaque action : compagnon possédé, zone, niveau, stock, prix, coût, voyage et état de fin. Centraliser les validations sans changer l’équilibrage.

**Validation :** Appels hors ordre, identifiants inconnus, quantités négatives, besoin insuffisant, fonctionnalité masquée et double clic : aucun gain ni débit partiel indu.

Fichiers : `assets/js/script.js`, `assets/js/shop.js`, `assets/js/exploration.js`.

### P1 — Concurrence — deux onglets, doubles clics et récompenses uniques

[Carte Trello](https://trello.com/c/zgErnpEG)

**Constat :** À compléter par des tests de concurrence. Les conflits d’écriture, états de fin, tirages en attente et récupérations uniques sont déjà protégés dans plusieurs chemins ; ne pas les déclarer cassés sans reproduction.

**Remède attendu :** Recenser chaque opération donnant ou consommant des ressources et vérifier une validation atomique/idempotente. Étendre le contrôle de révision aux transitions asynchrones et aux retours d’animation.

**Validation :** Deux onglets, clics rapides, sauvegarde refusée, fermeture pendant animation, achat et retour d’expédition simultanés : pas de duplication ni de perte.

Fichiers : `assets/js/save-safety.js`, `assets/js/script.js`, `assets/js/shop.js`, `assets/js/exploration.js`.

### P1 — Exploration — cohérence des voyages et butins importés

[Carte Trello](https://trello.com/c/wwL5KXZi)

**Constat :** Constaté : le voyage sauvegardé contient son échéance et son butin. La validation vérifie leur structure mais pas toute leur cohérence avec la destination, les taux, la durée et l’énergie réellement consommée.

**Remède attendu :** Valider zone/durée autorisées, coût attendu, dates et quantité maximale, objets du catalogue et compagnon possédé. Prévoir une migration prudente des anciennes explorations. Une preuve de tirage exige un service de confiance pour le mode vérifié.

**Validation :** Voyage structurellement valide mais butin incompatible, objet inconnu, quantité excessive, coût discordant et anciennes parties : traitement explicite sans effacement.

Fichiers : `assets/js/exploration.js`, `assets/js/save-validation.js`, `lapinous-content.json`, `lapinous-shop.json`.

### P2 — Aléatoire — tirages locaux et modification des probabilités

[Carte Trello](https://trello.com/c/dxaDMXbC)

**Constat :** Constaté : Math.random et les taux sont côté navigateur. Le résultat peut être anticipé ou influencé dans un client modifié ; le tirage d’œuf persistant réduit déjà le rejeu par rechargement.

**Remède attendu :** Recenser les tirages importants et utiliser crypto.getRandomValues si utile pour l’imprévisibilité locale. Pour une garantie d’équité, tirage et attestation côté serveur. Ne pas promettre que changer de générateur empêche de modifier le client.

**Validation :** Distribution statistique sur données fictives, bornes des taux, rechargement d’une éclosion et absence de nouveau tirage pour une opération identique.

Fichiers : `assets/js/script.js`, `assets/js/exploration.js`, `assets/js/species-data.js`.

### P2 — Mini-jeux — solutions et bonnes réponses accessibles au client

[Carte Trello](https://trello.com/c/FPRD0KPH)

**Constat :** Constaté : solutions de grilles, réponses de quiz et couleurs cibles sont nécessaires au fonctionnement local. Un joueur qui inspecte son client peut y accéder. Le risque concerne surtout de futurs records compétitifs.

**Remède attendu :** Conserver l’expérience hors connexion et distinguer entraînement/partie locale de score vérifié. Si classement partagé ajouté, validation de session et de résultat côté serveur ; ne pas envoyer simplement un score déclaré par le navigateur.

**Validation :** Résultat envoyé sans partie, état déjà terminé, résolution instantanée et utilisation de l’aperçu Admin : aucune récompense répétée ; politique des records explicite.

Fichiers : `assets/js/number-sudoku.js`, `assets/js/lapidoku.js`, `assets/js/quiz.js`, `assets/js/pixel-coloring.js`, `lapinous-quiz.json`.

### P2 — Automatisation des actions — autoclics, vitesse et limites métier

[Carte Trello](https://trello.com/c/I7GpGCvh)

**Constat :** Risque à mesurer, pas faille confirmée : clics synthétiques et automatisation peuvent répéter des actions ou accélérer une boucle. Les glissements de coloriage et options d’accessibilité sont des usages légitimes.

**Remède attendu :** Définir des limites d’action fondées sur les règles du jeu, pas sur l’interdiction du clavier ou du tactile. Tester les actions simultanées et mesurer les gains avant de changer les prix ou délais.

**Validation :** Rafales de clics, commandes clavier, glissements, tactile et lecteur d’écran : mêmes coûts et récompenses, interface utilisable.

Fichiers : `assets/js/script.js`, `assets/js/pixel-coloring.js`, `assets/js/shop.js`.

### P2 — Imports — compléter les invariants de progression et les limites

[Carte Trello](https://trello.com/c/K0s5ory6)

**Constat :** Constaté : types dangereux, nombres non finis, stocks négatifs et certaines bornes sont déjà contrôlés. D’autres relations doivent être auditées : niveau/amitié, fragments, collection, bonus, progression des jeux, compteurs et récompenses réclamées.

**Remède attendu :** Documenter les invariants de chaque format et refuser proprement les incohérences avant remplacement. Préserver les champs futurs et l’original ; un contrôle de cohérence ne remplace pas une preuve d’origine.

**Validation :** Valeurs limites, tableaux surdimensionnés, objets inconnus, compteurs incompatibles et formats historiques ; aucune sauvegarde valide perdue et diagnostic lisible.

Fichiers : `assets/js/save-validation.js`, `assets/js/save-safety.js`, `assets/js/achievements.js`, `assets/js/apothecary-effects.js`.

## Priorités pratiques

### Lot 189 local — intégrité des fichiers, sans authentification d'origine

Les nouveaux fichiers d'export et Petits nids sur disque contiennent une enveloppe `warrenfall-save` version 1 : contenu UTF-8 encodé en base64 et empreinte SHA-256. La vérification précède le remplacement de la partie. L'encodage évite l'édition directe des quantités dans le texte ; l'empreinte détecte une retouche ou corruption tant qu'elle n'est pas recalculée. Ce n'est ni du chiffrement ni une signature de serveur. Les anciens JSON bruts restent importables : les refuser ou fixer un plafond de ressources casserait des parties légitimes. Le stockage navigateur reste dans son format antérieur, version 2, et aucun fichier existant n'est converti sans une nouvelle sauvegarde demandée par le jeu.

Les règles de récompenses sont vérifiées indépendamment de l'enveloppe : un doublon ne peut pas imposer son propre montant. Si son montant ne correspond pas à la rareté actuelle, il reste en attente avec diagnostic ; aucun ancien solde n'est réduit. Débordements numériques refusés, attribution unique et annulation sur échec d'écriture testées. Les quantités positives plausibles d'un ancien fichier, les métadonnées de récompenses falsifiées mais cohérentes et un fichier dont l'empreinte a été recalculée ne sont pas authentifiés. Aucun contrôle local ne résout cela sans une autorité extérieure.

Tests `tools/test-save-files.mjs` et `tools/test-auto-nest-files.mjs` : import réel avant remplacement, retouches carottes/objets, Unicode, gros soldes, anciens objets, lecture protégée via sélecteur, trois copies, échec disque et import interrompu par une autre activité. Les fichiers originaux et parties réelles ne sont pas modifiés pendant les tests. Lot non publié.

### Lot 188 local — restauration et suite des tirages

`assets/js/replay-draws.js` conserve une graine et un compteur par canal dans `drawState`, champ optionnel sans changement de version. Restaurer la même copie donne les mêmes tirages suivants avec le même catalogue et les mêmes événements, pour les œufs, départs d'exploration et butins de combat. Les nouvelles parties utilisent une graine propre ; une ancienne copie sans ce champ est initialisée de façon déterministe à partir de son contenu, sans accès au réseau. Les œufs en attente sont repris tels quels. Une erreur d'enregistrement restaure aussi la position du tirage ; les tests exécutent les fonctions réelles des œufs simples/×10, des départs et des résultats tactiques.

Ne pas ajouter une liste noire navigateur « déjà gagné » : une restauration restitue également les anciens soldes et peut légitimement avoir besoin de récupérer à nouveau sa récompense. Un marqueur externe qui refuserait le gain sans restituer son solde ferait perdre de la progression. Les gains déjà cochés dans la copie courante restent uniques.

Limites : pas d'identité commune attestée pour des copies historiques différentes, pas d'authenticité de graine/compteur dans un fichier éditable et résultats pouvant évoluer avec un catalogue ou événement différent. Cette suite locale décourage le rechargement opportuniste ; elle n'est ni un secret ni une preuve d'équité serveur. Aucune ancienne copie n'est supprimée, rejetée ou réécrite sur disque.

### Lot 187 — bonus et défis quotidiens

`temporal-bonuses.js` fournit une horloge monotone de session aux bonus des plats et aux journées des succès. Les changements civils de plus de deux minutes suspendent consommation des repas à bonus et attribution quotidienne. La reprise d'arrière-plan réancre l'heure pour les téléphones suspendus. Le dernier instant de récupération quotidienne est conservé comme champ optionnel au prochain gain, sans réécriture de l'historique ancien. Les montants des repas importés sont bornés ; une expiration observée ne réactive pas le même bonus lors d'un recul ultérieur. Les anciens bonus sans `issuedAt` restent lisibles.

Le fuseau de la partie est conservé dans le champ optionnel `dailyTimeZone` : changer le fuseau du téléphone ne crée pas une seconde journée. Les tests couvrent trois fuseaux et le passage normal de minuit sans délai artificiel de 24 heures. Attribution quotidienne, préparation et consommation des repas sont annulées si l'enregistrement échoue ; les tests vérifient les stocks, les besoins, les succès et les carottes. La fuite n'attribue rien et débite une seule fois après confirmation. Le renfort reste temporaire au combat et ne touche pas au catalogue ou aux sauvegardes. Aucun changement de version de sauvegarde.

Limites : pas de preuve d'heure après fermeture/arrière-plan, de provenance des bonus plausibles importés, ni de résistance à un client réécrit. La restauration d'une ancienne copie reste une restauration de son historique. Ne pas présenter ces gardes comme une protection serveur.

### Lot 186 — cohérence à la récupération et horloge de session (local)

`assets/js/exploration.js` contrôle les voyages avant toute attribution : possession, zone et durée connues, coût et niveau si présents, appartenance des objets à la zone et à la rareté, et total cumulé inférieur ou égal au nombre de tirages prévu. Les champs facultatifs historiques restent acceptés. Une incohérence ne supprime ni le voyage ni son butin : la récupération est suspendue avec diagnostic. Un catalogue modifié depuis le départ peut aussi demander une vérification ; ce contrôle ne qualifie pas le joueur de tricheur et ne réécrit jamais son historique.

L'horloge civile est comparée au compteur monotone du navigateur. Un écart supérieur à deux minutes pendant une session au premier plan suspend départs et récupérations, sans modifier les dates enregistrées. Une correction de l'heure permet de réessayer. Au retour d'arrière-plan, la référence de session est reprise pour préserver les téléphones dont le compteur est suspendu. Les changements de fuseau et été/hiver ne changent pas les millisecondes UTC utilisées.

Tests : `tools/test-exploration-import-clock.mjs`, `tools/test-exploration.mjs`, `tools/test-exploration-departure-safety.mjs`, `tools/test-save-safety.mjs`. Pas de changement de format, pas de réécriture des fichiers joueurs. Non publié.

Limites restantes : heure manipulée avant ouverture ou pendant l'arrière-plan, client modifié, butin falsifié mais plausible, provenance de l'énergie débitée et récompenses quotidiennes. Une heure de confiance et une preuve de tirage demandent un service extérieur. Les paramètres temporels injectables des fonctions restent utiles aux tests, sans constituer une frontière de sécurité du client local.

Commencer par l'échappement des textes importés, l'isolation des brouillons Admin et la cohérence des imports. Consolider ensuite les transactions et les tests de concurrence. Décider séparément du niveau de garantie souhaité pour les sauvegardes locales, l'horloge et de futurs records partagés.

Préserver toutes les sauvegardes et proposer une récupération explicite en cas d'incohérence. Ne pas classer une partie ancienne comme tricheuse sur la seule base d'un format ancien ou d'un changement d'heure. Aucun secret de production ne doit être embarqué dans le jeu.
