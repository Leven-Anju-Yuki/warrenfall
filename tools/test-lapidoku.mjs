import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('assets/js/lapidoku.js','utf8'),ctx);
const api=ctx.LapinousBunnyGrid;
assert.equal(api.levels.length,12);
for(const level of api.levels){
 const puzzle=api.create(level.index),n=level.size;
 assert.equal(puzzle.board.length,n*n);assert(puzzle.board.every(v=>v===0));
 assert.equal(new Set(puzzle.regions).size,n);
 for(let zone=0;zone<n;zone++){
  const cells=puzzle.regions.map((v,i)=>v===zone?i:-1).filter(i=>i>=0),seen=new Set([cells[0]]),queue=[cells[0]];
  for(const i of queue){const r=Math.floor(i/n),c=i%n;for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const y=r+dr,x=c+dc,j=y*n+x;if(y>=0&&y<n&&x>=0&&x<n&&puzzle.regions[j]===zone&&!seen.has(j)){seen.add(j);queue.push(j);}}}
  assert.equal(seen.size,cells.length,'Region connected '+level.index+'/'+zone);
 }
 const solutions=api.solutions(puzzle);assert.equal(solutions.length,1,'Unique solution '+level.index);
 const state={...puzzle,mistakes:0,mistakeLimit:3,finished:false,lost:false};
 assert(!api.isSolved(state));
 for(const i of solutions[0])assert(api.enter(state,i,1));
 assert(api.isSolved(state));assert.equal(state.mistakes,0);
 assert(!api.conflicts(state.board,state).some(Boolean));
 const modified=api.create(level.index);modified.regions[0]=99;
 assert.notEqual(api.create(level.index).regions[0],99,'No catalog mutation');
}
// Exhaustively check the four placement rules for every pair on a 5x5 grid.
const level=api.create(0),n=level.size;
for(let i=0;i<n*n;i++)for(let j=i+1;j<n*n;j++){
 const board=Array(n*n).fill(0);board[i]=board[j]=1;
 const r=Math.floor(i/n),c=i%n,y=Math.floor(j/n),x=j%n;
 const bad=r===y||c===x||level.regions[i]===level.regions[j]||(Math.abs(r-y)<=1&&Math.abs(c-x)<=1);
 assert.equal(api.conflicts(board,level)[i],bad);
 board[j]=2;assert(!api.conflicts(board,level).some(Boolean),'Cross is not a rabbit');
}
const fresh=()=>({...api.create(0),mistakes:0,mistakeLimit:3,finished:false,lost:false});
const state=fresh();api.enter(state,0,1);api.enter(state,1,1);assert.equal(state.mistakes,1);
assert.equal(api.enter(state,1,1),false);assert.equal(state.mistakes,1);
api.enter(state,1,2);assert.equal(state.mistakes,1);assert(!api.conflicts(state.board,state).some(Boolean));
api.enter(state,1,1);api.enter(state,1,0);api.enter(state,1,1);
assert(state.finished&&state.lost);assert.equal(state.mistakes,3);assert.equal(api.enter(state,1,0),false);
const marks=fresh();for(let i=0;i<n*n;i++)api.enter(marks,i,2);assert.equal(marks.mistakes,0);assert(!api.isSolved(marks));
assert.equal(api.enter(marks,-1,1),false);assert.equal(api.enter(marks,0,3),false);assert.throws(()=>api.create(99));
console.log('Lapinoudoku : 12 grilles 5×5 à 8×8, régions connectées, solution unique, quatre règles, croix gratuites, trois erreurs et verrouillage vérifiés.');
