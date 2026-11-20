/* Horloge de session et bonus : les anciennes dates restent lisibles. */
(() => {
  let wall=Date.now(),mono=globalThis.performance?.now?.();
  const reset=()=>{wall=Date.now();mono=globalThis.performance?.now?.();};
  globalThis.document?.addEventListener?.('visibilitychange',()=>{if(!document.hidden)reset();});
  function now(){
    const tick=globalThis.performance?.now?.();
    return Number.isFinite(tick)&&Number.isFinite(mono)?wall+Math.max(0,tick-mono):Date.now();
  }
  function valid(){return Math.abs(Date.now()-now())<=120000;}
  // Les valeurs de bonus importées sont bornées à celles réellement utilisées.
  const limits={combat:.15,resistance:.15,speed:.15,experience:.15,travel:.15};
  function value(progress,type,at=now()){
    const b=progress?.mealBonuses?.[type];
    if(!b||b.expired||!Number.isFinite(b.expiresAt)||!Number.isFinite(b.value))return 0;
    if(b.expiresAt<=at){b.expired=true;return 0;}
    if(b.issuedAt!==undefined&&(!Number.isFinite(b.issuedAt)||b.issuedAt>at+120000||b.expiresAt-b.issuedAt>1800000))return 0;
    return Math.max(0,Math.min(limits[type]||0,b.value));
  }
  function arm(progress,bonus){
    if(!valid())throw Error('Vérifie l’heure automatique de ton appareil avant de préparer ce bonus. Ton plat est conservé.');
    if(!Object.hasOwn(limits,bonus.type)||!Number.isFinite(bonus.value)||bonus.value<=0||bonus.value>limits[bonus.type]||!Number.isSafeInteger(bonus.durationMs)||bonus.durationMs<=0||bonus.durationMs>1800000)throw Error('Bonus de plat incorrect.');
    const issuedAt=now();
    progress.mealBonuses||={};
    progress.mealBonuses[bonus.type]={value:bonus.value,issuedAt,expiresAt:issuedAt+bonus.durationMs};
  }
  function describe(bonus){return bonus?` · ${bonus.type==='travel'?'Chance de soins rares':bonus.type==='combat'?'Puissance':bonus.type==='resistance'?'Résistance':bonus.type==='speed'?'Agilité':'Expérience'} +${Math.round(bonus.value*100)} ${bonus.type==='travel'?'points':'%'} · ${bonus.durationMs/60000} min (sans cumul)` : '';}
  window.LapinousClock={now,valid};
  window.LapinousMealBonuses={value,arm,describe};
})();
