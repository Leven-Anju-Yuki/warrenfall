/* Rappels locaux : aucun serveur ni autorisation de notification système. */
(() => {
  const day = date => Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000;
  function upcoming(now,windows,easter,lunar) {
    const result=[];
    for(let year=now.getFullYear();year<=now.getFullYear()+1;year++) {
      const anchors={halloween:new Date(year,9,31),noel:new Date(year,11,25),paques:easter(year),nouvel_an_chinois:lunar(year)};
      for(const [event,anchor] of Object.entries(anchors)) {
        const width=Number(windows[event]);
        if(!anchor||!Number.isFinite(width)||width<0||width>366)continue;
        const start=new Date(anchor.getFullYear(),anchor.getMonth(),anchor.getDate()-Math.floor(width));
        const days=day(start)-day(now);
        if(days>=1&&days<=5)result.push({id:`${event}:${year}`,event,start,days});
      }
    }
    return result.sort((a,b)=>a.days-b.days);
  }
  function deliver(events,storage,notify) {
    let seen={};
    try{seen=JSON.parse(storage.getItem('warrenfall_event_reminders_v1')||'{}');if(!seen||typeof seen!=='object'||Array.isArray(seen))seen={};}catch{}
    const sent=[];
    for(const event of events) {
      if(seen[event.id])continue;
      if(notify(event)!==true)continue;
      seen[event.id]=true;sent.push(event.id);
      try{storage.setItem('warrenfall_event_reminders_v1',JSON.stringify(seen));}catch{}
    }
    return sent;
  }
  window.LapinousEventReminders={upcoming,deliver};
})();
