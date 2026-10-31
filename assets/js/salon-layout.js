/* Zones du salon en coordonnées de l'image (0 à 1), jamais de l'écran.
 * x/y = coin supérieur du rectangle ; les pattes reposent sur son bord bas.
 * Le même calcul « cover, center » que le fond conserve l'alignement au zoom
 * du navigateur, au redimensionnement et au changement d'orientation.
 */
(() => {
  'use strict';
  const seats = Object.freeze([
    Object.freeze({id:'armchair', label:'Fauteuil', x:.175, y:.365, width:.115, height:.185}),
    Object.freeze({id:'sofa-left', label:'Canapé — place 1', x:.65, y:.36, width:.095, height:.19}),
    Object.freeze({id:'sofa-right', label:'Canapé — place 2', x:.745, y:.36, width:.095, height:.19}),
  ]);
  function project(viewportWidth, viewportHeight, imageWidth, imageHeight) {
    if (![viewportWidth, viewportHeight, imageWidth, imageHeight].every(n => Number.isFinite(n) && n > 0)) return [];
    const scale = Math.max(viewportWidth/imageWidth, viewportHeight/imageHeight);
    const width=imageWidth*scale, height=imageHeight*scale;
    const left=(viewportWidth-width)/2, top=(viewportHeight-height)/2;
    return seats.map(seat => ({...seat,
      left:left+seat.x*width, top:top+seat.y*height,
      width:seat.width*width, height:seat.height*height,
    }));
  }
  function fit(area, backdrop) {
    const friends = [...area.querySelectorAll('.salon-rabbit-friend')];
    const boxes=project(innerWidth, innerHeight, backdrop.width, backdrop.height);
    boxes.forEach((box,index) => {
      let zone=area.querySelector(`[data-salon-seat="${box.id}"]`);
      if (!zone) {
        zone=document.createElement('div'); zone.className='salon-seat';
        zone.dataset.salonSeat=box.id; zone.dataset.label=box.label;
        area.append(zone);
      }
      Object.assign(zone.style, {left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
      const friend=friends[index];
      if (friend && friend.parentElement !== zone) {
        // Abandonner les anciennes positions individuelles : seul le rectangle
        // de l'assise détermine désormais la place et la taille du lapin.
        friend.removeAttribute('style'); zone.append(friend);
      }
    });
  }
  window.LapinousSalonLayout=Object.freeze({project,fit,seats});
})();
