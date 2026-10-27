/* Adapter les panneaux existants sans dupliquer les achats ni les sauvegardes. */
(() => {
  const area = document.getElementById('gameArea');
  const phone = () => matchMedia('(pointer:coarse)').matches && Math.min(innerWidth, innerHeight) <= 900;
  const eggs = document.createElement('dialog');
  eggs.id = 'phoneEggDialog';
  eggs.setAttribute('aria-labelledby','phoneEggTitle');
  eggs.innerHTML = '<header><h2 id="phoneEggTitle">Les œufs du terrier</h2><button type="button" aria-label="Fermer les œufs">×</button></header><div class="phone-egg-content"></div>';
  eggs.querySelector('header button').onclick = () => eggs.close();
  document.body.append(eggs);
  // L'éclosion reste dans le même dialogue, donc dans la même couche native.
  window.LapinousEggView = {
    mount(node) {
      const content = eggs.querySelector('.phone-egg-content');
      const close = eggs.querySelector('header button');
      const title = eggs.querySelector('h2');
      const previousTitle = title.textContent;
      content.hidden = true;
      close.disabled = true;
      title.textContent = 'Éclosion des œufs';
      eggs.classList.add('egg-opening');
      const preventCancel = event => event.preventDefault();
      eggs.addEventListener('cancel', preventCancel);
      eggs.append(node);
      if (!eggs.open) eggs.showModal();
      node.querySelector('button:not(:disabled)')?.focus();
      return () => {
        node.remove();
        content.hidden = false;
        close.disabled = false;
        title.textContent = previousTitle;
        eggs.classList.remove('egg-opening');
        eggs.removeEventListener('cancel', preventCancel);
        close.focus();
      };
    }
  };
  let queued = false, puzzleZoom = null;
  function adapt() {
    queued = false;
    document.documentElement.classList.toggle('phone-ui',phone());
    const workshop=area.querySelector('.puzzle-workshop');
    if(workshop&&phone()){
      const board=workshop.querySelector('.puzzle-board');
      const zoom=puzzleZoom??Number(board?.style.getPropertyValue('--puzzle-cols'))>=5;
      if(zoom&&!workshop.classList.contains('phone-puzzle-zoom')){
        const cols=Number(board.style.getPropertyValue('--puzzle-cols'))||3;
        workshop.style.setProperty('--phone-puzzle-cell',Math.max(48,Math.ceil(board.getBoundingClientRect().width/cols*1.5))+'px');
      }
      workshop.classList.toggle('phone-puzzle-zoom',zoom);
      let button=workshop.querySelector('[data-phone-puzzle-zoom]');
      if(!button){button=document.createElement('button');button.type='button';button.className='ghost-btn';button.dataset.phonePuzzleZoom='true';workshop.querySelector('.puzzle-actions').prepend(button);button.onclick=()=>{puzzleZoom=!workshop.classList.contains('phone-puzzle-zoom');schedule();};}
      const label=zoom?'Vue entière':'Agrandir';
      if(button.textContent!==label)button.textContent=label;
      if(button.getAttribute('aria-pressed')!==String(zoom))button.setAttribute('aria-pressed',String(zoom));
    }
    const panel = area.querySelector('.egg-shop');
    if (panel) {
      if(!document.getElementById('phoneEggButton')){
        const trigger = document.createElement('button');
        trigger.id = 'phoneEggButton'; trigger.type = 'button';trigger.className='room-tab';
        trigger.innerHTML='<span class="tab-emoji">🥚</span><span>Œufs</span>';
        trigger.onclick = () => {document.getElementById('salonBtn').click();requestAnimationFrame(()=>eggs.showModal());};
        document.getElementById('salonBtn').after(trigger);
      }
      eggs.querySelector('.phone-egg-content').replaceChildren(panel);
    }
    area.querySelectorAll('.memory-grid').forEach(grid => {
      if (!grid.dataset.desktopColumns) grid.dataset.desktopColumns = grid.style.getPropertyValue('--memory-columns');
      const columns = phone() ? Math.min(6,Number(grid.dataset.desktopColumns) || 4) : Number(grid.dataset.desktopColumns);
      const rows = Math.ceil(grid.children.length / columns);
      if (grid.style.getPropertyValue('--memory-columns') !== String(columns)) grid.style.setProperty('--memory-columns',columns);
      grid.style.setProperty('--memory-rows', rows);
    });
    const preview=area.querySelector('.fight-preparation .battlefield-preview');
    if(phone()&&preview&&!preview.closest('.phone-fight-preview')){
      const details=document.createElement('details');details.className='phone-fight-preview';
      const summary=document.createElement('summary');summary.textContent='Terrain et statistiques détaillées';
      preview.before(details);details.append(summary,preview);
      const note=area.querySelector('.fight-power-comparison>small');
      if(note){note.dataset.phonePowerNote='true';details.append(note);}
    } else if(!phone()&&preview?.closest('.phone-fight-preview')) {
      const note=preview.closest('.phone-fight-preview').querySelector('[data-phone-power-note]');
      if(note)area.querySelector('.fight-power-comparison')?.append(note);
      preview.closest('.phone-fight-preview').replaceWith(preview);
    }
  }
  function schedule() { if (!queued) {queued = true; requestAnimationFrame(adapt);} }
  new MutationObserver(schedule).observe(area,{childList:true,subtree:true});
  addEventListener('resize',schedule);
  adapt();
})();
