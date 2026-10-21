/* Validation locale des sauvegardes : contrôle de cohérence, pas preuve anti-triche. */
(() => {
  /** Refuse les types dangereux et nombres invalides avant de remplacer la partie courante. */
  function validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Sauvegarde incorrecte.');
    function inspect(value, depth = 0) {
      if (depth > 30) throw new Error('Sauvegarde trop complexe.');
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Nombre invalide dans la sauvegarde.');
      if (value && typeof value === 'object') for (const [key, entry] of Object.entries(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Champ interdit dans la sauvegarde.');
        inspect(entry, depth + 1);
      }
    }
    inspect(data);
    if(!data.species&&!data.status&&!data.progress)throw new Error('Le fichier ne contient pas de partie reconnue.');
    if(data.species!==undefined&&(typeof data.species!=='string'||!data.species))throw new Error('Lapin actif incorrect.');
    if(data.ownedSpecies!==undefined&&(!Array.isArray(data.ownedSpecies)||data.ownedSpecies.some(key=>typeof key!=='string'||!key)))throw new Error('Collection incorrecte.');
    for(const field of ['speciesNames','speciesTraits','records','audio'])if(data[field]!==undefined&&(!data[field]||typeof data[field]!=='object'||Array.isArray(data[field])))throw new Error('Champ incorrect : '+field);
    const counter = (value, label) => {
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Quantité incorrecte : ' + label);
    };
    for (const key of ['carrots','eggs']) if (data[key] !== undefined) counter(data[key], key);
    for (const field of ['inventory','duplicateCounts']) if (data[field] !== undefined) {
      if (!data[field] || typeof data[field] !== 'object' || Array.isArray(data[field])) throw new Error('Stock incorrect.');
      for (const [id, count] of Object.entries(data[field])) counter(count, id);
    }
    if (data.progress !== undefined) {
      if (!data.progress || typeof data.progress !== 'object' || Array.isArray(data.progress)) throw new Error('Progression incorrecte.');
      for (const progress of Object.values(data.progress)) {
        if (!progress || typeof progress !== 'object' || Array.isArray(progress)) throw new Error('Progression incorrecte.');
        for (const stat of ['food','energy','cleanliness']) if (progress[stat] !== undefined &&
          (!Number.isFinite(progress[stat]) || progress[stat] < 0 || progress[stat] > 100)) throw new Error('Besoin hors limites : ' + stat);
        if (progress.attackFragments !== undefined) counter(progress.attackFragments, 'fragments');
        if (progress.attackLevels !== undefined && (!Array.isArray(progress.attackLevels) || progress.attackLevels.some(level => !Number.isInteger(level) || level < 0 || level > 5))) throw new Error('Amélioration incorrecte.');
      }
    }
    return data;
  }
  window.LapinousSaveValidation = { validate };
})();
