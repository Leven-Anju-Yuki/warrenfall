/* Compatibilité et écritures locales conservatrices, sans accès distant. */
(() => {
  const VERSION=2;
  const clone=value=>JSON.parse(JSON.stringify(value));
  function merge(defaults,saved) {
    const result=clone(defaults);
    for(const [key,value] of Object.entries(saved||{})) {
      if(value&&typeof value==='object'&&!Array.isArray(value)&&result[key]&&typeof result[key]==='object'&&!Array.isArray(result[key])) result[key]=merge(result[key],value);
      else result[key]=clone(value);
    }
    return result;
  }
  function migrate(data,fresh,freshProgress) {
    window.LapinousSaveValidation.validate(data);
    if(data.saveVersion!==undefined&&(!Number.isInteger(data.saveVersion)||data.saveVersion>VERSION))throw Error('Cette sauvegarde demande une version plus récente du jeu.');
    const original=clone(data),active=original.species||'azur';
    const game=merge(fresh,original);
    game.species=active;
    if(!original.progress) {
      game.progress={[active]:merge(freshProgress,{
        ...(original.status||{}),friendshipTotal:original.friendshipTotal??original.status?.friendshipTotal??0,
        currentLevel:original.currentLevel??1,lastUpgradeLevel:original.lastUpgradeLevel??0,
        boosts:original.boosts||{},improvements:original.improvements||{}
      })};
    }else{
      game.progress={};
      for(const [key,entry]of Object.entries(original.progress)) {
        const legacyNeeds=key===active?original.status||{}:{};
        game.progress[key]=merge(freshProgress,{...legacyNeeds,...entry});
      }
    }
    if(!game.progress[active])game.progress[active]=clone(freshProgress);
    game.speciesNames={...(original.speciesNames||{})};
    if(original.rabbitName&&!game.speciesNames[active])game.speciesNames[active]=original.rabbitName;
    game.ownedSpecies=[...new Set([...(original.ownedSpecies||Object.keys(game.progress)),active])];
    game.speciesTraits={...(original.speciesTraits||{})};
    if(!game.speciesTraits[active])game.speciesTraits[active]=original.trait||'aucun';
    game.saveVersion=VERSION;
    window.LapinousSaveValidation.validate(game);
    return game;
  }
  function write(storage,key,raw,expected,validate=window.LapinousSaveValidation.validate) {
    validate(JSON.parse(raw));
    const old=storage.getItem(key);
    if(expected!==undefined&&old!==expected)throw Error('La partie a changé dans une autre fenêtre. Recharge le jeu avant de continuer.');
    if(old&&old!==raw) {
      let valid=true;try{validate(JSON.parse(old));}catch{valid=false;}
      if(valid){
        if(!storage.getItem(key+'_original'))storage.setItem(key+'_original',old);
        storage.setItem(key+'_backup',old);
      }else{
        if(!storage.getItem(key+'_unreadable'))storage.setItem(key+'_unreadable',old);
      }
    }
    storage.setItem(key,raw);
    if(storage.getItem(key)!==raw)throw Error('La sauvegarde locale n’a pas été confirmée.');
    return raw;
  }
  function archiveMigration(storage,key,raw) {
    let hash=2166136261;
    for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619)>>>0;
    const archive=key+'_migration_v'+VERSION+'_'+hash.toString(16);
    const previous=storage.getItem(archive);
    if(previous!==null&&previous!==raw)throw Error('La copie de migration ne peut pas être remplacée. Exporte la sauvegarde.');
    if(previous===null)storage.setItem(archive,raw);
    if(storage.getItem(archive)!==raw)throw Error('Copie de migration non confirmée.');
    return archive;
  }
  window.LapinousSaveSafety={VERSION,migrate,write,archiveMigration};
})();
