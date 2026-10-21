import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/js/script.js','utf8');
const code=source.slice(source.indexOf('        let eventBannerTimer;'),source.indexOf('        updateSeasonalDecor();'));
const stored=new Map();let ready=false,timer,button;
function setup(){
 const banner={style:{display:'none'},innerHTML:'',setAttribute(){},append(b){button=b;},querySelectorAll:()=>[]};
 const context={Date,Set,JSON,sessionStorage:{getItem:k=>stored.get(k),setItem:(k,v)=>stored.set(k,v)},body:{classList:{toggle(){},contains:k=>k==='game-running'}},currentActiveEvents:()=>['halloween'],document:{getElementById:id=>id==='eventBanner'?banner:{get hidden(){return ready;}},querySelector:()=>null,createElement:()=>({setAttribute(){}})},setTimeout:(fn,ms)=>{assert.equal(ms,7000);timer=fn;return 1;},clearTimeout(){},SEASON_ICONS:{halloween:'🎃'},SEASON_BANNER_TEXT:{halloween:'Halloween'},EVENT_LABELS:{},playSeasonSound(){}};
 vm.createContext(context);vm.runInContext(code,context);return {context,banner};
}
const first=setup();first.context.updateSeasonalDecor();assert.equal(first.banner.style.display,'none');assert.equal(stored.size,0);
ready=true;first.context.updateSeasonalDecor();assert.equal(first.banner.style.display,'flex');assert.equal(typeof button.onclick,'function');
timer();assert.equal(first.banner.style.display,'none');
first.context.updateSeasonalDecor();assert.equal(first.banner.style.display,'none');
const reload=setup();reload.context.updateSeasonalDecor();assert.equal(reload.banner.style.display,'none');
stored.clear();const manual=setup();manual.context.updateSeasonalDecor();button.onclick();assert.equal(manual.banner.style.display,'none');
console.log('Bandeau saisonnier : attend le chargement, fermeture en 7 secondes ou par bouton, pas de réapparition dans la session OK.');
