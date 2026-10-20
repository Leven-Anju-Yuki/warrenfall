import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('tools/cloudinary-sync.mjs','utf8');
const start=source.indexOf('async function sync('),end=source.indexOf('  // Enregistre chaque version',start);
const saved=[];let calls=0;
const previous={assets:Object.fromEntries(['png','gif','svg'].map(ext=>[ext,{path:'pilot.'+ext,status:'verified'}]))};
const context={path:{join:(...x)=>x.join('/'),posix:{basename:x=>x}},root:'.',stateDir:'.',
 fs:{readFile:async file=>file.endsWith('manifest.json')?JSON.stringify(previous):Buffer.from('image')},Buffer,Blob,FormData,
 quota:async()=>{},verify:async()=>true,stamp:()=>new Date().toISOString(),save:async(_,value)=>saved.push(structuredClone(value)),
 api:async(_,route,options)=>{calls++;if(options.body.get('public_id')==='bad')throw Error('refus fictif');return {secure_url:'https://example.invalid/good'};},
 console:{log(){}},setTimeout:fn=>{fn();}};
vm.createContext(context);vm.runInContext(source.slice(start,end)+'} this.run=sync;',context);
await assert.rejects(context.run({selected:[{path:'bad.png',public_id:'bad',hash:'a'},{path:'good.png',public_id:'good',hash:'b'}]}, {},false),/activation et quarantaine suspendues/);
assert.equal(calls,4);assert.equal(saved.at(-1).assets['good.png'].status,'verified');assert.equal(saved.at(-1).assets['bad.png'].status,'failed');
console.log('Transferts partiels : échec conservé, image suivante vérifiée, activation et quarantaine bloquées. Aucun réseau.');

calls=0;saved.length=0;
await assert.rejects(context.run({selected:[{path:'huge.gif',public_id:'huge',hash:'h',bytes:42157845},{path:'good.png',public_id:'good',hash:'b',bytes:20}]},{},false),/Images refusées/);
assert.equal(calls,1);assert.match(saved.at(-1).assets['huge.gif'].error,/42157845/);
console.log('GIF trop volumineux refusé localement sans upload, original intact, autres transferts conservés.');
