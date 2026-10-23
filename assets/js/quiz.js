/* Quiz pédagogique : données éditables, questions mélangées et progression sauvegardée. */
(() => {
  const key='lapinous_quiz_catalog';
  const local=['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
  let catalog=null;
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  /** Valide les réponses et interdit les liens de source exécutables. */
  function validate(data){
    if(!Number.isInteger(data?.roundSize)||data.roundSize<1||data.roundSize>30||!Array.isArray(data.questions))throw new Error('Catalogue de quiz incorrect.');
    const ids=new Set();
    for(const q of data.questions){
      if(!q.id||ids.has(q.id)||!q.question||!q.explanation||!Array.isArray(q.choices)||q.choices.length!==4||q.choices.some(choice=>typeof choice!=='string'||!choice.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>3)throw new Error('Question incorrecte : '+q.id);
      if(q.sourceUrl&&!/^https:\/\//.test(q.sourceUrl))throw new Error('Lien de source incorrect.');
      ids.add(q.id);
    }
    return data;
  }
  /** Mélange une copie, pour éviter les répétitions et ne pas modifier le catalogue. */
  function shuffle(values){const copy=[...values];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
  /** Alterne les thèmes avant de reprendre une deuxième question du même thème. */
  function selectQuestions(data){
    const groups=new Map();
    for(const q of data.questions.filter(q=>q.enabled!==false)){
      const category=q.category||'Découvertes';
      if(!groups.has(category))groups.set(category,[]);
      groups.get(category).push(q);
    }
    const pools=shuffle([...groups.values()]).map(shuffle),selected=[];
    while(selected.length<data.roundSize){
      let added=false;
      for(const pool of pools){
        if(pool.length){selected.push(pool.pop());added=true;}
        if(selected.length===data.roundSize)break;
      }
      if(!added)break;
    }
    return selected;
  }
  const ready=fetch('./lapinous-quiz.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error('Quiz indisponible.');return response.json();}).then(data=>{
    catalog=validate(data);if(local){try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&saved.version===data.version)catalog=validate(saved);}catch{}}
    return catalog;
  }).catch(error=>{console.warn(error.message);return null;});
  /** Une réponse ne compte qu'une fois ; un changement de partie annule la récompense. */
  async function open(api){
    const data=await ready;if(!data||!api.valid())return;
    const questions=selectQuestions(data);
    if(!questions.length){api.toast('Aucune question active.');return;}
    let index=0,score=0,answered=false,finished=false,nextTimer=null;
    const panel=document.createElement('section');panel.className='console-panel quiz-panel';api.root.replaceChildren(panel);
    function render(){
      clearTimeout(nextTimer);nextTimer=null;
      if(!api.valid()||!panel.isConnected)return;
      answered=false;
      if(index===questions.length){
        if(!finished){finished=true;api.complete(score,questions.length);}
        panel.innerHTML=`<h2>Quiz terminé !</h2><p class="quiz-score">${score} / ${questions.length}</p><p>Chaque partie propose de nouvelles questions et mélange les réponses.</p><p class="quiz-more">Envie de préparer de bons repas pour un vrai lapin ?<br><a href="https://leven-anju-yuki.github.io/nourriture-lapin/" target="_blank" rel="noopener noreferrer">Découvrir le guide de l’alimentation du lapin ↗</a></p><button data-quiz-replay>Rejouer</button><button data-quiz-back>Retour aux mini-jeux</button>`;
        panel.querySelector('[data-quiz-replay]').onclick=()=>open(api);
      }else{
        const q=questions[index],choices=shuffle(q.choices.map((text,id)=>({text,id})));
        panel.innerHTML=`<header><h2>Le quiz des lapins</h2><span>Question ${index+1}/${questions.length} · ${score} bonne(s) réponse(s)</span></header><p class="quiz-category">${escape(q.category)}</p><h3>${escape(q.question)}</h3><div class="quiz-choices">${choices.map(choice=>`<button data-quiz-answer="${choice.id}">${escape(choice.text)}</button>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div><footer><button data-quiz-next disabled>Suivant</button><button data-quiz-back>Retour aux mini-jeux</button></footer>`;
        panel.querySelectorAll('[data-quiz-answer]').forEach(button=>button.onclick=()=>{
          if(answered||!api.valid())return;answered=true;
          const correct=Number(button.dataset.quizAnswer)===q.answer;if(correct)score++;
          panel.querySelectorAll('[data-quiz-answer]').forEach(control=>{control.disabled=true;if(Number(control.dataset.quizAnswer)===q.answer)control.classList.add('correct');});
          if(!correct)button.classList.add('incorrect');
          panel.querySelector('.quiz-feedback').innerHTML=`<strong>${correct?'Bonne réponse !':'La bonne réponse : '+escape(q.choices[q.answer])}</strong><p>${escape(q.explanation)}</p>`;
          panel.querySelector('[data-quiz-next]').disabled=false;
          panel.querySelector('[data-quiz-next]').textContent=index===questions.length-1?'Voir le résultat · automatique dans 15 s':'Suivant · automatique dans 15 s';
          nextTimer=setTimeout(advance,15000);
        });
        panel.querySelector('[data-quiz-next]').onclick=advance;
      }
      panel.querySelector('[data-quiz-back]').onclick=()=>{clearTimeout(nextTimer);nextTimer=null;answered=false;api.back();};
    }
    function advance(){
      clearTimeout(nextTimer);nextTimer=null;
      if(!answered||finished||!api.valid()||!panel.isConnected)return;
      index++;render();
    }
    render();
  }
  window.LapinousQuiz={ready,validate,shuffle,selectQuestions,open,get:()=>catalog,save(data){catalog=validate(data);localStorage.setItem(key,JSON.stringify(data));}};
})();
