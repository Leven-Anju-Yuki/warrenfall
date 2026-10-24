import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const context={window:{}};vm.runInNewContext(fs.readFileSync('assets/js/pixel-coloring.js','utf8'),context);
const api=context.window.LapinousColoring;
// Le blanc du pelage reste à peindre ; la transparence n'est jamais une couleur.
const transparent=new Uint8ClampedArray(3*3*4);
transparent.set([255,255,255,255],4*4);
let background=api.rabbitBackground(transparent,3,3);
assert.equal(background.filter(Boolean).length,8);
assert.equal(background[4],0);
// Un blanc opaque intérieur, séparé du fond par le contour, reste présent.
const opaque=new Uint8ClampedArray(5*5*4).fill(255);
for(const i of [6,7,8,11,13,16,17,18])opaque.set([90,50,30,255],i*4);
background=api.rabbitBackground(opaque,5,5);
assert.equal(background.filter(Boolean).length,16);
assert.equal(background[12],0);
const migrated={colors:[[255,255,255],[90,50,30]],targets:[0,1,0],painted:[1,1,0],background:[1,0,1]};
const paintedBefore=JSON.stringify(migrated.painted);
assert.equal(api.progress(migrated).done,1);
assert.equal(api.progress(migrated).total,1);
assert.equal(api.paint(migrated,2,0),false);
assert.equal(JSON.stringify(migrated.painted),paintedBefore);
assert.equal(api.nextColor({...migrated,painted:[0,0,0]},0),1);
for(const count of [1,8,14,22]){
 const pixels=Array.from({length:160},(_,i)=>[i%256,(i*13)%256,(i*39)%256]);
 const original=JSON.stringify(pixels),result=api.quantize(pixels,count);
 assert.equal(result.targets.length,pixels.length);assert.ok(result.colors.length<=count);
 assert.ok(result.targets.every(i=>i>=0&&i<result.colors.length));assert.equal(JSON.stringify(pixels),original);
 assert.equal(JSON.stringify(api.quantize(pixels,count)),JSON.stringify(result));
}
const state={targets:[0,1,0],painted:[0,0,0]};
assert.equal(api.paint(state,0,1),false);assert.equal(api.paint(state,-1,0),false);
assert.equal(api.paint(state,0,0),true);assert.equal(api.paint(state,0,0),false);
const saved=JSON.parse(JSON.stringify(state));assert.equal(api.paint(saved,1,1),true);assert.deepEqual(state.painted,[1,0,0]);
assert.equal(JSON.stringify(api.allowedLevels({kind:'rabbit'})),'[0,1]');
assert.equal(JSON.stringify(api.allowedLevels({kind:'scene'})),'[1,2]');
assert.equal(api.imageLevel({kind:'rabbit'},1).size,96);
assert.equal(api.imageLevel({kind:'scene'},1).size,128);
assert.equal(api.imageLevel({kind:'scene'},2).size,192);
const sequence={colors:[[],[],[]],targets:[0,1,2],painted:[1,0,0]};
assert.equal(api.nextColor(sequence,0),1);sequence.painted[1]=1;assert.equal(api.nextColor(sequence,1),2);
sequence.painted[2]=1;assert.equal(api.nextColor(sequence,2),2);
console.log('Coloriage : palettes bornées, résultat déterministe, couleurs vérifiées et reprise indépendante OK.');
