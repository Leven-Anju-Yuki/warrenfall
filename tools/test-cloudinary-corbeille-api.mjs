import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const source=fs.readFileSync('tools/cloudinary-corbeille.mjs','utf8').replace(/^import .*;\r?\n/gm,'');
const hash=crypto.createHash('sha256').update('exact-backup').digest('hex');
const id='lapinous/old/avec espace';
const item={path:'assets/img/old.png',hash,url:'https://example.invalid/old.png'};
for(const scenario of ['success','delete-refused','pending','no-backup','simulation']) {
 const calls=[],files=new Map();
 files.set('inventory.json',{date:new Date().toISOString(),selected:[{path:'assets/img/active.png',hash}],excluded:[],missing:[]});
 files.set('manifest.json',{assets:{'assets/img/active.png':{status:'verified',public_id:'lapinous/active',url:'https://example.invalid/active.png',hash}}});
 files.set('versions-connues.json',{assets:{[id]:item}});
 const since=new Date(Date.now()-(scenario==='pending'?2:8)*86400000).toISOString();
 files.set('quarantaine.json',{items:{[id]:{...item,since,type:'logical'}}});
 const writes=new Map();
 const fakeFs={readFile:async file=>{
  const name=path.basename(file);
  if(files.has(name))return JSON.stringify(files.get(name));
  if(name==='.env')return 'CLOUDINARY_CLOUD_NAME=test\nCLOUDINARY_API_KEY=fake\nCLOUDINARY_API_SECRET=fake\nLAPINOUS_CLOUDINARY_DELETE_ENABLED=true';
  if(file.includes('backup')&&scenario!=='no-backup')return Buffer.from('exact-backup');
  const e=new Error('missing');e.code='ENOENT';throw e;
 },readdir:async()=>[],mkdir:async()=>{},writeFile:async(f,v)=>writes.set(f,v),rename:async(a,b)=>writes.set(b,writes.get(a))};
 const proc={cwd:()=>'/project',argv:['node','script',scenario==='simulation'?'simulation':'appliquer'],env:{LAPINOUS_IMAGE_BACKUP_DIR:'/backup'}};
 const context={fs:fakeFs,path,crypto,process:proc,Date,Buffer,URLSearchParams,AbortSignal,structuredClone,console:{log(){}},deletionSuspended:async()=>false,fetch:async(url,options)=>{
  calls.push({url,...options});
  if(options.method==='GET')return {ok:true,json:async()=>({public_id:id,secure_url:item.url,resource_type:'image',type:'upload'})};
  assert.ok(url.endsWith('/resources/image/upload'));
  assert.equal(options.body.get('public_ids[]'),id);
  assert.equal([...options.body.keys()].includes('prefix'),false);
  return {ok:true,json:async()=>({deleted:{[id]:scenario==='delete-refused'?'not_found':'deleted'}})};
 }};
 await vm.runInNewContext('(async()=>{'+source+'})()',context);
 const report=JSON.parse(writes.get(path.join('/project','.cloudinary-local','corbeille-report.json')));
 if(scenario==='success'){assert.equal(report.deleted.length,1);assert.equal(calls.length,2);assert.equal(JSON.parse(writes.get(path.join('/project','.cloudinary-local','quarantaine.json'))).items[id],undefined);}
 else if(scenario==='delete-refused'){assert.equal(report.errors.length,1);assert.equal(JSON.parse(writes.get(path.join('/project','.cloudinary-local','quarantaine.json'))).items[id].since,since);}
 else {assert.equal(calls.length,0);assert.equal(report.deleted.length,0);}
}
console.log('Corbeille simulée : endpoint, ID exact, confirmation, délai, sauvegarde et absence de réseau en simulation OK.');
