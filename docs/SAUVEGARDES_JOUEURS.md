# Sauvegardes des joueurs

La partie courante et les trois « Petits nids » restent dans le navigateur. Pour obtenir aussi trois fichiers JSON sur disque, ouvrir Sauvegardes, choisir ou reconnecter le dossier « Lapinous sauvegarde » et autoriser l’écriture. Les copies existantes sont recopiées à la connexion du dossier ; les suivantes à chaque nouvel instantané, toutes les cinq minutes pendant le jeu. Les trois fichiers réservés `warrenfall-petit-nid-auto-1.json` à `-3.json` contiennent la date, l’heure et le nom du nid. Le premier est le plus récent. Aucun fichier manuel n’est supprimé.

Un navigateur sans accès aux dossiers conserve les copies dans son stockage ; l’export manuel reste nécessaire pour obtenir un fichier. Une fermeture brutale peut interrompre une copie disque ; la copie du navigateur reste disponible. Les notifications distinguent les deux emplacements.

## Protection contre les modifications

Le jeu est statique et s’exécute chez le joueur. Un fichier local, même chiffré ou muni d’une somme de contrôle calculée dans le navigateur, ne garantit pas une progression authentique. Les anciennes sauvegardes restent acceptées pour préserver les parties. Aucune protection anti-triche fiable n’est prétendue ici.

Pour interdire réellement l’ajout d’objets : comptes authentifiés, progression et récompenses validées sur un serveur, signatures avec une clé uniquement sur ce serveur et politique explicite d’import des anciennes parties. Cette infrastructure reste à définir et à déployer ; aucun secret ne doit être placé dans le JavaScript public.
