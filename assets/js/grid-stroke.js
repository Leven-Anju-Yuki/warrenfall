/* Cases traversées entre deux événements : même un geste rapide reste continu. */
window.LapinousGridStroke=(from,to,width,height)=>{
  const dx=to.x-from.x,dy=to.y-from.y,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))*2)),cells=new Set();
  for(let n=0;n<=steps;n++){const x=Math.floor(from.x+dx*n/steps),y=Math.floor(from.y+dy*n/steps);if(x>=0&&x<width&&y>=0&&y<height)cells.add(y*width+x);}
  return [...cells];
};
