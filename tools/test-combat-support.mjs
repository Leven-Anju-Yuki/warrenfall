import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const window={};vm.runInNewContext(fs.readFileSync('assets/js/boss-abilities.js','utf8'),{window});
const api=window.LapinousBossAbilities;
const stats=b=>({power:b.power,maxHp:400});
const fresh=()=>({key:'boss',boss:{power:40},bossHp:30,bossMaxHp:100,team:[{key:'a',hp:100,power:70,sp:{},pr:{food:70,energy:80,cleanliness:90,friendshipTotal:123,future:'keep'}},{key:'b',hp:100,power:50,sp:{},pr:{food:2,energy:3,cleanliness:4}}]});
for(let candidate=1;candidate<200;candidate+=7){const f=fresh();const result=api.callAlly(f,{boss:f.boss,ally:{power:candidate}},stats,()=>.5);assert.ok(result.ally);assert.ok(f.bossPower+f.ally.power<=120);assert.equal(api.callAlly(f,{ally:{power:200}},stats),null);}
const weak=fresh();weak.team.forEach(r=>r.power=10);assert.ok(api.callAlly(weak,{ally:{power:100}},stats).unavailable);assert.equal(weak.ally,undefined);
for(const blocked of [true,false]){const f=fresh();f.team[0].sp.blocksBossCall=true;f.team[0].hp=blocked?100:0;const result=api.callAlly(f,{ally:{power:20}},stats);assert.equal(!!result.blocked,blocked);}
const healthy=fresh();healthy.bossHp=80;assert.equal(api.callAlly(healthy,{ally:{power:100}},stats),null);assert.equal(healthy.callAttempted,undefined);
const f=fresh();api.callAlly(f,{ally:{power:100}},stats);f.team[1].hp=0;api.allyDamage(f,f.team[0]);assert.ok(f.bossPower+f.ally.power<=70);f.ally.hp=0;assert.equal(api.allyDamage(f,f.team[0]),0);
for(const save of [()=>false,()=>{throw Error('quota');}]){const fight=fresh(),before=JSON.stringify(fight);assert.throws(()=>api.flee(fight,save));assert.equal(JSON.stringify(fight),before);}
const fled=fresh();assert.equal(api.flee(fled,()=>true),true);assert.equal(fled.finished,true);assert.deepEqual([fled.team[0].pr.food,fled.team[0].pr.energy,fled.team[0].pr.cleanliness],[62,68,85]);assert.deepEqual([fled.team[1].pr.food,fled.team[1].pr.energy,fled.team[1].pr.cleanliness],[0,0,0]);assert.equal(fled.team[0].pr.friendshipTotal,123);assert.equal(fled.team[0].pr.future,'keep');assert.throws(()=>api.flee(fled,()=>true));
const locked=fresh();locked.locked=true;assert.throws(()=>api.flee(locked,()=>true));
const protectedFight=fresh();protectedFight.team[0].pr.remedyEffects={cleanProtection:{value:.5,uses:1}};const before=JSON.stringify(protectedFight);
assert.throws(()=>api.flee(protectedFight,()=>false,p=>{delete p.remedyEffects.cleanProtection;return 2;}));assert.equal(JSON.stringify(protectedFight),before);
console.log('Boss support: one call, health threshold, living blockers, combined power cap, KO cap, flight costs and save rollback OK');
// Exercise the actual HTML functions: helper-only tests do not catch template errors.
const source=fs.readFileSync('assets/js/script.js','utf8'),area={innerHTML:''};
const renderFight=fresh();Object.assign(renderFight,{active:0,turn:1,bossCharge:0,speed:1});
for(const r of renderFight.team)Object.assign(r,{maxHp:100,charge:0,pr:{...r.pr,attackLevels:[0]},sp:{name:r.key,rarity:'commun'}});
api.callAlly(renderFight,{ally:{name:'Compagnon <test>',power:100}},stats);
const context=vm.createContext({window,gameArea:area,tacticalFight:renderFight,raritySkillCount:()=>1,isTechniqueUnlocked:()=>true,techniqueFor:()=>({name:'Test'}),rabbitDisplayName:r=>r.key,combatSpriteStyle:()=>'',combatEscape:x=>String(x??'').replaceAll('<','&lt;').replaceAll('>','&gt;'),combatStatusHtml:()=>'',bossIntentHtml:()=>'',updateCombatShieldBars(){},queueAutoFight(){},bossCombatStats:stats,criticalConfig:()=>({multiplier:2,chargePerTurn:20}),powerName:()=>'',powerMode:()=>'',nextLivingIndex:()=>0});
vm.runInContext(source.slice(source.indexOf('        function bossFightPreviewHtml('),source.indexOf('        function nextLivingIndex(')),context);
assert.ok(vm.runInContext('bossFightPreviewHtml({power:40},"boss")',context).includes('fight-preview-stats'));
vm.runInContext(source.slice(source.indexOf('        function renderTacticalFight('),source.indexOf('        window.tacticalFightMode =')),context);
vm.runInContext('renderTacticalFight("test")',context);
assert.ok(area.innerHTML.includes('combat-ally'));assert.ok(area.innerHTML.includes('fleeTacticalFight()'));assert.ok(area.innerHTML.includes('Compagnon &lt;test&gt;'));
console.log('Actual boss preview and battle renderer: ally portrait/status, escaped name and flee command OK');
