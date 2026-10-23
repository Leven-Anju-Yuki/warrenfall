import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const script=path.resolve('tools/backup-transferred-images.mjs');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'warrenfall-backup-test-'));
const root=path.join(temp,'project'),backup=path.join(temp,'permanent');
const relative='assets/img/plants/nested/original.png';
const source=path.join(root,relative),destination=path.join(backup,relative);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function prepare(bytes,status='verified'){
  await fs.mkdir(path.dirname(source),{recursive:true});
  await fs.mkdir(path.join(root,'.cloudinary-local'),{recursive:true});
  await fs.mkdir(backup,{recursive:true});
  await fs.writeFile(source,bytes);
  await fs.writeFile(path.join(root,'.cloudinary-local/inventory.json'),JSON.stringify({selected:[{path:relative,sourceExists:true}]}));
  await fs.writeFile(path.join(root,'.cloudinary-local/manifest.json'),JSON.stringify({assets:{[relative]:{hash:hash(bytes),status}}}));
}
function run(){return spawnSync(process.execPath,[script],{cwd:root,env:{...process.env,LAPINOUS_IMAGE_BACKUP_DIR:backup},encoding:'utf8'});}
try{
  await prepare('first original','pending');
  assert.notEqual(run().status,0);
  assert.equal(await fs.readFile(source,'utf8'),'first original');
  await assert.rejects(fs.access(destination));
  await prepare('first original');
  assert.equal(run().status,0);
  assert.equal(await fs.readFile(destination,'utf8'),'first original');
  await assert.rejects(fs.access(source));
  await prepare('second original');
  assert.equal(run().status,0);
  const firstArchive=path.join(backup,'.versions',relative,hash('first original')+'.png');
  assert.equal(await fs.readFile(firstArchive,'utf8'),'first original');
  assert.equal(await fs.readFile(destination,'utf8'),'second original');
  const secondArchive=path.join(backup,'.versions',relative,hash('second original')+'.png');
  await fs.writeFile(secondArchive,'corrupt fixture');
  await prepare('third original');
  assert.notEqual(run().status,0);
  assert.equal(await fs.readFile(destination,'utf8'),'second original');
  assert.equal(await fs.readFile(firstArchive,'utf8'),'first original');
  assert.equal(await fs.readFile(source,'utf8'),'third original');
  console.log('Sauvegarde permanente : transfert confirmé obligatoire, arborescence, copie exacte, anciennes versions conservées et archive corrompue bloquante OK.');
}finally{
  const resolved=path.resolve(temp);
  if(path.dirname(resolved)!==path.resolve(os.tmpdir())||!path.basename(resolved).startsWith('warrenfall-backup-test-'))throw Error('Nettoyage temporaire hors périmètre');
  await fs.rm(resolved,{recursive:true,force:true});
}
