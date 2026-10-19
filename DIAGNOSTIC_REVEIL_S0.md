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
