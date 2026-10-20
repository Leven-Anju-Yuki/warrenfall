import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {deletionSuspended} from './cloudinary-deletion-policy.mjs';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'warrenfall-hold-')),file=path.join(folder,'policy.json');
assert.equal(await deletionSuspended(file),true);
for(const [text,expected] of [['bad',true],['{}',true],['{"suspended":true}',true],['{"suspended":"false"}',true],['{"suspended":false}',false]]){
 await fs.writeFile(file,text);assert.equal(await deletionSuspended(file),expected);
}
assert.equal(await deletionSuspended('tools/cloudinary-deletion-policy.json'),false);
console.log('Suppression après délai autorisée ; politique absente, illisible ou ambiguë = bloquée. Aucun appel distant.');
