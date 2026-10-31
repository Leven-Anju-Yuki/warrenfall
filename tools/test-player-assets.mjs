// Vérifie les liens de code après nettoyage, sans ouvrir ni modifier une partie.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd();
for(const file of (await fs.readdir(root)).filter(name=>name.endsWith('.html'))){
  const html=await fs.readFile(file,'utf8');
  for(const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)){
    const relative=match[1].split('?')[0];
    if(/^(?:https?:|\/\/|data:)/.test(relative))continue;
    await assert.doesNotReject(fs.access(path.resolve(root,relative)),`${file} references missing code: ${relative}`);
  }
}
console.log('All local script and stylesheet links in HTML entry points exist: OK');
