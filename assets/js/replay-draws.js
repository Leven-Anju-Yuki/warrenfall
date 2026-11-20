/* Des tirages stables à la restauration, sans refuser les anciennes parties.
 * Ce repère local ne constitue pas une attestation serveur : un fichier édité
 * ou une ancienne copie sans repère commun ne peut pas être authentifié. */
(() => {
  function canonical(value){
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  function hash(text){let n=2166136261;for(let i=0;i<text.length;i++)n=Math.imul(n^text.charCodeAt(i),16777619)>>>0;return n;}
  function legacy(game,original=game){
    if(game.drawState!==undefined)return;
    const {savedAt,saveVersion,drawState,...data}=original;
    game.drawState={version:1,seed:'legacy-'+hash(canonical(data)).toString(16),counters:{}};
  }
  function fresh(game){
    const bytes=new Uint32Array(4);
    if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(bytes);
    else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*4294967296);
    game.drawState={version:1,seed:Array.from(bytes,n=>n.toString(16)).join('-'),counters:{}};
  }
  function random(game,channel){
    legacy(game);
    const state=game.drawState;
    if(!state||state.version!==1||typeof state.seed!=='string'||!state.seed||state.seed.length>200||!state.counters||typeof state.counters!=='object'||Array.isArray(state.counters)||!['eggs','exploration','battleLoot'].includes(channel))throw Error('Repère de tirages non reconnu : partie conservée, aucun tirage effectué.');
    const index=state.counters[channel]??0;
    if(!Number.isSafeInteger(index)||index<0||index>=Number.MAX_SAFE_INTEGER)throw Error('Compteur de tirages incorrect : partie conservée.');
    state.counters[channel]=index+1;
    let seed=hash(state.seed+'|'+channel+'|'+index);
    return ()=>{seed=(seed+0x6D2B79F5)>>>0;let n=Math.imul(seed^(seed>>>15),seed|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
  }
  window.LapinousReplay={fresh,legacy,random};
})();
