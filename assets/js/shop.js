/* Magasin : catalogue extensible et opérations sans argent réel. */
(() => {
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    let catalog = null;
    // Valider le catalogue avant toute opération.
    function validateCatalog(data) {
        if (!data || !Array.isArray(data.items) || !data.cashier) throw new Error('Catalogue incorrect');
        const ids = new Set();
        for (const item of data.items) {
            if (!item.id || ids.has(item.id) || !Number.isSafeInteger(item.price) || item.price <= 0) throw new Error('Article incorrect');
            if (item.kind !== 'reset' && (item.kind !== 'restore' || !['food','energy','cleanliness'].includes(item.stat))) throw new Error('Effet incorrect');
            if(item.restoreAmount!==undefined&&(!Number.isFinite(item.restoreAmount)||(item.restoreAmount<0||(item.restoreAmount===0&&!item.remedyEffect))))throw new Error('Quantité de nourriture incorrecte');
            if(item.bonus&&(!['resistance','combat','speed','experience'].includes(item.bonus.type)||!Number.isFinite(item.bonus.value)||item.bonus.value<=0||item.bonus.value>1||!Number.isSafeInteger(item.bonus.durationMs)||item.bonus.durationMs<=0))throw new Error('Bonus incorrect');
            if(item.remedyEffect&&(!['sleep','trainingSaving','trainingSavings','trainingExperience','cleanProtection','brush','interaction','level'].includes(item.remedyEffect.type)||!Number.isFinite(item.remedyEffect.value)||item.remedyEffect.value<=0||(item.remedyEffect.uses!==undefined&&(!Number.isSafeInteger(item.remedyEffect.uses)||item.remedyEffect.uses<1))||(item.remedyEffect.durationMs!==undefined&&(!Number.isSafeInteger(item.remedyEffect.durationMs)||item.remedyEffect.durationMs<1))))throw new Error('Effet de soin incorrect');
            ids.add(item.id);
        }
        // Les plats spéciaux mis de côté ne doivent pas bloquer les articles et les soins.
        for(const recipe of data.recipesEnabled===false?[]:(data.recipes||[])){if(!recipe.id||!recipe.item||ids.has(recipe.item)||!recipe.name||!Number.isSafeInteger(recipe.price)||recipe.price<=0||!recipe.ingredients||!Object.keys(recipe.ingredients).length||Object.entries(recipe.ingredients).some(([id,count])=>!ids.has(id)||!Number.isSafeInteger(count)||count<=0))throw new Error("Recette incorrecte");}
        return data;
    }
    // Calculer les fragments rendus par une seule compétence.
    function resetPlan(progress, index) {
        if (!Array.isArray(progress.attackLevels) || !Number.isInteger(index) || index < 0 || index >= progress.attackLevels.length) throw new Error('Choisis une compétence.');
        const levels = [progress.attackLevels[index]];
        if (levels.some(level => !Number.isInteger(level) || level < 0 || level > 5)) throw new Error('Progression incorrecte.');
        return {index, refund: levels.reduce((sum, level) => sum + level, 0), affected: levels.filter(level => level > 0).length};
    }
    // Appliquer un achat déjà validé sur les données fournies.
    function transact(game, progress, item, index) {
        if (!Number.isSafeInteger(item?.price) || item.price <= 0) throw new Error('Prix incorrect.');
        let plan;
        if (item.kind === 'restore') {
            if (!['food','energy','cleanliness'].includes(item.stat)) throw new Error('Article incorrect.');
            const count = game.inventory?.[item.id] || 0;
            if (!Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER) throw new Error('Stock incorrect.');
        } else if (item.kind === 'reset') {
            plan = resetPlan(progress, index);
            if (!plan.refund) throw new Error('Aucun fragment à récupérer ici.');
            if (!Number.isSafeInteger(progress.attackFragments) || progress.attackFragments < 0 || !Number.isSafeInteger(progress.attackFragments + plan.refund)) throw new Error('Solde de fragments incorrect.');
        } else throw new Error('Article indisponible.');
        if (!Number.isSafeInteger(game.carrots) || game.carrots < item.price) throw new Error('Tu n’as pas assez de carottes.');
        // Valider tous les effets avant de dépenser : aucun débit en cas d’échec.
        game.carrots -= item.price;
        if (plan) {
            progress.attackLevels = progress.attackLevels.map((level, i) => i === index ? 0 : level);
            progress.attackFragments += plan.refund;
            if (progress.attackTraining) {
                progress.attackTraining.points = progress.attackLevels[0];
                progress.attackTraining.bonus = progress.attackLevels[0];
                progress.attackTraining.completed = progress.attackLevels[0] >= 5;
            }
        } else {
            if (!game.inventory) game.inventory = {};
            game.inventory[item.id] = (game.inventory[item.id] || 0) + 1;
        }
        return plan ? `${plan.refund} fragment${plan.refund > 1 ? 's' : ''} récupéré${plan.refund > 1 ? 's' : ''}.` : 'Article ajouté à ton inventaire !';
    }
    // Valider le panier entier sur des copies puis le payer en une fois.
    function checkout(game, progressByKey, items, lines) {
        if (!Array.isArray(lines) || !lines.length) throw new Error('Ton panier est vide.');
        const workingGame = { carrots: game.carrots, inventory: JSON.parse(JSON.stringify(game.inventory || {})) }, working = Object.create(null), seen = new Set(), results = [];
        for (const line of lines) {
            const item = items.find(item => item.id === line.id);
            if (!item || (item.kind === 'reset' && (!game.ownedSpecies?.includes(line.target) || !Object.prototype.hasOwnProperty.call(progressByKey,line.target)))) throw new Error('Un article ou un lapin du panier n’est plus disponible.');
            const signature = JSON.stringify([line.target,line.id,item.kind === 'reset' ? line.index : null]);
            if (item.kind === 'reset' && seen.has(signature)) throw new Error('Cet article est déjà prévu pour ce lapin.');
            seen.add(signature);
            if (item.kind === 'reset' && !Object.prototype.hasOwnProperty.call(working,line.target)) working[line.target] = JSON.parse(JSON.stringify(progressByKey[line.target]));
            results.push(transact(workingGame,working[line.target],item,line.index));
        }
        // Le panier entier est validé sur des copies avant tout débit ou modification réelle.
        const total = game.carrots - workingGame.carrots;
        for (const key of Object.keys(working)) Object.assign(progressByKey[key],working[key]);
        game.carrots = workingGame.carrots;
        game.inventory = workingGame.inventory;
        return {total, count:lines.length, results};
    }
    // Consommer une unité et restaurer la barre du compagnon actif.
    function useConsumable(game, progress, item) {
        if(window.LapinousExploration?.busy(game,game.species))throw new Error('Ce lapin est en exploration. Attends son retour pour lui donner un soin.');
        if (item?.kind !== 'restore' || !['food','energy','cleanliness'].includes(item.stat)) throw new Error('Ce produit ne peut pas être consommé.');
        const count = game.inventory?.[item.id];
        if (!Number.isSafeInteger(count) || count < 1) throw new Error('Cet article est épuisé.');
        if (!Number.isFinite(progress[item.stat]) || (progress[item.stat] >= 100 && !item.bonus&&!item.remedyEffect)) throw new Error('Cette barre est déjà pleine.');
        if(item.remedyEffect)window.LapinousRemedies.arm(progress,item.remedyEffect);
        progress[item.stat] = Math.min(100,progress[item.stat]+(item.restoreAmount??100));
        if(item.bonus){progress.mealBonuses ||= {};progress.mealBonuses[item.bonus.type]={value:item.bonus.value,expiresAt:Date.now()+item.bonus.durationMs};}
        game.inventory[item.id] = count - 1;
    }
    window.LapinousShopReady = fetch('./lapinous-shop.json').then(response => {
        if (!response.ok) throw new Error('Catalogue introuvable');
        return response.json();
    }).then(data => {
        // Les essais locaux du Dashboard ne remplacent pas le fichier publié.
        if(document.documentElement.classList.contains('local-admin')){
            try {const saved=JSON.parse(localStorage.getItem('lapinous_shop_catalog'));if(saved){validateCatalog(saved);saved.items.forEach(item=>{const base=data.items.find(value=>value.id===item.id);if(base?.category==='market')item.category=base.category;if(base?.image)item.image=base.image;});saved.items.push(...data.items.filter(item=>!saved.items.some(existing=>existing.id===item.id)));saved.items=saved.items.filter(item=>item.category!=='prepared');saved.backgrounds={...data.backgrounds,...saved.backgrounds,market:data.backgrounds.market,items:data.backgrounds.items};if(saved.backgrounds.cart?.includes('Comptoir vide'))saved.backgrounds.cart=data.backgrounds.cart;if(['assets/img/fond/salon.png','./assets/img/fond/salon.png'].includes(saved.backgrounds.inventory))saved.backgrounds.inventory=data.backgrounds.inventory;saved.gameBoxes={...data.gameBoxes,...saved.gameBoxes,lapinoudoku:data.gameBoxes.lapinoudoku};if(!Array.isArray(saved.recipes)||saved.recipes.some(recipe=>!('image' in recipe)))saved.recipes=data.recipes;if(typeof saved.recipesEnabled!=='boolean')saved.recipesEnabled=data.recipesEnabled;saved.items.forEach(item=>{if(["market_carrot","market_apple"].includes(item.id)){item.category="market";item.image=data.items.find(base=>base.id===item.id)?.image||item.image||"";}if(item.id==="market_basket")item.category="retired";});saved.companions={...data.companions,...saved.companions};if(saved.companions.fragmentKeeper?.working?.endsWith('-10.png'))saved.companions.fragmentKeeper=data.companions.fragmentKeeper;for(const role of ['artisan','fragmentKeeper'])if(!saved.companions[role]?.idle||saved.companions[role]?.placeholder)saved.companions[role]=data.companions[role];if(saved.companions.chef?.placeholder||saved.companions.chef?.idle?.endsWith("chef.svg"))saved.companions.chef=data.companions.chef;if(saved.companions.fragmentKeeper)saved.companions.fragmentKeeper.name='Le mage des fragments';saved.apothecary={...data.apothecary,...saved.apothecary};if(!saved.cashier.idle||/caissier_(presentation|merci)\.png$/.test(saved.cashier.presentation))saved.cashier=data.cashier;data=saved;}} catch {}
        }
        catalog = validateCatalog(data);
    }).catch(error => { console.warn('Magasin indisponible', error); });
    // Regrouper les achats identiques pour afficher leurs quantités.
    function groupCartLines(lines) {
        const groups=new Map();
        lines.forEach((line,index)=>{
            const key=JSON.stringify([line.id,line.target??null,line.index??null]);
            if(groups.has(key))groups.get(key).quantity++;
            else groups.set(key,{...line,cartIndex:index,quantity:1});
        });
        return [...groups.values()];
    }
    // Installer la boutique et l’inventaire en mode administrateur local.
    function init(api) {
        // Le reste du jeu reste utilisable si le chargement du catalogue a échoué.
        if (!catalog) { console.warn("Boutique non initialisée : catalogue indisponible."); return false; }
        // Boutique en travaux : réservée au mode administrateur local.

        if (catalog) [catalog.cashier.presentation,catalog.cashier.thanks].forEach(src => { const preload = new Image(); preload.src = src; });
        const dialog = document.createElement('dialog');
        dialog.id='shopDialog';dialog.className='shop-dialog';dialog.setAttribute('aria-labelledby','shopTitle');
        dialog.innerHTML=`<div class="shop-layout"><aside class="shop-cashier"><img id="shopCashierImage" alt="Lapin caissier"><p id="shopCashierSpeech" aria-live="polite"></p></aside><section class="shop-panel"><header class="shop-header"><div><small>LE COMPTOIR DU TERRIER</small><h2 id="shopTitle">Magasin</h2></div><button type="button" class="shop-close" aria-label="Fermer le magasin">×</button></header><div class="shop-wallet" id="shopWallet"></div><div class="shop-tabs" role="group" aria-label="Rayons du magasin"><button type="button" data-shop-tab="items">Articles</button><button type="button" data-shop-tab="market">Marché</button><button type="button" data-shop-tab="evolution">Évolution</button><button type="button" data-shop-tab="fragments">Fragments</button><button type="button" data-shop-tab="cart">Panier (0)</button><button type="button" data-shop-tab="carrots">Carottes</button></div><div class="shop-body" id="shopBody"></div><div class="shop-cart-summary" id="shopCartSummary"></div><p id="shopMessage" class="shop-message" role="status" aria-live="polite"></p></section></div>`;
        document.body.appendChild(dialog);
        const button=document.createElement('button');button.id='shopButton';button.className='shop-trigger';button.type='button';button.textContent='🛍️';button.title='Magasin';button.setAttribute('aria-label','Ouvrir le magasin');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','shopDialog');document.body.appendChild(button);
        const content=dialog.querySelector('#shopBody'),message=dialog.querySelector('#shopMessage'),speech=dialog.querySelector('#shopCashierSpeech'),image=dialog.querySelector('#shopCashierImage');
        // Les rayons partagent la ligne du titre plutôt qu’une rangée supplémentaire.
        dialog.querySelector('.shop-header').insertBefore(dialog.querySelector('.shop-tabs'),dialog.querySelector('.shop-close'));
        let inspectedItem='', inspectedAt=0;
        let tab='items',target='',chosenIndex=0,cart=[],cartGame=api.game(),thankTimer,apothecaryTimer,retrieveAnimation,retrieveVersion=0,retrieving=false;
        let drawerSlots=null;
        const herbalistPoses=catalog.apothecary||{};
        const walkingSrc=herbalistPoses.walkingLeft;
        let walkingAvailable=null;
        const inventoryButton=document.createElement('button');inventoryButton.id='inventoryButton';inventoryButton.className='shop-trigger inventory-trigger';inventoryButton.type='button';inventoryButton.textContent='🌿';inventoryButton.title='Inventaire';inventoryButton.setAttribute('aria-label','Ouvrir ton inventaire');inventoryButton.setAttribute('aria-haspopup','dialog');inventoryButton.setAttribute('aria-controls','shopDialog');document.body.appendChild(inventoryButton);
        const owned=()=> (api.game().ownedSpecies||[]).filter(key=>api.species()[key]);
        const name=key=>api.game().speciesNames?.[key]||api.species()[key]?.name||'Lapin';
        const portrait=key=>api.species()[key]?.faceImg||api.species()[key]?.coteImg||'./assets/img/lapins_jouables/sans_evenements/mystery.svg';
        // Les plats sont d?finis uniquement dans recipes ; item garde leur cl? de stock.
        const getItem=id=>catalog.items.find(item=>item.id===id)||catalog.recipes?.filter(()=>catalog.recipesEnabled).map(recipe=>({...recipe,id:recipe.item,category:'prepared'})).find(item=>item.id===id);
        const total=()=>cart.reduce((sum,line)=>sum+(getItem(line.id)?.price||0),0);
        const alreadyAdded=(item,key,index)=>item.kind==='reset'&&cart.some(line=>line.id===item.id&&line.target===key&&(item.kind!=='reset'||line.index===index));
        // Afficher la présentation ou le remerciement du caissier.
        function cashier(thanks=false,greeting=false) {
            if(!catalog)return;clearTimeout(thankTimer);
            image.src=thanks?catalog.cashier.thanks:greeting?(catalog.cashier.greeting||catalog.cashier.presentation):(catalog.cashier.idle||catalog.cashier.presentation);
            image.classList.toggle('shop-cashier-flipped',!thanks&&catalog.cashier.flipPresentation);
            image.alt=thanks?'La caissière te remercie':greeting?'La caissière te salue':'La caissière présente les articles';
            speech.textContent=thanks?'Merci pour tes achats !':greeting?'Bonjour ! Choisis tes articles.':'Quels articles souhaites-tu ?';
            if(thanks)thankTimer=setTimeout(()=>cashier(false),4000);
            else if(greeting)thankTimer=setTimeout(()=>{if(dialog.open)cashier(false);},1200);
        }
        let workshopTimer,workshopPose='idle',workshopUntil=0;
        const workshopImages=new Map();
        for(const role of ['artisan','fragmentKeeper'])for(const pose of ['working','walkingLeft']){
            const source=catalog.companions?.[role]?.[pose];if(!source)continue;
            const preload=new Image();
            workshopImages.set(source,new Promise(resolve=>{preload.onload=()=>resolve(true);preload.onerror=()=>resolve(false);preload.src=source;}));
        }
        const workshopRole=()=>tab==='evolution'?'artisan':tab==='fragments'?'fragmentKeeper':null;
        // Les planches 3x2 sont découpées par le CSS, sans créer six fichiers supplémentaires.
        function showWorkshopPose(pose){
            const actor=content.querySelector('.shop-zone-companion');const companion=catalog.companions?.[workshopRole()];if(!actor||!companion)return;
            const sheet=['working','walkingLeft'].includes(pose)&&!companion[pose]?.toLowerCase().endsWith('.gif')&&companion.sheetColumns===3&&companion.sheetRows===2;
            actor.replaceChildren();
            if(sheet){const sprite=document.createElement('span');sprite.className='shop-zone-sprite';sprite.setAttribute('role','img');sprite.setAttribute('aria-label',companion.name);sprite.style.backgroundImage=`url("${window.LapinousImages?.url(companion[pose])||companion[pose]}")`;actor.append(sprite);}
            else {const image=document.createElement('img');image.src=companion[pose]||companion.idle;image.alt=companion.name;actor.append(image);}
        }
        // Une pose temporaire revient à l'attente et s'annule quand on change de rayon.
        function workshopAction(pose,duration=1800){
            const role=workshopRole();if(!role)return;clearTimeout(workshopTimer);workshopPose=pose;workshopUntil=Date.now()+duration;showWorkshopPose(pose);
            workshopTimer=setTimeout(()=>{if(workshopRole()===role){workshopPose='idle';workshopUntil=0;showWorkshopPose('idle');}},duration);
        }
        function appendZoneCompanion(){
            const companion=catalog.companions?.[workshopRole()];if(!companion?.idle)return;
            const aside=document.createElement('aside');aside.className='shop-zone-companion';content.append(aside);
            showWorkshopPose(Date.now()<workshopUntil?workshopPose:'idle');
        }
        function placeProductInfo(product) {
            const panel=product?.querySelector('.shop-consumable-details');if(!panel)return;
            const rect=product.getBoundingClientRect();
            panel.style.setProperty('width',Math.min(300,innerWidth-24)+'px','important');
            const box=panel.getBoundingClientRect();
            panel.style.setProperty('left',Math.max(12,Math.min(rect.left+rect.width/2-box.width/2,innerWidth-box.width-12))+'px','important');
            panel.style.setProperty('top',Math.max(8,rect.top-box.height-10)+'px','important');
        }
        for(const type of ['pointerover','focusin','click']) content.addEventListener(type,event=>{
            const product=event.target.closest('.shop-consumable');if(product)placeProductInfo(product);
        });
        function fitApothecary(){
            if(!content.querySelector('.herbalist-workshop'))return;
            const width=content.clientWidth;
            content.style.setProperty('--apothecary-width',width+'px');
            content.style.setProperty('--apothecary-height',content.clientHeight+'px');
        }
        new ResizeObserver(()=>{fitApothecary();const product=content.querySelector('.shop-consumable:focus-within,.shop-consumable:hover');if(product)placeProductInfo(product);}).observe(content);
        new MutationObserver(fitApothecary).observe(content,{childList:true});
        let forging=false;
        function inspectCartItem(trigger){
            const panel=content.querySelector('#cartOptions'+trigger.dataset.cartInspect);if(!panel)return;
            content.querySelectorAll('.cart-counter-options').forEach(other=>{
                if(other===panel)return;
                if(other.matches(':popover-open'))other.hidePopover();
                other.hidden=true;
            });
            panel.ontoggle=event=>{if(event.newState==='closed')panel.hidden=true;};
            panel.hidden=false;
            if(panel.showPopover&&!panel.matches(':popover-open'))panel.showPopover();
            const rect=trigger.getBoundingClientRect(),box=panel.getBoundingClientRect();
            panel.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-box.width-8))+'px';
            panel.style.top=Math.max(8,rect.top-box.height-8)+'px';
        }
        let cashierMoving=false,cashierX=0,cashierTrip=0,cashierMovement;
        async function cashierWalk(to){
            const frame=content.getBoundingClientRect(),actor=image.getBoundingClientRect();
            const origin=actor.left-cashierX;
            to=Math.max(frame.left+8-origin,Math.min(frame.right-actor.width-8-origin,to));
            const from=cashierX,version=cashierTrip;
            if(Math.abs(to-from)<3)return;
            image.src=catalog.cashier.walkingLeft||catalog.cashier.presentation;
            image.style.transform=to<from?'':'scaleX(-1)';
            const movement=image.parentElement.animate([{transform:`translateX(${from}px)`},{transform:`translateX(${to}px)`}],{duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.max(700,Math.abs(to-from)*3),fill:'forwards',easing:'linear'});
            cashierMovement=movement;requestAnimationFrame(actorBounds);try{await movement.finished;}catch(error){if(error.name!=='AbortError')throw error;}finally{if(version===cashierTrip){cashierX=to;image.parentElement.style.transform=`translateX(${to}px)`;}movement.cancel();}
        }
        async function cashierCollect(button){
            if(tab!=='market'||cashierMoving)return;
            cashierMoving=true;clearTimeout(thankTimer);const version=cashierTrip;
            const original=image.getBoundingClientRect(),destination=(button.closest('.shop-consumable')||button).getBoundingClientRect();
            const offset=cashierX+destination.left+destination.width/2-original.left-original.width/2;
            try{await cashierWalk(offset);if(!dialog.open||tab!=='market'||version!==cashierTrip)return;image.src=catalog.cashier.back||catalog.cashier.presentation;await new Promise(resolve=>setTimeout(resolve,500));}
            finally{cashierMoving=false;if(version===cashierTrip&&dialog.open&&tab==='market'){image.src=catalog.cashier.idle||catalog.cashier.presentation;image.style.transform='';speech.textContent='Je garde tes articles. Que veux-tu ajouter ?';}}
        }
        async function cashierDeposit(){
            if(cashierMoving)return false;
            cashierMoving=true;clearTimeout(thankTimer);const version=cashierTrip;
            try{speech.textContent='Je rassemble tes articles sur le comptoir.';await cashierWalk(0);if(version!==cashierTrip||!dialog.open)return false;image.src=catalog.cashier.idle||catalog.cashier.presentation;image.style.transform='';speech.textContent='Tes articles sont prêts. Vérifie ton panier avant de payer.';return true;}
            finally{cashierMoving=false;}
        }
        async function forgeEvolution(room){
            if(forging)return;
            forging=true;
            await Promise.race([Promise.all(['working','walkingLeft'].map(pose=>workshopImages.get(catalog.companions?.artisan?.[pose]))),new Promise(resolve=>setTimeout(resolve,1500))]);
            if(!dialog.open||tab!=='evolution'){forging=false;return;}
            api.buyEvolution(room);render();
            const actor=content.querySelector('.shop-zone-companion');
            const selected=content.querySelector(`[data-shop-evolve="${room}"]`)?.closest('.shop-evolution-card');
            if(!actor||!selected){forging=false;return;}
            clearTimeout(workshopTimer);workshopUntil=0;forging=true;
            const buttons=[...content.querySelectorAll('[data-shop-evolve]')];
            const states=buttons.map(button=>button.disabled);buttons.forEach(button=>button.disabled=true);
            const valid=()=>dialog.open&&tab==='evolution'&&actor.isConnected;
            const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const origin=actor.getBoundingClientRect(),item=selected.getBoundingClientRect();
            const distance=item.left+item.width/2-(origin.left+origin.width/2);
            const walk=async(from,to,returning=false)=>{
                showWorkshopPose('walkingLeft');
                const sprite=actor.querySelector('.shop-zone-sprite');
                if(sprite)sprite.style.transform=returning?'':'scaleX(-1)';
                const movement=actor.animate([{transform:`translateX(${from}px)`},{transform:`translateX(${to}px)`}],{duration:reduced?1:1400,easing:'ease-in-out',fill:'forwards'});
                try{await movement.finished;}finally{actor.style.transform=`translateX(${to}px)`;movement.cancel();}
            };
            try{
                await walk(0,distance);if(!valid())return;
                showWorkshopPose('thanks');await new Promise(resolve=>setTimeout(resolve,600));if(!valid())return;
                await walk(distance,0,true);if(!valid())return;
                showWorkshopPose('working');await new Promise(resolve=>setTimeout(resolve,8000));if(!valid())return;
                showWorkshopPose('thanks');await new Promise(resolve=>setTimeout(resolve,1000));
            }finally{
                forging=false;
                if(valid()){actor.style.transform='';showWorkshopPose('idle');buttons.forEach((button,index)=>button.disabled=states[index]);}
            }
        }
        // Actualiser uniquement le contenu du rayon ouvert.
        let marketSizingObserver;
        let actorFrame;
        function actorBounds() {
            cancelAnimationFrame(actorFrame);
            if (!dialog.open) return;
            const body = content.getBoundingClientRect(), layout = dialog.querySelector('.shop-layout').getBoundingClientRect();
            dialog.style.setProperty('--actor-top', (body.top - layout.top) + 'px');
            dialog.style.setProperty('--actor-height', body.height + 'px');
            const phone=matchMedia('(pointer:coarse)').matches&&Math.min(innerWidth,innerHeight)<=900;
            for(const [actor,bubble,parent] of [[image,speech,dialog.querySelector('.shop-layout')],[content.querySelector('#inventoryHerbalist'),content.querySelector('#inventorySpeech'),content]]){
                if(!actor||!bubble)continue;
                if(!phone){if(bubble.parentElement!==actor.parentElement)actor.parentElement.append(bubble);bubble.classList.remove('phone-bubble');bubble.hidden=false;continue;}
                if(bubble.parentElement!==parent)parent.append(bubble);bubble.classList.add('phone-bubble');
                const bounds=actor.getBoundingClientRect(),frame=parent.getBoundingClientRect();
                bubble.hidden=!bounds.width||!bounds.height;
                if(bubble.hidden)continue;
                const box=bubble.getBoundingClientRect();
                bubble.style.setProperty('--bubble-x',Math.max(6,Math.min(frame.width-box.width-6,bounds.left-frame.left+(bounds.width-box.width)/2))+'px');
                bubble.style.setProperty('--bubble-y',Math.max(2,(phone?bounds.top-frame.top-box.height-4:bounds.bottom-frame.top+4))+'px');
            }
            if(cashierMoving||retrieving)actorFrame=requestAnimationFrame(actorBounds);
        }
        new ResizeObserver(()=>requestAnimationFrame(actorBounds)).observe(content);
        new ResizeObserver(()=>requestAnimationFrame(actorBounds)).observe(speech);
        function fitPaintedShop(){
            const stage=content.querySelector('.shop-painted-stage');if(!stage)return;
            const width=content.clientWidth,height=content.clientHeight;
            const x=(content.clientWidth-width)/2,y=(content.clientHeight-height)/2;
            Object.assign(stage.style,{width:width+'px',height:height+'px',left:x+'px',top:y+'px'});
            const rect=stage.getBoundingClientRect();
            for(const [name,value] of Object.entries({x:rect.left+width*.79,y:rect.top+height*(innerHeight<700?.23:.27),w:width*.20,h:height*(innerHeight<700?.54:.45)}))dialog.style.setProperty('--painted-actor-'+name,value+'px');
        }
        new ResizeObserver(()=>{fitPaintedShop();requestAnimationFrame(actorBounds);}).observe(content);
        function render() {
            renderContents();
            const painted=['market','items'].includes(tab);
            dialog.classList.toggle('painted-shop',painted);
            if(painted){
                const stage=document.createElement('div');stage.className='shop-painted-stage';
                stage.style.backgroundImage=content.style.backgroundImage;
                stage.append(...content.childNodes);content.append(stage);
                fitPaintedShop();
            }
            requestAnimationFrame(()=>{fitPaintedShop();actorBounds();});
        }
        function renderContents() {
            const game=api.game(),keys=owned();
            dialog.classList.toggle('inventory-dialog',tab==='inventory');
            const inventoryBackground=tab==='inventory'?catalog.backgrounds?.inventory:tab==='market'?catalog.backgrounds?.market:null;
            dialog.style.backgroundImage=inventoryBackground?`linear-gradient(#fff8e833,#fff8e833),url("${window.LapinousImages?.url(inventoryBackground)||inventoryBackground}")`:'';
            const marketScene=tab==='market'&&!!catalog.backgrounds?.market;
            dialog.classList.toggle('market-illustrated',marketScene);
            const zoneScene=['items','evolution','fragments','cart'].includes(tab)&&!!catalog.backgrounds?.[tab];
            dialog.classList.toggle('shop-zone-illustrated',zoneScene);
            for(const zone of ['items','evolution','fragments','cart'])dialog.classList.toggle('zone-'+zone,zoneScene&&tab===zone);
            content.style.backgroundImage=marketScene?`url("${window.LapinousImages?.url(catalog.backgrounds.market)||catalog.backgrounds.market}")`:'';
            if(zoneScene)content.style.backgroundImage=`url("${window.LapinousImages?.url(catalog.backgrounds[tab])||catalog.backgrounds[tab]}")`;
            if(marketScene||zoneScene)dialog.style.backgroundImage='';
            dialog.classList.toggle('shop-consumables-view',['items','market','evolution'].includes(tab));
            dialog.classList.toggle('shop-fragments-view',tab==='fragments');
            dialog.querySelector('#shopTitle').textContent=tab==='inventory'?'L’apothicairerie':'Magasin';
            dialog.querySelector('.shop-cashier').hidden=['inventory','evolution','fragments'].includes(tab);
            dialog.querySelector('.shop-tabs').hidden=tab==='inventory';
            dialog.querySelector('#shopWallet').hidden=tab==='inventory';
            if(cartGame!==game){cart=[];cartGame=game;}
            if(!keys.includes(target))target=keys.includes(game.species)?game.species:keys[0];
            dialog.querySelector('#shopWallet').textContent=`🥕 ${game.carrots} carottes disponibles`;
            dialog.querySelector('[data-shop-tab="cart"]').textContent=`Panier (${cart.length})`;
            dialog.querySelectorAll('[data-shop-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.shopTab===tab);b.setAttribute('aria-pressed',String(b.dataset.shopTab===tab));});
            const summary=dialog.querySelector('#shopCartSummary');summary.hidden=tab==='cart'||tab==='inventory';
            summary.innerHTML=`<span>🛒 <b>${cart.length}</b> article${cart.length>1?'s':''} · <b>${total()} 🥕</b></span><button type="button" data-shop-tab="cart" ${!cart.length?'disabled':''}>Voir le panier</button>`;
            if(tab==='evolution'){
                const evolutions=api.evolutions();

                content.innerHTML='<p class="shop-cart-note">Les dernières versions débloquées par l’amitié se renforcent ici, pour le lapin actif.</p><div class="shop-evolution-grid">'+evolutions.map(evo=>'<article class="shop-evolution-card"><img src="'+escape(evo.image)+'" alt=""><strong>'+escape(evo.name)+'</strong>'+(evo.stage>=5?'<b class="evolution-max">MAX</b>':'<div class="evolution-dots" aria-label="'+Math.max(0,evo.stage-1)+' améliorations sur 4">'+Array.from({length:4},(_,index)=>'<i class="'+(index<evo.stage-1?'filled':'')+'"></i>').join('')+'</div>')+'<button data-shop-evolve="'+evo.room+'" '+(evo.stage<1||evo.stage>=5||game.carrots<evo.cost?'disabled':'')+'>'+(evo.stage<1?'À débloquer avec l’amitié':evo.stage>=5?'Maximum':evo.cost+' 🥕 · Améliorer')+'</button></article>').join('')+'</div>';appendZoneCompanion();return;
            }
            if(tab==='inventory') {
                content.style.backgroundImage=`url("${window.LapinousImages?.url(catalog.backgrounds.inventory)||catalog.backgrounds.inventory}")`;
                const active=game.species,pr=api.progress(active);
                const groupOrder=['nourriture','energie','proprete','amitie'];
                const remedyGroup=item=>item.remedyGroup||({food:'nourriture',energy:'energie',cleanliness:'proprete'}[item.stat]);
                const remedies=catalog.items.filter(item=>item.kind==='restore'&&!['market','prepared','legacy_food','retired'].includes(item.category)).sort((a,b)=>groupOrder.indexOf(remedyGroup(a))-groupOrder.indexOf(remedyGroup(b)));
                // Emplacements fixes et espacés sur les trois rangées, indépendants du stock.
                if(!drawerSlots){
                    const count=Math.max(16,Math.ceil(remedies.length/4)*4);
                    const preferred=[];
                    drawerSlots=preferred.concat(Array.from({length:count},(_,i)=>i).filter(i=>!preferred.includes(i)));
                }
                const items=Array(drawerSlots.length).fill(null);
                remedies.forEach((item,i)=>{if((game.inventory?.[item.id]||0)>0)items[drawerSlots[i]]=item;});
                content.innerHTML=`<div class="herbalist-workshop"><section class="inventory-cabinet" aria-label="Tes soins disponibles"><div class="inventory-cabinet-heading">Les réserves du terrier</div><div class="inventory-drawers">${items.map(item=>item?`<button type="button" class="inventory-drawer ${(game.inventory?.[item.id]||0)>0?'':'is-unowned'}" data-shop-use="${escape(item.id)}" ${retrieving?'disabled':''} aria-disabled="${(pr[item.stat]>=100&&!item.bonus&&!item.remedyEffect)}" aria-label="${escape(item.name)} : une touche pour la description, deux pour utiliser"><img src="${escape(item.image)}" alt="${escape(item.name)}"><strong>${escape(item.emoji)} ${escape(item.name)}</strong><span class="inventory-quantity">×${game.inventory?.[item.id]||0}</span><span class="inventory-handle" aria-hidden="true"></span><span class="inventory-drawer-details"><b>${escape(item.emoji)} ${escape(item.name)}</b><span>${escape(item.description)}</span><em>${(pr[item.stat]>=100&&!item.bonus&&!item.remedyEffect)?'Barre déjà pleine':`Utiliser sur ${escape(name(active))}`} · Stock : ${game.inventory?.[item.id]||0}</em></span></button>`:'<div class="inventory-drawer inventory-drawer-empty" aria-label="Tiroir vide"><span class="inventory-handle" aria-hidden="true"></span></div>').join('')}</div>${!items.some(Boolean)?'<p class="inventory-empty">Tes tiroirs sont vides pour le moment.</p>':''}<div class="inventory-cabinet-feet" aria-hidden="true"></div></section><aside class="inventory-herbalist"><img id="inventoryHerbalist" src="${escape(herbalistPoses.idle)}" alt="La lapine apothicaire"><p id="inventorySpeech" aria-live="polite">De quoi as-tu besoin, ${escape(name(active))} ?</p></aside></div><div class="shop-needs"><span>🥕 ${Math.round(pr.food)} %</span><span>😴 ${Math.round(pr.energy)} %</span><span>🫧 ${Math.round(pr.cleanliness)} %</span></div>`;
                return;
            }
            if(tab==='carrots'){content.innerHTML='<section class="shop-coming"><span>🥕</span><h3>Des carottes pour tes aventures</h3><p>Les achats avec de l’argent réel ne sont pas encore disponibles.</p><p>Gagne tes carottes en jouant et en affrontant les boss.</p></section>';return;}
            if(tab==='cart') {
                if(!cart.length){content.innerHTML='<section class="shop-coming"><span>🛒</span><h3>Ton panier est vide</h3><p>Ajoute des articles pour les lapins de ton choix.</p><button type="button" class="shop-cart-button" data-shop-tab="items">Choisir des articles</button></section>';return;}
                content.innerHTML=`<h3 class="shop-cart-title">Tes achats</h3><p class="shop-cart-note">Les soins seront rangés dans ton inventaire. Les extracteurs agiront sur les compétences choisies.</p><div class="shop-cart-lines">${groupCartLines(cart).map(line=>{
                    const index=line.cartIndex;
                    const item=getItem(line.id);let detail='Ajouté à l’inventaire · à utiliser sur le lapin actif de ton choix';
                    if(item.kind==='reset'){const pr=api.progress(line.target);detail=`${api.technique(line.target,line.index).name} : ${resetPlan(pr,line.index).refund} fragments récupérés, compétence à 0/5. Les autres restent intactes.`;}
                    return `<article class="shop-cart-line cart-counter-item"><button type="button" class="cart-counter-inspect" data-cart-inspect="${index}" aria-label="Options de ${escape(item.name)}, quantité ${line.quantity}" aria-haspopup="true"><img src="${escape(item.image||'./assets/img/lapins_jouables/sans_evenements/mystery.svg')}" alt=""><b class="cart-counter-count">×${line.quantity}</b><span class="cart-counter-name">${escape(item.name)}</span></button><div class="cart-counter-options" id="cartOptions${index}" popover="auto" hidden><strong>${escape(item.name)}</strong><span>${item.price*line.quantity} carottes au total</span><div class="shop-cart-controls">${item.kind==='restore'?`<div class="shop-quantity"><button type="button" data-shop-minus="${index}" aria-label="Retirer une unité de ${escape(item.name)}">− 1</button><span aria-label="Quantité">${line.quantity}</span><button type="button" data-shop-plus="${index}" aria-label="Ajouter une unité de ${escape(item.name)}">+ 1</button></div><small>${item.price} carottes par unité</small>`:''}<button type="button" data-shop-remove="${index}" aria-label="Supprimer ${escape(item.name)} du panier">Supprimer du panier</button></div></div></article>`;
                }).join('')}</div><section class="shop-cart-payment"><p>Total : <b>${total()} 🥕</b></p>${total()>game.carrots?'<p class="shop-cart-note">Tu n’as pas assez de carottes pour ce panier.</p>':''}<div class="shop-confirm-actions"><button type="button" data-shop-pay ${total()>game.carrots?'disabled':''}>Confirmer et payer ${total()} 🥕</button><button type="button" data-shop-tab="items">Continuer mes achats</button></div></section>`;
                // Le total et la confirmation restent hors de la zone qui défile.
                content.querySelectorAll('[data-cart-inspect]').forEach(trigger=>trigger.addEventListener('pointerenter',()=>inspectCartItem(trigger)));
                summary.hidden=false;
                summary.replaceChildren(content.querySelector('.shop-cart-payment'));
                return;
            }
            if(!target){content.innerHTML='<p>Adopte un compagnon pour choisir des articles.</p>';return;}
            const pr=api.progress(target);
            if(!Number.isInteger(chosenIndex)||chosenIndex>=pr.attackLevels.length)chosenIndex=0;
            const selector=`<section class="shop-rabbit-picker"><h3>Extracteur : pour quel lapin ?</h3><div class="shop-rabbit-grid" role="group" aria-label="Choisir le lapin destinataire">${keys.map(key=>`<button type="button" class="shop-rabbit-choice ${key===target?'selected':''}" data-shop-rabbit="${escape(key)}" aria-pressed="${key===target}"><img src="${escape(portrait(key))}" alt=""><strong>${escape(name(key))}</strong><small>Niveau ${api.progress(key).currentLevel||1}</small></button>`).join('')}</div></section>`;
            content.innerHTML=`<p class="shop-cart-note">${tab==='fragments'?'Choisis un lapin et sa compétence.':tab==='market'?'Les aliments sont conservés dans la réserve de la cuisine.':'Les soins se conservent dans ton inventaire.'}</p><div class="shop-needs"><span>🥕 ${Math.round(pr.food)} %</span><span>😴 ${Math.round(pr.energy)} %</span><span>🫧 ${Math.round(pr.cleanliness)} %</span><span>💎 ${pr.attackFragments} fragments</span></div><div class="shop-items">${catalog.items.filter(item=>tab==='fragments'?item.kind==='reset':tab==='market'?item.category==='market':item.kind==='restore'&&!['market','prepared'].includes(item.category)).map(item=>{
                const reset=item.kind==='reset',plan=reset?resetPlan(pr,chosenIndex):null;
                const full=false,inCart=alreadyAdded(item,target,chosenIndex);
                const unavailable=full||(!reset&&inCart)||(reset&&(!plan.refund||game.carrots<item.price));
                const skills=reset?`<label>Compétence à réinitialiser<select id="shopSkill">${pr.attackLevels.map((level,index)=>`<option value="${index}" ${chosenIndex===index?'selected':''}>${escape(api.technique(target,index).name)} · ${level}/5</option>`).join('')}</select></label><small>${plan.refund} fragments récupérables sur cette compétence, pour ce lapin.</small>`:'';
                // Les soins affichent leur image ; survol, focus et toucher révèlent les détails.
                if(!reset)return `<article class="shop-consumable" tabindex="0" aria-label="${escape(item.name)}">${item.image?`<img src="${escape(item.image)}" alt="${escape(item.name)}" loading="lazy">`:`<span class="shop-food-emoji" aria-hidden="true">${escape(item.emoji)}</span>`}<div class="shop-consumable-details"><h3>${escape(item.emoji)} ${escape(item.name)}</h3><p>${escape(item.description)}</p><button type="button" data-shop-add="${escape(item.id)}">${item.price} 🥕 · Ajouter au panier</button></div></article>`;
                return `<article class="shop-item shop-fragment-item"><div class="shop-fragment-details">${item.image ? `<div class="shop-product-visual"><img src="${escape(item.image)}" alt="${escape(item.name)}" loading="lazy"></div>` : `<span class="shop-item-icon" aria-hidden="true">${escape(item.emoji)}</span>`}<h3>${escape(item.name)}</h3><p>${escape(item.description)}</p>${skills}<button type="button" data-shop-add="${escape(item.id)}" ${unavailable?'disabled':''}>${full?'Barre déjà pleine':`${item.price} 🥕 · Payer et récupérer`}</button></div><aside class="shop-fragment-rabbits">${selector}</aside></article>`;
            }).join('')}</div>`;
            if(tab==='items'){
                const grid=content.querySelector('.shop-items');grid.classList.add('remedy-stalls');
                const groups=[['nourriture','Nourriture'],['energie','Énergie et repos'],['proprete','Propreté'],['amitie','Amitié et progression']];
                const cards=[...grid.children];
                for(const [key,label] of groups){const stall=document.createElement('section');stall.className='remedy-stall';const title=document.createElement('h3');title.textContent=label;stall.append(title);const shelf=document.createElement('div');shelf.className='remedy-products';for(const card of cards){const id=card.querySelector('[data-shop-add]').dataset.shopAdd;const item=getItem(id);const group=item.remedyGroup||({food:'nourriture',energy:'energie',cleanliness:'proprete'}[item.stat]);if(group===key){card.dataset.remedyNumber=item.visualNumber||'';shelf.append(card);}}stall.append(shelf);grid.append(stall);}
            }
            if(tab==='market'){
                // Rayons compacts : les etals remplacent la succession de grandes cartes.
                const grid=content.querySelector('.shop-items');
                const groups=[['Fruits du verger',['market_apple','market_pear','market_strawberry','market_blueberry']],['Legumes du jardin',['market_carrot','market_cucumber','market_courgette','market_lettuce','market_celery','market_fennel']],['Herbes, fleurs et foin',[]]];
                const articles=[...grid.children];
                groups.forEach(([name,ids],index)=>{
                    const cards=articles.filter(card=>{const id=card.querySelector('[data-shop-add]').dataset.shopAdd;return index===2?!groups.slice(0,2).some(group=>group[1].includes(id)):ids.includes(id);});
                    if(!cards.length)return;
                    const section=document.createElement('section');section.className='market-stall';
                    const heading=document.createElement('h3');heading.textContent=name;section.append(heading);
                    const shelf=document.createElement('div');shelf.className='market-stall-products';
                    cards.forEach(card=>{const item=catalog.items.find(item=>item.id===card.querySelector('[data-shop-add]').dataset.shopAdd);const label=document.createElement('span');label.className='market-price-tag';label.textContent=item.price+' \u{1F955}';label.title=item.name;card.append(label);shelf.append(card);});
                    section.append(shelf);grid.append(section);
                });
                const table=document.createElement('aside');table.className='market-purchase-table';table.setAttribute('aria-label','Table des achats');
                const marketLines=cart.filter(line=>getItem(line.id)?.category==='market');
                table.innerHTML='<strong>Table des achats</strong><div>'+[...new Set(marketLines.map(line=>line.id))].map(id=>{const item=getItem(id),quantity=marketLines.filter(line=>line.id===id).length;return '<span title="'+escape(item.name)+'">'+(item.image?'<img src="'+escape(item.image)+'" alt="'+escape(item.name)+'">':escape(item.emoji))+'<b>×'+quantity+'</b></span>';}).join('')+'</div>';content.append(table);
                marketSizingObserver ||= new ResizeObserver(()=>content.querySelectorAll('.market-stall').forEach(stall=>stall.style.setProperty('--market-row-height',((stall.querySelector('.market-stall-products')||stall).getBoundingClientRect().height/2)+'px')));
                marketSizingObserver.disconnect();content.querySelectorAll('.market-stall').forEach(stall=>marketSizingObserver.observe(stall));
            }
            if(tab==='fragments'){
                const visual=content.querySelector('.shop-fragment-details .shop-product-visual');
                if(visual){content.append(visual);visual.querySelector('img').loading='eager';}
                const description=content.querySelector('.shop-fragment-details>p');
                if(description){const details=document.createElement('details');details.className='fragment-description';const summary=document.createElement('summary');summary.textContent='Comment fonctionne l\u2019extracteur ?';details.append(summary,description.cloneNode(true));description.replaceWith(details);}
                const fragmentDetails=content.querySelector('.shop-fragment-details'),fragmentRabbits=content.querySelector('.shop-fragment-rabbits');
                if(fragmentDetails&&fragmentRabbits){
                    const controls=document.createElement('section');controls.className='fragment-controls';
                    controls.setAttribute('aria-label','Choisir un lapin et utiliser les fragments');
                    controls.append(fragmentDetails,fragmentRabbits);content.append(controls);
                }
            }
            appendZoneCompanion();
        }
        // Ouvrir le rayon demandé après les contrôles de partie.
        const rayAllowed=ray=>window.LapinousVisibility.allowed(({market:'market',evolution:'evolution',fragments:'fragments',carrots:'carrotShop'})[ray]||'shop');
        function open(initialTab='items') {
            if(!window.LapinousVisibility.allowed(initialTab==='inventory'?'inventory':'shop')||(initialTab!=='inventory'&&!rayAllowed(initialTab)))return;
            if(!catalog){api.toast('Le catalogue n’a pas pu charger.','warn');return;}
            if(!owned().length){api.toast('Adopte un compagnon avant de visiter le magasin.','warn');return;}
            if(api.inCombat()){api.toast('Termine le combat avant de visiter le magasin.','warn');return;}
            clearTimeout(apothecaryTimer);
            cashierTrip++;cashierX=0;image.parentElement.style.transform='';image.style.transform='';target=api.game().species;tab=initialTab;chosenIndex=0;message.textContent='';cashier(false,true);render();if(!dialog.open)dialog.showModal();workshopAction('greeting',1000);
            if(tab==='inventory'){
                const actor=content.querySelector('#inventoryHerbalist');
                actor.src=herbalistPoses.greeting;
                const speech=content.querySelector("#inventorySpeech");
                speech.textContent=`Bonjour, ${name(target)} !`;
                // Saluer à l’ouverture, puis attendre ; ne pas interrompre un soin démarré.
                apothecaryTimer=setTimeout(()=>{if(dialog.open&&tab==='inventory'&&!retrieving&&actor.isConnected){actor.src=herbalistPoses.idle;speech.textContent=`De quoi as-tu besoin, ${name(target)} ?`;}},900);
            }
        }
        window.openLapinousShop=()=>open();button.addEventListener('click',()=>open());
        window.openLapinousMarket=()=>{document.getElementById('kitchenFridgeDialog')?.close();open('market');};
        window.openLapinousInventory=()=>open('inventory');inventoryButton.addEventListener('click',window.openLapinousInventory);
        dialog.querySelector('.shop-close').addEventListener('click',()=>dialog.close());
        dialog.addEventListener('close',()=>{cashierTrip++;cashierMovement?.cancel();cashierMoving=false;clearTimeout(workshopTimer);workshopUntil=0;clearTimeout(thankTimer);clearTimeout(apothecaryTimer);retrieveVersion++;retrieveAnimation?.cancel();retrieving=false;(tab==='inventory'?inventoryButton:button).focus();});
        dialog.addEventListener('change',event=>{if(event.target.id==='shopSkill'){chosenIndex=Number(event.target.value);render();}});
        dialog.addEventListener('error',event=>{if(event.target.id==='inventoryHerbalist'&&(window.LapinousImages?.local(event.target.getAttribute('src'))||event.target.getAttribute('src'))===walkingSrc){walkingAvailable=false;event.target.src=herbalistPoses.back;return;}if(event.target.matches('img')&&(window.LapinousImages?.local(event.target.getAttribute('src'))||event.target.getAttribute('src'))!=='./assets/img/lapins_jouables/sans_evenements/mystery.svg')event.target.src='./assets/img/lapins_jouables/sans_evenements/mystery.svg';},true);
        dialog.addEventListener('click',async event=>{
            const product=event.target.closest('.shop-consumable');
            if(tab==='market'&&product&&!event.target.closest('[data-shop-add]')){
                event.preventDefault();
                const touch=window.matchMedia('(hover: none), (pointer: coarse)').matches;
                if(touch&&!product.classList.contains('market-armed')){content.querySelectorAll('.market-armed').forEach(card=>card.classList.remove('market-armed'));product.classList.add('market-armed');product.focus();return;}
                product.classList.remove('market-armed');product.querySelector('[data-shop-add]')?.click();return;
            }

            const clicked=event.target.closest('button');if(!clicked||clicked.disabled)return;
            if(clicked.dataset.cartInspect!==undefined){inspectCartItem(clicked);return;}
            if(clicked.dataset.shopEvolve){await forgeEvolution(clicked.dataset.shopEvolve);}
            if(clicked.dataset.shopTab&&rayAllowed(clicked.dataset.shopTab)){if(tab==='market'&&clicked.dataset.shopTab==='cart'&&cart.length){if(!await cashierDeposit())return;}else if(cashierMoving)return;if(tab==='market'&&clicked.dataset.shopTab!=='market'){cashierX=0;cashierTrip++;image.parentElement.style.transform='';image.style.transform='';}clearTimeout(workshopTimer);workshopUntil=0;tab=clicked.dataset.shopTab;message.textContent='';render();workshopAction('greeting',1000);}
            if(clicked.dataset.shopRabbit){target=clicked.dataset.shopRabbit;chosenIndex=0;message.textContent='';render();content.querySelector('.shop-rabbit-choice.selected')?.focus();}
            if(clicked.dataset.shopAdd){
                if(cashierMoving)return;
                const item=getItem(clicked.dataset.shopAdd);
                if(!item||alreadyAdded(item,target,chosenIndex))return;
                if(tab==='market'){await cashierCollect(clicked);if(!dialog.open||tab!=='market')return;}
                const pr=api.progress(target);
                if(item.kind==='reset'){
                    try{
                        transact(api.game(),pr,item,chosenIndex);
                        api.save();api.refresh();api.sound('purchase');render();
                        message.textContent='Fragments récupérés. Achat payé directement.';
                        workshopAction('working',8000);
                    }catch(error){message.textContent=error.message;}
                    return;
                }
                
                if(item.kind==='reset'&&!resetPlan(pr,chosenIndex).refund)return;
                cart.push({id:item.id,target:item.kind==='reset'?target:null,index:item.kind==='reset'?chosenIndex:null});
                render();if(item.kind==='reset')workshopAction('working',6500);message.textContent=`${item.name} ajouté${item.kind==='reset'?` pour ${name(target)}`:' pour ton inventaire'}.`;
                dialog.querySelector('#shopCartSummary button').focus();
            }
            if(clicked.hasAttribute('data-shop-plus')||clicked.hasAttribute('data-shop-minus')){
                const increase=clicked.hasAttribute('data-shop-plus');
                const index=Number(increase?clicked.dataset.shopPlus:clicked.dataset.shopMinus),line=cart[index];
                if(!line||getItem(line.id)?.kind!=='restore')return;
                if(increase)cart.push({...line});else cart.splice(index,1);
                render();const updated=content.querySelector('[data-cart-inspect="'+Math.min(index,groupCartLines(cart).length-1)+'"]');updated?.focus();if(updated)inspectCartItem(updated);
            }
            if(clicked.hasAttribute('data-shop-remove')){
                const line=cart[Number(clicked.dataset.shopRemove)];
                if(!line)return;
                cart=cart.filter(other=>!(other.id===line.id&&other.target===line.target&&other.index===line.index));
                render();content.querySelector('button')?.focus();
            }
            if(clicked.dataset.shopUse){
                if(retrieving)return;
                const active=api.game().species,currentGame=api.game(),item=getItem(clicked.dataset.shopUse);
                if(api.exploring?.(active)){api.toast('Ce lapin est en exploration. Choisis un autre compagnon pour utiliser un soin.','warn');return;}
                try {
                    if(api.inCombat()||cartGame!==currentGame||!owned().includes(active))throw new Error('Rouvre l’inventaire avec ton compagnon actif après le combat.');
                    if(!item)return;
                    const now=Date.now();
                    if(inspectedItem!==item.id||now-inspectedAt>900||!clicked.classList.contains('drawer-selected')){
                        inspectedItem=item.id;inspectedAt=now;
                        content.querySelectorAll('[data-shop-use]').forEach(node=>node.classList.toggle('drawer-selected',node.dataset.shopUse===item.id));
                        let description=content.querySelector('.inventory-description');
                        if(!description){description=document.createElement('div');description.className='inventory-description';description.setAttribute('role','status');content.append(description);}
                        description.innerHTML=`<strong>${escape(item.name)} · ×${currentGame.inventory?.[item.id]||0}</strong><p>${escape(item.description)}</p><small>${!(currentGame.inventory?.[item.id]>0)?'Stock vide : disponible au magasin.':(api.progress(active)[item.stat]>=100&&!item.bonus&&!item.remedyEffect)?'Ce besoin est déjà rempli.':'Touche deux fois le tiroir pour utiliser ce soin.'}</small>`;
                        return;
                    }
                    if(!(currentGame.inventory?.[item.id]>0))return;
                    inspectedItem='';inspectedAt=0;
                    if((api.progress(active)[item.stat]>=100&&!item.bonus&&!item.remedyEffect))return;
                    clearTimeout(apothecaryTimer);retrieving=true;requestAnimationFrame(actorBounds);render();
                    const version=++retrieveVersion;
                    const valid=()=>version===retrieveVersion&&dialog.open&&tab==='inventory'&&api.game()===currentGame&&api.game().species===active&&!api.inCombat();
                    const herbalist=content.querySelector('#inventoryHerbalist');
                    const drawer=[...content.querySelectorAll('[data-shop-use]')].find(button=>button.dataset.shopUse===item.id);
                    const origin=herbalist.getBoundingClientRect(),destination=drawer.getBoundingClientRect();
                    // Déplacement horizontal uniquement : les pieds restent sur le même sol.
                    const offset='translateX('+(destination.left+destination.width/2-origin.left-origin.width/2+35)+'px)';
                    const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:550;
                    // Le GIF regarde à gauche ; le miroir regarde à droite au retour.
                    const setWalking=returning=>{
                        herbalist.src=walkingAvailable===false?herbalistPoses.back:walkingSrc;
                        herbalist.classList.add('herbalist-walking');herbalist.classList.toggle('herbalist-walk-right',returning);
                        herbalist.alt='La lapine marche '+(returning?'vers la droite':'vers le meuble');
                    };
                    // Animer le conteneur conserve le miroir du sprite sans changer sa hauteur.
                    const groundTransform=getComputedStyle(herbalist.parentElement).transform.replace(/^none$/,'');
                    const move=async(from,to)=>{
                        retrieveAnimation=herbalist.parentElement.animate([{transform:groundTransform+' '+from},{transform:groundTransform+' '+to}],{duration,easing:'ease-in-out',fill:'forwards'});
                        await retrieveAnimation.finished;
                    };
                    content.querySelector('#inventorySpeech').textContent='Je vais chercher ton remède…';
                    setWalking(false);
                    await move('translateX(0)',offset);
                    if(!valid())throw new Error('Le soin est resté dans ton inventaire.');
                    const cabinet=content.querySelector('.inventory-drawers').getBoundingClientRect();
                    const heightRatio=(destination.top+destination.height/2-cabinet.top)/cabinet.height;
                    herbalist.src=heightRatio>0.66?herbalistPoses.crouching:heightRatio<0.34?herbalistPoses.reaching:herbalistPoses.back;
                    herbalist.classList.remove('herbalist-walk-right','herbalist-walking');
                    herbalist.alt='La lapine se tourne vers le tiroir choisi';
                    drawer.classList.add('drawer-taking');
                    content.querySelector('#inventorySpeech').textContent='Je te prépare ça…';
                    await new Promise(resolve=>setTimeout(resolve,650));
                    if(!valid())throw new Error('Le soin est resté dans ton inventaire.');
                    setWalking(true);
                    drawer.classList.remove('drawer-taking');
                    await move(offset,'translateX(0)');
                    if(!valid())throw new Error('Le soin est resté dans ton inventaire.');
                    useConsumable(currentGame,api.progress(active),item);api.checkLevelUp?.();api.save();api.refresh();
                    retrieving=false;render();
                    content.querySelector('#inventoryHerbalist').src=herbalistPoses.thanks;
                    content.querySelector('#inventorySpeech').textContent='Tiens, prends ça, ça te fera du bien !';
                    // Revenir à l’attente après la remise, uniquement si la fenêtre reste ouverte.
                    const deliveredActor=content.querySelector('#inventoryHerbalist');
                    apothecaryTimer=setTimeout(()=>{if(dialog.open&&!retrieving&&deliveredActor.isConnected)deliveredActor.src=herbalistPoses.idle;},2500);
                    const gift=document.createElement('img');gift.className='herbalist-gift';gift.src=item.image;gift.alt=item.name;content.querySelector('.inventory-herbalist').appendChild(gift);
                    message.textContent=item.name+' utilisé sur '+name(active)+'.';
                }catch(error){if(dialog.open&&tab==='inventory'&&retrieving){retrieving=false;render();message.textContent=error.name==='AbortError'?'Le soin est resté dans ton inventaire.':error.message;}}
            }
            if(clicked.hasAttribute('data-shop-pay')){
                try{
                    if(api.inCombat()||cartGame!==api.game())throw new Error('La partie a changé. Rouvre le magasin avant de payer.');
                    const progressByKey=Object.create(null);
                    for(const line of cart){if(getItem(line.id)?.kind!=='reset')continue;if(!owned().includes(line.target))throw new Error('Un lapin du panier n’est plus disponible.');progressByKey[line.target]=api.progress(line.target);}
                    const result=checkout(api.game(),progressByKey,catalog.items,cart);
                    cart=[];api.save();api.refresh();api.sound('purchase');render();cashier(true);
                    message.textContent=`Merci ! ${result.count} article${result.count>1?'s':''} acheté${result.count>1?'s':''} pour ${result.total} carottes.`;
                    content.querySelector('button')?.focus();
                }catch(error){message.textContent=error.message;}
            }
        });
    }
    // Résoudre les poses d’un accompagnateur à partir du catalogue partagé.
    function companionImage(role,filename){
        const poses=catalog?.companions?.[role];
        return Object.values(poses||{}).find(value=>typeof value==='string'&&value.endsWith('/'+filename))||'./assets/img/accompagnateurs/couturiere/'+filename;
    }
    window.LapinousShop={getCatalog:()=>catalog,companionImage,init,transact,resetPlan,validateCatalog,checkout,useConsumable};
})();
