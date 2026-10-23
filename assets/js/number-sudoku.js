/* Grilles déterministes à solution unique ; aucune donnée de partie dans ce module. */
(() => {
  const givenPercentages = [65,60,55,50,45,40];
  const levels = [6,8,10,8,12,16,28,32,36,40,44,48].map((holes,index)=>({
    index, size:index<3?4:index<6?6:9, rows:index<6?2:3, cols:index<3?2:3, holes:index<6?holes:81-Math.round(81*givenPercentages[index-6]/100),
    givenPercent:index<6?null:givenPercentages[index-6],
    label:index<3?'Découverte':index<6?'Intermédiaire':index<9?'Classique':'Défi'
  }));
  function candidates(board,i,size,rows,cols) {
    const r=Math.floor(i/size), c=i%size, used=new Set();
    for(let k=0;k<size;k++){used.add(board[r*size+k]);used.add(board[k*size+c]);}
    for(let y=r-r%rows;y<r-r%rows+rows;y++)for(let x=c-c%cols;x<c-c%cols+cols;x++)used.add(board[y*size+x]);
    return Array.from({length:size},(_,n)=>n+1).filter(n=>!used.has(n));
  }
  function solutions(input,level,limit=2) {
    const board=input.slice(); let count=0;
    function visit(){
      let at=-1, choices=[];
      for(let i=0;i<board.length;i++)if(!board[i]){
        const found=candidates(board,i,level.size,level.rows,level.cols);
        if(!found.length)return;
        if(at<0||found.length<choices.length){at=i;choices=found;if(found.length===1)break;}
      }
      if(at<0){count++;return;}
      for(const value of choices){board[at]=value;visit();if(count>=limit)break;}
      board[at]=0;
    }
    visit();return count;
  }
  function create(index) {
    const level=levels[index];if(!level)throw Error('Niveau Lapidoku inconnu');
    let seed=8173+index*104729;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    const {size,rows,cols}=level;
    const digits=shuffle(Array.from({length:size},(_,i)=>i+1));
    const order=(groups,within)=>shuffle(Array.from({length:groups},(_,i)=>i)).flatMap(g=>shuffle(Array.from({length:within},(_,i)=>g*within+i)));
    const rr=order(size/rows,rows), cc=order(size/cols,cols);
    const solution=rr.flatMap(r=>cc.map(c=>digits[(cols*(r%rows)+Math.floor(r/rows)+c)%size]));
    const board=solution.slice();let removed=0;
    for(const i of shuffle(Array.from({length:board.length},(_,i)=>i))){
      const value=board[i];board[i]=0;
      if(solutions(board,level)!==1)board[i]=value;else removed++;
      if(removed>=level.holes)break;
    }
    return {...level,board,solution};
  }
  function conflicts(board,level){
    return board.map((value,i)=>{if(!value)return false;const copy=board.slice();copy[i]=0;return !candidates(copy,i,level.size,level.rows,level.cols).includes(value);});
  }
  const mistakeLimit=3;
  function enter(state,index,value){
    if(state.finished||!Number.isInteger(index)||index<0||index>=state.board.length||state.given[index]||!Number.isInteger(value)||value<0||value>state.size)return false;
    const previous=state.board[index];
    state.board[index]=value;
    if(value!==0&&value!==previous&&value!==state.solution[index]){
      state.mistakes++;
      if(state.mistakes>=state.mistakeLimit){state.lost=true;state.finished=true;}
    }
    return true;
  }
  globalThis.LapinousSudoku={levels,create,solutions,conflicts,enter,mistakeLimit};
})();
