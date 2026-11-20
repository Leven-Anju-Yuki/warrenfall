import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const config=JSON.parse(fs.readFileSync('lapinous-content.json','utf8')).exploration;
const items=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8')).items;
const start=Date.UTC(2026,10,19,12);
function boot(){
  let wall=start,mono=0;const listeners={};
  class Clock extends Date {static now(){return wall;}}
  const context={window:{getExplorationConfig:()=>config},Date:Clock,performance:{now:()=>mono},document:{hidden:false,addEventListener:(event,fn)=>listeners[event]=fn}};
  vm.runInNewContext(fs.readFileSync('assets/js/exploration.js','utf8'),context);
  return {api:context.window.LapinousExploration,context,listeners,time:(w,m)=>{wall=w;mono=m;}};
}
const {api}=boot();
const fresh=()=>({ownedSpecies:['myco'],progress:{myco:{currentLevel:15,energy:100}},inventory:{market_apple:7},eggs:3,future:{keep:true}});
const prepare=()=>api.plan(config,items,'myco',15,'forest',1,start,()=>.9);
const saved=()=>{const g=fresh();api.depart(g,'myco',prepare(),()=>true,start);return JSON.parse(JSON.stringify(g));};
// Every current zone, duration and category must still be collectible on reload.
for(const zone of config.zones)for(const duration of config.durations)for(const draw of [0,.04,.15,.9]){
  const g=fresh();g.progress.myco.currentLevel=100;
  const p=api.plan(config,items,'myco',100,zone.id,duration.hours,start,()=>draw);
  api.depart(g,'myco',p,()=>true,start);
  const copy=JSON.parse(JSON.stringify(g));
  api.claim(copy,'myco',items,()=>true,p.endsAt);
  assert.equal(copy.exploration.trips.myco.claimed,true);
}
for(const alter of [
  t=>t.loot[0].quantity=999999,
  t=>t.loot.push({...t.loot[0],quantity:2}),
  t=>t.loot[0].id='not-a-catalog-item',
  t=>{t.loot=[{id:'egg',rarity:'ingredient',quantity:2}];},
  t=>{t.loot=[{id:config.zones.find(z=>z.id==='desert').ingredients.find(id=>!config.zones[0].ingredients.includes(id))||'foreign',quantity:2}];},
  t=>t.hours=12,t=>t.energy=0,t=>t.level=0,t=>t.zone='unknown',t=>t.endsAt=t.startedAt+1000,
]){
  const g=saved();alter(g.exploration.trips.myco);const before=JSON.stringify(g);let saves=0;
  assert.throws(()=>api.claim(g,'myco',items,()=>{saves++;return true;},start+api.HOUR));
  assert.equal(JSON.stringify(g),before);assert.equal(saves,0);
}
const unowned=saved();unowned.ownedSpecies=[];
assert.throws(()=>api.claim(unowned,'myco',items,()=>true,start+api.HOUR));
// Old optional fields and old future extension fields are retained as-is.
const legacy=saved(),t=legacy.exploration.trips.myco;
for(const key of ['hours','energy','level','rates'])delete t[key];
for(const entry of t.loot)delete entry.rarity;
t.future='retain';
api.claim(legacy,'myco',items,()=>true,start+30*api.HOUR);
assert.equal(legacy.exploration.trips.myco.future,'retain');assert.equal(legacy.future.keep,true);
const absent=saved(),raw=JSON.stringify(absent);
assert.throws(()=>api.claim(absent,'myco',items,()=>true,start+api.HOUR,null));assert.equal(JSON.stringify(absent),raw);
for(const jump of [5*api.HOUR,-5*api.HOUR]){
  const b=boot(),g=saved(),before=JSON.stringify(g);b.time(start+jump,1000);
  assert.throws(()=>b.api.claim(g,'myco',items,()=>true),/appareil/);
  assert.equal(JSON.stringify(g),before);
  const departure=fresh(),departureBefore=JSON.stringify(departure);
  const p=b.api.plan(config,items,'myco',15,'forest',1,start+jump,()=>.9);
  assert.throws(()=>b.api.depart(departure,'myco',p,()=>true),/appareil/);
  assert.equal(JSON.stringify(departure),departureBefore);
  b.time(start+api.HOUR,api.HOUR);
  b.api.claim(g,'myco',items,()=>true);assert.equal(g.exploration.trips.myco.claimed,true);
}
// A reopened session must accept a legitimate offline journey, even many days later.
const offline=boot(),old=saved();offline.time(start+48*api.HOUR,10);
offline.listeners.visibilitychange();offline.api.claim(old,'myco',items,()=>true);
assert.equal(old.exploration.trips.myco.claimed,true);
const reloaded=boot();reloaded.time(start+48*api.HOUR,48*api.HOUR);
const rolled=saved(),before=JSON.stringify(rolled);
assert.throws(()=>reloaded.api.claim(rolled,'myco',items,()=>false));assert.equal(JSON.stringify(rolled),before);
console.log('Imported loot: zone, rarity, totals, duplicate totals, dates and costs checked without data loss; clock jumps, corrected clock, offline resume and rollback OK');
