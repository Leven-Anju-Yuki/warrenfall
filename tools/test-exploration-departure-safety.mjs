import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('assets/js/exploration.js','utf8'),context);
const api=context.window.LapinousExploration;
const config=JSON.parse(fs.readFileSync('lapinous-content.json','utf8')).exploration;
const items=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8')).items;
const now=Date.UTC(2026,10,19,12);
const fresh=()=>({species:'myco',ownedSpecies:['myco'],progress:{myco:{currentLevel:15,energy:100,friendshipTotal:123}},inventory:{market_apple:7},eggs:3,future:{keep:true}});
const prepare=()=>api.plan(config,items,'myco',15,'forest',1,now,()=>.9);
for(const alter of [
  p=>p.energy=0,
  p=>p.loot[0].quantity+=100,
  p=>p.endsAt=now+1,
  p=>p.level=100,
  p=>p.zone='desert',
  p=>p.claimed=true,
]){
  const game=fresh(),before=JSON.stringify(game),p=prepare();alter(p);
  let saves=0;
  assert.throws(()=>api.depart(game,'myco',p,()=>{saves++;return true;},now));
  assert.equal(saves,0);assert.equal(JSON.stringify(game),before,'Reject before changing any player data');
}
const unissued=JSON.parse(JSON.stringify(prepare()));
assert.throws(()=>api.depart(fresh(),'myco',unissued,()=>true,now));
const expired=fresh();assert.throws(()=>api.depart(expired,'myco',prepare(),()=>true,now+60001));
const changedLevel=fresh();changedLevel.progress.myco.currentLevel=1;
assert.throws(()=>api.depart(changedLevel,'myco',prepare(),()=>true,now));
assert.equal(changedLevel.progress.myco.energy,100);
const game=fresh(),p=prepare(),before=JSON.stringify(game);
assert.throws(()=>api.depart(game,'myco',p,()=>false,now));
assert.equal(JSON.stringify(game),before,'Failed save must roll back and keep the preparation retryable');
api.depart(game,'myco',p,()=>true,now);
const active=JSON.stringify(game.exploration.trips.myco);
p.loot[0].quantity=999999;p.endsAt=now;
assert.equal(JSON.stringify(game.exploration.trips.myco),active,'Preparation must not alias the saved journey');
api.claim(game,'myco',items,()=>true,now+api.HOUR);
const after=JSON.stringify(game);
assert.throws(()=>api.depart(game,'myco',p,()=>true,now));
assert.equal(JSON.stringify(game),after,'A consumed preparation cannot be replayed');
// An old saved journey has no in-memory receipt: collecting it must still work.
const legacy=fresh();const oldTrip=JSON.parse(active);
legacy.exploration={future:'retain',trips:{myco:oldTrip}};
const original=JSON.stringify(legacy);
assert.throws(()=>api.claim(legacy,'myco',items,()=>false,now+api.HOUR));
assert.equal(JSON.stringify(legacy),original);
api.claim(legacy,'myco',items,()=>true,now+api.HOUR);
assert.equal(legacy.exploration.future,'retain');assert.equal(legacy.future.keep,true);
assert.equal(legacy.progress.myco.friendshipTotal,123);
assert.throws(()=>api.claim(legacy,'myco',items,()=>true,now+api.HOUR));
console.log('Explorations: forged/replayed departures blocked, independent stored trip, rollback and old journeys preserved');
