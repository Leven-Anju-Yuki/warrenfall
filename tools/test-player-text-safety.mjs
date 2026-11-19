import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/js/script.js','utf8');
function declaration(name){
  const start=source.indexOf('        function '+name+'(');
  assert.ok(start>=0,name);
  const end=source.indexOf('\n        }',start);
  return source.slice(start,end+'\n        }'.length);
}
const rawName=`O'Lapin <b data-audit="name">& 日本語</b>`;
const game={species:'azur',ownedSpecies:['azur','bambou'],salonFavorites:['bambou'],speciesNames:{azur:rawName,bambou:rawName},inventory:{market_apple:7},carrots:123,eggs:4,progress:{azur:{currentLevel:8,friendshipTotal:192}},future:{keep:true}};
const before=JSON.stringify(game);
const species={azur:{name:'Azur',faceImg:'azur.png'},bambou:{name:'Bambou',faceImg:'bambou.png'}};
const context=vm.createContext({game,getSpecies:()=>species,currentRabbitName:()=>rawName,collectionCarouselIndex:1,currentActiveEvents:()=>[],window:{LapinousTeamRules:{eventFirst:entries=>entries}}});
vm.runInContext(source.split('\n').find(line=>line.includes('function combatEscape(')),context);
for(const name of ['collectionSwitcherHtml','salonOwnedRabbitsSceneHtml']){
  vm.runInContext(declaration(name),context);
  const html=context[name]();
  assert.ok(!html.includes('<b data-audit'),name+' must not interpret a saved name as HTML');
  assert.ok(html.includes('&lt;b data-audit=&quot;name&quot;&gt;'),name+' must preserve the full visible name');
  assert.ok(html.includes('&#39;Lapin'));
}
assert.equal(JSON.stringify(game),before,'Rendering must not change or encode saved player data');
vm.runInContext(fs.readFileSync('assets/js/save-validation.js','utf8'),context);
vm.runInContext(fs.readFileSync('assets/js/save-safety.js','utf8'),context);
const restored=context.window.LapinousSaveSafety.migrate(game,{},{});
assert.equal(restored.speciesNames.azur,rawName);
assert.equal(restored.inventory.market_apple,7);
assert.equal(restored.progress.azur.currentLevel,8);
assert.equal(restored.progress.azur.friendshipTotal,192);
assert.equal(restored.carrots,123);assert.equal(restored.eggs,4);assert.equal(restored.future.keep,true);
assert.equal(JSON.stringify(game),before,'Migration preserves the imported source');
console.log('Saved names: safe salon/carousel HTML, Unicode and quotes retained, raw save and progression unchanged');
