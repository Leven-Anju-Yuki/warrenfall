# Réveil S0 Warrenfall — diagnostic du 17 octobre 2026

État : diagnostic effectué, scripts prêts, test réel capot fermé NON RÉALISÉ. Mission non validée.

## Constats Windows

- ASUS Vivobook X1404ZA ; veille S0 basse consommation connectée au réseau, hibernation disponible, S3 indisponible.
- `powercfg /lastwake` : compteur 0, résultat non probant pour les transitions S0.
- `powercfg /waketimers` : accès administrateur requis ; la session actuelle n’est pas élevée. Pas de contournement tenté.
- Minuteurs de réveil : activés sur secteur (AC=1), désactivés sur batterie (DC=0).
- Fermeture du capot : veille sur secteur et batterie (LIDACTION=1).
- Hibernation automatique : pas de délai sur secteur ; 21600 secondes (6 h) sur batterie.
- Cloudinary 20 h : active, WakeToRun=True, démarrage/poursuite sur batterie permis, rattrapage désactivé, session interactive flori.
- Batterie : active, réveil demandé, répétition quinze minutes, deux restrictions batterie désactivées.
- Ancien bilan indépendant désactivé. Aucun réglage de production, d’alimentation ou d’horaire modifié pendant ce diagnostic.

## Test réel préparé

`tools/test-reveil-s0.ps1 -Armer` prépare un unique déclenchement dans huit minutes. Le test utilise le même utilisateur interactif et le même exécutable PowerShell que la tâche de 20 h, avec droits standards. Aucun rattrapage si le réveil est manqué. Une seule tâche temporaire de nom fixe ; refus en présence d’un test précédent.

Action : `tools/test-reveil-horodatage.ps1`, qui écrit seulement la date et l’heure dans un fichier de `.cloudinary-local/wake-test/`. Aucun appel à Python, Node, Cloudinary, Trello ou Discord.

1. Premier essai sur secteur, où les minuteurs sont déjà autorisés ; session Windows conservée, éventuellement verrouillée.
2. Après armement, fermer le capot avant l’échéance et ne pas toucher au PC jusqu’à deux minutes après.
3. Réouvrir et indiquer l’heure approximative de fermeture/réouverture ; vérifier avec `-Verifier`.
4. Corréler l’horodatage, l’échéance, le résultat de tâche et les événements Kernel-Power 506/507. Une exécution pendant que le PC est éveillé, ou seulement après ouverture du capot, ne prouve pas le réveil.
5. Conserver les journaux. Une tâche de test supplémentaire ne sera pas créée sans traiter le premier essai.

L’action de test ne maintient pas artificiellement le PC éveillé et n’utilise aucun privilège système. Le chat peut lui aussi être suspendu lorsque le portable dort ; aucune réponse de ma part n’est nécessaire pendant la fenêtre d’essai.

## Conséquences d’éventuels réglages — non appliqués

Autoriser les minuteurs sur batterie permettrait des réveils supplémentaires et une consommation accrue ; cela ne garantit pas l’exécution d’une application de bureau en S0. Cette modification nécessite un accord préalable. Ne pas remplacer l’action capot par « ne rien faire » : ce ne serait pas une validation du réveil depuis la veille.

La tâche Cloudinary possède déjà WakeToRun ; un test réussi peut ne nécessiter aucune modification. Un horodatage réussi ne validera pas à lui seul la connectivité réseau, la durée complète de la synchronisation ou la disponibilité des services. Ces limites doivent rester distinctes.

## Limites et alternatives

Microsoft distingue le réveil du processeur S0 de l’exécution des applications de bureau, normalement suspendues pendant la veille. Certaines restrictions diffèrent entre secteur et batterie, et des protections contre la décharge peuvent limiter les sources de réveil.

Sources officielles :
- https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-wake-sources
- https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/integrating-apps-with-modern-standby

Si le test S0 échoue, examiner avec autorisation les diagnostics administrateur et les possibilités RTC/UEFI ou hibernation, puis les tester séparément. Aucune capacité RTC n’est présumée sur cet ASUS. Ne pas forcer S3 par registre sur un matériel qui ne le déclare pas.

