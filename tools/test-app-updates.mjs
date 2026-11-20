import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const events={},nodes=[],messages=[];let saves=0,reloads=0,saveOK=false;
function node(tag){const children={};return {tag,hidden:false,open:false,textContent:'',setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},querySelector:k=>children[k]||(children[k]=node('child'))};}
const workerEvents={},worker={state:'installing',addEventListener:(k,fn)=>workerEvents[k]=fn};
const waiting={postMessage:m=>messages.push(m)};
const reg={waiting:null,installing:worker,addEventListener(){},update:async()=>{}};
const document={hidden:false,body:{classList:{contains:()=>true},append:(...n)=>nodes.push(...n)},createElement:node,addEventListener:(k,fn)=>events[k]=fn};
const window={LapinousPrepareUpdate:()=>{saves++;return saveOK;}};
const navigator={onLine:true,serviceWorker:{controller:{},ready:Promise.resolve(reg),getRegistration:async()=>reg,addEventListener:(k,fn)=>events[k]=fn}};
vm.runInNewContext(fs.readFileSync('assets/js/app-updates.js','utf8'),{window,document,navigator,location:{reload:()=>reloads++},addEventListener:(k,fn)=>events[k]=fn});
await Promise.resolve();await Promise.resolve();
const [notice,panel]=nodes;assert.equal(notice.hidden,true);reg.waiting=waiting;worker.state='installed';workerEvents.statechange();await Promise.resolve();assert.equal(notice.hidden,false);notice.onclick();assert.equal(panel.open,true);
panel.querySelector('[data-later-update]').onclick();assert.equal(panel.open,false);assert.equal(messages.length,0);
const apply=panel.querySelector('[data-apply-update]');apply.onclick();assert.equal(saves,1);assert.equal(messages.length,0);events.controllerchange();assert.equal(reloads,0);
saveOK=true;apply.onclick();assert.equal(messages.length,1);assert.equal(messages[0].type,'ACTIVATE_UPDATE');assert.equal(reloads,0);events.controllerchange();assert.equal(reloads,1);apply.onclick();assert.equal(messages.length,1);
assert.ok(panel.innerHTML.includes('az_travaux.png'));assert.ok(panel.innerHTML.includes('data-later-update'));
console.log('PWA update: visible notice, later option, refusal when save fails, activation only after save, and one voluntary reload OK');
