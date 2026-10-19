import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';import {spawn} from 'node:child_process';

// Les originaux sont lus dans la sauvegarde permanente ; aucune image de contrôle.

const root=process.cwd();
const desktop=process.argv.includes("--desktop");
const polishAudit=process.argv.includes("--polish");
const sudokuAudit=process.argv.includes("--lapidoku");
const achievementAudit=process.argv.includes("--achievements");

const script=`<script>${process.argv.includes('--guide-auto')?'':"localStorage.setItem('lapinous_guide_seen_v4','1');"}window.mobileErrors=[];addEventListener('error',e=>{if(e.message)mobileErrors.push(e.message)});</script>`;

const audit=`<script>addEventListener('load',async()=>{const pause=ms=>new Promise(r=>setTimeout(r,ms));for(let i=0;i<100&&!window.openMemory;i++)await pause(200);if(location.search.includes('guideauto')){for(let i=0;i<100&&!document.getElementById('startupScreen')?.hidden;i++)await pause(200);if(!document.querySelector('#myModal.show'))throw Error('Tutoriel non ouvert automatiquement');window.guideAutoVerified=true;bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal')).hide();await pause(400);}if(!document.body.classList.contains('game-running'))document.getElementById('adoptBtn').click();await pause(2500);if(location.search.includes('family')&&!sessionStorage.familyFixture){const saved=JSON.parse(localStorage.getItem('lapinous_autosave'));saved.ownedSpecies=['azur','caramel','mocha','bambou'];saved.salonFavorites=['caramel','mocha','bambou'];saved.species='azur';if(location.search.includes('brand')){saved.speciesNames||={};saved.speciesNames.azur='Ancienne sauvegarde';}localStorage.setItem('lapinous_autosave',JSON.stringify(saved));sessionStorage.familyFixture='1';location.reload();return;}window.visualReady=true;});</script>`;

const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');const media=url.pathname.startsWith('/test-media/');const base=media?path.resolve(root,'../clikergame_avec_image'):root;let file=path.resolve(base,'.'+decodeURIComponent(media?url.pathname.replace('/test-media/','/'):url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(base+path.sep))return res.writeHead(403).end();let text=await fs.readFile(file);if(file.endsWith('index.html'))text=text.toString().replace('<head>','<head>'+script).replace('</body>',audit+'</body>');if(file.endsWith('image-manifest.js'))text=text.toString().replace(/("assets\/img\/[^"]+"):\s*"https:[^"]+"/g,(all,key)=>key+': '+JSON.stringify('/test-media/'+JSON.parse(key)));res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.png')?'image/png':file.endsWith('.gif')?'image/gif':'application/json');res.end(text);}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{for(const size of (desktop?(process.argv.includes('--quick')?[[1920,1080]]:[[1920,1080],[2560,1440],[3440,1440]]):process.argv.includes('--quick')?[[568,280]]:[[844,390],[740,320],[568,280]])){

const profile=path.join(root,'.cloudinary-local/mobile-cdp-'+size.join('-')+'-'+Date.now());await fs.mkdir(profile,{recursive:true});

const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true});child.stderr.on('data',()=>{});

try{let port;for(let i=0;i<100;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await new Promise(r=>setTimeout(r,100));}}

const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();const socket=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));let seq=0;const pending=new Map();socket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);}});const send=(method,params={})=>new Promise(resolve=>{const id=++seq;pending.set(id,resolve);socket.send(JSON.stringify({id,method,params}));});

await send('Emulation.setDeviceMetricsOverride',{width:size[0],height:size[1],deviceScaleFactor:1,mobile:!desktop});await send('Emulation.setTouchEmulationEnabled',{enabled:!desktop});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'+(process.argv.includes('--family')?'?family=1'+(process.argv.includes('--brand')?'&brand=1':'')+(process.argv.includes('--guide-auto')?'&guideauto=1':''):(process.argv.includes('--guide-auto')?'?guideauto=1':''))});

if(process.argv.includes('--startup')){
 await new Promise(r=>setTimeout(r,950));
 const shot=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(profile,'startup.png'),Buffer.from(shot.result.data,'base64'));
 console.log('Ouverture : '+path.join(profile,'startup.png'));
}
for(let i=0;i<150;i++){const response=await send('Runtime.evaluate',{expression:"window.visualReady",returnByValue:true});if(response.result?.result?.value)break;await new Promise(r=>setTimeout(r,200));}