Alternative indépendante de l’état du portable : exécuter la chaîne de 20 h sur une machine toujours disponible (mini-PC/NAS/serveur), avec accès sécurisé aux fichiers et sauvegardes nécessaires. Une simple migration vers un hébergement distant sans acheminer les nouvelles images locales ne suffirait pas. La sauvegarde permanente et la quarantaine restent à préserver. Aucun déploiement distant effectué.

## Essai réel armé le 19 octobre 2026

Autorisation explicite reçue : seul RTCWAKE sur batterie passe de 0 à 1. Comparaison complète powercfg /qh : une seule ligne modifiée ; secteur inchangé. XML de toutes les tâches Lapinous existantes identique avant/après. PC débranché, batterie lue à 61 %. Tâche temporaire unique armée à 09:24 pour 09:32:22 Europe/Paris ; rattrapage désactivé. Consigne : capot fermé avant l’échéance, réouverture à partir de 09:35, puis confirmation utilisateur. Aucun résultat de réveil encore établi. Les fichiers de preuve sont dans .cloudinary-local/wake-test/. Aucun appel distant effectué par le test. /waketimers reste inaccessible faute de session administrateur élevée.

## Résultat réel du 19 octobre — échec de la configuration testée

Confirmation utilisateur : retour à 11 h 57. Kernel-Power 506 à 09:27:50.580, motif Lid (fermeture), puis 507 à 11:56:59.718, motif Lid (réouverture). Échéance du test : 09:32:22.235. Aucun fichier d’horodatage produit. Le Planificateur indique LastRun=11:57:01 et LastTaskResult=267014 (0x41306, tâche interrompue), sans journal opérationnel pour déterminer la cause de cette interruption.

À 10:22:47, événements 507 puis 506 « Austerity Battery Drain Budget Exceeded ». Ils indiquent une restriction liée à la consommation pendant la session de veille ; leur survenue après l’échéance de 09:32 ne permet pas de les désigner comme cause certaine du premier réveil manqué.

Contrôle distinct, PC éveillé : le même exécutable et le script d’action ont écrit correctement le 19/10 à 11:59:30.334+02:00, dans un fichier de contrôle séparé. Ce contrôle ne doit jamais être confondu avec l’essai en veille.

Verdict : aucune exécution utile démontrée pendant la veille et capot fermé ; le test ne valide pas une synchronisation fiable à 20 h sur batterie. Il ne prouve pas non plus une impossibilité absolue du matériel. Aucun appel Cloudinary/Trello/Discord effectué par le test ou son contrôle.

Toutes les tâches de production restent strictement identiques par comparaison de leur XML. La seule tâche temporaire de test est maintenant désactivée ; preuves conservées. RTCWAKE sur batterie reste à 1, conformément à l’autorisation reçue. Ce réglage n’a pas suffi et peut augmenter les réveils/consommations ; il n’est pas justifié comme solution Warrenfall à ce stade. Aucun retour à 0 effectué sans accord.

Diagnostic supplémentaire préparé dans tools/diagnostic-reveil-admin.ps1 : powercfg /waketimers, /lastwake, /sleepstudy et /systemsleepdiagnostics en lecture seule. La session actuelle n’est pas élevée et ces rapports ont été refusés par Windows. Le script n’active pas l’historique et ne change aucun réglage.

Solution indépendante du sommeil du portable : héberger la chaîne quotidienne sur une machine restant disponible, avec copie des images et fichiers nécessaires envoyée avant la veille, et sauvegarde permanente/quarantaine préservées. Un hébergement seul ne peut pas récupérer des nouvelles images restées exclusivement sur un portable endormi. Aucun déplacement de l’automatisation n’a été fait. Une éventuelle piste hibernation/RTC devra être évaluée puis testée séparément ; aucune compatibilité firmware n’est présumée.


## Vérification réelle de configuration — 20 octobre 2026

Aucune modification des paramètres Windows, aucune tâche créée/armée, aucun déclenchement Cloudinary/Trello/Discord pour ce diagnostic.

ASUS Vivobook X1404ZA, Windows 11 Famille build 26300. `powercfg /a` confirme S0 basse consommation connecté et hibernation, sans S3. Minuteurs RTCWAKE=1 sur secteur ET batterie ; fermeture du capot = veille sur les deux alimentations. Hibernation après six heures sur batterie. `powercfg /waketimers` reste refusé faute de jeton administrateur élevé ; l’accès élargi à l’outil n’équivaut pas à une élévation UAC. `/lastwake` indique un réveil sans source détaillée, insuffisant pour conclure.

