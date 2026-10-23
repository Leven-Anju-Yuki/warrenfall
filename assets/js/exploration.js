/* Expéditions à échéance absolue, sans dépendance à un onglet ouvert. */
(() => {
  const HOUR=3600000;
  const trip=(game,rabbit)=>game.exploration?.trips?.[rabbit];
  const busy=(game,rabbit,now=Date.now())=>{const t=trip(game,rabbit);return !!t&&!t.claimed&&now<t.endsAt;};
  function rates(zone,duration,rabbit,level){
    const affinity=zone.affinities.includes(rabbit),bounded=Math.max(1,Math.min(100,Number(level)||1));
    const care=Math.min(30,duration.care+Math.floor(bounded/25)),rare=Math.min(22,duration.rare+Math.floor(bounded/10)+(affinity?3:0)),egg=Math.min(12,duration.egg+Math.floor(bounded/20)+(affinity?1:0));
    return {ingredient:100-care-rare-egg,care,rare,egg,affinity};
  }
  function plan(config,items,rabbit,level,zoneId,hours,now=Date.now(),random=Math.random){
    const zone=config.zones.find(z=>z.id===zoneId),duration=config.durations.find(d=>d.hours===hours);
    if(!zone||!duration||level<zone.level)throw Error('Ce lieu n’est pas encore accessible à ce lapin.');
    for(const id of [...zone.ingredients,...zone.care,...zone.rare])if(!items.some(item=>item.id===id))throw Error('Le catalogue de trouvailles est incomplet.');
    const chances=rates(zone,duration,rabbit,level),loot=[];
    const pick=pool=>pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
    for(let i=0;i<duration.rolls;i++){
      const value=random()*100;
      const rarity=value<chances.egg?'egg':value<chances.egg+chances.rare?'rare':value<chances.egg+chances.rare+chances.care?'care':'ingredient';
      const id=rarity==='egg'?'egg':pick(rarity==='rare'?zone.rare:rarity==='care'?zone.care:zone.ingredients);
      const previous=loot.find(entry=>entry.id===id&&entry.rarity===rarity);
      if(previous)previous.quantity++;else loot.push({id,rarity,quantity:1});
    }
    return {id:globalThis.crypto?.randomUUID?.()||`${now}-${Math.random().toString(36).slice(2)}`,rabbit,zone:zoneId,hours,startedAt:now,endsAt:now+hours*HOUR,level,rates:chances,loot,claimed:false,energy:duration.energy};
  }
  function depart(game,rabbit,planned,save,now=Date.now()){
    if(planned.rabbit!==rabbit||!Number.isFinite(planned.startedAt)||!Number.isFinite(planned.endsAt)||planned.endsAt-planned.startedAt!==planned.hours*HOUR||!Number.isSafeInteger(planned.energy)||planned.energy<0)throw Error('Départ incorrect, ton lapin reste au terrier.');
    if(!game.ownedSpecies?.includes(rabbit)||busy(game,rabbit,now))throw Error('Ce lapin n’est pas disponible.');
    if(trip(game,rabbit)&&!trip(game,rabbit).claimed)throw Error('Récupère ses trouvailles avant de repartir.');
    const progress=game.progress?.[rabbit];if(!progress||progress.energy<planned.energy)throw Error('Ce lapin doit se reposer avant de partir.');
    const before=game.exploration,energy=progress.energy;
    game.exploration={...before,trips:{...before?.trips,[rabbit]:planned}};progress.energy-=planned.energy;
    try{if(save()!==true)throw Error('Départ non enregistré : ton lapin reste au terrier.');}
    catch(error){if(before===undefined)delete game.exploration;else game.exploration=before;progress.energy=energy;throw error;}
    return planned;
  }
  function claim(game,rabbit,items,save,now=Date.now()){
    const current=trip(game,rabbit);
    if(!current||current.claimed)throw Error('Ces trouvailles ont déjà été récupérées.');
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
  function open({host,game,config,items,species,save,toast,refresh}){
    if(!config){toast('La carte des explorations n’est pas encore disponible.','warn');return;}
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;return b;};
    const dialog=el('dialog',undefined,'exploration-dialog');host.append(dialog);dialog.showModal();
    const name=id=>game.speciesNames?.[id]||species[id]?.name||id;
    let selected=game.species,zoneId=config.zones[0].id,hours=1;
    const title=el('header');title.append(el('h2','Les escapades du terrier'),button('×',()=>dialog.close()));
    const layout=el('div',undefined,'exploration-layout'),guide=el('aside',undefined,'exploration-guide'),image=el('img');image.src=config.companion.image;image.alt=config.companion.name;guide.append(image,el('p','Je connais les sentiers ! Choisis un compagnon et une destination.'));
    const content=el('section'),form=el('div',undefined,'exploration-form'),rabbit=el('select'),zones=el('select'),durations=el('select');
    rabbit.dataset.explorationRabbit='';zones.dataset.explorationZone='';durations.dataset.explorationDuration='';
    for(const id of game.ownedSpecies||[])if(species[id]){const option=el('option',name(id));option.value=id;rabbit.append(option);}rabbit.value=selected;
    for(const zone of config.zones){const option=el('option',`${zone.emoji} ${zone.name} · niveau ${zone.level}`);option.value=zone.id;zones.append(option);}
      for(const duration of config.durations){const option=el('option',`${duration.hours} h ${duration.hours===1?'réelle':'réelles'} · ${duration.rolls} trouvailles · ${duration.energy} énergie`);option.value=duration.hours;durations.append(option);}
    for(const [text,input] of [['Compagnon',rabbit],['Destination',zones],['Durée',durations]]){const label=el('label',text);label.append(input);form.append(label);}
    const details=el('div',undefined,'exploration-details'),feedback=el('p',undefined,'exploration-feedback');feedback.setAttribute('role','status');
    const start=button('Préparer le sac et partir',()=>{try{const p=game.progress?.[selected];const planned=plan(config,items,selected,p?.currentLevel||1,zoneId,hours);depart(game,selected,planned,save);feedback.textContent=`${name(selected)} est parti ! Retour le ${new Date(planned.endsAt).toLocaleString('fr-FR')}.`;refresh();render();}catch(error){feedback.textContent=error.message;}});
    const active=el('div',undefined,'exploration-trips');content.append(form,details,start,feedback,el('h3','Sur les sentiers'),active);layout.append(guide,content);dialog.append(title,el('p','1 h d’exploration = 1 h dans la vraie vie. Tu peux fermer le jeu : le voyage continue.','exploration-intro'),layout);
    start.dataset.explorationStart='';
    function render(){
      const zone=config.zones.find(z=>z.id===zoneId),duration=config.durations.find(d=>d.hours===hours),level=game.progress?.[selected]?.currentLevel||1,chances=rates(zone,duration,selected,level);
      details.replaceChildren(el('p',`${name(selected)} · niveau ${level}${chances.affinity?' · 🌿 Dans son élément : bonus de trouvailles rares !':''}`),el('p',`Par trouvaille : ingrédients ${chances.ingredient} % · soins ${chances.care} % · soins rares ${chances.rare} % · œuf ${chances.egg} %.`));
      details.prepend(el('strong',`${zone.emoji} ${zone.name}`));details.append(el('p',`${duration.hours} h de voyage · ${duration.rolls} trouvailles · coût : ${duration.energy} énergie.`));
      const pool=el('p');pool.textContent='Dans ce lieu : '+zone.ingredients.map(id=>items.find(i=>i.id===id)?.name||id).join(', ')+'.';details.append(pool);
      const more=el('details');more.append(el('summary','Les soins à découvrir ici'),el('p','Soins : '+zone.care.map(id=>items.find(i=>i.id===id)?.name||id).join(', ')+'.'),el('p','Soins rares : '+zone.rare.map(id=>items.find(i=>i.id===id)?.name||id).join(', ')+'.'));details.append(more,el('small','Le niveau et l’affinité du lapin améliorent les chances. Les œufs trouvés rejoignent les œufs habituels du terrier.'));
      const current=trip(game,selected);start.disabled=level<zone.level||!!current&&!current.claimed||(game.progress?.[selected]?.energy||0)<duration.energy;
      if(start.disabled)details.append(el('p',level<zone.level?`Niveau ${zone.level} requis pour ce lieu.`:current&&!current.claimed?'Ce compagnon a déjà une escapade en cours ou des trouvailles à récupérer.':'Ton compagnon doit se reposer avant de partir.'));
      active.replaceChildren();
      for(const t of Object.values(game.exploration?.trips||{})){
        if(t.claimed)continue;
        const row=el('article',undefined,'exploration-trip'),zone=config.zones.find(z=>z.id===t.zone),left=Math.max(0,t.endsAt-Date.now());
        row.append(el('strong',`${name(t.rabbit)} · ${zone?.name||t.zone}`));
        const clock=el('span');clock.dataset.endsAt=t.endsAt;row.append(clock,el('small',`Retour : ${new Date(t.endsAt).toLocaleString('fr-FR')}`));
        const collect=button('Accueillir et récupérer',()=>{try{const loot=claim(game,t.rabbit,items,save);feedback.textContent=`${name(t.rabbit)} rapporte : `+loot.map(e=>`${e.quantity} × ${e.id==='egg'?'œuf':items.find(i=>i.id===e.id)?.name||e.id}`).join(', ')+'.';refresh();render();}catch(error){feedback.textContent=error.message;}});collect.disabled=left>0;collect.dataset.collectRabbit=t.rabbit;row.append(collect);active.append(row);
      }
      if(!active.children.length)active.append(el('p','Personne sur les sentiers pour le moment.'));
      tick();
    }
    function tick(){for(const n of dialog.querySelectorAll('[data-ends-at]')){const seconds=Math.max(0,Math.ceil((Number(n.dataset.endsAt)-Date.now())/1000));n.textContent=seconds?`${Math.floor(seconds/3600)} h ${Math.floor(seconds%3600/60)} min ${seconds%60} s restantes`:'De retour au terrier !';n.parentElement.querySelector('button').disabled=seconds>0;}}
    rabbit.onchange=()=>{selected=rabbit.value;render();};zones.onchange=()=>{zoneId=zones.value;render();};durations.onchange=()=>{hours=Number(durations.value);render();};
    const timer=setInterval(()=>{if(!dialog.isConnected){clearInterval(timer);return;}tick();},1000);
    dialog.onclose=()=>{clearInterval(timer);dialog.remove();refresh();};render();
  }
  window.LapinousExploration={HOUR,trip,busy,rates,plan,depart,claim,open};
})();
