/* Succès conservés dans la partie, y compris l'historique quotidien. */
(function (root) {
    const daily = [
        { id: 'visit', title: 'Bonjour les lapins !', metric: 'visit', target: 1, reward: 3, text: 'Revenir jouer aujourd’hui' },
        { id: 'play', title: 'Un esprit joueur', metric: 'gamesFinished', target: 1, reward: 5, text: 'Réussir un Memory, puzzle ou Lapidoku, ou parcourir 20 m au Jardin' },
        { id: 'boss', title: 'Le jardin est à nous', metric: 'bossesDefeated', target: 1, reward: 8, text: 'Vaincre un boss' },
        { id: 'run', title: 'On se dégourdit les pattes', metric: 'agilityPlayed', target: 1, reward: 4, text: 'Terminer un parcours d’agilité d’au moins 20 m' },
        { id: 'egg', title: 'Une nouvelle surprise', metric: 'eggsOpened', target: 1, reward: 5, text: 'Ouvrir un œuf' },
        { id: 'memory', title: 'Une bonne mémoire', metric: 'memoryCompleted', target: 1, reward: 5, text: 'Réussir un niveau de Memory' },
        { id: 'puzzle', title: 'Pièce après pièce', metric: 'puzzleCompleted', target: 1, reward: 5, text: 'Terminer un puzzle cousu' },
        { id: 'quiz', title: 'Mieux connaître ses lapins', metric: 'quizCompleted', target: 1, reward: 4, text: 'Terminer un quiz, quel que soit le score' },
    ];
    const milestones = [
        {id:'collection-1',title:'Bienvenue au terrier',metric:'collection',target:1,reward:5,text:'Adopter son premier lapin'},
        ...[3, 10, 20, 30].map((n,i) => ({id:`collection-${n}`, title:`Une famille de ${n} lapins`, metric:'collection', target:n, reward:[15,40,90,150][i]})),
        ...[10, 25, 50, 100].map((n,i) => ({id:`level-${n}`, title:`Un compagnon au niveau ${n}`, metric:'level', target:n, reward:[15,40,90,200][i]})),
        ...[10, 50, 100].map((n,i) => ({id:`boss-${n}`, title:`${n} boss vaincus`, metric:'bossesDefeated', target:n, reward:[20,70,150][i]})),
        ...[10, 50, 100].map((n,i) => ({id:`games-${n}`, title:`${n} jeux terminés`, metric:'gamesFinished', target:n, reward:[15,50,100][i]})),
        ...[10, 50, 100].map((n,i) => ({id:`eggs-${n}`, title:`${n} œufs ouverts`, metric:'eggsOpened', target:n, reward:[15,50,100][i]})),
        ...[1, 10, 30].map((n,i) => ({id:`memory-${n}`,title:`${n} niveau(x) de Memory réussi(s)`,metric:'memoryCompleted',target:n,reward:[5,20,50][i],text:'Les niveaux rejoués comptent aussi'})),
        ...[1, 5, 20].map((n,i) => ({id:`puzzle-${n}`,title:`${n} puzzle(s) cousu(s) terminé(s)`,metric:'puzzleCompleted',target:n,reward:[5,15,40][i],text:'Terminer le plateau, y compris en rejouant'})),
        ...[1, 5, 20].map((n,i) => ({id:`quiz-${n}`,title:`${n} quiz terminé(s)`,metric:'quizCompleted',target:n,reward:[4,15,40][i],text:'Chaque quiz terminé compte, quel que soit le score'})),
    ];
    function dayKey(date = new Date(root.LapinousClock?.now?.() ?? Date.now()),timeZone) {
        if(timeZone)try{
            const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
            const part=type=>parts.find(p=>p.type===type).value;
            return `${part('year')}-${part('month')}-${part('day')}`;
        }catch{} // Un ancien champ non reconnu ne rend pas la partie illisible.
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }
    // Un recul d'horloge ne rouvre pas une ancienne journée. Le repère n'est
    // ajouté qu'au prochain gain quotidien, sans réécrire l'historique existant.
    function dailyAllowed(game,date){
        if(!Number.isFinite(date?.getTime?.()))return false;
        if(root.LapinousClock?.valid()===false)return false;
        const last=game.achievements?.lastDailyClaimAt;
        return !Number.isFinite(last)||date.getTime()>=last-120000;
    }
    function ensure(game, date = new Date(root.LapinousClock?.now?.() ?? Date.now())) {
        game.records ||= {};
        // Les anciens compteurs sont conservés ; seuls les résultats connus sont repris.
        if (game.records.gamesWon == null) {
            const lapidoku = Object.values(game.progress || {}).reduce((n,p) => n + (Number(p.minigames?.lapidoku?.completed) || 0), 0);
            game.records.gamesWon = (Number(game.records.puzzlesCompleted) || 0) + lapidoku;
        }
        const state = game.achievements ||= { days: {}, claimed: {}, peaks: {}, earnedCarrots: 0 };
        state.days ||= {}; state.claimed ||= {}; state.peaks ||= {};
        state.earnedCarrots ||= 0;
        // Conserver le fuseau de la partie évite de créer de nouvelles journées
        // en changeant simplement le réglage de fuseau du téléphone.
        state.dailyTimeZone ||= Intl.DateTimeFormat().resolvedOptions().timeZone;
        const key = dayKey(date,state.dailyTimeZone);
        state.days[key] ||= { counts: { visit: 1 }, claimed: {} };
        for (const entry of Object.values(state.days)) {
            entry.counts.gamesFinished = (entry.counts.gamesWon || 0) + (entry.counts.agilityPlayed || 0);
        }
        const completed = key => Object.values(game.progress || {}).reduce((sum,p) => sum + (Number(p.minigames?.[key]?.completed) || 0), 0);
        const values = { ...game.records,
            memoryCompleted: Math.max(Number(game.records.memoryCompleted) || 0, completed('memory')),
            quizCompleted: Math.max(Number(game.records.quizCompleted) || 0, completed('quiz')),
            collection: new Set(game.ownedSpecies || []).size,
            gamesFinished: (Number(game.records.gamesWon) || 0) + (Number(game.records.agilityPlayed) || 0),
            level: Math.max(1, ...Object.values(game.progress || {}).map(p => Number(p.currentLevel) || 1)) };
        for (const [metric,value] of Object.entries(values)) state.peaks[metric] = Math.max(Number(state.peaks[metric]) || 0, Number(value) || 0);
        return state;
    }
    function record(game, metric, amount = 1, date = new Date(root.LapinousClock?.now?.() ?? Date.now()), dailyAmount = amount) {
        const state = ensure(game, date);
        game.records[metric] = (Number(game.records[metric]) || 0) + amount;
        const counts = state.days[dayKey(date,state.dailyTimeZone)].counts;
        counts[metric] = (counts[metric] || 0) + dailyAmount;
        ensure(game, date);
    }
    function list(game, date = new Date(root.LapinousClock?.now?.() ?? Date.now())) {
        const state = ensure(game, date), today = dayKey(date,state.dailyTimeZone);
        const row = (def, counts, claimed, day) => ({...def, day, value: Math.min(def.target, counts[def.metric] || 0), claimed: !!claimed[def.id]});
        const todayRows = daily.map(d => row(d, state.days[today].counts, state.days[today].claimed, today));
        const pending = []; // Historique conserv?, r?compenses quotidiennes expir?es.
        // Un seul palier par famille, sans masquer une récompense encore à récupérer.
        const families = [...new Set(milestones.map(d => d.metric))];
        const permanent = families.map(metric => {
            const steps = milestones.filter(d => d.metric === metric);
            const current = steps.find(d => !state.claimed[d.id]) || steps[steps.length - 1];
            return { ...row(current, state.peaks, state.claimed, null), step: steps.indexOf(current) + 1, steps: steps.length };
        });
        const rank = a => a.value >= a.target ? (a.claimed ? 1 : 0) : 2;
        const completedFirst = rows => rows.sort((a,b) => rank(a) - rank(b));
        const features={quizCompleted:'quiz',memoryCompleted:'memory',puzzleCompleted:'puzzles',bossesDefeated:'combat',agilityPlayed:'agility'};
        // Masquer les objectifs inaccessibles, sans toucher à leur historique ni
        // empêcher de récupérer une récompense déjà gagnée.
        const visible=row=>row.claimed||row.value>=row.target||!features[row.metric]||root.LapinousVisibility?.allowed(features[row.metric])!==false;
        return { today: completedFirst(todayRows.filter(visible)), pending, permanent: completedFirst(permanent.filter(visible)) };
    }
    function claim(game, id, day = null, date = new Date(root.LapinousClock?.now?.() ?? Date.now())) {
        if(day!==null&&!dailyAllowed(game,date))return 0;
        const state = ensure(game, date);
        if (day !== null && day !== dayKey(date,state.dailyTimeZone)) return 0;
        const def = (day === null ? milestones : daily).find(d => d.id === id);
        const entry = day === null ? { counts: state.peaks, claimed: state.claimed } : state.days[day];
        if (!def || !entry || entry.claimed[id] || (entry.counts[def.metric] || 0) < def.target) return 0;
        entry.claimed[id] = date.toISOString();
        if(day!==null)state.lastDailyClaimAt=Math.max(Number(state.lastDailyClaimAt)||0,date.getTime());
        game.carrots = (Number(game.carrots) || 0) + def.reward;
        state.earnedCarrots += def.reward;
        return def.reward;
    }
    function claimAndSave(game,id,day,save,date=new Date(root.LapinousClock?.now?.() ?? Date.now())){
        const keys=['achievements','records','carrots'];
        const before=keys.map(key=>({key,exists:Object.hasOwn(game,key),value:game[key]===undefined?undefined:JSON.parse(JSON.stringify(game[key]))}));
        try{
            const reward=claim(game,id,day,date);
            if(reward&&save()!==true)throw Error('Récompense non enregistrée : elle reste à récupérer.');
            return reward;
        }catch(error){for(const b of before){if(b.exists)game[b.key]=b.value;else delete game[b.key];}throw error;}
    }
    root.LapinousAchievements = { ensure, record, list, claim, claimAndSave, dayKey, dailyAllowed };
})(typeof window === 'undefined' ? globalThis : window);
