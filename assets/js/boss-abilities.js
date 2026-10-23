/* Effets de combat temporaires : aucune écriture dans la sauvegarde des lapins. */
(() => {
  const profiles={
    roots:{name:'Révolte des Racines',icon:'🌿',description:'Entrave tous les lapins : leur prochaine attaque inflige 25 % de dégâts en moins.',tip:'Garde une technique de soin ou de protection pour ce moment.'},
    veil:{name:'Voile de Larmes',icon:'💧',description:'Brouille la vue de toute l’équipe : dégâts réduits de 20 % pendant les deux prochaines actions de chaque lapin.',tip:'Les soins et les protections gardent toute leur efficacité.'},
    shell:{name:'Mur de Chou',icon:'🛡️',description:'Réduit de 45 % les dégâts des deux prochaines attaques reçues.',tip:'Garde ta grande attaque pour après les deux impacts sur le rempart.'},
    explosion:{name:'Explosion Contrôlée',icon:'💥',description:'Frappe aussi les autres lapins encore debout : 35 % des dégâts principaux, avant leur protection.',tip:'Les protections d’équipe réduisent les dégâts de l’explosion.'},
    frenzy:{name:'Folie Bananière',icon:'🍌',description:'Ses deux prochaines attaques sont renforcées de 25 %, mais il subit 20 % de dégâts supplémentaires pendant deux impacts.',tip:'Sa défense s’ouvre : prépare une attaque puissante.'},
    mark:{name:'Marque du Traqueur',icon:'🎯',description:'Marque sa cible : elle subit 25 % de dégâts supplémentaires lors des deux prochaines attaques du boss qui la touchent.',tip:'Une technique de protection aide le lapin marqué.'},
    toxin:{name:'Toxines Paralysantes',icon:'🧪',description:'Empoisonne sa cible : elle perd 4 % de ses PV maximum à la fin des deux prochains tours du boss. Sa prochaine attaque est affaiblie de 15 %.',tip:'Surveille le lapin empoisonné et garde un soin disponible.'},
    royal:{name:'Autorité Royale',icon:'👑',description:'Renforce ses deux prochaines attaques de 20 % et réduit de 20 % les deux prochains coups reçus.',tip:'Profite de ce temps pour soigner ou protéger ton équipe.'},
    aim:{name:'Précision Mortelle',icon:'🌽',description:'Prépare sa prochaine frappe : dégâts augmentés de 35 % et moitié de la protection ignorée.',tip:'Soigner avant la frappe aide à y résister ; le bouclier reste partiellement utile.'},
    blade:{name:'Lame du Shogun',icon:'⚔️',description:'Prépare un coup critique : sa prochaine attaque inflige 60 % de dégâts supplémentaires.',tip:'Le coup est annoncé : prépare une protection.'},
    quake:{name:'Séisme',icon:'🪨',description:'Touche les autres lapins pour 25 % des dégâts principaux et affaiblit de 20 % la prochaine attaque de chacun.',tip:'Une protection d’équipe amortit la secousse.'}
  };
  const byKey={carotte:'roots',oignon:'veil',choux:'shell',piment:'explosion',banane:'frenzy',courgette:'mark',tomate:'toxin',ail:'royal',mais:'aim',aubergine:'blade',patate:'quake'};
  function get(boss,key){
    if(boss?.kind==='vegetable')return null;
    const kind=Object.hasOwn(profiles,boss?.combatAbility)?boss.combatAbility:Object.hasOwn(byKey,key)?byKey[key]:null;
    return Object.hasOwn(profiles,kind)?{...profiles[kind],kind}:null;
  }
  const effects=r=>(r.bossEffects ||= {});
  const enemy=f=>(f.bossEffects ||= {});
  const alive=f=>f.team.filter(r=>r.hp>0);
  function tag(r,key,value){effects(r)[key]={...value};}
  function consume(store,key){if(store[key]&&--store[key].remaining<=0)delete store[key];}
  function playerDamage(f,r,damage){
    const status=effects(r),boss=enemy(f);let value=damage;
    for(const key of ['roots','veil','toxinWeak','quake'])if(status[key]){value*=status[key].factor;consume(status,key);}
    if(boss.shield){value*=1-boss.shield.amount;consume(boss,'shield');}
    if(boss.exposed){value*=boss.exposed.factor;consume(boss,'exposed');}
    return Math.max(1,Math.round(value));
  }
  function protect(target,damage,resistance=0,pierce=0){
    const guard=Math.max(0,Math.min(.9,Number(target.guard)||0));target.guard=0;
    return Math.max(1,Math.round(damage*(1-guard*(1-pierce))*(1-Math.max(0,Math.min(.9,Number(resistance)||0)))));
  }
  function bossDamage(f,r,damage,resistance=0){
    const status=effects(r),boss=enemy(f);let value=damage,pierce=0;
    if(boss.fury){value*=boss.fury.factor;consume(boss,'fury');}
    if(boss.strike){value*=boss.strike.factor;pierce=boss.strike.pierce||0;delete boss.strike;}
    if(status.mark){value*=status.mark.factor;consume(status,'mark');}
    return protect(r,value,resistance,pierce);
  }
  function cast(f,target,mainDamage,resistance=()=>0){
    const profile=get(f.boss,f.key);if(!profile)return null;
    const boss=enemy(f),kind=profile.kind,extra=[];
    const weaken=(key,factor,remaining)=>alive(f).forEach(r=>tag(r,key,{factor,remaining}));
    switch(kind){
      case 'roots':weaken('roots',.75,1);break;
      case 'veil':weaken('veil',.8,2);break;
      case 'shell':boss.shield={amount:.45,remaining:2};break;
      case 'frenzy':boss.fury={factor:1.25,remaining:2};boss.exposed={factor:1.2,remaining:2};break;
      case 'mark':if(target.hp>0)tag(target,'mark',{factor:1.25,remaining:2});break;
      case 'toxin':if(target.hp>0){tag(target,'poison',{remaining:2,fresh:true});tag(target,'toxinWeak',{factor:.85,remaining:1});}break;
      case 'royal':boss.fury={factor:1.2,remaining:2};boss.shield={amount:.2,remaining:2};break;
      case 'aim':boss.strike={factor:1.35,pierce:.5};break;
      case 'blade':boss.strike={factor:1.6,pierce:0};break;
      case 'quake':weaken('quake',.8,1);break;
    }
    if(kind==='explosion'||kind==='quake')for(const r of alive(f)){
      if(r===target)continue;
      const damage=protect(r,mainDamage*(kind==='explosion'?.35:.25),resistance(r));
      r.hp=Math.max(0,r.hp-damage);extra.push({key:r.key,damage});
    }
    return {...profile,kind,extra};
  }
  function afterBoss(f){
    const ticks=[];
    for(const r of f.team){
      const status=effects(r),poison=status.poison;if(!poison)continue;
      if(r.hp<=0){delete status.poison;continue;}
      if(poison.fresh){poison.fresh=false;continue;}
      const damage=Math.max(1,Math.round(r.maxHp*.04));r.hp=Math.max(0,r.hp-damage);
      consume(status,'poison');ticks.push({key:r.key,damage});
    }
    return ticks;
  }
  function rabbitLabels(r){
    const s=effects(r),labels=[];
    for(const [key,icon,name,unit] of [['roots','🌿','Entravé','action'],['veil','💧','Larmes','actions'],['toxinWeak','🧪','Affaibli','action'],['quake','🪨','Ébranlé','action'],['mark','🎯','Marqué','coups'],['poison','🧪','Poison','tours']])if(s[key])labels.push(`${icon} ${name} · ${s[key].remaining} ${unit}`);
    return labels;
  }
  function bossLabels(f){
    const s=enemy(f),labels=[];
    if(s.shield)labels.push(`🛡️ −${Math.round(s.shield.amount*100)} % · ${s.shield.remaining} coups`);
    if(s.fury)labels.push(`🔥 Attaque +${Math.round((s.fury.factor-1)*100)} % · ${s.fury.remaining} coups`);
    if(s.exposed)labels.push(`🍌 Vulnérable +20 % · ${s.exposed.remaining} coups`);
    if(s.strike)labels.push(`⚔️ Frappe préparée +${Math.round((s.strike.factor-1)*100)} %`);
    return labels;
  }
  function intent(f,chargePerTurn){
    const profile=get(f.boss,f.key);if(!profile)return null;
    if(f.bossEffects?.strike)return {...profile,ready:true,turns:1,label:'Frappe préparée au prochain tour du boss'};
    const turns=Math.max(1,Math.ceil((100-f.bossCharge)/chargePerTurn));
    return {...profile,ready:turns===1,turns,label:turns===1?'Au prochain tour du boss':`Dans ${turns} tours du boss`};
  }
  function shieldInfo(f,r){
    const clamp=value=>Math.max(0,Math.min(.9,Number(value)||0));
    if(r)return {reduction:r.hp>0?clamp(r.guard):0,hits:r.hp>0&&clamp(r.guard)>0?1:0};
    const shield=f.bossEffects?.shield,legacy=clamp(f.bossGuard);
    const amount=shield?.remaining>0?clamp(shield.amount):0;
    return {reduction:f.bossHp<=0?0:1-(1-legacy)*(1-amount),hits:f.bossHp<=0?0:Math.max(legacy>0?1:0,amount>0?shield.remaining:0)};
  }
  window.LapinousBossAbilities={get,playerDamage,bossDamage,cast,afterBoss,rabbitLabels,bossLabels,intent,shieldInfo};
})();
