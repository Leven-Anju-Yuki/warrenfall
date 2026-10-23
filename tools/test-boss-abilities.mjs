import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const window={};vm.runInNewContext(fs.readFileSync('assets/js/boss-abilities.js','utf8'),{window});
const api=window.LapinousBossAbilities,content=JSON.parse(fs.readFileSync('lapinous-content.json','utf8'));
const fixture=key=>({key,boss:structuredClone(content.bosses[key]),bossHp:700,bossMaxHp:1000,bossCharge:80,team:[0,1,2].map(i=>({key:'rabbit'+i,hp:200,maxHp:200,guard:0,pr:{food:50,energy:50,cleanliness:50}}))});
const original=JSON.stringify(content);
const kinds=new Set();
for(const [key,boss]of Object.entries(content.bosses)){
 const profile=api.get(boss,key);assert(profile?.description&&profile.tip&&profile.icon);kinds.add(profile.kind);
 assert.equal(api.get({...boss,combatAbility:undefined},key).kind,profile.kind,'Older local boss retains its identity');
 const f=fixture(key);assert.equal(api.intent(f,20).ready,true);assert.equal(api.intent({...f,bossCharge:0},20).turns,5);
 assert(api.cast(f,f.team[0],100));assert(f.team.every(r=>r.hp>=0&&r.hp<=r.maxHp));
 assert(f.team.every(r=>r.pr.food===50&&r.pr.energy===50&&r.pr.cleanliness===50),'No saved needs modified');
}
assert.equal(kinds.size,11);assert.equal(JSON.stringify(content),original);
assert.equal(api.get({kind:'vegetable',combatAbility:'roots'},'carotte'),null);assert.equal(api.get({},'custom'),null);
{
 const f=fixture('carotte');f.team[2].hp=0;api.cast(f,f.team[0],100);
 for(const r of f.team.slice(0,2)){assert.equal(api.playerDamage(f,r,100),75);assert.equal(api.playerDamage(f,r,100),100);}
 assert(!f.team[2].bossEffects?.roots);
}
{
 const f=fixture('oignon');api.cast(f,f.team[0],100);const r=f.team[0];
 assert.equal(api.playerDamage(f,r,100),80);assert.equal(api.playerDamage(f,r,100),80);assert.equal(api.playerDamage(f,r,100),100);
 assert(api.rabbitLabels(f.team[1]).some(s=>s.includes('2')));
}
{
 const f=fixture('choux');api.cast(f,f.team[0],100);
 assert.equal(api.playerDamage(f,f.team[0],100),55);assert.equal(api.playerDamage(f,f.team[0],100),55);assert.equal(api.playerDamage(f,f.team[0],100),100);
 assert.equal(api.bossLabels(f).length,0);
}
{
 const f=fixture('piment');f.team[1].guard=.5;f.team[2].hp=0;const cast=api.cast(f,f.team[0],100);
 assert.equal(f.team[0].hp,200,'Main target not hit twice');assert.equal(f.team[1].hp,182);assert.equal(f.team[1].guard,0);
 assert.equal(f.team[2].hp,0,'No resurrection or hit on KO target');assert.equal(cast.extra.length,1);
}
{
 const f=fixture('banane');api.cast(f,f.team[0],100);
 assert.equal(api.bossDamage(f,f.team[0],100),125);assert.equal(api.bossDamage(f,f.team[0],100),125);assert.equal(api.bossDamage(f,f.team[0],100),100);
 assert.equal(api.playerDamage(f,f.team[0],100),120);assert.equal(api.playerDamage(f,f.team[0],100),120);assert.equal(api.playerDamage(f,f.team[0],100),100);
}
{
 const f=fixture('courgette');api.cast(f,f.team[0],100);
 assert.equal(api.bossDamage(f,f.team[1],100),100);assert.equal(api.bossDamage(f,f.team[0],100),125);assert.equal(api.bossDamage(f,f.team[0],100),125);assert.equal(api.bossDamage(f,f.team[0],100),100);
}
{
 const f=fixture('tomate');api.cast(f,f.team[0],100);assert.equal(api.afterBoss(f).length,0,'No immediate poison tick');
 assert.equal(api.playerDamage(f,f.team[0],100),85);assert.equal(api.playerDamage(f,f.team[0],100),100);
 assert.equal(api.afterBoss(f)[0].damage,8);assert.equal(api.afterBoss(f)[0].damage,8);assert.equal(api.afterBoss(f).length,0);assert.equal(f.team[0].hp,184);
 const ko=fixture('tomate');api.cast(ko,ko.team[0],100);ko.team[0].hp=0;api.afterBoss(ko);assert.equal(ko.team[0].hp,0);
}
{
 const f=fixture('ail');api.cast(f,f.team[0],100);assert.equal(api.playerDamage(f,f.team[0],100),80);assert.equal(api.bossDamage(f,f.team[0],100),120);
}
{
 const f=fixture('mais');api.cast(f,f.team[0],100);f.team[0].guard=.8;
 assert.equal(api.bossDamage(f,f.team[0],100),81,'Only half the shield is bypassed');assert.equal(api.bossDamage(f,f.team[0],100),100,'Prepared strike consumed once');
}
{
 const f=fixture('aubergine');api.cast(f,f.team[0],100);assert.equal(api.bossDamage(f,f.team[0],100),160);assert.equal(api.bossDamage(f,f.team[0],100),100);
}
{
 const f=fixture('patate');api.cast(f,f.team[0],100);assert.equal(f.team[1].hp,175);assert.equal(api.playerDamage(f,f.team[1],100),80);assert.equal(api.playerDamage(f,f.team[1],100),100);
}
{
 const f=fixture('choux'),r=f.team[0];r.guard=.55;
 assert.deepEqual(JSON.parse(JSON.stringify(api.shieldInfo(f,r))),{reduction:.55,hits:1});
 api.bossDamage(f,r,100);assert.equal(api.shieldInfo(f,r).hits,0);
 api.cast(f,r,100);assert.equal(Math.round(api.shieldInfo(f).reduction*100),45);assert.equal(api.shieldInfo(f).hits,2);
 api.playerDamage(f,r,100);assert.equal(api.shieldInfo(f).hits,1);
 api.playerDamage(f,r,100);assert.equal(api.shieldInfo(f).hits,0);
 r.guard=.55;r.hp=0;assert.equal(api.shieldInfo(f,r).reduction,0);
 f.bossGuard=.4;assert.equal(Math.round(api.shieldInfo(f).reduction*100),40);
}
console.log('Boss et barres de bouclier : protections, consommation et durées OK.');
