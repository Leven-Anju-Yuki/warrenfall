import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const scope = 'https://example.test/lapinous/';
const manifest = JSON.parse(await fs.readFile('manifest.json', 'utf8'));
assert.equal(manifest.name, 'Warrenfall : Les Chroniques de Garenne');
assert.equal(manifest.short_name, 'Warrenfall');
assert.equal(manifest.id, './');
assert.equal(manifest.orientation, 'landscape');
assert.equal(manifest.scope, './');
for (const icon of manifest.icons) {
  const bytes = await fs.readFile(icon.src.split('?')[0]);
  const size = Number(icon.sizes.split('x')[0]);
  assert.equal(bytes.readUInt32BE(16), size);
  assert.equal(bytes.readUInt32BE(20), size);
}
const handlers = {}, stores = new Map([['portfolio', new Map()], ['lapinous-/autre/-shell-v0', new Map()], ['lapinous-/lapinous/-shell-v0', new Map()]]);
let offline = false, writes = 0;
const keyOf = key => typeof key === 'string' ? key : key.url;
async function network(request) {
  if (offline) throw Error('offline');
  const url = new URL(keyOf(request));
  if (url.hostname === 'res.cloudinary.com') return new Response('image');
  const relative = decodeURIComponent(url.pathname.replace('/lapinous/', ''));
  return new Response(await fs.readFile(relative || 'index.html'));
}
const caches = {
  keys: async () => [...stores.keys()],
  delete: async key => stores.delete(key),
  open: async name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      match: async key => store.get(keyOf(key))?.clone(),
      put: async (key, value) => { writes++; store.set(keyOf(key), value.clone()); },
      addAll: async keys => { for (const key of keys) store.set(key, await network(key)); },
      keys: async () => [...store.keys()],
      delete: async key => store.delete(keyOf(key))
    };
  }
};
vm.runInNewContext(await fs.readFile('sw.js','utf8'), {
  self: {registration:{scope},location:{origin:new URL(scope).origin},clients:{claim:async()=>{}},addEventListener:(name,handler)=>handlers[name]=handler},
  URL,caches,fetch:network,Set,Promise,Error
});
async function lifecycle(name) { let done; handlers[name]({waitUntil:promise=>done=promise}); await done; }
await lifecycle('install');
await lifecycle('activate');
assert(stores.has('portfolio'));
assert(stores.has('lapinous-/autre/-shell-v0'));
assert(!stores.has('lapinous-/lapinous/-shell-v0'));
async function request(relative, extra={}) {
  let done;
  handlers.fetch({request:{url:new URL(relative,scope).href,method:'GET',destination:'script',...extra},respondWith:promise=>done=promise});
  return done ? await done : undefined;
}
assert.equal(await request('.env'),undefined);
assert.equal(await request('Lapinous_Sauvegardes/partie.json'),undefined);
assert.equal(await request('dashboard.html'),undefined);
offline = true;
assert((await (await request('index.html',{mode:'navigate',destination:'document'})).text()).includes('gameRoot'));
assert((await (await request('assets/js/installer.js?v=phone-install-104')).text()).includes('orientationGate'));
offline = false;
for(let i=0;i<123;i++) await request('https://res.cloudinary.com/demo/image/upload/'+i+'.png',{destination:'image'});
const images=[...stores.entries()].find(([name])=>name.endsWith('images-v1'))[1];
assert.equal(images.size,120);
console.log('PWA : manifeste, icônes, installation du cache, isolation, exclusions, repli hors ligne et limite des images OK. Écritures en mémoire uniquement :',writes);
