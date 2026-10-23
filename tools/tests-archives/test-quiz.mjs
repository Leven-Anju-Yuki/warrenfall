import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=process.cwd();
const page=`<!doctype html><html><head><link rel="stylesheet" href="/assets/css/style.css"></head><body><main id="quiz"></main><pre id="result">PENDING</pre><script src="/assets/js/quiz.js"></script><script>
(async()=>{try{const api=window.LapinousQuiz,data=await api.ready;const rewards=[];let valid=true;await api.open({root:document.getElementById('quiz'),valid:()=>valid,toast:()=>{},back:()=>{},complete:(score,total)=>rewards.push({score,total})});
let locked=true,noSources=true;for(let i=0;i<data.roundSize;i++){const panel=document.querySelector('.quiz-panel'),question=data.questions.find(q=>q.question===panel.querySelector('h3').textContent);const next=panel.querySelector('[data-quiz-next]');locked&&=next.disabled;const answer=panel.querySelector('[data-quiz-answer="'+question.answer+'"]');answer.click();answer.click();noSources&&=!panel.querySelector('.quiz-feedback small,.quiz-feedback a')&&!/guide fourni|PDF/i.test(panel.querySelector('.quiz-feedback').textContent);locked&&=!next.disabled&&[...panel.querySelectorAll('[data-quiz-answer]')].every(button=>button.disabled);next.click();}
const unchanged=JSON.stringify(data);api.shuffle(data.questions);const bad=structuredClone(data);bad.questions[0].answer=8;let rejects=false;try{api.validate(bad)}catch{rejects=true}const link=structuredClone(data);link.questions[0].sourceUrl='javascript:alert(1)';let rejectsLink=false;try{api.validate(link)}catch{rejectsLink=true}
document.getElementById('result').textContent=JSON.stringify({locked,noSources,rewards,unchanged:JSON.stringify(data)===unchanged,rejects,rejectsLink,finished:!!document.querySelector('[data-quiz-replay]')});}catch(error){document.getElementById('result').textContent=JSON.stringify({error:error.message})}})();
</script></body></html>`;
const server=http.createServer(async(req,res)=>{
  if(req.url==='/test'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css':'application/json');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  const output=await new Promise((resolve,reject)=>{
    const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless','--disable-gpu','--no-first-run','--user-data-dir='+path.join(root,'.cloudinary-local/quiz-browser'),'--dump-dom','--virtual-time-budget=10000','http://127.0.0.1:'+server.address().port+'/test'],{windowsHide:true});
    let text='';child.stdout.on('data',value=>text+=value);child.stderr.on('data',()=>{});const timer=setTimeout(()=>{child.kill();reject(new Error('Test expiré'));},45000);child.on('error',reject);child.on('exit',()=>{clearTimeout(timer);resolve(text);});
  });
  const match=output.match(/<pre id="result">([^<]+)<\/pre>/);assert.ok(match&&match[1]!=='PENDING');const result=JSON.parse(match[1]);assert.ok(!result.error,result.error);assert.ok(result.locked&&result.noSources&&result.unchanged&&result.rejects&&result.rejectsLink&&result.finished);assert.deepEqual(result.rewards,[{score:8,total:8}]);console.log('Quiz Chrome : 8 réponses, une seule récompense, doubles clics neutralisés, catalogue et liens validés.');
}finally{server.close();}
