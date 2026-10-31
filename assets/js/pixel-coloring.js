/* Coloriages indépendants des puzzles : la palette ne fait jamais partie du zoom. */
(() => {
  const levels=[{name:'Simple',size:64,colors:24},{name:'Modéré',size:128,colors:40},{name:'Difficile',size:192,colors:56}];
  const allowedLevels=image=>image.kind==='discovery'?[0]:image.kind==='rabbit'?[0,1]:image.kind==='scene'?[1,2]:[0,1,2];
  const imageLevel=(image,index)=>({...levels[index],size:image.kind==='rabbit'&&index===1?96:levels[index].size});
  function nextColor(state,current){
    const remaining=new Set(state.targets.filter((c,i)=>!state.background?.[i]&&!state.painted[i]));
    if(remaining.has(current))return current;
    for(let step=1;step<=state.colors.length;step++){const c=(current+step)%state.colors.length;if(remaining.has(c))return c;}
    return current;
  }
  const distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
  function progress(state){
    let done=0,total=0;
    state.targets.forEach((_,i)=>{if(!state.background?.[i]){total++;if(state.painted[i])done++;}});
    return {done,total};
  }
  function rabbitBackground(raw,width,height){
    const mask=Array.from({length:width*height},(_,i)=>Number(raw[i*4+3]<32));
    const edges=[];
    for(let x=0;x<width;x++)edges.push(x,(height-1)*width+x);
    for(let y=0;y<height;y++)edges.push(y*width,y*width+width-1);
    // La transparence d'origine protège notamment la fourrure blanche et noire.
    if(edges.some(i=>mask[i]))return mask;
    const corners=[0,width-1,(height-1)*width,width*height-1];
    const rgb=i=>[raw[i*4],raw[i*4+1],raw[i*4+2]];
    const matte=corners.map(rgb).find(c=>corners.filter(i=>distance(rgb(i),c)<=432).length>=3);
    if(!matte)return mask;
    // Un fond opaque uniforme est retiré seulement s'il communique avec le bord.
    const queue=[],seen=new Uint8Array(width*height);
    const visit=i=>{if(i<0||i>=mask.length||seen[i])return;seen[i]=1;if(distance(rgb(i),matte)<=972){mask[i]=1;queue.push(i);}};
    edges.forEach(visit);
    for(let q=0;q<queue.length;q++){
      const i=queue[q],x=i%width;
      if(x>0)visit(i-1);if(x<width-1)visit(i+1);visit(i-width);visit(i+width);
    }
    return mask;
  }
  function quantize(pixels,count){
    const colors=[pixels[0].slice()];
    const nearest=pixels.map(p=>distance(p,colors[0]));
    while(colors.length<Math.min(count,pixels.length)){
      let best=null,score=0;
      for(let i=0;i<pixels.length;i++)if(nearest[i]>score){score=nearest[i];best=pixels[i];}
      if(!best)break;colors.push(best.slice());
      for(let i=0;i<pixels.length;i++)nearest[i]=Math.min(nearest[i],distance(pixels[i],best));
    }
    let targets=[];
    for(let pass=0;pass<6;pass++){
      const sums=colors.map(()=>[0,0,0,0]);
      targets=pixels.map(p=>{let k=0;colors.forEach((c,i)=>{if(distance(p,c)<distance(p,colors[k]))k=i;});p.forEach((v,i)=>sums[k][i]+=v);sums[k][3]++;return k;});
      sums.forEach((s,i)=>{if(s[3])colors[i]=s.slice(0,3).map(v=>Math.round(v/s[3]));});
    }
    return {colors,targets};
  }
  function paint(state,index,color){
    if(index<0||index>=state.targets.length||state.background?.[index]||state.targets[index]!==color||state.painted[index])return false;
    state.painted[index]=1;return true;
  }
  function open(options){
    const {host,catalog:providedCatalog,storage,save,back}=options;
    // Petit dessin natif : pas de téléchargement ni de modification des portraits.
    const pattern=['..11....11..','..121..121..','..121..121..','..111..111..','...111111...','..11111111..','.1111111111.','.1131111311.','.1111221111.','..11122111..','...111111...','....1111....'];
    const colors=[[255,255,255],[233,157,171],[61,48,43]];
    const targets=pattern.join('').split('').map(c=>c==='.'?0:Number(c)-1),background=pattern.join('').split('').map(c=>Number(c==='.'));
    const rectangles=targets.map((c,i)=>background[i]?'':`<rect x="${i%12}" y="${Math.floor(i/12)}" width="1" height="1" fill="rgb(${colors[c]})"/>`).join('');
    const starter={id:'discovery-bunny-v1',title:'Mes premiers petits coups de pinceau',kind:'discovery',image:'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">${rectangles}</svg>`)};
    const catalog=[starter,...providedCatalog];
    let session=0,kind=catalog[0]?.kind||'all',level=kind==='scene'?1:0;
    const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
    const button=(text,action)=>{const n=el('button',text);n.type='button';n.onclick=action;return n;};
    const imageUrl=image=>window.LapinousImages?.url(image.image.replace(/^\.\//,''))||image.image;
    function hub(){
      session++;host.replaceChildren();const panel=el('dialog',undefined,'coloring-hub');host.append(panel);panel.showModal();panel.oncancel=e=>{e.preventDefault();back();};
      const heading=el('header',undefined,'coloring-album-heading');
      const intro=el('div');intro.append(el('small','L’atelier des petites couleurs'),el('h2','Les Couleurs du terrier'));
      heading.append(intro,button('← Mini-jeux',back));panel.append(heading,el('p','Choisis ton dessin et fais renaître ses couleurs. Tu peux reprendre ton coloriage quand tu veux.','coloring-album-intro'));
      const tabs=el('nav',undefined,'coloring-categories');
      for(const [value,label] of [['discovery','🌱 Découverte'],['rabbit','🐰 Mes lapins'],['scene','🖼️ Grandes images'],['saved','🎨 Mes coloriages']]){
        if(value!=='saved'&&!catalog.some(image=>image.kind===value))continue;
        const b=button(label,()=>{kind=value;if(value==='discovery')level=0;if(value==='rabbit'&&level===2)level=1;if(value==='scene'&&level===0)level=1;hub();});b.setAttribute('aria-pressed',String(kind===value));tabs.append(b);
      }panel.append(tabs);
      const choices=el('div',undefined,'coloring-difficulties');
      levels.forEach((l,i)=>{const size=kind==='rabbit'&&i===1?96:l.size,b=button('',()=>{level=i;hub();});b.append(el('strong',`${['🌱','🌼','🌳'][i]} ${l.name}`),el('span',`${size} cases de large · ${l.colors} couleurs maximum`));b.disabled=kind==='rabbit'&&i===2||kind==='scene'&&i===0;b.setAttribute('aria-pressed',String(level===i));choices.append(b);});if(kind!=='saved'&&kind!=='discovery')panel.append(choices);if(kind==='discovery')panel.append(el('p','Un petit lapin de 12 cases de large, avec seulement 3 couleurs.'));
      const list=el('div',undefined,'coloring-images');panel.append(list);
      const entries=kind==='saved'?Object.keys(storage).flatMap(key=>{const match=key.match(/^(.*):([012])(?::v[23])?$/),image=match&&catalog.find(x=>x.id===match[1]);return image?[{image,difficulty:Number(match[2]),key}]:[];}):catalog.filter(image=>kind==='all'||image.kind===kind).map(image=>({image,difficulty:level,key:`${image.id}:${level}:v3`}));
      entries.forEach(({image,difficulty,key})=>{
        const b=button('',()=>start(image,difficulty,key));
        const st=storage[key],count=st?progress(st):{done:0,total:0};
        const status=count.total>0&&count.done>=count.total?'complete':count.done>0?'ongoing':'new';
        const label={complete:'✓ Terminé',ongoing:'En cours',new:'À commencer'}[status];
        b.classList.add('coloring-card-'+status);
        const frame=el('span',undefined,'coloring-picture');
        const img=el('img');img.src=imageUrl(image);img.alt='';img.loading='lazy';
        frame.append(img,el('span',label,'coloring-card-ribbon'));
        b.append(frame,el('strong',image.title));
        b.append(el('small',st?`${count.done}/${count.total} cases coloriées · ${levels[difficulty].name}${key.endsWith(':v3')?'':' · Ancienne grille'}`:'À tes pinceaux !'));
        if(st){
          const bar=el('progress',undefined,'coloring-card-progress');
          bar.max=Math.max(1,count.total);bar.value=count.done;
          bar.setAttribute('aria-label',`Progression de ${image.title} : ${count.done} sur ${count.total} cases coloriées`);
          bar.title=`${count.total?Math.round(count.done/count.total*100):0} %`;
          b.append(bar);
        }
        list.append(b);
      });
      if(!entries.length&&kind==='saved')list.append(el('p','Tes coloriages commencés et tes anciennes grilles apparaîtront ici.'));
      if(!catalog.length)panel.append(el('p','Les images seront disponibles avec le catalogue des puzzles.'));
    }
    async function start(image,difficulty,savedKey){
      const token=++session,key=savedKey||`${image.id}:${difficulty}:v3`,l=imageLevel(image,difficulty);
      const loading=el('dialog',undefined,'coloring-hub');loading.append(el('p','Préparation des petites couleurs…'),button('← Images',hub));host.replaceChildren(loading);loading.showModal();loading.oncancel=e=>{e.preventDefault();hub();};
      let state=storage[key];
      if(!state&&image.kind==='discovery'){state={width:12,height:12,colors,targets:[...targets],background:[...background],painted:targets.map(()=>0)};storage[key]=state;save();}
      try{
        if(!state || image.kind==='rabbit'&&!Array.isArray(state.background)){
          const img=new Image();img.crossOrigin='anonymous';
          // Une requête lisible évite les anciennes copies opaques du cache d'images.
          const response=await fetch(imageUrl(image),{mode:'cors',cache:'reload'});
          if(!response.ok||response.type==='opaque')throw new Error('Image illisible');
          const objectURL=URL.createObjectURL(await response.blob());
          try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=objectURL;});}
          finally{URL.revokeObjectURL(objectURL);}
          if(token!==session||!host.contains(loading))return;
          const width=state?.width||l.size,height=state?.height||Math.max(1,Math.round(width*img.naturalHeight/img.naturalWidth));
          const source=document.createElement('canvas');source.width=width;source.height=height;
          const ctx=source.getContext('2d',{willReadFrequently:true});
          if(image.kind!=='rabbit'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);}
          ctx.drawImage(img,0,0,width,height);
          const raw=ctx.getImageData(0,0,width,height).data,pixels=[];
          const background=image.kind==='rabbit'?rabbitBackground(raw,width,height):null;
          if(state){
            // Conserve chaque couleur et chaque case déjà coloriée des anciennes grilles.
            state.background=background;
          }else{
            for(let i=0;i<raw.length;i+=4)if(!background?.[i/4])pixels.push([raw[i],raw[i+1],raw[i+2]]);
            if(!pixels.length)throw Error('Portrait vide');
            const result=quantize(pixels,l.colors);
            let foreground=0;
            const targets=Array.from({length:width*height},(_,i)=>background?.[i]?0:result.targets[foreground++]);
            state={version:3,width,height,colors:result.colors,targets,painted:Array(width*height).fill(0),...(background?{background}:{})};
          }
          storage[key]=state;save();
        }
        if(token!==session||!host.contains(loading))return;
        play(state,image,l);
      }catch(error){if(token!==session||!host.contains(loading))return;loading.replaceChildren(el('h2','Le coloriage attend ses couleurs'),el('p','Impossible de lire cette image pour le moment. Ta progression est conservée.'),button('Réessayer',()=>start(image,difficulty,key)),button('← Images',hub));}
    }
    function play(state,image,l){
      host.replaceChildren();const panel=el('dialog',undefined,'coloring-game');host.append(panel);panel.showModal();panel.oncancel=e=>{e.preventDefault();hub();};
      const header=el('header'),navigation=el('nav',undefined,'coloring-navigation');
      navigation.setAttribute('aria-label','Navigation de l’atelier');
      navigation.append(button('← Mon album',hub),button('🧺 Placard de jeux',back));
      header.append(el('h2',`🎨 ${image.title} · ${l.name}`),navigation);panel.append(header);
      const tools=el('div',undefined,'coloring-tools'),status=el('p',undefined,'coloring-status');status.setAttribute('role','status');
      const cell=state.width>=128?16:28;
      const viewport=el('div',undefined,'coloring-viewport'),canvas=el('canvas');canvas.width=state.width*cell;canvas.height=state.height*cell;
      canvas.setAttribute('aria-label','Coloriage numéroté. Choisis une couleur puis une case ; le bouton Colorier une case permet aussi de jouer au clavier.');
      viewport.append(canvas);
      const sidebar=el('aside',undefined,'coloring-sidebar');sidebar.setAttribute('aria-label','Aperçu et couleurs');
      const miniature=el('figure',undefined,'coloring-miniature'),miniCanvas=el('canvas'),miniCaption=el('figcaption','Aperçu · 0 %');
      miniCanvas.width=state.width;miniCanvas.height=state.height;miniCanvas.setAttribute('role','img');
      miniature.append(miniCanvas,miniCaption);
      const palette=el('div',undefined,'coloring-palette');palette.setAttribute('aria-label','Palette de couleurs défilante');
      sidebar.append(miniature,palette);panel.append(tools,viewport,sidebar,status);
      const initialProgress=progress(state),completedOnOpen=initialProgress.total>0&&initialProgress.done===initialProgress.total;
      let celebrated=false;
      const celebration=el('section',undefined,'coloring-finale');celebration.hidden=true;
      celebration.setAttribute('aria-labelledby','coloringFinaleTitle');
      const medal=el('span','🏅','coloring-finale-medal');medal.setAttribute('aria-hidden','true');
      const copy=el('div',undefined,'coloring-finale-copy'),heading=el('h3','Bravo, tableau terminé !');heading.id='coloringFinaleTitle';
      copy.append(el('small','Toutes les couleurs retrouvées'),heading,el('p',`${image.title} · ${l.name}`));
      const finaleActions=el('div',undefined,'coloring-finale-actions');
      const showFinale=button('🏅 Ma réussite',()=>{panel.classList.remove('artwork-only');showFinale.hidden=true;requestAnimationFrame(fit);});showFinale.hidden=true;navigation.append(showFinale);
      finaleActions.append(button('✨ Admirer mon dessin',()=>{panel.classList.add('artwork-only');showFinale.hidden=false;requestAnimationFrame(fit);}),button('🎨 Choisir un autre dessin',hub),button('🧺 Placard de jeux',back));
      celebration.append(medal,copy,finaleActions);panel.append(celebration);
      let selected=0,scale=1,minScale=1,x=0,y=0,gesture=null,preview=false;const pointers=new Map();
      const transform=()=>{
        const width=canvas.width*scale,height=canvas.height*scale;
        x=width<=viewport.clientWidth?(viewport.clientWidth-width)/2:Math.max(viewport.clientWidth-width,Math.min(0,x));
        y=height<=viewport.clientHeight?(viewport.clientHeight-height)/2:Math.max(viewport.clientHeight-height,Math.min(0,y));
        canvas.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
      };
      function fit(){minScale=Math.max(.001,Math.min(viewport.clientWidth/canvas.width,viewport.clientHeight/canvas.height)*.94);scale=minScale;transform();}
      function zoom(factor,cx=viewport.clientWidth/2,cy=viewport.clientHeight/2){const next=Math.max(minScale,Math.min(Math.max(8,minScale),scale*factor)),ratio=next/scale;x=cx-(cx-x)*ratio;y=cy-(cy-y)*ratio;scale=next;transform();}
      const touch=matchMedia('(pointer:coarse)').matches;
      tools.append(button('−',()=>zoom(1/1.4)),button('+',()=>zoom(1.4)),button('Recentrer',fit),el('small',touch?'Glisse un doigt pour colorier · Deux doigts pour déplacer et zoomer':'Clic maintenu : colorier · Deux doigts sur le pavé : déplacer · Pincer ou Ctrl + molette : zoomer · Clic droit : déplacer'));
      const help=button('?',()=>{const shown=panel.classList.toggle('show-coloring-help');help.setAttribute('aria-expanded',String(shown));});
      help.className='coloring-help-toggle';help.setAttribute('aria-label','Aide du coloriage');help.setAttribute('aria-expanded','false');tools.append(help);
      function draw(){
        const previousColor=selected;
        if(!gesture)selected=nextColor(state,selected);
        const ctx=canvas.getContext('2d');ctx.font=`${Math.min(11,Math.floor(cell*.48))}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const mini=miniCanvas.getContext('2d');mini.clearRect(0,0,state.width,state.height);
        state.targets.forEach((color,i)=>{if(state.background?.[i])return;mini.fillStyle=state.painted[i]?`rgb(${state.colors[color].join(',')})`:'#e6ddcd';mini.fillRect(i%state.width,Math.floor(i/state.width),1,1);});
        state.targets.forEach((color,i)=>{if(state.background?.[i])return;const cx=i%state.width*cell,cy=Math.floor(i/state.width)*cell,filled=preview||state.painted[i];ctx.fillStyle=filled?`rgb(${state.colors[color].join(',')})`:'#fff9ed';ctx.fillRect(cx,cy,cell,cell);ctx.strokeStyle=!filled&&color===selected?'#715532':'#cfc5b5';ctx.lineWidth=!filled&&color===selected?2:0.5;if(!filled)ctx.strokeRect(cx+.5,cy+.5,cell-1,cell-1);if(!filled){ctx.fillStyle='#493a2b';ctx.fillText(color+1,cx+cell/2,cy+cell/2);}});
        const {done,total}=progress(state);status.textContent=done===total?'🎉 Toutes les couleurs sont retrouvées !':`${done}/${total} cases · Couleur ${selected+1} sélectionnée`;
        miniCaption.textContent=`Aperçu · ${total?Math.round(done/total*100):0} %`;
        miniCanvas.setAttribute('aria-label',`Aperçu du coloriage : ${done} cases coloriées sur ${total}`);
        if(preview)status.textContent='👁 Aperçu admin du tableau terminé · Ta progression est conservée.';
        const finished=!preview&&(!gesture||celebrated||completedOnOpen)&&total>0&&done===total;
        const wasFinished=panel.classList.contains('is-complete');
        panel.classList.toggle('is-complete',finished);celebration.hidden=!finished;
        if(finished&&!wasFinished){
          copy.querySelector('small').textContent=`${done} cases coloriées · Tableau terminé`;
          requestAnimationFrame(fit);
          if(!celebrated&&!completedOnOpen){
            celebrated=true;celebration.setAttribute('aria-live','polite');
            const sparks=el('div',undefined,'coloring-celebration-sparks');sparks.setAttribute('aria-hidden','true');
            for(let i=0;i<18;i++){const spark=el('span',i%3===0?'✦':'●');spark.style.setProperty('--spark-x',`${8+(i*29)%85}%`);spark.style.setProperty('--spark-delay',`${i*.055}s`);spark.style.setProperty('--spark-color',['#cf9e48','#aa6d8e','#7c9561'][i%3]);sparks.append(spark);}
            viewport.append(sparks);setTimeout(()=>sparks.remove(),3500);
          }
        }
        palette.querySelectorAll('[data-color]').forEach(b=>{const c=Number(b.dataset.color),left=state.targets.reduce((n,v,i)=>n+(!state.background?.[i]&&v===c&&!state.painted[i]?1:0),0);b.hidden=!state.targets.some((v,i)=>v===c&&!state.background?.[i]);b.setAttribute('aria-pressed',String(c===selected));b.setAttribute('aria-label',`Couleur ${c+1}, ${left} cases restantes`);b.textContent=`${c+1}${left===0?' ✓':''}`;});
        if(previousColor!==selected){
          const chosen=palette.querySelector(`[data-color="${selected}"]`);
          if(chosen){const item=chosen.getBoundingClientRect(),frame=palette.getBoundingClientRect();
            const delta=item.bottom>frame.bottom-5?item.bottom-frame.bottom+5:item.top<frame.top+5?item.top-frame.top-5:0;
            if(delta)palette.scrollBy({top:delta,behavior:'instant'});
          }
        }
      }
      state.colors.forEach((color,i)=>{const b=button(String(i+1),()=>{selected=i;draw();});b.dataset.color=i;b.style.background=`rgb(${color.join(',')})`;b.style.color=color.reduce((s,v,j)=>s+v*[.299,.587,.114][j],0)>145?'#20170e':'#fff';palette.append(b);});
      function apply(index){if(preview)return;if(paint(state,index,selected)){draw();save();}else if(!state.background?.[index]&&state.targets[index]!==undefined&&!state.painted[index])status.textContent=`Cette case attend la couleur ${state.targets[index]+1}.`;}
      tools.insertBefore(button('Colorier une case',()=>apply(state.targets.findIndex((c,i)=>!state.background?.[i]&&c===selected&&!state.painted[i]))),tools.querySelector('small'));
      if(options.admin){const toggle=button('👁 Voir le tableau terminé',()=>{preview=!preview;toggle.textContent=preview?'🖌 Reprendre mon coloriage':'👁 Voir le tableau terminé';toggle.setAttribute('aria-pressed',String(preview));draw();});toggle.className='coloring-admin-preview';toggle.setAttribute('aria-pressed','false');tools.append(toggle);}
      viewport.onwheel=e=>{
        e.preventDefault();
        if(e.ctrlKey||e.metaKey){const r=viewport.getBoundingClientRect();zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.012),e.clientX-r.left,e.clientY-r.top);}
        else{const unit=e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1;x-=(e.deltaX||(e.shiftKey?e.deltaY:0))*unit;y-=(e.shiftKey?0:e.deltaY)*unit;transform();}
      };
      const geometry=()=>{const p=[...pointers.values()];return {cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};};
      const gridPoint=p=>({x:(p.x-x)/scale/cell,y:(p.y-y)/scale/cell});
      function stroke(from,to){if(preview)return;for(const i of window.LapinousGridStroke(gridPoint(from),gridPoint(to),state.width,state.height))if(paint(state,i,selected))gesture.changed.add(i);draw();}
      viewport.oncontextmenu=e=>e.preventDefault();
      viewport.onpointerdown=e=>{if(e.button===1)return;e.preventDefault();viewport.setPointerCapture(e.pointerId);const r=viewport.getBoundingClientRect();pointers.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top});if(pointers.size===1)gesture={start:pointers.get(e.pointerId),last:pointers.get(e.pointerId),moved:false,multi:false,pan:e.button===2,changed:new Set()};else{gesture.multi=true;for(const i of gesture.changed)state.painted[i]=0;gesture.changed.clear();draw();gesture.geo=geometry();}};
      viewport.onpointermove=e=>{if(!pointers.has(e.pointerId))return;const r=viewport.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};pointers.set(e.pointerId,p);if(pointers.size>=2){const g=geometry(),old=gesture.geo;if(old){zoom(old.d>0?g.d/old.d:1,old.cx,old.cy);x+=g.cx-old.cx;y+=g.cy-old.cy;transform();}gesture.geo=g;}else if(gesture?.pan){x+=p.x-gesture.last.x;y+=p.y-gesture.last.y;gesture.last=p;transform();}else if(gesture&&!gesture.multi){if(gesture.moved||Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>8){gesture.moved=true;stroke(gesture.last,p);gesture.last=p;}}};
      viewport.onpointerup=e=>{if(!pointers.has(e.pointerId))return;const r=viewport.getBoundingClientRect(),p={x:e.clientX-r.left,y:e.clientY-r.top};if(gesture&&!gesture.multi&&!gesture.pan){if(gesture.moved){stroke(gesture.last,p);if(gesture.changed.size)save();}else{const q=gridPoint(p),col=Math.floor(q.x),row=Math.floor(q.y);if(col>=0&&col<state.width&&row>=0&&row<state.height)apply(row*state.width+col);}}pointers.delete(e.pointerId);if(!pointers.size){gesture=null;draw();}};
      viewport.onpointercancel=viewport.onlostpointercapture=e=>{if(gesture&&!gesture.multi&&gesture.changed.size)save();pointers.delete(e.pointerId);if(!pointers.size){gesture=null;draw();}};
      draw();requestAnimationFrame(()=>{if(viewport.isConnected)fit();});
      const observer=new ResizeObserver(()=>{if(!viewport.isConnected){observer.disconnect();return;}fit();});observer.observe(viewport);
      // Disconnect when changing games, without retaining the old board.
      const removed=new MutationObserver(()=>{if(!viewport.isConnected){observer.disconnect();removed.disconnect();}});removed.observe(host,{childList:true});
    }
    hub();
  }
  window.LapinousColoring={open,levels,quantize,paint,nextColor,allowedLevels,imageLevel,rabbitBackground,progress};
})();
