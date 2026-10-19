(() => {
  const rooms=['cuisine','chambre','sdb','jardin'];
  function sharedUpgrades(game) {
    game.roomUpgrades ||= {};
    game.roomBoosts ||= {};
    for(const room of rooms) game.roomUpgrades[room]=Math.min(5,Math.max(Number(game.roomUpgrades[room])||0,...Object.values(game.progress||{}).map(p=>Number(p.improvements?.[room])||0)));
    for(const stat of ['food','energy','cleanliness','friendship']) game.roomBoosts[stat]=Math.max(Number(game.roomBoosts[stat])||0,...Object.values(game.progress||{}).map(p=>Number(p.boosts?.[stat])||0));
    for(const p of Object.values(game.progress||{})){p.improvements=game.roomUpgrades;p.boosts=game.roomBoosts;}
    return game.roomUpgrades;
  }
  function mini(game,key,level=0) {
    const reward=Number(level)>=3?3:2;
    game.carrots=(Number(game.carrots)||0)+reward;
    return reward;
  }
  function loot(game,items,random=Math.random){
    const pool=items.filter(item=>item.category==='market'&&item.kind==='restore'&&item.stat==='food');
    if(!pool.length||random()>=.35)return null;
    const item=pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
    game.inventory ||= {};game.inventory[item.id]=(Number(game.inventory[item.id])||0)+1;
    return item;
  }
  window.LapinousEconomy={sharedUpgrades,mini,loot,combatReward:difficulty=>Math.max(6,Math.round((Number(difficulty)||20)*.45))};
})();
