import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const window={},context=vm.createContext({window,crypto:globalThis.crypto,TextEncoder,TextDecoder,btoa,atob});
for(const module of ['save-files','save-validation','save-safety'])vm.runInContext(fs.readFileSync('assets/js/'+module+'.js','utf8'),context);
const api=window.LapinousSaveFiles;
const legacy={species:'azur',rabbitName:'Az 🐇 日本語',carrots:123456789,eggs:500,inventory:{market_apple:9999999,ancienne_potion:13},progress:{azur:{food:70,energy:60,cleanliness:90,currentLevel:38,friendshipTotal:970,attackFragments:42,attackLevels:[1,2]}},future:{neverLose:[1,'é']},savedAt:1795161600000};
const original=JSON.stringify(legacy),encoded=await api.encode(legacy),packet=JSON.parse(encoded);
assert.equal(packet.format,'warrenfall-save');assert.ok(!encoded.includes('market_apple'));assert.deepEqual(JSON.parse(JSON.stringify(await api.decode(encoded))),legacy);assert.equal(JSON.stringify(legacy),original);
assert.equal(JSON.stringify(await api.decode(original)),original,'Old JSON must remain readable with large legitimate balances and old items');
window.LapinousSaveValidation.validate(await api.decode(encoded));
for(const change of [p=>p.payload=p.payload.replace(/^./,p.payload[0]==='e'?'f':'e'),p=>{const data=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.payload),c=>c.charCodeAt(0))));data.carrots+=100000;data.inventory.market_apple+=1000;p.payload=btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(data))));},p=>p.carrots=999999,p=>p.version=2,p=>p.encoding='other']){
 const bad=JSON.parse(encoded);change(bad);await assert.rejects(api.decode(JSON.stringify(bad)));assert.equal(JSON.stringify(legacy),original);
}
// Loss of crypto support must not remove the ability to export a plain backup.
const fallback={window:{}};vm.runInNewContext(fs.readFileSync('assets/js/save-files.js','utf8'),fallback);
assert.equal(await fallback.window.LapinousSaveFiles.encode(legacy),original);await assert.rejects(fallback.window.LapinousSaveFiles.decode(encoded));
// Execute the actual import event: a bad checksum never replaces the current game.
const source=fs.readFileSync('assets/js/script.js','utf8'),handlers={};let reader,applies=0;
Object.assign(context,{game:{species:'azur',carrots:17},lastSavedRaw:'unchanged',document:{getElementById:id=>({addEventListener:(name,fn)=>handlers[id+':'+name]=fn}),querySelector:()=>({})},FileReader:class{constructor(){reader=this;}readAsText(file){this.result=file.text;}},applyLoadedGame:data=>{window.LapinousSaveValidation.validate(data);context.game=data;applies++;},showToast(){},bootstrap:{Modal:{getOrCreateInstance:()=>({hide(){}})}}});
const start=source.indexOf('        document.getElementById("exportBtn").addEventListener');const end=source.indexOf('        // DOSSIER DE SAUVEGARDES RÉEL',start);
vm.runInContext(source.slice(start,end),context);
const tampered=JSON.parse(encoded);tampered.checksum='0'.repeat(64);
handlers['importInput:change']({target:{files:[{text:JSON.stringify(tampered)}],value:'file'}});await reader.onload();assert.equal(context.game.carrots,17);assert.equal(applies,0);
handlers['importInput:change']({target:{files:[{text:encoded}],value:'file'}});await reader.onload();assert.equal(context.game.carrots,legacy.carrots);assert.equal(applies,1);
handlers['importInput:change']({target:{files:[{text:original}],value:'file'}});await reader.onload();assert.equal(context.game.inventory.ancienne_potion,13);assert.equal(applies,2);
handlers['importInput:change']({target:{files:[{text:encoded}],value:'file'}});context.lastSavedRaw='new activity';await reader.onload();assert.equal(applies,2,'Do not overwrite activity saved while reading a file');
// Pending rewards are checked from the catalogue; no arbitrary cap on wealth.
const species={azur:{rarity:'commun'},rare:{rarity:'rare'}};
const reward=window.LapinousSaveValidation.duplicateReward;
assert.equal(reward({ownedSpecies:['azur']},{speciesKey:'azur',carrotReward:5},species),5);
assert.equal(reward({ownedSpecies:['rare']},{speciesKey:'rare'},species),10);
assert.throws(()=>reward({ownedSpecies:['azur']},{speciesKey:'azur',carrotReward:1000000},species));
assert.throws(()=>reward({ownedSpecies:[]},{speciesKey:'azur',carrotReward:5},species));
// Execute the real payout and failed-save rollback.
context.game={species:'azur',carrots:40,ownedSpecies:['azur'],pendingDuplicate:{speciesKey:'azur',carrotReward:1000000},progress:{azur:{attackFragments:3,attackLevels:[0]}}};
Object.assign(context,{getSpecies:()=>species,ensureTechniqueProgress:key=>context.game.progress[key],isTechniqueUnlocked:()=>true,autoSave:()=>true,refreshCurrentZone(){}});
vm.runInContext(source.slice(source.indexOf('        window.resolveDuplicate ='),source.indexOf('        const zones =')),context);
const forged=JSON.stringify(context.game);window.resolveDuplicate('carrots');assert.equal(JSON.stringify(context.game),forged);
context.game.pendingDuplicate.carrotReward=5;const valid=JSON.stringify(context.game);context.autoSave=()=>false;window.resolveDuplicate('carrots');assert.equal(JSON.stringify(context.game),valid);
context.autoSave=()=>true;window.resolveDuplicate('carrots');assert.equal(context.game.carrots,45);window.resolveDuplicate('carrots');assert.equal(context.game.carrots,45);
// A failed encoder or file write must leave an existing manual backup intact.
let disk='original manual backup',opened=0,aborted=0,failDisk=false,encodedCalls=0;
const file={createWritable:async()=>{opened++;let pending;return {write:async text=>{if(failDisk)throw Error('disk full');pending=text;},close:async()=>{disk=pending;},abort:async()=>{aborted++;}};}};
window.confirm=()=>true;window.LapinousLocalFiles={permission:async()=>true};
Object.assign(context,{savesDirHandle:{getFileHandle:async()=>file},document:{getElementById:()=>({value:'manual'})},serializeGame:()=>JSON.stringify(context.game),renderFolderSaves(){}});
const folderStart=source.indexOf('        async function saveToFolder(');
vm.runInContext(source.slice(folderStart,source.indexOf('        document.getElementById("saveToFolderBtn")',folderStart)),context);
window.LapinousSaveFiles={...api,encode:async()=>{encodedCalls++;throw Error('encoder unavailable');}};
await vm.runInContext('saveToFolder("manual.json")',context);assert.equal(encodedCalls,1);assert.equal(opened,0);assert.equal(disk,'original manual backup');
window.LapinousSaveFiles=api;failDisk=true;await vm.runInContext('saveToFolder("manual.json")',context);assert.equal(aborted,1);assert.equal(disk,'original manual backup');
failDisk=false;await vm.runInContext('saveToFolder("manual.json")',context);assert.equal((await api.decode(disk)).carrots,45);
console.log('Save files: portable UTF-8 envelope, changed carrots/items rejected before import, legacy/large balances preserved, crypto fallback, canonical pending rewards and rollback OK');
