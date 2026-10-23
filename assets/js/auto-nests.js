/* Trois instantanés tournants ; aucune suppression des sauvegardes manuelles. */
(() => {
  const KEY='lapinous_auto_nests',INTERVAL=5*60*1000;
  function read(storage){
    const entries=JSON.parse(storage.getItem(KEY)||'[]');
    if(!Array.isArray(entries)||entries.length>3)throw Error('Les petits nids sont illisibles et sont conservés.');
    for(const entry of entries){if(!entry||!Number.isFinite(entry.savedAt)||typeof entry.id!=='string')throw Error('Petit nid incorrect, conservé.');window.LapinousSaveValidation.validate(entry.data);}
    return entries;
  }
  function capture(storage,raw,name,now=Date.now(),leaving=false){
    const before=storage.getItem(KEY),entries=read(storage),latest=Math.max(0,...entries.map(e=>e.savedAt));
    if(entries.length&&now-latest<(leaving?60000:INTERVAL))return null;
    const data=JSON.parse(raw);window.LapinousSaveValidation.validate(data);
    const date=new Date(now).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'medium'});
    const entry={id:'auto-nid-'+now+'-'+Math.random().toString(36).slice(2,7),name:`Petit nid de ${name||'Lapinou'} — ${date}`,savedAt:now,automatic:true,data};
    const next=[...entries,entry].sort((a,b)=>b.savedAt-a.savedAt).slice(0,3),text=JSON.stringify(next);
    if(storage.getItem(KEY)!==before)throw Error('Les petits nids ont changé dans une autre fenêtre.');
    // setItem est atomique : en cas de quota, les trois copies précédentes restent intactes.
    storage.setItem(KEY,text);
    if(storage.getItem(KEY)!==text)throw Error('Le petit nid n’a pas été confirmé.');
    return entry;
  }
  window.LapinousAutoNests={KEY,INTERVAL,read,capture};
})();
