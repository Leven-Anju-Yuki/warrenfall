import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/js/script.js','utf8');
let allowed=true,inKitchen=true,shown=0,mounted=0;
const dialog={open:false,setAttribute(){},showModal(){this.open=true;shown++;}};
let exists=false;
const catalog={items:[],companions:{chef:{}}};
const window={LapinousVisibility:{allowed:()=>allowed},LapinousShop:{getCatalog:()=>catalog},LapinousPantry:{mount(){mounted++;}}};
const game={species:'azur',inventory:{},currentZone:'default'};
const context=vm.createContext({window,game,document:{getElementById:()=>exists?dialog:null,createElement:()=>dialog,body:{appendChild(){exists=true;}}},
  body:{classList:{contains:()=>inKitchen}},kitchenHtml:()=>'<section>Provisions</section>',progress:()=>({food:100}),eatKitchenItem(){},cookMeal(){}});
vm.runInContext(source.slice(source.indexOf('        window.openKitchenFridge ='),source.indexOf('        window.eatKitchenItem =')),context);
window.openKitchenFridge();assert.equal(shown,1);assert.equal(mounted,1,'Empty inventory and full food must not block the fridge');
window.openKitchenFridge();assert.equal(shown,1,'An already open dialog must not be opened twice');
allowed=false;window.openKitchenFridge();assert.equal(mounted,2,'Admin feature restrictions stay enforced');
allowed=true;inKitchen=false;window.openKitchenFridge();assert.equal(mounted,2);
assert.ok(source.includes('class="action-btn kitchen-fridge-button" onclick="openKitchenFridge()"'),'Visible backup access is present');
console.log('Fridge: visible access, empty stock, full food, repeated opening, kitchen and feature restrictions OK');