if(process.argv.includes('--guide-auto')){const auto=await send('Runtime.evaluate',{expression:'window.guideAutoVerified===true',returnByValue:true});if(!auto.result?.result?.value)throw Error('Ouverture automatique non vérifiée');console.log('Tutoriel automatique vérifié après chargement.');}
for(const [name,expression] of (polishAudit?[
['salon-appuis',"document.getElementById('salonBtn').click()"],
['guide',"bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal')).show();document.querySelector('#myModal [data-next]').click()"],
['guide-carottes',"document.querySelector('#myModal [data-next]').click()"],
['guide-marchande',"document.querySelector('#myModal [data-next]').click()"],
['guide-fin',"for(let i=0;i<6;i++)document.querySelector('#myModal [data-next]').click()"],
['retour-guide',"bootstrap.Modal.getOrCreateInstance(document.getElementById('myModal')).hide()"],
['cuisine',"document.getElementById('cuisineBtn').click()"],
['chambre',"document.getElementById('chambreBtn').click()"],
['agilite-animee',"document.getElementById('jardinBtn').click();startAgility()"],
['fin-agilite',"stopAgility(false)"],
['salle-de-bain',"document.getElementById('sdbBtn').click();"],
...(process.argv.includes('--brand')?[
['quiz',"openRabbitQuiz()"],
['quiz-termine',"(async()=>{for(let n=0;n<100;n++){const choice=document.querySelector('[data-quiz-answer]');if(!choice)break;choice.click();document.querySelector('[data-quiz-next]').click();await new Promise(r=>setTimeout(r,30));}if(!document.querySelector('.quiz-score'))throw Error('Quiz non termine');document.getElementById('salonBtn').click();})()"]
]:[]),
['marche',"openLapinousMarket()"],
['table-remplie',"(async()=>{document.querySelector('.shop-consumable [data-shop-add]').click();await new Promise(r=>setTimeout(r,1200));})()"],
['evolution',"document.querySelector('[data-shop-tab=evolution]').click()"],
['fragments',"document.querySelector('[data-shop-tab=fragments]').click()"],
['inventaire',"openLapinousInventory()"],
['frigo',"document.getElementById('shopDialog').close();document.getElementById('cuisineBtn').click();openKitchenFridge()"],
['installation',"(()=>{document.getElementById('kitchenFridgeDialog').close();const visible=()=>[...document.querySelectorAll('#installButton,#installFromSave,#installInGame,#installInNav')].filter(b=>!b.hidden&&b.getBoundingClientRect().width);if(visible().length!==1)throw Error('Installation en double ou absente');dispatchEvent(new Event('appinstalled'));if(visible().length)throw Error('Installation encore proposee');})()"]
]:sudokuAudit?[
['lapidoku-niveaux',"openLapidoku()"],
['lapidoku-4',"startLapidoku(0)"],
['lapidoku-defaite',"(()=>{const p=LapinousSudoku.create(0),i=p.board.indexOf(0),wrong=p.solution[i]%p.size+1;selectLapidoku(i);for(let n=0;n<3;n++){enterLapidoku(0);enterLapidoku(wrong);}if(!document.querySelector('.sudoku-defeat')||document.querySelector('.sudoku-cell:not(:disabled)'))throw Error('Defaite non verrouillee');checkLapidoku();if(document.querySelector('.sudoku-victory'))throw Error('Gain apres defaite');})()"],
['lapidoku-recommencer',"openLapidoku();if(!document.querySelector('[onclick=\"startLapidoku(1)\"]').disabled)throw Error('Niveau debloque apres defaite');startLapidoku(0);if(!document.querySelector('.sudoku-play>header').textContent.includes('Erreurs 0/3'))throw Error('Erreurs non remises a zero')"],
['lapidoku-victoire',"(()=>{const p=LapinousSudoku.create(0);p.board.forEach((v,i)=>{if(!v){selectLapidoku(i);enterLapidoku(p.solution[i]);}});if(!document.querySelector('.sudoku-victory'))throw Error('Victoire automatique absente');checkLapidoku();checkLapidoku();if(!document.querySelector('.sudoku-notice').textContent.includes('réussie'))throw Error('Victoire non enregistree');})()"],
['lapidoku-9',"(()=>{for(let n=1;n<6;n++){startLapidoku(n);const p=LapinousSudoku.create(n);p.board.forEach((v,i)=>{if(!v){selectLapidoku(i);enterLapidoku(p.solution[i]);}});checkLapidoku();}startLapidoku(6);if(document.querySelectorAll('.sudoku-cell').length!==81)throw Error('Grille 9x9 absente');})()"],
['couture',"startPuzzle(0,0);selectPuzzlePiece(0);placePuzzlePiece(0);selectPuzzlePiece(1);placePuzzlePiece(1)"]
]:achievementAudit?[['salon','void 0'],['succes',"showLapinousRecords()"],['succes-long-terme',"document.querySelector('[data-records-tab=longterm]').click()"],['records',"document.querySelector('[data-records-tab=records]').click()"],['installer',"(async()=>{document.querySelector('.records-close').click();const b=document.getElementById('installInNav');if(b.hidden||!b.getBoundingClientRect().width)throw Error('Installer invisible');dispatchEvent(Object.assign(new Event('beforeinstallprompt',{cancelable:true}),{prompt:async()=>{window.installTestTriggered=true},userChoice:Promise.resolve({outcome:'dismissed'})}));b.click();await new Promise(r=>setTimeout(r,50));if(!window.installTestTriggered)throw Error('Installation non declenchee');})()"]]:desktop?[['salon','void 0'],['cuisine',"document.getElementById('cuisineBtn').click()"],['chambre',"document.getElementById('chambreBtn').click()"],['sdb',"document.getElementById('sdbBtn').click()"]]:[['salon','void 0'],['oeufs',"document.getElementById('phoneEggButton').click()"],['cuisine',"document.getElementById('phoneEggDialog').close();document.getElementById('cuisineBtn').click()"],['puzzle',"startPuzzle(0,0)"],['puzzle-zoom',"document.querySelector('[data-phone-puzzle-zoom]').click()"],['memory',"startMemory(0);flipMemory(0)"],['jardin',"document.getElementById('jardinBtn').click()"],['boss',"openAdventure()"],['preparation',"document.querySelector('[onclick^=prepareFight]').click()"],['marche',"leaveAdventure();document.getElementById('salonBtn').click();openLapinousMarket()"],['panier-rempli',"(async()=>{for(let i=0;i<3;i++){document.querySelectorAll('.shop-consumable [data-shop-add]')[i].click();await new Promise(r=>setTimeout(r,900));}document.querySelector('[data-shop-tab=cart]').click();await new Promise(r=>setTimeout(r,1100));if(!document.querySelector('.zone-cart'))throw Error('Panier non ouvert');})()"],['options-panier',"document.querySelector('[data-cart-inspect]').click()"],['evolution',"document.querySelector('[data-shop-tab=evolution]').click()"],['fragments',"document.querySelector('[data-shop-tab=fragments]').click()"],['panier',"document.querySelector('[data-shop-tab=cart]').click()"],['inventaire','openLapinousInventory()'],['frigo',"document.getElementById('shopDialog').close();document.getElementById('cuisineBtn').click();openKitchenFridge()"],['tactique',"(async()=>{document.getElementById('kitchenFridgeDialog').close();document.getElementById('jardinBtn').click();openAdventure();document.querySelector('[onclick^=prepareFight]').click();await new Promise(r=>setTimeout(r,50));document.querySelector('[onclick^=startTacticalFight]').click();})()"]])){

 if(process.argv.includes('--onboarding')&&!['salon-appuis','guide','guide-carottes','guide-marchande','guide-fin','retour-guide'].includes(name))continue;
 const action=await send('Runtime.evaluate',{expression,awaitPromise:true});if(action.result?.exceptionDetails)throw Error(name+': '+action.result.exceptionDetails.text);await new Promise(r=>setTimeout(r,2500));

 if(name==='salle-de-bain'){
  const checked=await send('Runtime.evaluate',{expression:"(()=>{const b=document.querySelector('#gameArea button[onclick=\"cleanRabbit()\"]');if(!b)return false;const r=b.getBoundingClientRect();return r.width>0&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()",returnByValue:true});
  if(!checked.result?.result?.value)throw Error('Bouton Nettoyer absent ou hors écran');
 }
 const shot=await send('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(profile,name+'.png'),Buffer.from(shot.result.data,'base64'));

 const state=await send('Runtime.evaluate',{expression:`JSON.stringify({name:${JSON.stringify(name)},title:document.title,legacyName:document.getElementById("brandTitle")?.textContent,errors:window.mobileErrors,background:document.getElementById('shopBody')?.style.backgroundImage,grid:document.querySelector('.shop-evolution-grid')?getComputedStyle(document.querySelector('.shop-evolution-grid')).position:null,classes:document.getElementById('shopDialog')?.className,body:document.getElementById('shopBody')?.getBoundingClientRect().toJSON(),rects:[...document.querySelectorAll('dialog[open],#friendshipBarContainer,#statusBars,.inventory-cabinet,.inventory-herbalist,#shopCashierImage,.puzzle-board,.memory-card.open,.cart-counter-inspect>img,.cart-counter-options:popover-open,#shopCashierSpeech,#inventorySpeech,#installInGame,#salonActiveRabbitSpot,.salon-rabbit-friend,#rabbitImage,.market-purchase-table,.sudoku-panel,.sudoku-board,.puzzle-tailor>img,#installInNav,.records-card,.achievement-row' )].map(n=>({id:n.id||n.className,rect:n.getBoundingClientRect().toJSON()}))})`,returnByValue:true});const report=JSON.parse(state.result.result.value);if((name==='puzzle'&&!report.rects.some(n=>n.id==='puzzle-board'&&n.rect.width>150&&n.rect.height>80))||report.errors.length||report.rects.some(n=>!String(n.id).includes('achievement-row')&&!(name==='puzzle-zoom'&&n.id==='puzzle-board')&&n.rect.width&&(n.rect.left < -1||n.rect.right>size[0]+1||n.rect.bottom>size[1]+1))||(name==='marche'&&report.rects.find(n=>n.id==='shopCashierImage').rect.height<50))process.exitCode=1;if(process.argv.includes('--brand')){if(report.title!=='Warrenfall : Les Chroniques de Garenne')throw Error('Titre incorrect');if(name==='cuisine'&&!report.legacyName?.includes('Ancienne sauvegarde'))throw Error('Ancienne sauvegarde non reprise');}if(polishAudit&&['marche','evolution','fragments','inventaire','frigo'].includes(name)){const dialog=report.rects.find(n=>n.id==='shopDialog'||n.id==='kitchenFridgeDialog');if(!dialog||Math.abs(dialog.rect.width-(size[0]-(desktop?24:8)))>2||Math.abs(dialog.rect.height-(size[1]-(desktop?24:8)))>2)throw Error('Dimensions magasin incoherentes');}if(sudokuAudit&&name.startsWith('lapidoku-')&&name!=='lapidoku-niveaux'){const board=report.rects.find(n=>n.id==='sudoku-board');if(!board||Math.abs(board.rect.width-board.rect.height)>2)throw Error('Grille non carree');}if(achievementAudit&&name==='succes'){const rows=report.rects.filter(n=>String(n.id).includes('achievement-row'));if(rows.length<8||rows.some(n=>n.rect.height>130))throw Error('Succes trop grands');}if(desktop&&name==='salon'){const hero=report.rects.find(n=>n.id==='salonActiveRabbitSpot');const friends=report.rects.filter(n=>String(n.id).includes('salon-rabbit-friend'));if(hero.rect.height<size[1]*.38||friends.length!==3||friends.some(n=>n.rect.height<size[1]*.32))throw Error('Lapins trop petits sur grand ecran');}console.log(state.result.result.value);

 }

if(polishAudit&&!process.argv.includes('--onboarding')){
 await send('Page.reload');
 let installed;
 for(let attempt=0;attempt<60;attempt++){
  installed=await send('Runtime.evaluate',{expression:"document.getElementById('installInNav')?.hidden===true&&localStorage.getItem('lapinous_installed')==='true'",returnByValue:true});
  if(installed.result?.result?.value)break;
  await new Promise(r=>setTimeout(r,200));
 }
 if(!installed.result?.result?.value)throw Error('Installation proposee apres rechargement');
 console.log('Installation masquee apres confirmation et rechargement.');
}
if(!desktop&&!process.argv.includes("--ui-only")){
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,200));

