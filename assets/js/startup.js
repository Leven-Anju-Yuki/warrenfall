(() => {
    'use strict';
    const screen = document.getElementById('startupScreen');
    const artwork = document.getElementById('startupArtwork');
    const progress = document.getElementById('startupProgress');
    const percent = document.getElementById('startupPercent');
    const status = document.getElementById('startupStatus');
    window.LapinousStartupError=()=>{screen.classList.remove('startup-opening');screen.hidden=false;status.textContent='Le jeu n’a pas pu terminer son chargement. Vérifie la connexion puis réessaie.';const retry=document.createElement('button');retry.type='button';retry.textContent='Recharger le jeu';retry.onclick=()=>location.reload();status.after(retry);};
    const intro = document.getElementById('startupIntro');
    const introSource = './assets/img/Ouverture_du_jeu/animations/Warrenfall_ouverture_web.gif';
    let introSeen=false;try{introSeen=sessionStorage.getItem('warrenfall_intro_seen')==='1';}catch{}
    const isReload=performance.getEntriesByType('navigation')[0]?.type==='reload';
    const reducedMotion = introSeen || isReload || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    const sources = ['./assets/img/Ouverture_du_jeu/fonds_4K/05_chargement_3840x2160.jpg'];
    let completed = 0;
    let failures = 0;
    const decorations = ['./assets/img/Ouverture_du_jeu/logo/Warrenfall_logo_transparent.png', './assets/img/Ouverture_du_jeu/animations/azazel_course.gif', './assets/img/Ouverture_du_jeu/animations/carotte_course.gif'];
    const openingCount = sources.length + decorations.length + (reducedMotion ? 0 : 1);
    let total = openingCount;
    let sceneStage = false;
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    const update = value => {
        value=Math.max(Number(progress.value)||0,value);
        progress.value = value;
        progress.textContent = percent.textContent = value + ' %';
    };
    function load(source) {
        return new Promise(resolve => {
            const image = new Image();
            let settled = false;
            const finish = ok => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                if (!ok) failures++;
                completed++;
                update(Math.min(95,sceneStage ? 40 + Math.round((completed - openingCount) / Math.max(1, total - openingCount) * 55) : Math.round(completed / total * 40)));
                resolve(ok);
            };
            const timer = setTimeout(() => finish(false), 12000);
            image.onload = () => image.decode ? image.decode().then(()=>finish(true),()=>finish(true)) : finish(true);
            image.onerror = () => finish(false);
            image.src = window.LapinousImages?.url(source) || source;
        });
    }
    const opening = sources.map(load);
    const decorationLoads = decorations.map(load);
    const introLoad = reducedMotion ? Promise.resolve(false) : load(introSource);
    window.LapinousStartupReady = (async () => {
        // One GIF playback for the introduction; the loading background never cycles.
        if (await introLoad) {
            intro.src = window.LapinousImages?.url(introSource) || introSource;
            intro.hidden = false;
            try{sessionStorage.setItem('warrenfall_intro_seen','1');}catch{}
            await pause(8000);
            intro.hidden = true;
        }
        screen.classList.remove('startup-opening');
        await Promise.all(opening);
        await Promise.all(decorationLoads);
        status.textContent = 'Préparation de ta partie…';
    })();
    window.LapinousStartupFinish = async () => {
        await window.LapinousStartupReady;
        await window.LapinousBackgroundReady;
        // The application has now rendered adoption or restored the saved room.
        // Keep the opening visible while those actual images become available.
        const images = [...document.images].filter(img => !screen.contains(img) && img.getBoundingClientRect().width && img.src);
        const backgrounds = new Set();
        document.querySelectorAll('body,#gameRoot,#gameArea,#gameArea *').forEach(node => {
            if (!node.getBoundingClientRect().width) return;
            for (const match of getComputedStyle(node).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)) backgrounds.add(match[1]);
        });
        const catalogue=window.LapinousShop?.getCatalog?.();
        const extras=new Set(['./assets/img/page.jpg']);
        function assets(value){if(typeof value==='string'&&/\.(png|gif|webp|jpe?g|svg)$/i.test(value))extras.add(value);else if(value&&typeof value==='object')Object.values(value).forEach(assets);}
        // Prepare all companion movements and care animations before exposing the game.
        if(catalogue){assets(catalogue.companions);assets(catalogue.cashier);assets(catalogue.apothecary);assets(catalogue.backgrounds);assets(catalogue.items);assets(catalogue.gameBoxes);}
        ['Zone_cuisine/faim','Zone_Chambre/sommeil','Zone_SdB/toilette_oreilles','Zone_jardin/entrainement'].forEach(path=>{extras.add('./assets/img/'+path+'.png');extras.add('./assets/img/'+path+'.gif');});
        let resources=[...new Set([...images.map(img=>img.currentSrc||img.src),...backgrounds,...extras])];
        sceneStage=true;total+=resources.length;
        let pending=resources;
        while(pending.length){
            const outcomes=await Promise.all(pending.map(load));
            pending=pending.filter((_,index)=>!outcomes[index]);
            if(pending.length){
                status.textContent=`${pending.length} ressource(s) indisponible(s). Le jeu attend leur chargement.`;
                await new Promise(resolve=>{const retry=document.createElement('button');retry.type='button';retry.textContent='Réessayer le chargement';retry.onclick=()=>{retry.remove();resolve();};status.after(retry);window.addEventListener('online',()=>{retry.remove();resolve();},{once:true});});
                completed-=pending.length;
            }
        }
        if(document.fonts?.ready)await document.fonts.ready;
        update(100);
        status.textContent = 'Toutes les ressources nécessaires sont prêtes !';
        await pause(350);
        screen.setAttribute('aria-busy', 'false');
        screen.hidden = true;
        window.dispatchEvent(new Event('lapinous:startup-complete'));
    };
})();
