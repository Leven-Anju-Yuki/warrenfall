import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/js/species-data.js','utf8');
function context(hostname){
  const window={dispatchEvent(){}};
  const ctx=vm.createContext({window,location:{hostname},localStorage:{getItem:()=>null,setItem(){}},document:{createElement:()=>({textContent:''}),head:{appendChild(){}}},Event:class{}});
  vm.runInContext(source.slice(source.lastIndexOf('(() => {')),ctx);
  return {ctx,window,v:window.LapinousVisibility};
}
for(const hostname of ['localhost','example.com']){
  const {ctx,window,v}=context(hostname);
  v.setBase({quiz:'public'});
  assert.equal(v.allowed('quiz'),true);
  v.setBase({quiz:'public',games:'hidden'});
  for(const game of ['quiz','puzzles','memory','lapidoku','lapinoudoku'])assert.equal(v.allowed(game),false);
  v.setBase({quiz:'hidden'});
  assert.equal(v.allowed('quiz'),false,'Hidden must apply to local admins too');
  vm.runInContext(fs.readFileSync('assets/js/achievements.js','utf8'),ctx);
  const game={progress:{},ownedSpecies:[]};
  assert.equal(window.LapinousAchievements.list(game).today.some(row=>row.id==='quiz'),false);
  window.LapinousAchievements.record(game,'quizCompleted');
  assert.equal(window.LapinousAchievements.list(game).today.some(row=>row.id==='quiz'),true,'Earned rewards preserved');
  assert.equal(window.LapinousAchievements.claim(game,'quiz',window.LapinousAchievements.dayKey()),4);
  v.setBase({quiz:'public'});
  assert.equal(window.LapinousAchievements.list(game).permanent.some(row=>row.metric==='quizCompleted'),true);
  v.setBase({shop:'hidden'});
  assert.equal(v.allowed('market'),false);
  assert.equal(v.allowed('fragments'),false);
}
assert.equal(JSON.parse(fs.readFileSync('lapinous-content.json')).visibility.quiz,'public');
console.log('Visibility dependencies, hidden admin, quiz access and earned rewards: OK');
