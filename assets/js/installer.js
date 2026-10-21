/* Installation et orientation : aucun accès aux sauvegardes du joueur. */
(() => {
  'use strict';
  let installPrompt;
  const mobile = () => matchMedia('(pointer:coarse)').matches && Math.min(innerWidth, innerHeight) < 900;
  const gate = document.createElement('dialog');
  gate.id = 'orientationGate';
  gate.setAttribute('aria-labelledby', 'orientationTitle');
  gate.innerHTML = '<div><span aria-hidden="true">📱 ↻</span><h1 id="orientationTitle">Tourne ton téléphone</h1><p>Le terrier se visite en paysage.</p><button type="button">Continuer en plein écran</button></div>';
  document.body.append(gate);
  gate.addEventListener('cancel', event => event.preventDefault());
  async function landscape() {
    if (!mobile()) return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      if (screen.orientation?.lock) await screen.orientation.lock('landscape');
    } catch { /* Le navigateur conserve son écran de rotation si le verrouillage est refusé. */ }
    orient();
  }
  function orient() {
    document.documentElement.classList.toggle('phone-landscape', mobile() && innerWidth > innerHeight);
    const portrait = mobile() && innerHeight > innerWidth;
    if (portrait && !gate.open) gate.showModal();
    if (!portrait && gate.open) gate.close();
  }
  gate.querySelector('button').addEventListener('click', landscape);
  addEventListener('resize', orient);
  addEventListener('orientationchange', orient);
  document.addEventListener('click', event => {
    if (event.target.closest('#adoptBtn,#loadInsteadBtn')) landscape();
  });
  orient();
  const help = document.createElement('dialog');
  help.className = 'install-help';
  help.setAttribute('aria-labelledby', 'installHelpTitle');
  help.innerHTML = '<header class="install-help-heading"><img src="./assets/icons/warrenfall-192.png?v=logo-111" width="72" height="72" alt=""><div><small>Emporte ton terrier</small><h2 id="installHelpTitle">Warrenfall ? port?e de patte</h2></div></header><p>Retrouve le jeu sur ton ?cran d?accueil, avec son ic?ne et sa propre fen?tre.</p><div class="install-help-platforms"><section><h3>Sur Android</h3><ol><li>Ouvre le jeu dans <strong>Chrome</strong>.</li><li>Touche le menu <strong>?</strong>, puis <strong>Installer l?application</strong> ou <strong>Ajouter ? l??cran d?accueil</strong>.</li></ol></section><section><h3>Sur iPhone et iPad</h3><ol><li>Ouvre le jeu dans <strong>Safari</strong>.</li><li>Touche <strong>Partager</strong>, puis <strong>Sur l??cran d?accueil</strong>.</li></ol></section></div><p class="install-help-note">Les ?crans d?j? charg?s restent disponibles hors connexion. Les nouvelles images demandent Internet.</p><button type="button">Revenir au jeu</button>';
  document.body.append(help);
  help.querySelector('button').onclick = () => help.close();
  const updatesHelp = document.createElement('p');
  updatesHelp.className = 'install-help-note';
  updatesHelp.textContent = 'Pour mettre le jeu à jour : sauvegarde ta partie, ouvre Warrenfall avec Internet, puis ferme complètement l’application et tous les onglets Warrenfall de Chrome avant de la rouvrir. Ne désinstalle pas le jeu et n’efface pas ses données. L’icône et le nom de l’application peuvent mettre plus longtemps à changer que le contenu du jeu.';
  help.querySelector('button').before(updatesHelp);
  const installStatus = document.createElement('p');
  installStatus.setAttribute('role','status');
  help.querySelector('h2').after(installStatus);
  const copyLink = document.createElement('button');
  copyLink.type='button'; copyLink.textContent='Copier le lien du jeu';
  copyLink.onclick=async()=>{try{await navigator.clipboard.writeText(new URL('./index.html',location.href).href);installStatus.textContent='Lien copié : ouvre Chrome ou Safari et colle-le dans la barre d’adresse.';}catch{installStatus.textContent=new URL('./index.html',location.href).href;}};
  help.querySelector('button').before(copyLink);
  const button = document.createElement('button');
  button.id = 'installButton'; button.type = 'button'; button.className = 'ghost-btn';
  button.textContent = 'Installer le jeu';
  document.getElementById('adoptBtn')?.parentElement.append(button);
  const savedButton = button.cloneNode(true); savedButton.id = 'installFromSave';
  document.querySelector('#saveModal .modal-body')?.prepend(savedButton);
  const gameButton = button.cloneNode(true); gameButton.id = 'installInGame';
  gameButton.textContent = '↓ Installer';
  document.body.append(gameButton);
  // Un seul accès pendant la partie : celui de la navigation.
  // L'accès mobile ne doit pas dépendre de la place restante dans les onglets.
  const navButton = document.createElement('button');
  navButton.id = 'installInNav'; navButton.type = 'button'; navButton.className = 'room-tab';
  navButton.dataset.installButton = 'true';
  navButton.innerHTML = '<span class="tab-emoji">📲</span><span>Installer</span>';
  document.getElementById('mainNav')?.append(navButton);
  const portraitInstall = document.createElement('button');
  portraitInstall.type='button'; portraitInstall.textContent='Installer le jeu';
  gate.querySelector('div').append(portraitInstall);
  let installationConfirmed = false;
  // Une ancienne confirmation ne prouve pas que l’application est encore installée.
  let installationRemembered = false;
  try { installationRemembered = localStorage.getItem('lapinous_installed') === 'true'; } catch {}
  function visibility() {
    const installed = installationConfirmed || matchMedia('(display-mode:standalone)').matches || navigator.standalone;
    if (installed) { installationConfirmed = true; try { localStorage.setItem('lapinous_installed','true'); } catch {} }
    [button, savedButton, gameButton, portraitInstall].forEach(item => { item.hidden = !!installed; });
    gameButton.hidden = !!installed || !mobile();
    navButton.hidden = !!installed || mobile();
    if (installed && help.open) help.close();
    navButton.disabled = false;
    navButton.setAttribute('aria-label', installed ? 'Warrenfall est déjà installé' : installationRemembered ? 'Installation et icône de Warrenfall' : 'Installer Warrenfall');
    navButton.lastElementChild.textContent = installed ? 'Application' : 'Installer';
    savedButton.textContent = installed ? 'Application et icône' : 'Installer le jeu';
  }
  async function install() {
    if (installPrompt) {
      const prompt = installPrompt; installPrompt = null;
      try {
        await prompt.prompt();
        const choice=await prompt.userChoice;
        if(choice.outcome==='accepted'){installationConfirmed=true;installationRemembered=true;visibility();}
      } catch {
        installStatus.textContent='Le navigateur n’a pas ouvert l’installation. Essaie son menu ⋮ → Installer l’application.';
        if(!help.open)help.showModal();
      }
    } else {
      installStatus.textContent=matchMedia('(display-mode:standalone)').matches || navigator.standalone
        ? 'Tu utilises déjà l’application installée.'
        : !isSecureContext ? 'Ouvre le jeu depuis son adresse HTTPS pour l’installer.'
        : 'L’invitation automatique n’est pas disponible ici. Ouvre le menu du navigateur → Installer l’application ou Ajouter à l’écran d’accueil. Si tu es dans une autre application, ouvre d’abord ce lien dans Chrome ou Safari.';
      if(!help.open)help.showModal();
    }
  }
  [button, savedButton, gameButton, navButton, portraitInstall].forEach(item => item.addEventListener('click', install));
  addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; installationConfirmed = false; installationRemembered = false; try { localStorage.removeItem('lapinous_installed'); } catch {} visibility(); });
  addEventListener('appinstalled', () => { installationConfirmed = true; installationRemembered = true; visibility(); if (help.open) help.close(); });
  matchMedia('(display-mode:standalone)').addEventListener?.('change', visibility);
  visibility();
  addEventListener('resize', visibility);
  if ('serviceWorker' in navigator && isSecureContext) {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {
      button.title = savedButton.title = 'Installation indisponible pour le moment ; recharge le jeu avec Internet.';
    }));
  }
})();
