/* Règles sans état : ordre des événements et affinités de combat. */
(() => {
  const eventKeys = sp => (Array.isArray(sp?.event) ? sp.event : String(sp?.event || '').split(',')).map(x => x.trim()).filter(Boolean);
  const eventActive = (sp, active) => eventKeys(sp).some(key => active.includes(key));
  function eventFirst(entries, active) {
    return entries.slice().sort((a,b) => Number(eventActive(b[1],active))-Number(eventActive(a[1],active)));
  }
  function affinity(keys, species) {
    const unique = [...new Set(keys)].filter(key => species[key]).slice(0,3);
    const bonuses = Object.fromEntries(unique.map(key => [key,0]));
    const pairs = [];
    for(let i=0;i<unique.length;i++) for(let j=i+1;j<unique.length;j++) {
      const a=unique[i],b=unique[j],sa=species[a],sb=species[b];
      const rival=(sa.rivals||[]).includes(b)||(sb.rivals||[]).includes(a);
      const friend=(sa.friends||[]).includes(b)||(sb.friends||[]).includes(a);
      const value=rival?-5:friend?5:0;
      if(!value)continue;
      bonuses[a]+=value;bonuses[b]+=value;
      pairs.push({a,b,value});
    }
    for(const key of unique) bonuses[key]=Math.max(species[key].noMalus?0:-10,Math.min(10,bonuses[key]));
    return {bonuses,pairs};
  }
  const victory = enemy => enemy.kind==='vegetable'
    ? {carrots:enemy.rewardCarrots===5?5:4,friendship:3,loot:false,bossAchievement:false}
    : {carrots:window.LapinousEconomy.combatReward(enemy.difficulty),friendship:3,loot:true,bossAchievement:true};
  window.LapinousTeamRules={eventActive,eventFirst,affinity,victory};
})();
