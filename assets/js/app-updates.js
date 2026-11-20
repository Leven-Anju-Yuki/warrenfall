/* Mise à jour volontaire : ne jamais recharger une partie non enregistrée. */
(() => {
  if(!('serviceWorker' in navigator))return;
  let registration,applying=false,lastCheck=0;
  const notice=document.createElement('button');notice.type='button';notice.id='gameUpdateNotice';notice.hidden=true;
  notice.textContent='✨ Az a du nouveau !';notice.setAttribute('aria-label','Une mise à jour de Warrenfall est prête');
  const panel=document.createElement('dialog');panel.className='game-update-dialog';panel.setAttribute('aria-labelledby','gameUpdateTitle');
  panel.innerHTML='<img class="game-update-art" src="./assets/img/Ouverture_du_jeu/mise_a_jour/az_travaux.png" alt="Az bricole dans le terrier, parmi les lanternes et les fleurs violettes"><header><small>Warrenfall</small><h2 id="gameUpdateTitle">Az embellit le terrier !</h2></header><footer><p>Une nouvelle version du jeu est prête.</p><p class="update-status" role="status">Ta partie sera enregistrée avant de recharger le jeu.</p><div><button type="button" data-apply-update>Enregistrer et mettre à jour</button><button type="button" data-later-update>Plus tard</button></div></footer>';
  document.body.append(notice,panel);
  notice.onclick=()=>{if(!panel.open)panel.showModal();};
  panel.querySelector('[data-later-update]').onclick=()=>panel.close();
  const apply=panel.querySelector('[data-apply-update]'),status=panel.querySelector('.update-status');
  apply.onclick=()=>{
    if(applying)return;
    if(!registration?.waiting){status.textContent='Cette version est déjà active. Tu peux fermer ce message.';return;}
    const playing=document.body.classList.contains('game-running');
    let saved=!playing;
    try{if(playing)saved=typeof window.LapinousPrepareUpdate==='function'&&window.LapinousPrepareUpdate()===true;}catch{saved=false;}
    if(!saved){
      status.textContent='La sauvegarde n’est pas confirmée. La mise à jour attend : conserve ta partie et exporte une copie avant de fermer.';return;
    }
    applying=true;apply.disabled=true;status.textContent='Partie enregistrée. Az termine les travaux…';
    registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying)location.reload();});
  const ready=()=>{if(registration?.waiting)notice.hidden=false;};
  const watch=reg=>{
    if(!reg)return;
    registration=reg;ready();
    const follow=()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)Promise.resolve().then(ready);});};
    // L'installation peut avoir commencé avant que cet écran soit chargé.
    follow();reg.addEventListener('updatefound',follow);
  };
  async function check(){
    if(navigator.onLine===false||Date.now()-lastCheck<60000)return;
    lastCheck=Date.now();
    try{if(!registration)watch(await navigator.serviceWorker.getRegistration());await registration?.update();ready();}catch{/* Hors ligne : la partie continue. */}
  }
  navigator.serviceWorker.ready.then(watch).catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  addEventListener('online',check);addEventListener('load',check);
})();
