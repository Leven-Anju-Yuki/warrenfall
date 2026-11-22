/* Enveloppe portable pour décourager les retouches simples des fichiers.
 * SHA-256 détecte une modification, mais n'atteste pas son auteur : aucune
 * clé secrète n'est embarquée et les anciens JSON restent acceptés. */
(() => {
  const FORMAT='warrenfall-save',VERSION=1;
  const available=()=>typeof globalThis.crypto?.subtle?.digest==='function'&&typeof globalThis.TextEncoder==='function'&&typeof globalThis.TextDecoder==='function'&&typeof globalThis.btoa==='function'&&typeof globalThis.atob==='function';
  async function digest(payload){
    if(!available())throw Error('Ce navigateur ne peut pas vérifier ce fichier protégé. La partie courante est conservée.');
    const bytes=new TextEncoder().encode(FORMAT+'-v1\n'+payload);
    return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  }
  async function encode(data){
    const text=JSON.stringify(data);
    // Un vieux navigateur doit toujours pouvoir exporter sa progression.
    if(!available())return text;
    const bytes=new TextEncoder().encode(text);let binary='';
    for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
    const payload=btoa(binary);
    return JSON.stringify({format:FORMAT,version:VERSION,encoding:'base64-utf8',payload,checksum:await digest(payload)});
  }
  async function decode(text){
    const packet=JSON.parse(text);
    if(packet?.format!==FORMAT)return packet; // Compatibilité, pas preuve d'origine.
    if(packet.version!==VERSION)throw Error('Version de fichier non reconnue : original conservé.');
    if(packet.encoding!=='base64-utf8'||typeof packet.payload!=='string'||typeof packet.checksum!=='string'||!/^[a-f0-9]{64}$/.test(packet.checksum)||Object.keys(packet).some(k=>!['format','version','encoding','payload','checksum'].includes(k)))throw Error('Enveloppe de sauvegarde incorrecte : original conservé.');
    if(await digest(packet.payload)!==packet.checksum)throw Error('Le contenu du fichier a été modifié ou endommagé. Import refusé ; ta partie courante et le fichier original sont conservés.');
    let binary;try{binary=atob(packet.payload);if(btoa(binary)!==packet.payload)throw Error();}catch{throw Error('Contenu encodé illisible : original conservé.');}
    const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }
  window.LapinousSaveFiles={FORMAT,VERSION,available,encode,decode};
})();
