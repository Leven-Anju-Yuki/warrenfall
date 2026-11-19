import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/js/script.js','utf8');
let allowed=true,inKitchen=true,shown=0,mounted=0;
const dialog={open:false,setAttribute(){},showModal(){this.open=true;shown++;}};
let exists=false;
const catalog=JSON.parse(fs.readFileSync('lapinous-shop.json','utf8'));
const window={LapinousVisibility:{allowed:()=>allowed},LapinousShop:{getCatalog:()=>catalog},LapinousPantry:{mount(){mounted++;}}};
const game={species:'azur',inventory:{},currentZone:'default'};
const context=vm.createContext({window,game,document:{getElementById:()=>exists?dialog:null,createElement:()=>dialog,body:{appendChild(){exists=true;}}},
  body:{classList:{contains:()=>inKitchen}},kitchenHtml:()=>window.LapinousPantry.html(catalog,game.inventory,'Test',100),progress:()=>({food:100}),eatKitchenItem(){},cookMeal(){}});
// Utiliser le vrai rendu : une doublure HTML cachait la régression « meals ».
vm.runInContext(fs.readFileSync('assets/js/pantry.js','utf8'),context);
window.LapinousPantry.mount=()=>mounted++;
const original=JSON.stringify({catalog,game});
vm.runInContext(source.slice(source.indexOf('        window.openKitchenFridge ='),source.indexOf('        window.eatKitchenItem =')),context);
window.openKitchenFridge();assert.equal(shown,1);assert.equal(mounted,1,'Empty inventory and full food must not block the fridge');
window.openKitchenFridge();assert.equal(shown,1,'An already open dialog must not be opened twice');
allowed=false;window.openKitchenFridge();assert.equal(mounted,2,'Admin feature restrictions stay enforced');
allowed=true;inKitchen=false;window.openKitchenFridge();assert.equal(mounted,2);
assert.ok(source.includes('class="fridge-hotspot" onclick="openKitchenFridge()"'),'The fridge in the scenery stays interactive');
assert.ok(!source.includes('class="action-btn kitchen-fridge-button"'),'No duplicate button next to the fruit');
assert.ok(dialog.innerHTML.includes('pantry-ready-shelves'));
for(const recipe of catalog.recipes) assert.ok(dialog.innerHTML.includes(`data-pantry-use="${recipe.item}"`),'Unowned prepared dishes stay visible');
for(const recipesEnabled of [true,false]){
  const variant={...catalog,recipesEnabled};
  assert.doesNotThrow(()=>window.LapinousPantry.html(variant,{},'Test',100));
}
assert.doesNotThrow(()=>window.LapinousPantry.html(null,{},'Test',0));
assert.equal(JSON.stringify({catalog,game}),original,'Rendering must not consume inventory or change the catalog');
console.log('Fridge: real HTML renderer, recipes, empty stock, full food, no duplicate button and data preservation OK');
