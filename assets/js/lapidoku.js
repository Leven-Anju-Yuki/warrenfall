/* Lapinoudoku : un lapin par ligne, colonne et région, sans voisins. */
(() => {
  const patterns=[
  [
    "20000",
    "22211",
    "22222",
    "22333",
    "43333"
  ],
  [
    "00001",
    "11111",
    "21111",
    "44443",
    "44444"
  ],
  [
    "00011",
    "00111",
    "00211",
    "33244",
    "34444"
  ],
  [
    "110222",
    "112222",
    "333424",
    "333444",
    "444444",
    "444455"
  ],
  [
    "011122",
    "111222",
    "111222",
    "334222",
    "334425",
    "332225"
  ],
  [
    "122202",
    "122222",
    "132222",
    "335222",
    "555244",
    "555244"
  ],
  [
    "2220000",
    "2220011",
    "2224031",
    "4444433",
    "5444443",
    "5444444",
    "5546444"
  ],
  [
    "1112000",
    "1122003",
    "1132203",
    "1133333",
    "5144333",
    "5555533",
    "5565533"
  ],
  [
    "3322000",
    "3322211",
    "3322224",
    "3333224",
    "3555444",
    "3555544",
    "6554444"
  ],
  [
    "30000222",
    "30015222",
    "30335222",
    "33335544",
    "55555544",
    "55555544",
    "55555546",
    "57755546"
  ],
  [
    "00002222",
    "31002222",
    "33322222",
    "33222222",
    "33322444",
    "33666445",
    "66666455",
    "66666475"
  ],
  [
    "01144442",
    "31142222",
    "31142222",
    "33444227",
    "34442227",
    "44446257",
    "44446777",
    "44446777"
  ]
];
  const levels=patterns.map((pattern,index)=>({index,size:pattern.length,
    label:index<3?'Premiers terriers':index<6?'Petites clairières':index<9?'Jardins malins':'Grands défis',
    regions:pattern.join('').split('').map(Number)}));
  function solutions(level,limit=2){
    const result=[],columns=new Set(),regions=new Set(),placed=[];
    function visit(row,previous){
      if(row===level.size){result.push(placed.slice());return;}
      for(let col=0;col<level.size;col++){
        const at=row*level.size+col,region=level.regions[at];
        if(columns.has(col)||regions.has(region)||(row&&Math.abs(col-previous)<=1))continue;
        columns.add(col);regions.add(region);placed.push(at);visit(row+1,col);
        columns.delete(col);regions.delete(region);placed.pop();
        if(result.length>=limit)return;
      }
    }
    visit(0,-2);return result;
  }
  function create(index){
    const level=levels[index];if(!level)throw Error('Niveau Lapinoudoku inconnu');
    return {...level,regions:level.regions.slice(),board:Array(level.size**2).fill(0)};
  }
  function conflicts(board,level){
    const errors=board.map(()=>false),rabbits=[];
    board.forEach((value,index)=>{if(value===1)rabbits.push(index);});
    for(let a=0;a<rabbits.length;a++)for(let b=a+1;b<rabbits.length;b++){
      const i=rabbits[a],j=rabbits[b],r=Math.floor(i/level.size),c=i%level.size,
        y=Math.floor(j/level.size),x=j%level.size;
      if(r===y||c===x||level.regions[i]===level.regions[j]||(Math.abs(r-y)<=1&&Math.abs(c-x)<=1))errors[i]=errors[j]=true;
    }
    return errors;
  }
  function isSolved(state){
    return state.board.filter(v=>v===1).length===state.size&&!conflicts(state.board,state).some(Boolean);
  }
  const mistakeLimit=3;
  function enter(state,index,value){
    if(state.finished||!Number.isInteger(index)||index<0||index>=state.board.length||![0,1,2].includes(value))return false;
    const before=state.board[index];if(before===value)return false;
    state.board[index]=value;
    if(value===1&&conflicts(state.board,state)[index]){
      state.mistakes++;
      if(state.mistakes>=state.mistakeLimit){state.finished=true;state.lost=true;}
    }
    return true;
  }
  globalThis.LapinousBunnyGrid={levels,create,solutions,conflicts,isSolved,enter,mistakeLimit};
})();
