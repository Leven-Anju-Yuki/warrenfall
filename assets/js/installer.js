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
  help.innerHTML = '<h2>Installer Warrenfall</h2><p>Sur Android, ouvre le jeu dans Chrome puis choisis « Installer l’application » ou « Ajouter à l’écran d’accueil » dans le menu ⋮.</p><p>Sur iPhone ou iPad : Safari → Partager → Sur l’écran d’accueil.</p><p>Après une première visite, les écrans et images déjà chargés restent disponibles hors connexion. Les images encore jamais ouvertes demandent Internet.</p><button type="button">Fermer</button>';
  document.body.append(help);
  help.querySelector('button').onclick = () => help.close();
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
  gameButton.remove();
  const navButton = document.createElement('button');
  navButton.id = 'installInNav'; navButton.type = 'button'; navButton.className = 'room-tab';
  navButton.dataset.installButton = 'true';
  navButton.innerHTML = '<span class="tab-emoji">📲</span><span>Installer</span>';
  document.getElementById('mainNav')?.append(navButton);
  let installationConfirmed = false;
  try { installationConfirmed = localStorage.getItem('lapinous_installed') === 'true'; } catch {}
  function visibility() {
    const installed = installationConfirmed || matchMedia('(display-mode:standalone)').matches || navigator.standalone;
    if (installed) { installationConfirmed = true; try { localStorage.setItem('lapinous_installed','true'); } catch {} }
    [button, savedButton, gameButton].forEach(item => { item.hidden = !!installed; });
    navButton.hidden = !!installed;
    navButton.disabled = !!installed;
    navButton.setAttribute('aria-label', installed ? 'Warrenfall est déjà installé' : 'Installer Warrenfall');
    navButton.lastElementChild.textContent = installed ? 'Installé' : 'Installer';
  }
  async function install() {
    if (installPrompt) {
      const prompt = installPrompt; installPrompt = null;
      await prompt.prompt(); await prompt.userChoice;
    } else help.showModal();
  }
  [button, savedButton, gameButton, navButton].forEach(item => item.addEventListener('click', install));
  addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; installationConfirmed = false; try { localStorage.removeItem('lapinous_installed'); } catch {} visibility(); });
  addEventListener('appinstalled', () => { installationConfirmed = true; visibility(); if (help.open) help.close(); });
  matchMedia('(display-mode:standalone)').addEventListener?.('change', visibility);
  visibility();
  addEventListener('resize', visibility);
  if ('serviceWorker' in navigator && isSecureContext) {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {
      button.title = savedButton.title = 'Installation indisponible pour le moment ; recharge le jeu avec Internet.';
    }));
  }
})();
