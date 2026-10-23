import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const data=JSON.parse(fs.readFileSync('lapinous-quiz.json','utf8'));
const window={};
vm.runInNewContext(fs.readFileSync('assets/js/quiz.js','utf8'),{
 window,console,location:{hostname:'test.invalid'},fetch:async()=>({ok:true,json:async()=>data})
});
await window.LapinousQuiz.ready;
const api=window.LapinousQuiz,original=JSON.stringify(data);
assert.equal(data.questions.length,60);
for(let i=0;i<500;i++){
 const round=api.selectQuestions(data);
 assert.equal(round.length,8);
 assert.equal(new Set(round.map(q=>q.id)).size,8);
 assert.equal(new Set(round.map(q=>q.category)).size,8);
}
const reduced=structuredClone(data);
reduced.questions.forEach((q,i)=>q.enabled=i<2);
assert.equal(api.selectQuestions(reduced).length,2);
reduced.questions.forEach(q=>q.enabled=false);
assert.equal(api.selectQuestions(reduced).length,0);
const single={roundSize:8,questions:data.questions.slice(0,4).map(q=>({...q,category:'Unique'}))};
assert.equal(api.selectQuestions(single).length,4);
assert.equal(JSON.stringify(data),original);
assert.equal(new Set(data.questions.map(q=>q.question)).size,60);
for(const q of data.questions){
 assert.equal(new Set(q.choices).size,4);
 assert.ok(!/guide fourni|selon le guide|PDF/i.test(q.question+' '+q.explanation));
}
console.log('Quiz : 60 questions, 500 parties avec 8 thèmes distincts, exclusions, petit catalogue et données intactes OK.');
