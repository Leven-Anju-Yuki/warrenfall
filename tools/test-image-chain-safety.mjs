import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import assert from 'node:assert/strict';
const code=fs.readFileSync('tools/update-images.mjs','utf8').replace(/^import .*;\r?\n/gm,'').replace('await update();','this.finished=update();');
for(const fail of [false,true]){
 const executions=[];const written=new Map();
 const data={assets:{}};
 const fakeFs={mkdirSync(){},writeFileSync:(file,value)=>written.set(file,value),renameSync:(from,to)=>written.set(to,written.get(from)),readFileSync:file=>JSON.stringify(file.includes('inventory')?{selected:[]}:data)};
 const context={fs:fakeFs,path,spawn:(exe,args)=>{
  executions.push(args[0]);const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();
  queueMicrotask(()=>{if(fail)child.stderr.emit('data',Buffer.from('SSL/certificat : CERT_HAS_EXPIRED'));child.emit('exit',fail?1:0);});return child;
 },process:{argv:[],execPath:'fake-node',exitCode:0,stdout:{write(){}}},console:{log(){},error(){}},setTimeout,clearTimeout,Date,readImageMap(){return {};},writeImageMap(){}};
 vm.runInNewContext(code,context);await context.finished;
 const report=JSON.parse(written.get('.cloudinary-local/nightly-report.json'));
 assert.equal(report.status,fail?'failed':'success');
 if(fail){assert.deepEqual(executions,['tools/cloudinary-sync.mjs']);assert.match(report.error,/CERT_HAS_EXPIRED/);assert.equal(context.process.exitCode,1);}
 else assert.ok(executions.includes('tools/cloudinary-corbeille.mjs'));
}
console.log('Chaîne images simulée : succès, diagnostic SSL conservé, arrêt avant activation/corbeille après échec OK. Aucun fichier/service réel.');
