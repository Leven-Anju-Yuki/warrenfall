import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync('assets/js/number-sudoku.js','utf8'),ctx);
const api=ctx.LapinousSudoku;
let previousGiven=82;
for(const level of api.levels){
  const puzzle=api.create(level.index);
  assert.equal(puzzle.board.length,level.size**2);
  assert.equal(api.solutions(puzzle.board,level),1,'Solution unique au niveau '+level.index);
  assert(!api.conflicts(puzzle.solution,level).some(Boolean));
  assert(puzzle.board.some(v=>!v));
  if(level.size===9){
    const given=puzzle.board.filter(Boolean).length;
    assert.equal(given,Math.round(81*level.givenPercent/100));
    assert(given<previousGiven,'Moins de chiffres présents à chaque niveau 9×9');previousGiven=given;
  }
  assert(puzzle.board.every((v,i)=>!v||v===puzzle.solution[i]));
  const duplicate=puzzle.solution.slice();duplicate[1]=duplicate[0];
  assert(api.conflicts(duplicate,level).some(Boolean));
  assert.deepEqual(api.create(level.index).board,puzzle.board);
}
assert.throws(()=>api.create(99));
console.log('Lapidoku : 12 niveaux 4×4, 6×6 et 9×9, solutions uniques, chiffres fixes et conflits vérifiés.');

const puzzle=api.create(0);
const fresh=()=>({...puzzle,board:puzzle.board.slice(),given:puzzle.board.map(Boolean),mistakes:0,mistakeLimit:api.mistakeLimit,finished:false,lost:false});
const state=fresh(),slot=state.board.indexOf(0),wrong=state.solution[slot]%state.size+1;
assert(api.enter(state,slot,wrong));assert.equal(state.mistakes,1);
api.enter(state,slot,wrong);assert.equal(state.mistakes,1,'Même valeur sans changement : pas de nouvelle erreur');
api.enter(state,slot,0);assert.equal(state.mistakes,1,'Effacement gratuit');
api.enter(state,slot,wrong);assert.equal(state.mistakes,2);
api.enter(state,slot,0);api.enter(state,slot,wrong);
assert(state.lost&&state.finished);assert.equal(state.mistakes,3);
assert.equal(api.enter(state,slot,state.solution[slot]),false,'Défaite verrouillée');
const restarted=fresh();assert.equal(restarted.mistakes,0);assert(!restarted.finished);
api.enter(restarted,slot,restarted.solution[slot]);assert.equal(restarted.mistakes,0);
const fixed=restarted.given.findIndex(Boolean);assert.equal(api.enter(restarted,fixed,wrong),false);
console.log('Erreurs : seuil 3, saisie correcte et effacement gratuits, défaite verrouillée et remise à zéro vérifiés.');
