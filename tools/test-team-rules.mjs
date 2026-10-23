import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context={window:{},console};
vm.createContext(context);
vm.runInContext(fs.readFileSync('assets/js/game-economy.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/js/team-rules.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/js/apothecary-effects.js','utf8'),context);
const rules=context.window.LapinousTeamRules;
const content=JSON.parse(fs.readFileSync('lapinous-content.json','utf8'));
const sp=content.species;
assert.equal(rules.affinity(['azur','bambou'],sp).bonuses.azur,5);
assert.equal(rules.affinity(['azur','flamme'],sp).bonuses.azur,-5);
assert.equal(rules.affinity(['azur','bambou','flamme'],sp).bonuses.azur,0);
assert.equal(rules.affinity(['azur','azur','bambou'],sp).pairs.length,1);
assert.equal(rules.affinity(['azur'],sp).pairs.length,0);
assert.equal(rules.affinity(['az','flamme'],{...sp,az:{noMalus:true,rivals:['flamme']}}).bonuses.az,0);
for(const [key,s]of Object.entries(sp))for(const type of ['friends','rivals'])for(const id of s[type]||[]){assert.ok(sp[id],`${key} -> ${id} absent`);assert.notEqual(id,key);}
const entries=Object.entries(sp),copy=entries.map(x=>x[0]);
const sorted=rules.eventFirst(entries,['halloween']);
assert.ok(rules.eventActive(sorted[0][1],['halloween']));
assert.deepEqual(entries.map(x=>x[0]),copy);
assert.deepEqual(rules.eventFirst(entries,[]).map(x=>x[0]),copy);
assert.ok(rules.eventActive({event:['paques','noel']},['noel']));
const script=fs.readFileSync('assets/js/script.js','utf8');
const stats=script.slice(script.indexOf('        function bossCombatStats('),script.indexOf('        function fightPowerComparisonHtml('));
vm.runInContext(stats,context);
for(const enemy of Object.values(content.opponents)){
 assert.equal(enemy.kind,'vegetable');assert.ok(enemy.combatPower<11);assert.ok(enemy.maxHp<=70);
 const reward=rules.victory(enemy);assert.ok([4,5].includes(reward.carrots));assert.equal(reward.loot,false);assert.equal(reward.bossAchievement,false);
 const values=context.bossCombatStats(enemy);assert.equal(values.power,enemy.combatPower);assert.ok(Number.isFinite(values.attackBase));
 // A level-1 rabbit (90 HP, 11 power) can win with its first skill, even at worst enemy damage.
 let hp=90,foe=values.maxHp;
 while(hp>0&&foe>0){foe-=Math.round(11*1.35);if(foe>0)hp-=Math.round(values.attackBase+values.attackSpread);}
 assert.ok(hp>0);
}
assert.equal(rules.victory(content.bosses.courgette).loot,true);
// Actual reward integration: no loot, boss achievement or duplicate payout for small opponents.
const finish=script.slice(script.indexOf('        function finishTacticalFight('),script.indexOf('        // ---- Boutique à œufs'));
const game={carrots:0,species:'azur'};let loot=0,bossWins=0,friendship=0;
vm.runInContext(script.slice(script.indexOf('        function combatEscape('),script.indexOf('        // Update existing nodes')),context);
Object.assign(context,{rabbitDisplayName:r=>r.sp.name,game,autoFightTimer:null,tacticalFight:{key:'debut_radis',boss:content.opponents.debut_radis,team:[{key:'azur',sp:content.species.azur,pr:{food:80,energy:80,cleanliness:80}}]},clearTimeout(){},awardBattleLoot(){loot++;},recordAchievement(){bossWins++;},gainFriendship:n=>friendship+=n,playSfx(){},showToast(){},updateStatusBars(){},autoSave(){},gameArea:{innerHTML:''}});
vm.runInContext(finish+'finishTacticalFight(true);finishTacticalFight(true);',context);
assert.ok(context.gameArea.innerHTML.includes('battle-result-replay'));assert.ok(context.gameArea.innerHTML.includes("prepareFight('debut_radis')"));assert.equal(game.carrots,4);assert.equal(friendship,3);assert.equal(loot,0);assert.equal(bossWins,0);
console.log('Affinités, ordre événementiel, petits ennemis gagnables au niveau 1, récompenses exclusives et absence de double gain : OK.');