| Tâche | État | Réveil | Rattrapage | Batterie autorisée | Doublons |
| --- | --- | --- | --- | --- | --- |
| Surveillance batterie | Active, toutes les 15 min | Oui | Oui | Démarrage/poursuite autorisés | IgnoreNew |
| Images Cloudinary 20 h | Active, chaque jour à 20 h | Oui | Oui | Démarrage/poursuite autorisés | IgnoreNew |
| Bilan indépendant 21 h | Désactivée | Non | Réglage conservé, sans effet tant que désactivée | Anciennes restrictions conservées | IgnoreNew |

Les tâches utilisent la session interactive flori, droits limités. Elles ne sont pas configurées pour fonctionner après déconnexion complète. Une session verrouillée ne signifie pas une session déconnectée. Historique opérationnel du Planificateur actuellement désactivé ; aucune activation automatique effectuée.

### Ce que démontrent les événements et le journal batterie

- Test capot fermé du 19/10 : échéance 09:32:22, entrée S0 par capot à 09:27:50, réouverture à 11:56:59, aucun horodatage réussi pendant la fermeture. Le contrôle éveillé de 11:59 est distinct. Ce test est un échec de la configuration testée, sans prouver une impossibilité absolue du matériel.
- Le 19/10, les périodes capot fermé 20:20–20:43 et 20:52–21:14 ne contiennent aucun contrôle batterie après les deux premières minutes.
- Les périodes 19:28–20:10 et 21:14–22:03 sont associées à `Austerity Battery Drain Budget Exceeded`, avec zéro contrôle batterie après les deux premières minutes. Ce motif signale une limitation de consommation ; il ne prouve pas à lui seul la cause de tous les autres échecs.
- Le 20/10, les périodes S0 déclenchées par inactivité 11:56–12:22 et 12:27–13:31 contiennent respectivement deux et cinq contrôles batterie, alors sur secteur. La période 14:00–14:24 en contient un sur batterie. Ce sont des exécutions observées à l’intérieur des intervalles 506/507, pas une preuve de résidence profonde S0 ni un test capot fermé contrôlé.
- La chaîne Cloudinary s’est lancée le 19/10 vers 20:10 après sortie de veille à 20:10:04. Cela illustre le rattrapage ; aucune exécution à 20:00 pendant cette veille n’est démontrée.

### Limite de Python et solutions réalistes

Python sait lire la batterie et envoyer une alerte lorsqu’il obtient du temps d’exécution et un accès réseau. Il n’a pas de privilège lui permettant de garantir sa propre exécution pendant S0. Microsoft documente la suspension des applications de bureau par DAM et des restrictions supplémentaires sur batterie ; le réseau annoncé connecté ne garantit pas qu’un processus Python puisse l’utiliser. Un service SYSTEM ou une tâche répétée davantage ne constitue pas une solution démontrée. Les observations locales ci-dessus empêchent aussi d’affirmer que Python ne fonctionne jamais pendant un intervalle S0 : il fonctionne dans certains cas, sans fiabilité capot fermé démontrée.

1. Garder les réglages actuels en attendant le test, sans modifier protections thermiques, batterie critique, hibernation ni forcer S3 par registre.
2. Comparer un nouveau test capot fermé sur batterie, pendant environ vingt minutes, à ses événements et à l’heure de réouverture. Réutiliser uniquement la tâche temporaire déjà désactivée, sans doublon, après accord sur le créneau. Action locale d’horodatage, rattrapage désactivé pour ne pas confondre retard et réveil. Aucun service distant appelé par le test. Échec si l’horodatage n’est produit qu’à la réouverture ; un succès unique ne garantit pas le fonctionnement toutes les nuits.
3. Si l’objectif est écran éteint, envisager sur secteur un mode de travail capot fermé sans mise en veille, uniquement avec autorisation et validation réelle sur cet appareil S0. Cela consomme plus et ne convient pas au transport dans un sac ; aucune protection critique ne doit être désactivée. Ce scénario est distinct d’une surveillance pendant le sommeil S0.
4. Pour une chaîne de 20 h indépendante de l’état du portable : machine toujours disponible (NAS, mini-PC, serveur), fichiers nécessaires copiés avant la veille et sauvegarde/quarantaine préservées. Ce serveur peut signaler l’absence de nouvelles données du portable, mais ne peut pas mesurer sa batterie en temps réel si celui-ci dort sans transmettre.
5. Pour la batterie du portable endormi : conserver les protections natives Windows ; ne pas promettre des alertes Discord à chaque seuil tant qu’un agent local ne peut ni s’exécuter ni communiquer. Une application spécialisée en arrière-plan resterait soumise aux limites Windows et demanderait un développement et des tests distincts.

