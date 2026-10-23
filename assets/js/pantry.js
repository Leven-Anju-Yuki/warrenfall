/* Garde-manger : stock existant et déplacement du Chef sur un sol fixe. */
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  /** Dispose les provisions sur trois étagères, avec des emplacements fixes. */
  function html(catalog, inventory, name, food = 0) {
    const foods = (catalog?.items || []).filter(item => item.category === 'market');
    const meals = catalog?.recipesEnabled ? (catalog.recipes || []).map(recipe => ({...recipe,id:recipe.item})) : [];
    const columns = window.matchMedia?.('(max-width: 600px)')?.matches ? 3 : 6;
    const full = food >= 100;
    const stocked = foods.filter(item => inventory[item.id] > 0);
    const rows = Math.max(3,Math.ceil(stocked.length/columns));
    const slots = Array(columns*rows).fill(null);
    stocked.forEach((item,index)=>slots[index]=item);
    let markup = `<section class="pantry-workshop"><header><h2>Le garde-manger du Chef</h2><p>${full ? `La barre de nourriture de ${escape(name)} est pleine.` : `Choisis une provision pour ${escape(name)}.`}</p></header><div class="pantry-stage"><section class="pantry-shelves" style="--pantry-columns:${columns}" aria-label="Les provisions">${Array.from({length:rows}, (_, row) => `<div class="pantry-shelf" data-shelf-kind="${row === 2 ? 'meals' : 'ingredients'}" aria-label="${row === 2 ? 'Plats prepares' : 'Ingredients'}"><span class="pantry-shelf-label">${row === 2 ? 'Plats pr\u00eats' : 'Ingr\u00e9dients'}</span>${slots.slice(row * columns, (row + 1) * columns).map(item => item ? `<button type="button" class="pantry-provision" data-pantry-use="${escape(item.id)}" aria-disabled="${full}" aria-label="${escape(item.name)}"><span class="pantry-picture">${item.image ? `<img src="${escape(item.image)}" alt="">` : escape(item.emoji)}</span><b>×${inventory[item.id]}</b><span class="pantry-details"><strong>${escape(item.name)}</strong><span>+${item.restoreAmount} nourriture · ${escape(item.description)}</span></span></button>` : '<div class="pantry-empty" aria-label="Emplacement libre"></div>').join('')}</div>`).join('')}</section><aside class="pantry-chef"><img src="${escape(catalog?.companions?.chef?.greeting)}" alt="Le Chef"><p aria-live="polite">Bonjour ! Que souhaites-tu ?</p></aside></div>${catalog?.recipesEnabled ? `<section class="pantry-meals"><label>Plat \u00e0 pr\u00e9parer<select id="pantryRecipe" aria-label="Plat à préparer">${(catalog.recipes || []).map(recipe => `<option value="${escape(recipe.id)}">${escape(recipe.emoji)} ${escape(recipe.name)}</option>`).join('')}</select></label><p id="pantryIngredients"></p><button type="button" id="pantryCook">Pr\u00e9parer ce plat</button></section>` : ''}<button class="ghost-btn" onclick="openLapinousMarket()">Aller au Marché</button></section>`;
    const plates = `<section class="pantry-ready" aria-label="Plats pr\u00e9par\u00e9s"><h3>Plats pr\u00eats</h3><div class="pantry-ready-shelves">${meals.length ? meals.map(item => `<button type="button" class="pantry-provision ${(inventory[item.id]||0)>0?'':'pantry-unavailable'}" data-pantry-use="${escape(item.id)}" aria-disabled="${full||!(inventory[item.id]>0)}" aria-label="${escape(item.name)}"><span class="pantry-picture">${item.image ? `<img src="${escape(item.image)}" alt="">` : escape(item.emoji)}</span><b>\u00d7${inventory[item.id]||0}</b><span class="pantry-details"><strong>${escape(item.name)}</strong><span>+${item.restoreAmount} nourriture</span></span></button>`).join('') : '<p>Les plats du Chef seront d\u00e9pos\u00e9s ici.</p>'}</div></section>`;
    markup = markup.replace('</aside></div>', '</aside>' + plates + '</div>');
    markup = markup.replaceAll('data-shelf-kind="meals"','data-shelf-kind="ingredients"').replaceAll('aria-label="Plats prepares"','aria-label="Ingredients"').replace('Plats pr\u00eats','Ingr\u00e9dients');
    return markup;
  }
  /** V?rifie tout le stock avant de retirer les ingr?dients et ajouter un plat. */
  function craft(inventory, recipe) {
    const entries = Object.entries(recipe.ingredients || {});
    if (!entries.length || !entries.every(([id,count]) => Number.isSafeInteger(count) && count > 0 && Number.isSafeInteger(inventory[id]) && inventory[id] >= count)) return false;
    const stock = inventory[recipe.item] || 0;
    if (!Number.isSafeInteger(stock) || stock < 0 || stock >= Number.MAX_SAFE_INTEGER) return false;
    entries.forEach(([id,count]) => inventory[id] -= count);
    inventory[recipe.item] = stock + 1;
    return true;
  }
  /** R?utilise le trajet du Chef pour les provisions et chaque ingr?dient d'une recette. */
  function mount(dialog, getCatalog, onUse, canUse = () => true, cooking = {}) {
    const catalog = getCatalog();
    const defaults = {greeting:'04_bonjour.png',idle:'05_attente_droite.png',thanks:'06_remise_produit.png',back:'03_attraper_hauteur.png',crouching:'01_accroupie.png',reaching:'02_attraper_haut.png',walkingLeft:'07_marche.gif',cutting:'08_decoupe_legumes.gif',cooking:'09_wok.gif'};
    const poses = Object.fromEntries(Object.entries(defaults).map(([pose,file])=>{const expected='assets/img/accompagnateurs/Chef/'+file;const source=catalog.companions.chef?.[pose];return [pose,window.LapinousImages?.url(source&& !/pngg$|09_cuisson|chef\.svg/.test(source)?source:expected)||window.LapinousImageManifest?.[expected]||expected];}));
    const background = catalog.backgrounds?.pantry;
    dialog.style.backgroundImage = '';
    const stage=dialog.querySelector('.pantry-stage');
    stage.classList.toggle('pantry-illustrated',!!background);
    stage.style.backgroundImage=background?`url("${window.LapinousImages?.url(background)||background}")`:'';
    const actor = dialog.querySelector('.pantry-chef'), sprite = actor.querySelector('img'), speech = actor.querySelector('p');
    sprite.src = poses.greeting;
    sprite.onerror = () => {sprite.onerror=null;sprite.src=window.LapinousImageManifest?.['assets/img/accompagnateurs/Chef/05_attente_droite.png']||poses.idle;};
    const valid = () => dialog.open && actor.isConnected && (!cooking.valid || cooking.valid());
    const wait = ms => new Promise(resolve => setTimeout(resolve, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));
    const buttons = [...dialog.querySelectorAll('[data-pantry-use]')];
    const picker = dialog.querySelector('#pantryRecipe'), cook = dialog.querySelector('#pantryCook');
    const ingredients = dialog.querySelector('#pantryIngredients');
    if (ingredients) {
      ingredients.classList.add('pantry-recipe-ingredients');
      ingredients.setAttribute('aria-live','polite');
      stage.append(ingredients);
    }
    const selected = () => catalog.recipes?.find(recipe => recipe.id === picker?.value);
    if(picker){
      picker.hidden=true;
      const choices=document.createElement('div');choices.className='pantry-recipe-choices';choices.hidden=true;
      choices.innerHTML=(catalog.recipes||[]).map(recipe=>`<button type="button" data-recipe-choice="${escape(recipe.id)}" aria-pressed="${recipe.id===picker.value}">${escape(recipe.emoji)} ${escape(recipe.name)}</button>`).join('');
      picker.parentElement.append(choices);
      choices.addEventListener('click',event=>{const choice=event.target.closest('[data-recipe-choice]');if(!choice||actor.dataset.busy)return;picker.value=choice.dataset.recipeChoice;choices.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button===choice)));updateRecipe();});
    }
    // La molette fait glisser les provisions horizontalement sur leurs planches.
    const tracks=[...dialog.querySelectorAll('.pantry-shelves,.pantry-ready-shelves')];
    tracks.forEach(track=>{
      track.tabIndex=0;track.setAttribute('aria-label','Etage de provisions, defiler verticalement avec la molette ou les fleches');
      track.addEventListener('wheel',event=>{if(actor.dataset.busy)return;event.preventDefault();track.scrollBy({top:event.deltaY||event.deltaX,behavior:'auto'});},{passive:false});
      track.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key)||actor.dataset.busy)return;event.preventDefault();track.scrollBy({top:(event.key==='ArrowUp'?-1:1)*track.clientHeight/3,behavior:'smooth'});});
    });
    // Une fiche flottante lisible reste hors des zones qui masquent le defilement.
    const info=document.createElement('div');info.className='pantry-info-card';info.hidden=true;dialog.append(info);
    buttons.forEach(button=>{
      const show=()=>{
        const detail=button.querySelector('.pantry-details');if(!detail)return;
        info.innerHTML=detail.innerHTML+`<span class="pantry-eat-hint">${button.classList.contains('pantry-unavailable')?'Choisir cette recette pour la cuisiner':canUse()?'Cliquer pour manger cet aliment':'Barre pleine : aliment conserve dans la reserve'}</span>`;info.hidden=false;
        const rect=button.getBoundingClientRect(),box=info.getBoundingClientRect();
        info.style.left=Math.max(12,Math.min(innerWidth-box.width-12,rect.left))+'px';
        info.style.top=Math.max(12,Math.min(innerHeight-box.height-12,rect.bottom+8))+'px';
      };
      button.addEventListener('mouseenter',show);button.addEventListener('focus',show);
      button.addEventListener('mouseleave',()=>info.hidden=true);button.addEventListener('blur',()=>info.hidden=true);
    });
    /** Affiche les quantit?s requises et emp?che une recette incompl?te. */
    function updateRecipe() {
      if (!cook) return;
      const recipe = selected(), stock = cooking.inventory?.() || {};
      ingredients.innerHTML = `<strong class="pantry-recipe-name">${escape(recipe?.name || '')}</strong>` + Object.entries(recipe?.ingredients || {}).map(([id,count]) => `<span class="pantry-ingredient ${stock[id] >= count ? 'available' : 'missing'}">${escape(catalog.items.find(item => item.id === id)?.name || id)} <b>${stock[id] || 0}/${count}</b></span>`).join('');
      cook.disabled = !!actor.dataset.busy || !recipe || !Object.entries(recipe.ingredients).every(([id,count]) => stock[id] >= count);
    }
    function lock(busy) {
      if (busy) actor.dataset.busy = 'true'; else delete actor.dataset.busy;
      buttons.forEach(button => {button.disabled=busy;button.setAttribute('aria-disabled',String(busy||!canUse()));});
      if (picker) picker.disabled = busy;
      updateRecipe();
    }
    let actorX=0;
    /** Deplace le Chef horizontalement sans modifier la hauteur de ses pieds. */
    async function moveActor(to){
      const animation=actor.animate([{transform:`translateX(${actorX}px)`},{transform:`translateX(${to}px)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:550,easing:'ease-in-out',fill:'forwards'});
      await animation.finished;actorX=to;
    }
    /** Passe au produit suivant ; un seul retour au centre suffit pour une recette. */
    async function retrieve(button,label,returnAfter=true){
      info.hidden=true;
      const track=button.closest('.pantry-shelves,.pantry-ready-shelves');
      if(track){const b=button.getBoundingClientRect(),t=track.getBoundingClientRect();if(b.top<t.top||b.bottom>t.bottom)track.scrollTop+=b.top-t.top;}
      const origin=actor.getBoundingClientRect(),target=button.getBoundingClientRect();
      const offset=actorX+target.left+target.width/2-origin.left-origin.width/2;
      speech.textContent=`Je vais chercher ${label}?`;
      sprite.src=poses.walkingLeft;sprite.style.transform=offset<actorX?'scaleX(-1)':'';
      await moveActor(offset);if(!valid())return false;
      const shelf=dialog.querySelector('.pantry-shelves').getBoundingClientRect();
      const height=(target.top+target.height/2-shelf.top)/shelf.height;
      sprite.style.transform='';sprite.src=height<.34?poses.reaching:height>.66?poses.crouching:poses.back;
      await wait(650);if(!valid())return false;
      if(returnAfter){sprite.src=poses.walkingLeft;sprite.style.transform=actorX>0?'scaleX(-1)':'';await moveActor(0);}
      return valid();
    }
    /** Depose le plat sur son etagere, puis ramene le Chef au centre avant la sauvegarde. */
    async function deposit(recipe) {
      const shelf=dialog.querySelector('.pantry-ready-shelves');
      let target=buttons.find(button=>button.dataset.pantryUse===recipe.item);
      let preview=null;
      const empty=shelf.querySelector('p');
      if(!target){
        preview=document.createElement('div');preview.className='pantry-provision pantry-deposit-preview';
        preview.innerHTML=`<span class="pantry-picture">${recipe.image?`<img src="${escape(recipe.image)}" alt="${escape(recipe.name)}">`:escape(recipe.emoji)}</span>`;
        const rank=catalog.recipes.indexOf(recipe);
        const next=buttons.find(button=>catalog.recipes.findIndex(entry=>entry.item===button.dataset.pantryUse)>rank);
        if(empty)empty.hidden=true;
        shelf.insertBefore(preview,next||null);target=preview;
      }
      const origin=actor.getBoundingClientRect();
      const bounds=shelf.getBoundingClientRect(),itemBounds=target.getBoundingClientRect();
      if(itemBounds.top<bounds.top||itemBounds.bottom>bounds.bottom)shelf.scrollTop+=itemBounds.top-bounds.top;
      const position=target.getBoundingClientRect();
      const offset=position.left+position.width/2-origin.left-origin.width/2;
      const move=async(from,to)=>{
        const animation=actor.animate([{transform:`translateX(${from}px)`},{transform:`translateX(${to}px)`}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:550,easing:'ease-in-out',fill:'forwards'});
        await animation.finished;
      };
      try{
        speech.textContent='Je range ton plat sur son etagere?';
        sprite.src=poses.walkingLeft;sprite.style.transform='';
        await move(0,offset);if(!valid())return false;
        const height=(position.top+position.height/2-bounds.top)/bounds.height;
        sprite.src=height<.34?poses.reaching:height>.66?poses.crouching:poses.back;
        await wait(650);if(!valid())return false;
        if(preview)preview.classList.add('deposited');
        else target.classList.add('pantry-deposited');
        await wait(400);if(!valid())return false;
        sprite.src=poses.walkingLeft;sprite.style.transform='scaleX(-1)';
        await move(offset,0);if(!valid())return false;
        sprite.style.transform='';sprite.src=poses.idle;
        speech.textContent='Ton plat est range !';
        return true;
      }finally{
        preview?.remove();target.classList.remove('pantry-deposited');
        if(empty)empty.hidden=false;
      }
    }
    setTimeout(() => { if (valid() && !actor.dataset.busy) sprite.src = poses.idle; },2500);
    buttons.forEach(button => button.addEventListener('click',async () => {
      if(actor.dataset.busy)return;
      const recipe=catalog.recipes?.find(entry=>entry.item===button.dataset.pantryUse);
      if(recipe&&picker){picker.value=recipe.id;dialog.querySelectorAll('[data-recipe-choice]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice.dataset.recipeChoice===recipe.id)));updateRecipe();
        if(!(cooking.inventory?.()[recipe.item]>0)){speech.textContent=cook.disabled?'Il manque des ingrédients pour ce plat.':'Je peux cuisiner ce plat. Appuie sur Préparer ce plat.';return;}}
      if(!canUse()){speech.textContent='La barre de nourriture est pleine. Garde cette provision pour plus tard.';return;}
      lock(true);
      try {
        if (!await retrieve(button, button.getAttribute('aria-label'))) return;
        sprite.src = poses.thanks; speech.textContent = 'Voil? ta provision !';
        await wait(900); if (valid() && canUse()) onUse(button.dataset.pantryUse);
      } finally { if (valid()) { sprite.style.transform = ''; sprite.src = poses.idle; lock(false); } }
    }));
    picker?.addEventListener('change',updateRecipe);
    cook?.addEventListener('click',async () => {
      if (actor.dataset.busy || cook.disabled || !window.LapinousVisibility.allowed('recipes')) return;
      const recipe = selected(); lock(true);
      try {
        for (const [id,count] of Object.entries(recipe.ingredients)) {
          const button = buttons.find(button => button.dataset.pantryUse === id);
          if (!button || !await retrieve(button, `${count} x ${catalog.items.find(item => item.id === id)?.name || id}`,false)) return;
        }
        speech.textContent='Tous les ingredients sont recuperes, je retourne cuisiner.';
        sprite.src=poses.walkingLeft;sprite.style.transform=actorX>0?'scaleX(-1)':'';
        await moveActor(0);if(!valid())return; sprite.style.transform='';
        sprite.src = poses[recipe.preparation === 'cutting' ? 'cutting' : 'cooking'];
        speech.textContent = `Je pr?pare ${recipe.name}?`;
        await wait(3000); if (!valid()) return;
        sprite.src = poses.thanks; speech.textContent = 'Ton plat est pret !';
        await wait(500); if (!valid()) return;
        if (await deposit(recipe) && valid()) cooking.complete?.(recipe.id);
      } finally { if (valid()) { sprite.style.transform = ''; sprite.src = poses.idle; lock(false); } }
    });
    updateRecipe();
  }
  window.LapinousPantry = { html, mount, craft };
})();
