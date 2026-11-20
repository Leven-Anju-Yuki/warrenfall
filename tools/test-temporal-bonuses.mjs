import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
let wall=Date.UTC(2026,10,20,12),mono=0;const anchor=wall,listeners={};
class Clock extends Date{constructor(...args){super(...(args.length?args:[wall]));}static now(){return wall;}}
const window={},context=vm.createContext({window,Date:Clock,performance:{now:()=>mono},document:{hidden:false,addEventListener:(k,fn)=>{const previous=listeners[k];listeners[k]=()=>{previous?.();fn();};}}});
vm.runInContext(fs.readFileSync('assets/js/temporal-bonuses.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/js/achievements.js','utf8'),context);
const shop=fs.readFileSync('assets/js/shop.js','utf8');vm.runInContext(shop.slice(shop.indexOf('    function useConsumable('),shop.indexOf('    window.LapinousShopReady'))+'\nwindow.consumeAndSave=consumeAndSave;',context);
const bonus=window.LapinousMealBonuses,ach=window.LapinousAchievements;
const item={id:'meal',kind:'restore',stat:'food',restoreAmount:70,bonus:{type:'combat',value:.1,durationMs:1800000}};
const progress={food:100,energy:80,cleanliness:90,future:{keep:true}},game={species:'azur',carrots:10,inventory:{meal:3},ownedSpecies:['azur'],progress:{azur:progress}};
const original=JSON.stringify(game);assert.throws(()=>window.consumeAndSave(game,progress,item,()=>false));assert.equal(JSON.stringify(game),original);
window.consumeAndSave(game,progress,item,()=>true);assert.equal(game.inventory.meal,2);assert.equal(bonus.value(progress,'combat'),.1);assert.equal(progress.food,100);assert.equal(progress.future.keep,true);
window.consumeAndSave(game,progress,item,()=>true);assert.equal(bonus.value(progress,'combat'),.1,'Same bonus replaces rather than stacks');
wall+=5*3600000;mono+=1000;assert.equal(window.LapinousClock.valid(),false);assert.equal(bonus.value(progress,'combat'),.1);
const unchanged=JSON.stringify(game);assert.throws(()=>window.consumeAndSave(game,progress,item,()=>true));assert.equal(JSON.stringify(game),unchanged);
assert.equal(ach.claim(game,'visit',ach.dayKey(new Clock())),0);assert.equal(JSON.stringify(game),unchanged,'Clock rejection must not rewrite daily history');
wall=anchor+1000;
const beforeClaim=JSON.stringify(game);assert.throws(()=>ach.claimAndSave(game,'visit',ach.dayKey(new Clock()),()=>false));assert.equal(JSON.stringify(game),beforeClaim);
assert.equal(ach.claimAndSave(game,'visit',ach.dayKey(new Clock()),()=>true),3);assert.equal(ach.claimAndSave(game,'visit',ach.dayKey(new Clock()),()=>true),0);
const past=new Date(anchor-86400000);assert.equal(ach.dailyAllowed(game,past),false);
mono=1800001;wall=anchor+mono;assert.equal(bonus.value(progress,'combat'),0);wall=anchor;mono=0;assert.equal(bonus.value(progress,'combat'),0,'An observed expiration cannot revive');
const legacy={mealBonuses:{combat:{value:.1,expiresAt:anchor+60000}},future:'preserve'};assert.equal(bonus.value(legacy,'combat'),.1);assert.equal(legacy.future,'preserve');
wall=anchor+86400000;listeners.visibilitychange();assert.equal(window.LapinousClock.valid(),true,'Ordinary overnight resume stays available');
const content=JSON.parse(fs.readFileSync('lapinous-content.json','utf8')),catalog=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8'));
vm.runInContext(fs.readFileSync('assets/js/exploration.js','utf8'),context);
const config=content.exploration,z=config.zones[0],d=config.durations[0],api=window.LapinousExploration;
const normal=api.rates(z,d,'azur',5),boosted=api.rates(z,d,'azur',5,.1);assert.equal(boosted.rare,normal.rare+10);assert.equal(Object.values({a:boosted.ingredient,b:boosted.care,c:boosted.rare,d:boosted.egg}).reduce((a,b)=>a+b),100);
const trip=api.plan(config,catalog.items,'azur',5,z.id,d.hours,anchor,()=>.9,.1);assert.equal(trip.endsAt-trip.startedAt,d.hours*3600000);assert.equal(trip.loot.reduce((n,x)=>n+x.quantity,0),d.rolls);
for(const recipe of catalog.recipes){assert.ok(recipe.bonus);assert.ok(recipe.bonus.value<=.15);assert.equal(recipe.bonus.durationMs,1800000);}
// Two adjacent calendar days remain legitimate even with only seconds between them.
wall=new Date('2026-11-20T23:59:59').getTime();listeners.visibilitychange();
const midnight={carrots:0,ownedSpecies:['azur'],progress:{}};
assert.equal(ach.claimAndSave(midnight,'visit',ach.dayKey(new Clock()),()=>true),3);
wall+=2000;mono+=2000;
assert.equal(ach.claimAndSave(midnight,'visit',ach.dayKey(new Clock()),()=>true),3);
assert.equal(midnight.carrots,6);
const originalTZ=process.env.TZ;
try{
  const zoned={carrots:0,progress:{},ownedSpecies:['azur'],achievements:{days:{},claimed:{},peaks:{},earnedCarrots:0,dailyTimeZone:'UTC'}};
  wall=anchor;listeners.visibilitychange();
  const day=ach.dayKey(new Clock(),'UTC');
  assert.equal(ach.claimAndSave(zoned,'visit',day,()=>true),3);
  for(const zone of ['Pacific/Kiritimati','Pacific/Honolulu','Europe/Paris']){process.env.TZ=zone;assert.equal(ach.claimAndSave(zoned,'visit',day,()=>true),0);assert.equal(ach.list(zoned).today[0].day,day);}
  assert.equal(Object.keys(zoned.achievements.days).length,1);
}finally{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;}
// Run the real kitchen handlers, including a refused save while cooking.
const source=fs.readFileSync('assets/js/script.js','utf8');
window.LapinousVisibility={allowed:()=>true};window.LapinousShop={getCatalog:()=>catalog,consumeAndSave:window.consumeAndSave};
vm.runInContext(fs.readFileSync('assets/js/pantry.js','utf8'),context);
let saveOK=false;Object.assign(context,{game,progress:()=>progress,autoSave:()=>saveOK,showToast(){},refreshCurrentZone(){},updateStatusBars(){},explorationUnavailable:()=>false,document:{getElementById:()=>null}});
vm.runInContext(source.slice(source.indexOf('        window.eatKitchenItem ='),source.indexOf('        function speciesFaceImg()')),context);
const recipe=catalog.recipes[0];game.inventory={};for(const [id,n] of Object.entries(recipe.ingredients))game.inventory[id]=n;
const beforeCook=JSON.stringify(game);assert.equal(window.cookMeal(recipe.id),false);assert.equal(JSON.stringify(game),beforeCook);
saveOK=true;assert.equal(window.cookMeal(recipe.id),true);assert.equal(game.inventory[recipe.item],1);
const beforeEat=JSON.stringify(game);saveOK=false;window.eatKitchenItem(recipe.item);assert.equal(JSON.stringify(game),beforeEat);
console.log('Daily claims and meals: monotonic clock, rejected jumps, backward day, unique rewards, failed save rollback, legacy buffs, offline resume and travel probabilities OK');
