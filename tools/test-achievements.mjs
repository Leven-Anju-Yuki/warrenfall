import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync('assets/js/achievements.js','utf8'),context);
const api=context.LapinousAchievements;
const date=new Date('2026-10-15T12:00:00');
const game={carrots:10,ownedSpecies:['azur'],records:{gamesWon:3},progress:{azur:{currentLevel:10,minigames:{memory:{completed:4},quiz:{completed:2}}}},achievements:{days:{'2026-10-14':{counts:{eggsOpened:1},claimed:{}}},claimed:{'level-10':'already'},peaks:{},earnedCarrots:15}};
let list=api.list(game,date);
assert.equal(list.permanent.find(x=>x.metric==='memoryCompleted').value,1);
assert.equal(list.permanent.find(x=>x.metric==='quizCompleted').value,1);
assert.equal(api.claim(game,'level-10',null,date),0);
assert.equal(api.claim(game,'egg','2026-10-14',date),0);
assert.equal(list.pending.length,0);
assert.ok(game.achievements.days['2026-10-14']);
assert.equal(api.claim(game,'egg','2026-10-14',date),0);
assert.equal(api.claim(game,'quiz',api.dayKey(date),date),0); // Old quizzes are not today's activity.
api.record(game,'quizCompleted',1,date);
assert.equal(api.claim(game,'quiz',api.dayKey(date),date),4);
assert.equal(api.claim(game,'quiz',api.dayKey(date),date),0);
api.record(game,'memoryCompleted',1,date);
api.record(game,'puzzleCompleted',1,date);
list=api.list(game,date);
assert.equal(list.today.find(x=>x.id==='memory').value,1);
assert.equal(list.today.find(x=>x.id==='puzzle').value,1);
assert.equal(api.claim(game,'memory-1',null,date),5);
assert.equal(api.list(game,date).permanent.find(x=>x.metric==='memoryCompleted').target,10);
assert.equal(api.claim(game,'puzzle-20',null,date),0);
assert.equal(game.carrots,19);
assert.equal(game.achievements.claimed['level-10'],'already');
console.log('Succès : anciens gains conservés, reprise Memory/quiz, objectifs quotidiens et paliers sans double récompense OK.');

const before=game.carrots;
api.record(game,'eggsOpened',1,date);
const tomorrow=new Date('2026-10-16T00:00:01');
assert.equal(api.claim(game,'egg',api.dayKey(date),tomorrow),0);
assert.equal(game.carrots,before);
const sorted=api.list(game,date).today;
let unfinished=false;for(const row of sorted){if(row.value<row.target)unfinished=true;else assert.equal(unfinished,false);}
console.log('Expiration ? minuit et tri des succ?s accomplis v?rifi?s.');