Sources :
- https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/integrating-apps-with-modern-standby
- https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby-wake-sources

**État : diagnostic actualisé ; nouveau test capot fermé en attente de disponibilité et de confirmation de Florie. Aucun fonctionnement fiable validé à ce stade.**


## Nouveau test réel du 20 octobre — échec confirmé

Florie a confirmé son retour à 15 h 22. La tâche temporaire existante a été réutilisée, sans création de doublon ; déclenchement unique à 15:04:18.372, WakeToRun=true, StartWhenAvailable=false, exécution sur batterie autorisée, utilisateur interactif flori. Batterie à 32 % et PC débranché à la préparation. Les trois tâches de production n’ont pas changé, comparaison de leurs XML avant/après à l’appui.

Chronologie Europe/Paris :

- 14:56:40.561 : Kernel-Power 506, entrée S0, motif Lid.
- 15:04:18 : échéance de l’horodatage ; aucun fichier produit.
- 15:11:42.829 puis 15:11:42.834 : 507/506, motif Austerity Battery Drain Budget Exceeded. Ces événements ne prouvent pas un réveil de bureau utilisable.
- 15:11:45 : dernière tentative déclarée par le Planificateur ; résultat 0x800710E0 (« L’opérateur ou l’administrateur a refusé la requête »). Aucun horodatage. Le journal opérationnel étant désactivé, le code seul ne permet pas de nommer précisément la condition responsable du refus.
- 15:22:40.498 : Kernel-Power 507, sortie S0, motif Lid, cohérente avec le retour utilisateur.
- 15:23:26.685 : contrôle batterie à 27 %, secteur absent, seuil 30 % envoyé et accepté par Discord (HTTP 204). Il s’agit d’une alerte après réouverture, pas pendant la fermeture.

**Verdict : aucune exécution utile capot fermé sur batterie démontrée, et aucun horodatage produit. Deux essais réels (19 et 20 octobre) échouent avec cette configuration malgré les minuteurs et WakeToRun activés. Une surveillance Python/Discord fiable toutes les quinze minutes en veille S0 sur batterie ne peut pas être promise.** Cela ne démontre pas une impossibilité absolue pour toutes les configurations matérielles ou applications spécialisées.

Preuves structurées : `.cloudinary-local/wake-test/verification-20261020.json`. La tâche temporaire est désactivée après vérification ; aucun nouveau lancement manuel, aucune modification des trois tâches habituelles, d’alimentation ou de protection, aucun appel distant par le test. L’alerte Discord observée provient de la tâche batterie habituelle, restée active.

Suite réaliste : obtenir les rapports administrateur SleepStudy et systemsleepdiagnostics pour préciser les restrictions de veille et le refus Windows. Pour les traitements ponctuels à 20 h, conserver le rattrapage ou choisir une machine disponible en permanence avec les données requises préalablement transférées. Pour la batterie en temps réel, il faut un agent local réellement exécuté et connecté ; un serveur distant ne peut pas lire la batterie d’un portable suspendu. Un fonctionnement actif, écran éteint et capot fermé, sur secteur, serait un scénario distinct, demandant autorisation des réglages puis un nouveau test ; aucun changement n’a été appliqué.

Précision utilisateur reçue ensuite : fermeture déclarée vers 14 h 46–47, retour vers 15 h 22. Windows enregistre l’entrée S0 au motif Lid à 14:56:40 ; ces deux heures sont conservées séparément sans supposer la cause de l’écart. Dans les deux cas, l’échéance 15:04 est antérieure au retour.
