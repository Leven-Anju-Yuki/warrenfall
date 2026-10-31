/** Catalogue des textes joueurs : destinations d'affichage et champs réellement rendus.
 * Jamais d'appel de traduction, de lecture des sauvegardes ou d'exécution du jeu.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseJS,walkJS,visibleMarkup,sourceText,textKey} from './player-texts.mjs';

export async function buildPlayerTexts(root=process.cwd()) {
  const entries=new Map(), review=[], errors=[];
  const read=file=>fs.readFile(path.join(root,file),'utf8');
  function add(value,file,line,kind) {
    for(const raw of visibleMarkup(value)){
      const text=sourceText(raw),key=textKey(text);
      // Une interpolation seule n'est pas un texte à traduire.
      if(!text.replace(/\{\d+\}/g,'').match(/\p{L}/u))continue;
      const entry=entries.get(key)||{text,occurrences:0,origins:[]};
      entry.occurrences++;
      entry.origins.push({file,line,kind});entries.set(key,entry);
    }
  }
  const displayFields=new Set(['name','nickname','personality','story','accessory','likes','dislikes','quote','title','label','description','desc','question','choices','explanation','category','power','section','where','text','points','tip','notice','message','greetingText','thanksText']);
  // Les champs ci-dessus sont lus par les fiches, le quiz et les ateliers.
  // Images, IDs, sources documentaires et autres paramètres métier restent exclus.
  for(const file of ['lapinous-content.json','lapinous-shop.json','lapinous-puzzles.json','lapinous-quiz.json']){
    const walk=(value,key='',location='')=>{
      if(typeof value==='string'){if(displayFields.has(key))add(value,file,null,location);}
      else if(Array.isArray(value))value.forEach((item,i)=>walk(item,key,`${location}[${i}]`));
      else if(value&&typeof value==='object'&&value.enabled!==false)Object.entries(value).forEach(([k,v])=>walk(v,k,`${location}.${k}`));
    };
    walk(JSON.parse(await read(file)));
  }
  const index=await read('index.html');
  add(index.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i,''),'index.html',1,'html');
  for(const file of ['403.html','404.html','offline.html']){
    try{add((await read(file)).replace(/<head\b[^>]*>[\s\S]*?<\/head>/i,''),file,1,'html');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const scripts=[...new Set([...index.matchAll(/<script\b[^>]*src="\.\/(assets\/js\/[^"?]+)(?:\?[^" ]*)?"/g)].map(match=>match[1]))]
    .filter(file=>!/(?:bootstrap|jquery|image-manifest|dashboard)/.test(path.basename(file)));
  const propertyName=node=>node?.name||node?.value;
  const displayCall=new Set(['showToast','toast','alert','confirm','prompt','setCustomValidity']);
  const displayAssignment=new Set(['textContent','innerText','innerHTML','outerHTML','title','placeholder']);
  function expression(node,resolve=()=>[],fields=[]) {
    if(!node)return [];
    if(node.type==='Identifier')return resolve(node.name,fields);
    if(node.type==='MemberExpression'){
      const chain=[...fields];let base=node;
      while(base.type==='MemberExpression'){
        chain.unshift(base.computed?(base.property.type==='Literal'?base.property.value:null):base.property.name);base=base.object;
      }
      return expression(base,resolve,chain);
    }
    if(fields.length){
      const [field,...rest]=fields;
      if(node.type==='ObjectExpression')return node.properties.filter(property=>field===null||propertyName(property.key)===field).flatMap(property=>expression(property.value,resolve,rest));
      if(node.type==='ArrayExpression')return node.elements.filter((_,index)=>field===null||index===Number(field)).flatMap(value=>expression(value,resolve,rest));
      return [];
    }
    if(node.type==='Literal'&&typeof node.value==='string')return [node.value];
    if(node.type==='TemplateLiteral')return [node.quasis.map((part,i)=>(part.value.cooked??part.value.raw)+(i<node.expressions.length?`{${i}}`:'')).join('')];
    if(node.type==='ConditionalExpression')return [...expression(node.consequent,resolve),...expression(node.alternate,resolve)];
    if(node.type==='BinaryExpression'&&node.operator==='+')return [...expression(node.left,resolve),...expression(node.right,resolve)];
    if(node.type==='ArrayExpression')return node.elements.flatMap(value=>expression(value,resolve));
    if(node.type==='ObjectExpression')return node.properties.flatMap(value=>expression(value.value,resolve));
    if(node.type==='CallExpression'&&/^(?:escape|escapeHTML|escapeHtml)$/.test(node.callee.name||''))return expression(node.arguments[0],resolve);
    return [];
  }
  for(const file of scripts){
    try{
      const ast=parseJS(await read(file),{ecmaVersion:'latest',sourceType:'module',locations:true});
      // Résoudre un libellé local sans confondre deux variables homonymes situées
      // dans des fonctions différentes. Cela couvre les textes mis en variable
      // avant d'être affectés à textContent, sans ramasser toutes les chaînes du code.
      const bindings=new WeakMap();
      const isScope=node=>node.type==='Program'||node.type==='BlockStatement'||/Function/.test(node.type);
      walkJS(ast,(node,parents)=>{
        if(node.type==='VariableDeclarator'&&node.id.type==='Identifier'){
          const scope=[...parents].reverse().find(isScope);
          if(!bindings.has(scope))bindings.set(scope,new Map());
          bindings.get(scope).set(node.id.name,{node:node.init,parents});
        }
      });
      function resolve(name,parents,visited=new Set(),fields=[]){
        for(const scope of [...parents].reverse().filter(isScope)){
          const binding=bindings.get(scope)?.get(name);
          if(binding){
            if(!binding.node||visited.has(binding.node))return [];
            const next=new Set(visited);next.add(binding.node);
            return expression(binding.node,(key,path)=>resolve(key,binding.parents,next,path),fields);
          }
          if(scope.params?.some(parameter=>parameter.name===name))return [];
        }
        return [];
      }
      const nonvisualNodes=new Set();
      walkJS(ast,node=>{
        if(node.type==='VariableDeclarator'&&node.init?.type==='CallExpression'&&
          node.init.callee.property?.name==='createElement'&&['style','script'].includes(node.init.arguments[0]?.value))nonvisualNodes.add(node.id.name);
      });
      // Repérer les petites fabriques DOM : el(tag, texte), button(texte, action)…
      // On suit leur paramètre texte au lieu de compter leurs classes CSS.
      const factories=new Map();
      for(let pass=0;pass<2;pass++)walkJS(ast,node=>{
        const fn=node.type==='VariableDeclarator'?node.init:node;
        const name=node.type==='VariableDeclarator'?node.id?.name:node.id?.name;
        if(!name||!fn||!['ArrowFunctionExpression','FunctionExpression','FunctionDeclaration'].includes(fn.type))return;
        walkJS(fn.body,child=>{
          let candidate;
          if(child.type==='AssignmentExpression'&&child.left.type==='MemberExpression'&&displayAssignment.has(propertyName(child.left.property)))candidate=child.right;
          if(child.type==='CallExpression'){
            const index=factories.get(child.callee.name);
            if(index!==undefined)candidate=child.arguments[index];
          }
          if(candidate?.type==='Identifier'){
            const index=fn.params.findIndex(parameter=>parameter.name===candidate.name);
            if(index>=0)factories.set(name,index);
          }
        });
      });
      const selected=new Set();
      let context=[];
      const collect=(node,kind)=>{if(!node||selected.has(node))return;selected.add(node);for(const value of expression(node,(name,path)=>resolve(name,context,new Set(),path)))add(value,file,node.loc.start.line,kind);};
      walkJS(ast,(node,parents)=>{
        context=parents;
        // Code d'administration : ne pas envoyer ses libellés à la traduction du jeu.
        if(parents.some(parent=>/Function/.test(parent.type)&&/admin|dashboard/i.test(parent.id?.name||'')))return;
        if(node.type==='AssignmentExpression'&&node.left.type==='MemberExpression'&&!nonvisualNodes.has(node.left.object?.name)&&
          (displayAssignment.has(propertyName(node.left.property))||['notice','message'].includes(propertyName(node.left.property))))collect(node.right,'affichage');
        if(node.type==='CallExpression'){
          const name=propertyName(node.callee.property)||node.callee.name;
          if(displayCall.has(name))collect(node.arguments[0],'message joueur');
          if(factories.has(name))collect(node.arguments[factories.get(name)],'fabrique DOM');
          if(name==='Error')collect(node.arguments[0],'erreur joueur');
          if(name==='setAttribute'&&['title','placeholder'].includes(node.arguments[0]?.value))collect(node.arguments[1],'aide visible');
          if(['insertAdjacentHTML','insertAdjacentText'].includes(name))collect(node.arguments[1],'affichage');
        }
        // Gabarits HTML renvoyés par les composants (menus, ateliers, cartes…).
        if(node.type==='TemplateLiteral'&&node.quasis.some(part=>/<[a-z][\w:-]*(?:\s|>)/i.test(part.value.raw))){
          collect(node,'gabarit HTML');
          let prefix='';
          node.expressions.forEach((value,index)=>{
            prefix+=node.quasis[index].value.raw;
            // Une condition entre deux balises produit du texte ; dans une balise,
            // elle produit souvent une classe CSS ou un attribut : ne pas l'envoyer.
            if(prefix.lastIndexOf('<')<=prefix.lastIndexOf('>'))collect(value,'texte conditionnel');
          });
        }
        if(node.type==='Literal'&&typeof node.value==='string'&&/<[a-z][\w:-]*(?:\s|>)/i.test(node.value))collect(node,'fragment HTML');
        if(node.type==='Property'&&displayFields.has(propertyName(node.key)))collect(node.value,'donnée affichée');
        // Tableau du placard : ID et action JS exclus, nom et description visibles.
        if(node.type==='VariableDeclarator'&&node.id.name==='games'&&node.init?.type==='ArrayExpression'){
          for(const row of node.init.elements)if(row?.type==='ArrayExpression'){
            collect(row.elements[1],'nom de jeu');collect(row.elements[3],'description de jeu');
          }
        }
        if(node.type==='VariableDeclarator'&&node.id.name==='RELATIONS_TEXT')collect(node.init,'relations affichées');
        if(node.type==='ForOfStatement'&&node.right.type==='ArrayExpression'){
          const pattern=node.left.declarations?.[0]?.id;
          if(pattern?.type==='ArrayPattern')for(const row of node.right.elements)if(row?.type==='ArrayExpression'){
            pattern.elements.forEach((binding,index)=>{if(/^(?:name|label|title|description|unit)$/.test(binding?.name||''))collect(row.elements[index],'libellé affiché');});
          }
        }
        // Les messages Error sont montrés par les catch du parcours joueur.
        if(node.type==='NewExpression'&&node.callee.name==='Error'&&!file.endsWith('game-languages.js'))collect(node.arguments[0],'erreur joueur');
        // Le moteur de langues masque ses diagnostics de validation derrière son
        // message d'interface générique, déjà collecté via status.textContent.
        if(!file.endsWith('game-languages.js')&&node.type==='Literal'&&typeof node.value==='string'&&/\p{L}/u.test(node.value)&&/[\sàéèêç]/i.test(node.value))review.push({file,line:node.loc.start.line,text:node.value});
      });
    }catch(error){errors.push({file,error:error.message});}
  }
  let decisions={};
  try{decisions=JSON.parse(await read('tools/player-text-review.json')).decisions;}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const reviewId=row=>row.file+':'+createHash('sha256').update(row.text).digest('hex');
  for(const row of review)if(decisions[reviewId(row)]?.visible)add(row.text,row.file,row.line,'affichage vérifié dans le code');
  const sorted=[...entries].sort(([a],[b])=>a.localeCompare(b,'fr'));
  const chars=text=>[...text].length;
  const occurrences=sorted.reduce((sum,[,row])=>sum+row.occurrences,0);
  const rawCharacters=sorted.reduce((sum,[,row])=>sum+chars(row.text)*row.occurrences,0);
  const sourceCharacters=sorted.reduce((sum,[,row])=>sum+chars(row.text),0);
  const result={scope:'Textes destinés à être affichés aux joueurs, catalogues et parcours chargés par index.html. Inventaire statique à contrôler pour les phrases construites indirectement.',
    uniqueTexts:sorted.length,occurrences,charactersBeforeDeduplication:rawCharacters,sourceCharacters,
    duplicateOccurrencesRemoved:occurrences-sorted.length,fourLanguagesCharacters:sourceCharacters*4,
    errors,entries:Object.fromEntries(sorted)};
  const languagesFolder=path.join(root,'assets/i18n');await fs.mkdir(languagesFolder,{recursive:true});
  // Une liste suffit pour le français source : ne pas recopier chaque longue
  // histoire une seconde fois comme clé. Les fichiers traduits ont leurs clés.
  await fs.writeFile(path.join(languagesFolder,'fr.json'),JSON.stringify({version:1,language:'fr',strings:sorted.map(([,row])=>row.text)},null,2)+'\n');
  const privateFolder=path.join(root,'.cloudinary-local/translation-audit');await fs.mkdir(privateFolder,{recursive:true});
  await fs.writeFile(path.join(privateFolder,'player-texts.json'),JSON.stringify(result,null,2));
  // Liste de contrôle uniquement : ces chaînes ne sont PAS dans le volume à traduire.
  const unclassified=review.filter(row=>!entries.has(textKey(row.text))&&!/<[a-z]/i.test(row.text)&&!decisions[reviewId(row)]);
  await fs.writeFile(path.join(privateFolder,'strings-to-review.json'),JSON.stringify(unclassified,null,2));
  return {...result,entries:undefined,stringsToReview:unclassified.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildPlayerTexts(),null,2));
