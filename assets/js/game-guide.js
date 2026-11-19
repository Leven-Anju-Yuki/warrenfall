(() => {
  const modal = document.getElementById('myModal');
  if (!modal) return;
  const seenKey = 'lapinous_guide_seen_v4';
  modal.classList.add('warrenfall-guide');
  modal.querySelector('.modal-content').style.setProperty('--guide-page-image', `url("${window.LapinousImages?.url('./assets/img/page.jpg')||'./assets/img/page.jpg'}")`);
  modal.querySelector('.modal-title').textContent = 'Les petits secrets du terrier';
  const steps = [
  {
    "section": "Bienvenue",
    "title": "Bienvenue dans ton petit terrier !",
    "image": "./assets/img/Ouverture_du_jeu/logo/Warrenfall_logo_transparent.png",
    "where": "Commence ici",
    "text": "Choisis ton premier lapin et donne-lui un petit nom.",
    "points": [
      "Découvre les pièces avec les boutons du bas.",
      "Un œuf de bienvenue t’attend après l’adoption."
    ],
    "tip": "Touche le livre pour retrouver ces conseils quand tu veux."
  },
  {
    "section": "Les besoins",
    "title": "Un lapin bien dans ses pattes.",
    "image": "./assets/img/Zone_cuisine/faim.png",
    "where": "Cuisine · Chambre · Bain",
    "text": "Chaque lapin possède ses propres jauges de nourriture, d’énergie et de propreté. Prendre soin de l’un ne remplit pas celles des autres.",
    "points": [
      "Cuisine : donne-lui à manger.",
      "Chambre : laisse-le se reposer.",
      "Bain : lave-le."
    ],
    "tip": "Des besoins bas peuvent réduire les gains des activités. Regarde les jauges avant de jouer ou de combattre ; le frigo permet de consulter tes provisions même quand ton lapin n’a plus faim."
  },
  {
    "section": "L’amitié",
    "title": "De jolis moments ensemble.",
    "image": "./assets/img/Zone_jardin/entrainement.gif",
    "where": "Salon → Coin jeux · Jardin",
    "text": "Les jeux et les victoires font gagner de l’amitié à ton lapin.",
    "points": [
      "Au Salon : puzzles, jeu des paires, quiz, Lapidoku (chiffres) et Lapinoudoku (couleurs, lapins et croix).",
      "Au Jardin : cours et remporte des combats.",
      "L’amitié gagnée fait monter son niveau."
    ],
    "tip": "La barre d’amitié indique ta progression et le prochain niveau. Les pièces se débloquent progressivement : lis le niveau et le coût indiqués sur le bouton. Les améliorations des pièces profitent à tous."
  },
  {
    "section": "Les carottes",
    "title": "Quelques carottes pour se faire plaisir.",
    "image": "./assets/img/Zone_cuisine/carotte.png",
    "where": "Jardin · Succès · Œufs",
    "text": "Elles servent à acheter des œufs et des articles au magasin.",
    "points": [
      "Une partie réussie : 2 ou 3 carottes, même si tu rejoues.",
      "Une victoire au combat rapporte davantage.",
      "Pense à récupérer tes récompenses avec le trophée."
    ],
    "tip": "Le plus beau cadeau des jeux reste l’amitié !"
  },
  {
    "section": "Ton premier combat",
    "title": "Prêt à défier les légumes ?",
    "image": "./assets/img/boss/oignon_face.png",
    "where": "Jardin → Aventure",
    "text": "Choisis un adversaire dans Jardin → Aventure.",
    "points": [
      "Prépare des lapins nourris, reposés et propres.",
      "Commence avec les petits légumes : amitié et 4 ou 5 carottes, sans ingrédient.",
      "Regarde les liens de ton équipe : les amis s’encouragent, les rivaux se gênent. Les boss sont plus forts et peuvent donner un ingrédient."
    ],
    "tip": "Tu peux choisir tes actions ou laisser jouer ton équipe. Après une défaite, prends soin de tes lapins."
  },
  {
    "section": "Les rencontres",
    "title": "De bonnes choses pour tes lapins.",
    "image": "assets/img/accompagnateurs/caissier/05_attente_droite.png",
    "where": "Magasin → Marché",
    "text": "La marchande, le Chef et l’apothicaire t’accompagnent.",
    "points": [
      "Marchande : choisis tes articles, puis règle ton panier.",
      "Chef : retrouve tes ingrédients dans le frigo et choisis un plat à préparer.",
      "Apothicaire : les soins sont rangés par nourriture, énergie, propreté et amitié. Certains préparent un bonus pour une prochaine action."
    ],
    "tip": "Les provisions et les soins sont partagés entre tous tes lapins."
  },
  {
    "section": "Les rencontres",
    "title": "Des amis pleins de savoir-faire.",
    "image": "assets/img/accompagnateurs/Apothicaire/05_attente_droite.png",
    "where": "Bouton feuille → Inventaire",
    "text": "Trois autres rencontres t’attendent.",
    "points": [
      "Artisan : améliore les pièces pour toute ta partie.",
      "Mage : aide-toi des fragments pour renforcer les techniques.",
      "Couturière : elle assemble les pièces bien placées du puzzle."
    ],
    "tip": "Les besoins, le niveau et les techniques restent propres à chaque lapin."
  },
  {
    "section": "Tes sauvegardes",
    "title": "Ton terrier se souvient de toi.",
    "image": "./assets/img/Ouverture_du_jeu/logo/Warrenfall_logo_transparent.png",
    "where": "Disquette → Sauvegardes",
    "text": "La partie en cours est enregistrée automatiquement dans ce navigateur après les actions importantes. Tu n’as pas besoin de fermer le jeu pour sauvegarder.",
    "points": [
      "Quand tu changes d’application ou masques la page, le jeu tente aussi d’enregistrer ta partie. La musique et les effets s’arrêtent ; la musique peut reprendre à ton retour si tu ne l’as pas coupée.",
      "Au prochain lancement dans le même navigateur, le jeu reprend la dernière partie enregistrée. Une fermeture forcée par le téléphone peut empêcher la toute dernière sauvegarde.",
      "Si un avertissement indique que l’enregistrement a échoué, garde la page ouverte et exporte un fichier avant de quitter."
    ],
    "tip": "Enregistrement automatique ne veut pas dire sauvegarde sur un compte en ligne : changer de navigateur ou d’appareil ne transfère pas ta partie."
  },
  {
    "section": "Tes sauvegardes",
    "title": "Trois Petits nids pour revenir en arrière.",
    "image": "./assets/img/oeuf/rare.png",
    "where": "Disquette → Sauvegardes → Petits nids",
    "text": "En plus de la reprise automatique, le jeu garde trois instantanés nommés « Petit nid », avec leur date et leur heure.",
    "points": [
      "Un nouveau Petit nid est créé environ toutes les cinq minutes pendant le jeu. Un instantané peut aussi être créé au départ de la page, avec au moins une minute entre deux copies.",
      "Seuls les trois plus récents restent disponibles : le nouveau remplace le plus ancien Petit nid. Tes sauvegardes manuelles ne sont pas supprimées par cette rotation.",
      "Ouvre les sauvegardes avec la disquette, repère la date et l’heure du Petit nid, puis utilise Charger pour reprendre cet état. Tu retrouveras la progression de cet instant, pas les actions réalisées après."
    ],
    "tip": "Le message « Petit nid enregistré dans ce navigateur » confirme la copie locale. Si un dossier de sauvegardes est connecté et autorisé, les Petits nids y sont aussi copiés ; sinon ils restent dans le navigateur."
  },
  {
    "section": "Tes sauvegardes",
    "title": "Garde aussi une copie à toi.",
    "image": "./assets/img/Ouverture_du_jeu/logo/Warrenfall_logo_transparent.png",
    "where": "Disquette → Sauvegardes",
    "text": "La copie la plus sûre à conserver en dehors du navigateur est un fichier de ta partie. C’est particulièrement utile avant de changer de téléphone, de navigateur ou de nettoyer ses données.",
    "points": [
      "Depuis la disquette, crée une sauvegarde nommée et utilise l’export ou le téléchargement JSON pour conserver un fichier daté. Garde-le dans un endroit que tu peux retrouver.",
      "Pour reprendre ce fichier, utilise Importer / Charger une sauvegarde. Sur un autre appareil, il faut d’abord y transférer ton fichier.",
      "Le dossier « Lapinous sauvegarde » n’est utilisé que si ton navigateur permet de le choisir et d’y écrire. Sur les téléphones sans cet accès, utilise le téléchargement et l’import de fichiers."
    ],
    "tip": "Effacer les données du site peut supprimer la reprise automatique et les Petits nids du navigateur. Une copie téléchargée à part évite de dépendre uniquement de ces enregistrements."
  },
  {
    "section": "À toi de jouer",
    "title": "À toi les petites aventures !",
    "image": "./assets/img/oeuf/rare.png",
    "where": "Œufs · Sauvegardes",
    "text": "Prends ton temps : ton terrier se découvre petit à petit.",
    "points": [
      "Ouvre ton œuf depuis le bouton Œufs.",
      "Garde une copie de ta partie avec la disquette.",
      "Si le bouton Installer est proposé, ajoute le jeu à ton écran d’accueil."
    ],
    "tip": "Commence par un petit jeu avec ton nouveau compagnon."
  }
];
  let index = 0;
  const body = modal.querySelector('.modal-body');
  function render() {
    const allowed=name=>window.LapinousVisibility?.allowed(name)!==false;
    const step = {...steps[index],points:[...steps[index].points]};
    if(index===2){
      const games=[['puzzles','puzzles'],['memory','jeu des paires'],['quiz','quiz'],['lapidoku','Lapidoku (chiffres)'],['lapinoudoku','Lapinoudoku (couleurs, lapins et croix)']].filter(([key])=>allowed(key)).map(([,label])=>label);
      step.points=[...(games.length?['Au Salon : '+games.join(', ')+'.']:[]),...((allowed('agility')||allowed('combat'))?['Au Jardin : '+[allowed('agility')?'cours':null,allowed('combat')?'remporte des combats':null].filter(Boolean).join(' et ')+'.']:[]),steps[index].points[2]];
      step.where=[games.length?'Salon → Coin jeux':null,(allowed('agility')||allowed('combat'))?'Jardin':null].filter(Boolean).join(' · ');
    }
    if(index===4&&!allowed('combat')){step.title='À chacun son rythme';step.where='Ton terrier';step.text='Prends soin de ton compagnon et découvre les activités disponibles.';step.points=['Nourris-le, laisse-le se reposer et entretiens son pelage.'];step.tip='Les autres activités apparaîtront lorsqu’elles seront disponibles.';}
    if(index===5){if(!allowed('recipes'))step.points[1]='Chef : retrouve tes ingrédients dans le frigo.';step.points=step.points.filter((_,i)=>allowed(['market','pantry','inventory'][i]));step.text='Retrouve les services disponibles pour tes lapins.';step.where=[allowed('market')?'Marché':null,allowed('pantry')?'Cuisine':null,allowed('inventory')?'Apothicairerie':null].filter(Boolean).join(' · ');}
    const gift=window.LapinousWelcomeGiftStatus?.();
    const receipt=(index===0||index===steps.length-1)?`<p class="guide-gift-status" role="status">${gift?.granted?'✓ Œuf de bienvenue offert ! Retrouve-le dans Œufs (sauf si tu l’as déjà ouvert).':'Ton œuf sera offert après l’adoption de ton premier lapin.'}</p>`:'';
    body.innerHTML = `<div class="guide-progress" role="status">${step.section} <span>${index + 1} / ${steps.length}</span></div><div class="guide-layout"><aside class="guide-art"><img src="${step.image}" alt="${step.title}"><span>${step.where}</span></aside><article class="guide-copy"><h2>${step.title}</h2><p>${step.text}</p><ul>${step.points.map(point=>`<li>${point}</li>`).join('')}</ul><p class="guide-tip">${step.tip}</p>${receipt}</article></div><nav class="guide-actions" aria-label="Étapes du tutoriel"><button type="button" data-read hidden>Lire le texte ↓</button><button type="button" data-prev ${index===0?'disabled':''}>← Retour</button><button type="button" data-next ${index===steps.length-1?'hidden':''}>La suite →</button><button type="button" data-bs-dismiss="modal">${index===steps.length-1?'Entrer dans le terrier':'Explorer maintenant'}</button></nav>`;
    const copy=body.querySelector('.guide-copy'), read=body.querySelector('[data-read]');
    const more=()=>{read.hidden=copy.scrollHeight-copy.scrollTop-copy.clientHeight<8;};
    read.onclick=()=>copy.scrollBy({top:Math.max(60,copy.clientHeight*.8),behavior:'smooth'});
    copy.addEventListener('scroll',more);requestAnimationFrame(()=>{if(copy.isConnected)more();});
    body.querySelector('[data-prev]').onclick = () => { index--; render(); };
    body.querySelector('[data-next]').onclick = () => { index++; render(); };
  }
  modal.addEventListener('show.bs.modal', () => {
    index = 0; render();
    modal.classList.remove('book-opening');
    requestAnimationFrame(() => { if(modal.classList.contains('show')) modal.classList.add('book-opening'); });
  });
  modal.addEventListener('hidden.bs.modal',()=>modal.classList.remove('book-opening'));
  window.addEventListener('lapinous:visibility-changed',render);
  modal.addEventListener('shown.bs.modal', () => { try { localStorage.setItem(seenKey,'1'); } catch {} });
  let newGamePending=false;
  window.addEventListener('lapinous:new-game',()=>{
    newGamePending=true;
    if(document.getElementById('startupScreen')?.hidden!==false)firstVisit();
  });
  function firstVisit() {
    let seen=false; try { seen=localStorage.getItem(seenKey)==='1'; } catch {}
    if (newGamePending||!seen){newGamePending=false;index=0;render();bootstrap.Modal.getOrCreateInstance(modal).show();}
  }
  window.addEventListener('lapinous:startup-complete',firstVisit,{once:true});
  if(document.getElementById('startupScreen')?.hidden) firstVisit();
  render();
})();
