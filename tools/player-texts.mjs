/** Outils de préparation uniquement : ce module ne fait pas partie du jeu chargé. */
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
export const {parse: parseJS} = require('../.cloudinary-local/translation-audit/node_modules/acorn');
const {parseFragment} = await import('../.cloudinary-local/translation-audit/node_modules/parse5/dist/index.js');

/** Une même phrase, casse ou espaces différents, n'est traduite qu'une seule fois. */
export function sourceText(value) {
  return String(value).normalize('NFC').replace(/\s+/gu,' ').trim()
    .replace(/^[^\p{L}\p{N}{]+|[^\p{L}\p{N}}.!?:;…]+$/gu,'').trim();
}
export const textKey = value => sourceText(value).toLocaleLowerCase('fr');

/** Lire seulement les nœuds de texte et les aides visibles (title/placeholder).
 * Les attributs techniques, alt/aria seuls, templates inactifs et blocs admin sont exclus.
 * Un panneau masqué puis ouvert par le joueur reste une partie de l'interface.
 */
export function visibleMarkup(markup) {
  const texts=[];
  const walk=node=>{
    const attrs=Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));
    if (['script','style','template','noscript','head'].includes(node.tagName) || /^(?:admin|legalDrafts)/i.test(attrs.id||'') || /(?:^|\s)admin[-\s]/.test(attrs.class||'')) return;
    if(node.nodeName==='#text')texts.push(node.value);
    for(const name of ['title','placeholder'])if(attrs[name])texts.push(attrs[name]);
    for(const child of node.childNodes||[])walk(child);
  };
  walk(parseFragment(markup));
  return texts.map(sourceText).filter(text=>/\p{L}/u.test(text));
}

/** Parcours AST : permet de suivre le contexte d'une chaîne, sans exécuter le jeu. */
export function walkJS(node,visit,parents=[]) {
  if(!node||typeof node!=='object')return;
  if(node.type)visit(node,parents);
  const next=node.type?[...parents,node]:parents;
  for(const value of Object.values(node)){
    if(Array.isArray(value))value.forEach(child=>walkJS(child,visit,next));
    else if(value&&typeof value==='object')walkJS(value,visit,next);
  }
}
