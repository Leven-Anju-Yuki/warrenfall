import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const content=JSON.parse(fs.readFileSync('lapinous-content.json','utf8'));
const baseShop=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8'));
for(const hostname of ['leven-anju-yuki.github.io','localhost','127.0.0.1','[::1]']){
  const local=hostname!=='leven-anju-yuki.github.io';
  const edited=structuredClone(baseShop);edited.items[0].price=1;
  const store=new Map([
    ['lapinous_egg_rates',JSON.stringify({commun:0,divin:100})],
    ['lapinous_event_windows',JSON.stringify({halloween:365})],
    ['lapinous_shop_catalog',JSON.stringify(edited)],
    ['lapinous_autosave',JSON.stringify({species:'azur',carrots:123,inventory:{legacy_custom_item:3}})],
  ]);
  const before=JSON.stringify([...store]);let writes=0;
  const document={createElement:()=>({}),head:{append(){},appendChild(){}},documentElement:{classList:{contains:()=>true}}};
  const window={dispatchEvent(){},addEventListener(){},location:{hostname}};
  const context=vm.createContext({document,window,location:{hostname},Event:class{},console,
    localStorage:{getItem:k=>store.get(k)??null,setItem(){writes++;},removeItem(){writes++;}},
    fetch:async url=>({ok:true,json:async()=>structuredClone(String(url).includes('shop')?baseShop:content)}),
  });
  vm.runInContext(fs.readFileSync('assets/js/species-data.js','utf8'),context);
  await window.LapinousContentReady;
  assert.equal(context.loadEggRates().divin,local?100:content.eggRates.divin);
  assert.equal(context.loadEventWindows().halloween,local?365:(content.eventWindows?.halloween??10));
  vm.runInContext(fs.readFileSync('assets/js/shop.js','utf8'),context);
  await window.LapinousShopReady;
  assert.equal(window.LapinousShop.getCatalog().items[0].price,local?1:baseShop.items[0].price,'A forged CSS Admin class must not enable draft prices');
  assert.equal(writes,0,'Reading catalogs must not rewrite saves or drafts');
  assert.equal(JSON.stringify([...store]),before,'Old inventory and local drafts are retained verbatim');
}
console.log('Public prices, egg rates and event windows isolated from drafts; localhost/IPv4/IPv6 editors and stored progression preserved');
