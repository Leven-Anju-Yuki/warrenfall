import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/js/script.js','utf8');
const start=source.indexOf('        function gainFriendship(amount)');
const end=source.indexOf('\n        // ===',start);
let bonus=0,checks=0;
const progress={friendshipTotal:0,friendship:0};
const ctx=vm.createContext({game:{species:'azur'},progress:()=>progress,mealBonus:()=>bonus,checkLevelUp:()=>checks++});
vm.runInContext(source.slice(start,end),ctx);
for(const [amount,meal,expected]of [[3,0,1],[8,0,4],[6,0,3],[10,.5,7]]){
  bonus=meal;const before=progress.friendshipTotal;
  assert.equal(vm.runInContext(`gainFriendship(${amount})`,ctx),expected);
  assert.equal(progress.friendshipTotal-before,expected);
}
assert.equal(checks,4);
const window={};vm.runInNewContext(fs.readFileSync('assets/js/save-validation.js','utf8'),{window});
assert.doesNotThrow(()=>window.LapinousSaveValidation.validate({species:'azur',pendingEgg:{speciesKey:'caramel',trait:'aucun'}}));
assert.throws(()=>window.LapinousSaveValidation.validate({species:'azur',pendingEgg:{speciesKey:'caramel'}}));
console.log('Actual friendship gain, meal bonus, pending egg validation: OK');
