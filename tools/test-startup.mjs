import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/js/startup.js','utf8');
async function scenario({reload=false,fail=false,storage=new Map()}={}){
 const nodes=Object.fromEntries(['startupScreen','startupArtwork','startupIntro','startupProgress','startupPercent','startupStatus'].map(id=>[id,{hidden:false,classList:{remove(){nodes.loadingVisible=true;}},setAttribute(){},contains(){return false;},after(button){nodes.retry=button;}}]));
 const delays=[];let blocked=fail;
 const context={document:{getElementById:id=>nodes[id],images:[],querySelectorAll:()=>[],createElement:()=>({remove(){}}),fonts:{ready:Promise.resolve()}},window:{dispatchEvent(){},addEventListener(){}},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},performance:{getEntriesByType:()=>[{type:reload?'reload':'navigate'}]},Image:class{set src(value){queueMicrotask(()=>blocked&&value.includes('Zone_')?this.onerror():this.onload());}},Event:class{},setTimeout:(fn,ms)=>{delays.push(ms);return ms===12000?0:setTimeout(fn,0);},clearTimeout};
 vm.runInNewContext(source,context);await context.window.LapinousStartupReady;assert.equal(nodes.loadingVisible,true);
 let done=false;const finished=context.window.LapinousStartupFinish().then(()=>done=true);
 if(fail){for(let i=0;i<20&&!nodes.retry;i++)await new Promise(r=>setTimeout(r,1));assert.ok(nodes.retry);assert.equal(nodes.startupScreen.hidden,false);assert.equal(done,false);blocked=false;nodes.retry.onclick();}
 await finished;assert.equal(nodes.startupScreen.hidden,true);assert.equal(nodes.startupProgress.value,100);return delays;
}
const storage=new Map();assert.ok((await scenario({storage})).includes(8000));assert.ok(!(await scenario({storage})).includes(8000));assert.ok(!(await scenario({reload:true})).includes(8000));await scenario({fail:true,reload:true});
console.log('Chargement : introduction une fois, aucun GIF au rechargement, blocage en cas de ressource absente et reprise réussie OK.');
