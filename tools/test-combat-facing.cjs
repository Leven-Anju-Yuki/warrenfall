const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('assets/js/script.js','utf8');
const begin=source.indexOf('function combatSpriteStyle('),end=source.indexOf('function rabbitFightPreviewHtml',begin);
const style=vm.runInNewContext('('+source.slice(begin,end).trim()+')');
const content=JSON.parse(fs.readFileSync('lapinous-content.json','utf8'));
for(const [key,rabbit] of Object.entries(content.species)){
 assert.ok(['left','right'].includes(rabbit.combatFacing),key+' missing native facing');
 assert.match(style(rabbit,'rabbit',key),rabbit.combatFacing==='left'?/scale:-1 1/:/scale:1 1/);
}
for(const key of ['vampireRabbit','cauchemar','easterKing','sandman'])assert.equal(content.species[key].combatFacing,'left');
for(const key of ['azur','myco','nopal'])assert.equal(content.species[key].combatFacing,'right');
assert.match(style(content.opponents.debut_radis,'boss'),/scale:-1 1/);
assert.match(style({combatFacing:'right'},'boss'),/--combat-facing:-1/);
console.log('39 explicit sprite orientations OK; existing right-facing rabbits unchanged.');
