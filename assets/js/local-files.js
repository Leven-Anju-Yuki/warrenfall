(() => {
  'use strict';
  const filenames=new Set(['lapinous-content.json','lapinous-puzzles.json','lapinous-quiz.json','lapinous-shop.json']);
  const supported=()=>typeof window.showDirectoryPicker==='function';
  const memory=new Map();
  let downloadOnly=false;
  function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('lapinous-local-folders',1);request.onupgradeneeded=()=>request.result.createObjectStore('handles');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function remember(key,handle){memory.set(key,handle);try{const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(handle,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}catch{ /* Le dossier reste utilisable pour cette session. */ }}
  async function recall(key){if(memory.has(key))return memory.get(key);try{const db=await database();const handle=await new Promise((resolve,reject)=>{const request=db.transaction('handles').objectStore('handles').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});db.close();if(handle)memory.set(key,handle);return handle;}catch{return null;}}
  async function permission(handle,ask=true){const options={mode:'readwrite'};if(await handle.queryPermission(options)==='granted')return true;return ask&&await handle.requestPermission(options)==='granted';}
  async function chooseProject(){const handle=await window.showDirectoryPicker({id:'lapinous-project',mode:'readwrite'});for(const name of filenames){try{await handle.getFileHandle(name);}catch{throw new Error('Choisis la racine du projet contenant les quatre JSON Warrenfall.');}}await remember('project',handle);return handle;}
  async function chooseSaves(){
    const previous=await recall('player');
    const options={id:'lapinous-player-saves',mode:'readwrite'};if(previous)options.startIn=previous;
    const parent=await window.showDirectoryPicker(options);
    const names=['Lapinous_Sauvegardes','lapinous_sauvegardes','Lapinous sauvegarde'];
    let handle=names.includes(parent.name)?parent:null;
    if(!handle)for(const name of names){try{handle=await parent.getDirectoryHandle(name);break;}catch(error){if(error.name!=='NotFoundError')throw error;}}
    if(!handle)handle=await parent.getDirectoryHandle('Lapinous sauvegarde',{create:true});
    await remember('player',handle);return handle;
  }
  // Restore the handle before the click, keeping the file picker in the user gesture.
  recall('player');
  async function openSaveFile(){
    const folder=memory.get('player');
    const options={id:'lapinous-load-save',startIn:folder||'downloads',types:[{description:'Sauvegarde Warrenfall',accept:{'application/json':['.json']}}],multiple:false};
    const [handle]=await window.showOpenFilePicker(options);
    return JSON.parse(await (await handle.getFile()).text());
  }
  function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function write(handle,text){const stream=await handle.createWritable();try{await stream.write(text);await stream.close();}catch(error){await stream.abort().catch(()=>{});throw error;}}
  let exporting=false;
  async function cleanBackups(folder){
    const cutoff=Date.now()-7*24*60*60*1000;
    for await(const [name,handle] of folder.entries()){
      if(handle.kind!=='file')continue;
      const match=/^(lapinous-(?:content|puzzles|quiz|shop))-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.json$/.exec(name);
      if(!match)continue;
      const date=Date.parse(`${match[2]}T${match[3]}:${match[4]}:${match[5]}.${match[6]}Z`);
      if(Number.isFinite(date)&&date<cutoff)await folder.removeEntry(name);
    }
  }
  async function exportJSON(name,data){if(!filenames.has(name))throw new Error('Nom de catalogue incorrect.');const text=JSON.stringify(data,null,2);JSON.parse(text);if(!supported()){download(name,text);return 'download';}if(exporting)throw new Error('Un export est deja en cours.');exporting=true;try{const folder=await recall('project')||await chooseProject();if(!await permission(folder))throw new Error('Autorisation refusee. Reconnecte le dossier ou utilise le telechargement.');const file=await folder.getFileHandle(name);const old=await file.getFile();const backup=await folder.getDirectoryHandle('Sauvegardes JSON',{create:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-');await write(await backup.getFileHandle(name.replace('.json','')+'-'+stamp+'.json',{create:true}),await old.text());await write(file,text);try{await cleanBackups(backup);}catch(error){console.warn('Export enregistre ; nettoyage des anciennes copies impossible.',error.name);}return 'written';}finally{exporting=false;}}
  const exportWithFallback=(name,data)=>{if(downloadOnly){download(name,JSON.stringify(data,null,2));return Promise.resolve('download');}return exportJSON(name,data);};
  let nestQueue=Promise.resolve();
  function nestFilename(entry,slot){
    const d=new Date(entry.savedAt),pad=n=>String(n).padStart(2,'0');
    if(!Number.isFinite(d.getTime()))throw Error('Date du petit nid invalide.');
    const stamp=`${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}_${pad(d.getHours())}h${pad(d.getMinutes())}-${pad(d.getSeconds())}-${String(d.getMilliseconds()).padStart(3,'0')}`;
    return `warrenfall-petit-nid-auto-${slot}-${stamp}.json`;
  }
  function writeAutoNests(entries){
    if(!Array.isArray(entries)||entries.length>3)throw Error('Trois petits nids maximum.');
    const snapshot=JSON.parse(JSON.stringify(entries));
    const job=nestQueue.then(async()=>{
      const folder=await recall('player');
      if(!folder||!await permission(folder,false))return false;
      const keep=new Set();
      // Confirmer toutes les nouvelles copies avant de retirer les anciens nids.
      for(let i=0;i<snapshot.length;i++){
        const entry=snapshot[i];
        const name=nestFilename(entry,i+1),text=JSON.stringify({...entry.data,savedAt:entry.savedAt,autoNest:{name:entry.name,savedAt:entry.savedAt,savedAtISO:new Date(entry.savedAt).toISOString()}},null,2);
        const file=await folder.getFileHandle(name,{create:true});
        await write(file,text);
        if(await (await file.getFile()).text()!==text)throw Error('Copie du petit nid non confirmée.');
        keep.add(name);
      }
      if(keep.size)for await(const [name,file]of folder.entries()){
        if(file.kind!=='file'||keep.has(name)||!/^warrenfall-petit-nid-auto-[123](?:-\d{2}-\d{2}-\d{4}_\d{2}h\d{2}-\d{2}-\d{3})?\.json$/.test(name))continue;
        // Les anciens noms fixes sont reconnus, mais seuls nos instantanés sont retirés.
        let old;try{old=JSON.parse(await (await file.getFile()).text());}catch{continue;}
        if(typeof old.autoNest?.name==='string'&&Number.isFinite(old.autoNest.savedAt))await folder.removeEntry(name);
      }
      return true;
    });
    nestQueue=job.catch(()=>{});return job;
  }
  window.LapinousLocalFiles={supported,recall,permission,chooseProject,chooseSaves,openSaveFile,nestFilename,writeAutoNests,exportJSON:exportWithFallback,download};
  document.addEventListener('DOMContentLoaded',()=>{
    const exportButton=document.getElementById('exportContentBtn');if(!exportButton)return;
    const panel=document.createElement('section');panel.className='dash-section';
    panel.innerHTML='<h2>Dossier des exports JSON</h2><p>Choisis la racine du projet contenant les quatre JSON. Avant chaque remplacement, l’ancien fichier est conservé dans « Sauvegardes JSON ». Les copies de plus de 7 jours sont supprimées lors du prochain export. Recharge le jeu après l’export.</p><button type="button" data-project-folder>Choisir / reconnecter le dossier du projet</button> <label><input type="checkbox" data-download-only> Télécharger les JSON plutôt qu’écrire dans le projet</label><p data-folder-status role="status"></p>';
    exportButton.closest('section')?.before(panel);
    if(!panel.isConnected)document.body.prepend(panel);
    const status=panel.querySelector('[data-folder-status]');
    panel.querySelector('[data-download-only]').onchange=event=>downloadOnly=event.target.checked;
    panel.querySelector('[data-project-folder]').disabled=!supported();
    panel.querySelector('[data-project-folder]').onclick=async()=>{try{const handle=await chooseProject();status.textContent='Dossier connecté : '+handle.name;}catch(error){if(error.name!=='AbortError')status.textContent=error.message;}};
    recall('project').then(handle=>{status.textContent=handle?'Dossier mémorisé : '+handle.name:'Au premier export, choisis le dossier du projet.';});
  });
})();
