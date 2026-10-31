import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('assets/js/salon-layout.js','utf8'),context);
const {project,seats}=context.window.LapinousSalonLayout;
// Comparer les zones au decor source, puis au meme decor recadre en cover.
for(const [w,h] of [[1672,941],[1920,800],[1024,768],[390,844],[844,390]]) {
  const boxes=project(w,h,1672,941);
  const scale=Math.max(w/1672,h/941), ox=(w-1672*scale)/2, oy=(h-941*scale)/2;
  assert.equal(boxes.length,3);
  boxes.forEach((box,i)=>{
    assert.ok(Math.abs((box.left-ox)/scale-seats[i].x*1672)<1e-8);
    assert.ok(Math.abs((box.top+box.height-oy)/scale-(seats[i].y+seats[i].height)*941)<1e-8,'Feet must stay on the same point of the seat');
    assert.ok(box.width>0 && box.height>0);
  });
  assert.ok(boxes[1].left+boxes[1].width<=boxes[2].left+1e-8,'Sofa seats must not overlap');
}
assert.equal(project(0,800,1672,941).length,0);
console.log('Salon seat alignment across desktop, portrait, landscape and cover cropping: OK');