const portrait=await send('Runtime.evaluate',{expression:"document.getElementById('orientationGate').open",returnByValue:true});

if(!portrait.result?.result?.value)throw Error('?cran de rotation absent');

await send('Emulation.setDeviceMetricsOverride',{width:size[0],height:size[1],deviceScaleFactor:1,mobile:true});

const worker=await send('Runtime.evaluate',{expression:"Promise.race([navigator.serviceWorker.ready.then(()=>!!navigator.serviceWorker.controller),new Promise(r=>setTimeout(()=>r(false),12000))])",awaitPromise:true,returnByValue:true});

if(!worker.result?.result?.value)throw Error('Service worker non actif');

await send('Network.enable');await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await send('Page.reload');await new Promise(r=>setTimeout(r,3500));

let offline;for(let attempt=0;attempt<60;attempt++){offline=await send('Runtime.evaluate',{expression:"!!document.getElementById('gameRoot')&&!!document.getElementById('installButton')",returnByValue:true});if(offline.result?.result?.value)break;await new Promise(r=>setTimeout(r,200));}

if(!offline.result?.result?.value)throw Error('Le jeu ne se recharge pas hors ligne');

console.log('Rotation portrait et rechargement hors connexion OK. CAPTURES',profile);

}
if(desktop)console.log('CAPTURES DESKTOP',profile);
socket.close();}finally{child.kill();child.stderr?.destroy();child.stdout?.destroy();child.unref();}}

}finally{server.closeAllConnections();server.close();}
