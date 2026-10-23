/* Bonus individuels sérialisables : aucun minuteur en mémoire ni changement de lapin. */
(function(root){
 const state=p=>p.remedyEffects||(p.remedyEffects={});
 function arm(p,effect,now=Date.now()){
  const s=state(p),old=s[effect.type];
  if(old&&(!old.expiresAt||old.expiresAt>now))throw Error('Ce soin est déjà préparé pour ce lapin.');
  if(effect.type==='level'){
   if(p.currentLevel>=100)throw Error('Ce lapin est déjà au niveau maximum.');
   p.friendshipTotal=Math.max(p.friendshipTotal||0,p.currentLevel*25);
   return;
  }
  s[effect.type]={value:effect.value,uses:effect.uses||1,...(effect.durationMs?{expiresAt:now+effect.durationMs}:{})};
 }
 function take(p,type,now=Date.now()){
  const s=state(p),e=s[type];if(!e)return 0;
  if(e.expiresAt&&e.expiresAt<=now){delete s[type];return 0;}
  const value=e.value;
  if(!e.expiresAt&&--e.uses<=0)delete s[type];
  return value;
 }
 function training(p,baseCost){
  // Deux réductions ne se consomment pas ensemble : la plus forte en premier.
  const s=state(p),single=s.trainingSaving?.value||0,multi=s.trainingSavings?.value||0;
  const reduction=single>=multi?take(p,'trainingSaving'):take(p,'trainingSavings');
  return {cost:Math.max(0,Math.ceil(baseCost*(1-reduction))),experience:1+take(p,'trainingExperience')};
 }
 root.LapinousRemedies={arm,take,training,cleanCost:(p,n,now)=>n*(1-take(p,'cleanProtection',now))};
})(typeof window==='undefined'?globalThis:window);
