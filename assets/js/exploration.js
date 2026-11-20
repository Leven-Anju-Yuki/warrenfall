/* Expéditions à échéance absolue, sans dépendance à un onglet ouvert. */
(() => {
  const HOUR=3600000;
  // Reçus de préparation uniquement en mémoire : aucune nouvelle contrainte
  // de format n'est imposée aux voyages déjà présents dans les sauvegardes.
  const preparedTrips=new WeakMap();
  // Comparaison en mémoire seulement : aucune date historique de sauvegarde
  // n'est réécrite. Une horloge corrigée rend les actions disponibles à nouveau.
  const clockAnchor={wall:Date.now(),mono:globalThis.performance?.now?.()};
  // Certains téléphones suspendent aussi leur compteur monotone en arrière-plan.
  // Reprendre un onglet doit conserver le temps hors ligne habituel ; le contrôle
  // porte donc sur les changements observés pendant une session au premier plan.
  globalThis.document?.addEventListener?.('visibilitychange',()=>{
    if(!document.hidden){clockAnchor.wall=Date.now();clockAnchor.mono=globalThis.performance?.now?.();}
  });
  function checkedTime(value){
    if(value!==undefined){if(!Number.isFinite(value))throw Error('Heure incorrecte.');return value;}
    const now=Date.now(),mono=globalThis.performance?.now?.();
    if(Number.isFinite(mono)&&Number.isFinite(clockAnchor.mono)&&Math.abs((now-clockAnchor.wall)-(mono-clockAnchor.mono))>120000)
      throw Error('L’heure de l’appareil a changé pendant le jeu. Vérifie son réglage automatique : le voyage et ses trouvailles sont conservés.');
    return now;
  }
  // Ce contrôle refuse un crédit incohérent, sans modifier le voyage importé.
  // Les champs facultatifs des anciennes parties restent facultatifs.
  function checkLoot(game,rabbit,current,items,config){
    if(!game.ownedSpecies?.includes(rabbit)||current.rabbit!==rabbit)throw Error('Compagnon du voyage incorrect : les trouvailles sont conservées.');
    if(!config)throw Error('La carte des explorations est indisponible : réessaie après son chargement.');
    const zone=config.zones.find(z=>z.id===current.zone);
    const elapsed=current.endsAt-current.startedAt;
    const duration=config.durations.find(d=>d.hours*HOUR===elapsed);
    if(!zone||!duration||!Number.isFinite(current.startedAt)||!Number.isFinite(current.endsAt)||
      (current.hours!==undefined&&current.hours!==duration.hours)||
      (current.energy!==undefined&&current.energy!==duration.energy)||
      (current.level!==undefined&&(!Number.isSafeInteger(current.level)||current.level<zone.level)))
      throw Error('Destination, durée, niveau ou coût du voyage incohérent : voyage conservé, aucune récompense ajoutée.');
    let total=0;
    if(!Array.isArray(current.loot)||!current.loot.length)throw Error('Butin illisible : voyage conservé.');
    for(const entry of current.loot){
      if(!entry||!Number.isSafeInteger(entry.quantity)||entry.quantity<=0)throw Error('Quantité de butin incorrecte : voyage conservé.');
      const pools={ingredient:zone.ingredients,care:zone.care,rare:zone.rare,egg:['egg']};
      const allowed=entry.rarity===undefined?Object.values(pools).flat():pools[entry.rarity];
      if(!allowed?.includes(entry.id)||(entry.id!=='egg'&&!items.some(item=>item.id===entry.id)))throw Error('Trouvaille incompatible avec ce lieu ou ce catalogue : voyage conservé, aucune récompense ajoutée.');
      total+=entry.quantity;
      if(!Number.isSafeInteger(total)||total>duration.rolls)throw Error('Trop de trouvailles pour cette durée : voyage conservé, aucune récompense ajoutée.');
    }
  }
  const trip=(game,rabbit)=>game.exploration?.trips?.[rabbit];
  const busy=(game,rabbit,now=Date.now())=>{const t=trip(game,rabbit);return !!t&&!t.claimed&&now<t.endsAt;};
  function rates(zone,duration,rabbit,level,meal=0){
    const affinity=zone.affinities.includes(rabbit),bounded=Math.max(1,Math.min(100,Number(level)||1));
    const care=Math.min(30,duration.care+Math.floor(bounded/25)),rare=Math.min(22,duration.rare+Math.floor(bounded/10)+(affinity?3:0)),egg=Math.min(12,duration.egg+Math.floor(bounded/20)+(affinity?1:0));
    const mealRare=Math.min(35,rare+Math.max(0,Math.min(.15,Number(meal)||0))*100);
    return {ingredient:100-care-mealRare-egg,care,rare:mealRare,egg,affinity};
  }
  function plan(config,items,rabbit,level,zoneId,hours,now=Date.now(),random=Math.random,meal=0){
    const zone=config.zones.find(z=>z.id===zoneId),duration=config.durations.find(d=>d.hours===hours);
    if(!zone||!duration||level<zone.level)throw Error('Ce lieu n’est pas encore accessible à ce lapin.');
    for(const id of [...zone.ingredients,...zone.care,...zone.rare])if(!items.some(item=>item.id===id))throw Error('Le catalogue de trouvailles est incomplet.');
    const chances=rates(zone,duration,rabbit,level,meal),loot=[];
    const pick=pool=>pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
    for(let i=0;i<duration.rolls;i++){
      const value=random()*100;
      const rarity=value<chances.egg?'egg':value<chances.egg+chances.rare?'rare':value<chances.egg+chances.rare+chances.care?'care':'ingredient';
      const id=rarity==='egg'?'egg':pick(rarity==='rare'?zone.rare:rarity==='care'?zone.care:zone.ingredients);
      const previous=loot.find(entry=>entry.id===id&&entry.rarity===rarity);
      if(previous)previous.quantity++;else loot.push({id,rarity,quantity:1});
    }
    const planned={id:globalThis.crypto?.randomUUID?.()||`${now}-${Math.random().toString(36).slice(2)}`,rabbit,zone:zoneId,hours,startedAt:now,endsAt:now+hours*HOUR,level,rates:chances,loot,claimed:false,energy:duration.energy};
    preparedTrips.set(planned,{raw:JSON.stringify(planned),requiredLevel:zone.level});
    return planned;
  }
  function depart(game,rabbit,planned,save,now){
    now=checkedTime(now);
    const receipt=planned&&preparedTrips.get(planned);
    if(!receipt||JSON.stringify(planned)!==receipt.raw)throw Error('Ce départ a été modifié ou déjà utilisé. Prépare à nouveau le voyage.');
    if(planned.rabbit!==rabbit||!Number.isFinite(planned.startedAt)||!Number.isFinite(planned.endsAt)||planned.endsAt-planned.startedAt!==planned.hours*HOUR||!Number.isSafeInteger(planned.energy)||planned.energy<0)throw Error('Départ incorrect, ton lapin reste au terrier.');
    if(!game.ownedSpecies?.includes(rabbit)||busy(game,rabbit,now))throw Error('Ce lapin n’est pas disponible.');
    if(trip(game,rabbit)&&!trip(game,rabbit).claimed)throw Error('Récupère ses trouvailles avant de repartir.');
    const progress=game.progress?.[rabbit];if(!progress||!Number.isFinite(progress.energy)||progress.energy<planned.energy)throw Error('Ce lapin doit se reposer avant de partir.');
    const level=Number(progress.currentLevel)||1;
    if(level<receipt.requiredLevel||level!==planned.level)throw Error('Le niveau de ce lapin a changé. Prépare à nouveau son voyage.');
    if(planned.startedAt>now||now-planned.startedAt>60000)throw Error('Ce départ a expiré. Prépare à nouveau le voyage.');
    const before=game.exploration,energy=progress.energy;
    // Une copie indépendante empêche de modifier ensuite le voyage actif en
    // conservant une référence vers l'objet de préparation.
    game.exploration={...before,trips:{...before?.trips,[rabbit]:JSON.parse(receipt.raw)}};progress.energy-=planned.energy;
    try{if(save()!==true)throw Error('Départ non enregistré : ton lapin reste au terrier.');}
    catch(error){if(before===undefined)delete game.exploration;else game.exploration=before;progress.energy=energy;throw error;}
    preparedTrips.delete(planned);
    return planned;
  }
  function claim(game,rabbit,items,save,now,config=window.getExplorationConfig?.()){
    now=checkedTime(now);
    const current=trip(game,rabbit);
    if(!current||current.claimed)throw Error('Ces trouvailles ont déjà été récupérées.');
    checkLoot(game,rabbit,current,items,config);
    if(now<current.endsAt)throw Error('Ce lapin explore encore les environs.');
    const inventory={...game.inventory};let eggs=game.eggs||0;
    for(const entry of current.loot){
      if(!Number.isSafeInteger(entry.quantity)||entry.quantity<=0)throw Error('Trouvailles incorrectes, conservées.');
      if(entry.id==='egg')eggs+=entry.quantity;
      else{if(!items.some(item=>item.id===entry.id))throw Error('Un produit est absent du catalogue : les trouvailles sont conservées.');inventory[entry.id]=(inventory[entry.id]||0)+entry.quantity;}
    }
    if(!Number.isSafeInteger(eggs)||Object.values(inventory).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Quantité incorrecte : les trouvailles sont conservées.');
    const before={inventory:game.inventory,eggs:game.eggs,exploration:game.exploration};
    game.inventory=inventory;game.eggs=eggs;
    game.exploration={...game.exploration,trips:{...game.exploration.trips,[rabbit]:{...current,claimed:true,claimedAt:now}}};
    try{if(save()!==true)throw Error('Réception non enregistrée : tu peux réessayer sans perdre les trouvailles.');}
    catch(error){Object.assign(game,before);throw error;}
    return current.loot;
  }
  function prepareDeparture(game,rabbit,config,items,level,zone,hours,save,meal=0){
    const now=checkedTime();
    const existed=Object.hasOwn(game,'drawState'),before=game.drawState===undefined?undefined:JSON.parse(JSON.stringify(game.drawState));
    try{
      const random=window.LapinousReplay?.random(game,'exploration')||Math.random;
      const planned=plan(config,items,rabbit,level,zone,hours,now,random,meal);
      depart(game,rabbit,planned,save,now);return planned;
    }catch(error){if(existed)game.drawState=before;else delete game.drawState;throw error;}
  }
  function open({host,game,config,items,species,save,toast,refresh}){
    if(!config){toast('La carte des explorations n’est pas encore disponible.','warn');return;}
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
    const dialog=el('dialog',undefined,'exploration-dialog');host.append(dialog);dialog.showModal();
    const name=id=>game.speciesNames?.[id]||species[id]?.name||id;
    let selected=game.species,zoneId=config.zones[0].id,hours=1;
    const title=el('header');title.append(el('h2','Les escapades du terrier'),button('×',()=>dialog.close()));
    const layout=el('div',undefined,'exploration-layout'),guide=el('aside',undefined,'exploration-guide'),image=el('img');image.src=config.companion.image;image.alt=config.companion.name;guide.append(image,el('p','Je connais les sentiers ! Choisis un compagnon et une destination.'));
    const trail=el('div',undefined,'exploration-trail'),actor=el('div',undefined,'exploration-walker'),speech=el('p',undefined,'exploration-guide-speech');
    actor.append(image);trail.append(actor,speech);guide.replaceChildren(trail);
    const poses=config.companion.poses||{},sequence=['wave','map','walk','look','stand','walk'];
    let poseIndex=0,poseTimer,returning=false;
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
    function pose(kind){
      clearTimeout(poseTimer);
      if(!dialog.isConnected||!dialog.open)return;
      const actual=reducedMotion&&kind==='walk'?'stand':kind;
      image.src=poses[actual]||config.companion.image;
      actor.dataset.pose=actual;
      actor.classList.toggle('returning',returning);
      const lines={wave:'Coucou ! Prêt pour une escapade ?',map:'Voyons quel sentier emprunter…',walk:'En route, les merveilles nous attendent !',look:'Regarde ! Il y a des trésors par ici.',stand:'Le sac est prêt. À toi de choisir ton compagnon !'};
      speech.textContent=lines[kind];
      image.alt=`${config.companion.name} : ${speech.textContent}`;
      if(kind==='walk')returning=!returning;
      poseTimer=setTimeout(()=>pose(sequence[++poseIndex%sequence.length]),kind==='walk'?8000:4000);
    }
    const content=el('section'),form=el('div',undefined,'exploration-form'),rabbit=el('select'),zones=el('select'),durations=el('select');
    rabbit.dataset.explorationRabbit='';zones.dataset.explorationZone='';durations.dataset.explorationDuration='';
    for(const id of game.ownedSpecies||[])if(species[id]){const option=el('option',name(id));option.value=id;rabbit.append(option);}rabbit.value=selected;
    for(const zone of config.zones){const option=el('option',`${zone.emoji} ${zone.name} · niveau ${zone.level}`);option.value=zone.id;zones.append(option);}
      for(const duration of config.durations){const option=el('option',`${duration.hours} h ${duration.hours===1?'réelle':'réelles'} · ${duration.rolls} trouvailles · ${duration.energy} énergie`);option.value=duration.hours;durations.append(option);}
    for(const [text,input] of [['Compagnon',rabbit],['Destination',zones],['Durée',durations]]){const label=el('label',text);label.append(input);form.append(label);}
    const details=el('div',undefined,'exploration-details'),feedback=el('p',undefined,'exploration-feedback');feedback.setAttribute('role','status');
    const availability=el('div',undefined,'exploration-availability');availability.setAttribute('role','status');
    const start=button('Préparer le sac et partir',()=>{try{const p=game.progress?.[selected];const last=(game.ownedSpecies||[]).filter(id=>id!==selected&&!busy(game,id)).length===0;if(last&&!window.confirm(`${name(selected)} est ton dernier compagnon disponible. Pendant ${hours} h réelles, les mini-jeux, les soins, l’entraînement et les combats seront indisponibles jusqu’à son retour et la récupération de ses trouvailles. Tu pourras toujours consulter ta collection et tes sauvegardes. Le faire partir ?`))return;const planned=prepareDeparture(game,selected,config,items,p?.currentLevel||1,zoneId,hours,save,window.LapinousMealBonuses?.value(p,'travel')||0);feedback.textContent=`${name(selected)} est parti ! Retour le ${new Date(planned.endsAt).toLocaleString('fr-FR')}.`;refresh();render();pose('wave');}catch(error){feedback.textContent=error.message;}});
    const active=el('div',undefined,'exploration-trips'),tripsTitle=el('h3','Sur les sentiers');content.append(form,details,availability,start,feedback,tripsTitle,active);layout.append(guide,content);dialog.append(title,el('p','1 h d’exploration = 1 h dans la vraie vie. Tu peux fermer le jeu : le voyage continue.','exploration-intro'),layout);
    start.dataset.explorationStart='';
    function render(){
      const zone=config.zones.find(z=>z.id===zoneId),duration=config.durations.find(d=>d.hours===hours),level=game.progress?.[selected]?.currentLevel||1,chances=rates(zone,duration,selected,level,window.LapinousMealBonuses?.value(game.progress?.[selected],'travel')||0);
      const background=zone.image?new URL(window.LapinousImages?.url(zone.image)||zone.image,document.baseURI).href:'';
      dialog.style.setProperty('--biome-image',background?`url(${JSON.stringify(background)})`:'none');
      dialog.dataset.biome=zone.id;
      trail.style.setProperty('--biome-image',background?`url(${JSON.stringify(background)})`:'none');
      details.replaceChildren(el('p',`${name(selected)} · niveau ${level}${chances.affinity?' · 🌿 Dans son élément : bonus de trouvailles rares !':''}`),el('p',`Par trouvaille : ingrédients ${chances.ingredient} % · soins ${chances.care} % · soins rares ${chances.rare} % · œuf ${chances.egg} %.`));
      details.prepend(el('strong',`${zone.emoji} ${zone.name}`));details.append(el('p',`${duration.hours} h de voyage · ${duration.rolls} trouvailles · coût : ${duration.energy} énergie.`));
      const discoveries=el('details'),pool=el('p');discoveries.append(el('summary','Les trouvailles de ce lieu'));pool.textContent=zone.ingredients.map(id=>items.find(i=>i.id===id)?.name||id).join(', ')+'.';discoveries.append(pool);details.append(discoveries);
      const more=el('details');more.append(el('summary','Les soins à découvrir ici'),el('p','Soins : '+zone.care.map(id=>items.find(i=>i.id===id)?.name||id).join(', ')+'.'),el('p','Soins rares : '+zone.rare.map(id=>items.find(i=>i.id===id)?.name||id).join(', ')+'.'));details.append(more,el('small','Le niveau et l’affinité du lapin améliorent les chances. Les œufs trouvés rejoignent les œufs habituels du terrier.'));
      const current=trip(game,selected);start.disabled=level<zone.level||!!current&&!current.claimed||(game.progress?.[selected]?.energy||0)<duration.energy;
      availability.replaceChildren();availability.classList.toggle('blocked',start.disabled);
      start.textContent=start.disabled?'Départ indisponible':'🎒 Partir à l’aventure';
      if(start.disabled){
        const reason=level<zone.level?`${name(selected)} est niveau ${level}. Ce lieu demande le niveau ${zone.level}.`:current&&!current.claimed?'Ce compagnon est déjà en voyage ou attend que tu récupères ses trouvailles.':`Il faut ${duration.energy} énergie ; ${name(selected)} en a ${Math.floor(game.progress?.[selected]?.energy||0)}.`;
        availability.append(el('strong',reason));
        if(level<zone.level){
          if(chances.affinity)availability.append(el('p','Son affinité augmente les chances de trouvailles rares, mais le niveau requis reste nécessaire.'));
          const accessible=config.zones.find(z=>z.level<=level);
          if(accessible)availability.append(button(`Choisir ${accessible.name}`,()=>{zoneId=accessible.id;zones.value=zoneId;render();pose('map');}));
        }
      }else availability.append(el('span',`✓ ${name(selected)} est prêt pour ce voyage.`));
      active.replaceChildren();
      for(const t of Object.values(game.exploration?.trips||{})){
        if(t.claimed)continue;
        const row=el('article',undefined,'exploration-trip'),zone=config.zones.find(z=>z.id===t.zone),left=Math.max(0,t.endsAt-Date.now());
        row.append(el('strong',`${name(t.rabbit)} · ${zone?.name||t.zone}`));
        const clock=el('span');clock.dataset.endsAt=t.endsAt;row.append(clock,el('small',`Retour : ${new Date(t.endsAt).toLocaleString('fr-FR')}`));
        const collect=button('Accueillir et récupérer',()=>{try{const loot=claim(game,t.rabbit,items,save,undefined,config);feedback.textContent=`${name(t.rabbit)} rapporte : `+loot.map(e=>`${e.quantity} × ${e.id==='egg'?'œuf':items.find(i=>i.id===e.id)?.name||e.id}`).join(', ')+'.';refresh();render();pose('wave');}catch(error){feedback.textContent=error.message;}});collect.disabled=left>0;collect.dataset.collectRabbit=t.rabbit;row.append(collect);active.append(row);
      }
      tripsTitle.hidden=!active.children.length;active.hidden=!active.children.length;
      tick();
    }
    function tick(){for(const n of dialog.querySelectorAll('[data-ends-at]')){const seconds=Math.max(0,Math.ceil((Number(n.dataset.endsAt)-Date.now())/1000));n.textContent=seconds?`${Math.floor(seconds/3600)} h ${Math.floor(seconds%3600/60)} min ${seconds%60} s restantes`:'De retour au terrier !';n.parentElement.querySelector('button').disabled=seconds>0;}}
    rabbit.onchange=()=>{selected=rabbit.value;render();};zones.onchange=()=>{zoneId=zones.value;render();pose('look');};durations.onchange=()=>{hours=Number(durations.value);render();};
    const timer=setInterval(()=>{if(!dialog.isConnected||!dialog.open){clearInterval(timer);clearTimeout(poseTimer);return;}tick();},1000);
    dialog.onclose=()=>{clearTimeout(poseTimer);clearInterval(timer);dialog.remove();refresh();};render();pose('wave');
  }
  window.LapinousExploration={HOUR,trip,busy,rates,plan,depart,claim,prepareDeparture,open};
})();
