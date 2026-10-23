import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8'));
const window={};const context=vm.createContext({window,console,Date,fetch:async()=>({ok:true,json:async()=>structuredClone(data)}),document:{documentElement:{classList:{contains:()=>false}}}});
vm.runInContext(fs.readFileSync('assets/js/apothecary-effects.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/js/shop.js','utf8'),context);
await window.LapinousShopReady;
const api=window.LapinousRemedies,shop=window.LapinousShop;
const items=data.items.filter(i=>i.category==='apothecary');
assert.equal(items.length,13);assert.equal(new Set(items.map(i=>i.visualNumber)).size,13);
for(const item of items){
 assert.ok(!item.name.includes('?'));assert.ok(!item.description.includes('?'));
 assert.ok(fs.existsSync(item.image)||fs.readFileSync('assets/js/image-manifest.js','utf8').includes(JSON.stringify(item.image)), 'Image absente du disque et du manifeste: '+item.id);
 const p={food:10,energy:10,cleanliness:10,currentLevel:4,friendshipTotal:80};
 const game={carrots:3000,inventory:{[item.id]:1,unknown:7}};
 shop.useConsumable(game,p,item);
 assert.equal(game.inventory[item.id],0);assert.equal(game.inventory.unknown,7);
 if(item.remedyEffect?.type==='level'){assert.equal(p.friendshipTotal,100);assert.equal(p.currentLevel,4);}
 else if(item.remedyEffect)assert.ok(p.remedyEffects[item.remedyEffect.type]);
 else assert.equal(p[item.stat],10+item.restoreAmount);
}
let p={};api.arm(p,{type:'sleep',value:.5});p=JSON.parse(JSON.stringify(p));assert.equal(api.take(p,'sleep'),.5);assert.equal(api.take(p,'sleep'),0);
p={};api.arm(p,{type:'trainingSavings',value:.2,uses:3});for(let i=0;i<3;i++)assert.equal(api.training(p,10).cost,8);assert.equal(api.training(p,10).cost,10);
p={};api.arm(p,{type:'trainingSaving',value:.5});api.arm(p,{type:'trainingSavings',value:.2,uses:3});assert.equal(api.training(p,10).cost,5);assert.equal(p.remedyEffects.trainingSavings.uses,3);assert.equal(api.training(p,10).cost,8);
api.arm(p,{type:'trainingExperience',value:.5});assert.equal(api.training(p,10).experience,1.5);assert.equal(api.training(p,10).experience,1);
p={};api.arm(p,{type:'cleanProtection',value:.5,durationMs:600000},1000);assert.equal(api.cleanCost(p,8,1001),4);assert.equal(api.cleanCost(p,8,1002),4);assert.equal(api.cleanCost(p,8,601000),8);
p={};api.arm(p,{type:'interaction',value:5});assert.throws(()=>api.arm(p,{type:'interaction',value:5}));assert.equal(api.take(p,'interaction'),5);assert.equal(api.take(p,'interaction'),0);
p={currentLevel:100,friendshipTotal:2500,energy:100};const level=items.find(i=>i.remedyEffect?.type==='level'),game={inventory:{[level.id]:1}};assert.throws(()=>shop.useConsumable(game,p,level));assert.equal(game.inventory[level.id],1);
console.log('13 soins : catalogue, consommation unique, sauvegarde des bonus, sommeil, trois entraînements, priorité sans cumul, expérience, expiration, amitié et niveau maximum OK.');
