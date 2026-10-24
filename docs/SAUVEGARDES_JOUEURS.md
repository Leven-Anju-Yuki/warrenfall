# Sauvegardes des joueurs

La partie courante et les trois « Petits nids » restent dans le navigateur. Pour obtenir aussi trois fichiers JSON sur disque, ouvrir Sauvegardes, choisir ou reconnecter le dossier « Lapinous sauvegarde » et autoriser l’écriture. Les copies existantes sont recopiées à la connexion du dossier ; les suivantes à chaque nouvel instantané, toutes les cinq minutes pendant le jeu. Les trois fichiers portent le numéro du nid et sa date de capture, par exemple `warrenfall-petit-nid-auto-1-24-10-2026_18h30-15-123.json`. Le numéro 1 est le plus récent. Le JSON conserve aussi la date précise et son équivalent ISO. Les exports manuels téléchargés portent également la date et l’heure dans leur nom ; le menu du dossier affiche la date de modification des fichiers.

Les anciennes copies automatiques sont retirées uniquement après écriture et relecture confirmée des nouvelles. Les anciens noms fixes sont reconnus pour la migration. Le nettoyage se limite aux noms réservés contenant les métadonnées d’un Petit nid ; les fichiers manuels et les fichiers illisibles restent conservés. En cas d’écriture interrompue, les copies précédentes sont préservées.

Un navigateur sans accès aux dossiers conserve les copies dans son stockage ; l’export manuel reste nécessaire pour obtenir un fichier. Une fermeture brutale peut interrompre une copie disque ; la copie du navigateur reste disponible. Les notifications distinguent les deux emplacements.

## Protection contre les modifications

Le jeu est statique et s’exécute chez le joueur. Un fichier local, même chiffré ou muni d’une somme de contrôle calculée dans le navigateur, ne garantit pas une progression authentique. Les anciennes sauvegardes restent acceptées pour préserver les parties. Aucune protection anti-triche fiable n’est prétendue ici.

Pour interdire réellement l’ajout d’objets : comptes authentifiés, progression et récompenses validées sur un serveur, signatures avec une clé uniquement sur ce serveur et politique explicite d’import des anciennes parties. Cette infrastructure reste à définir et à déployer ; aucun secret ne doit être placé dans le JavaScript public.
