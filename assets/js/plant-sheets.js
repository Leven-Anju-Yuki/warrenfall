/* Les bouquets fournis restent intacts ; seules leurs cases sont affichées. */
(() => {
  const folder='assets/img/magasin/aliments/';
  const flowers=['camomille','bleuet','soucis','pissenlit','rose'];
  const borders=[0,350,670,990,1310,1672];
  const sheets=[
    ['assets/img/magasin/aliments/Cinq bouquets floraux fantastiques colorés.png',flowers.map((name,i)=>[folder+name+'.png',[borders[i]/1672,0,(borders[i+1]-borders[i])/1672,1]])],
    ['assets/img/magasin/aliments/Planche botanique d’herbes et fleurs remarquables (1).png',[
      ['menthe',[0,0,330,310]],['aneth',[330,0,370,400]],['coriandre',[700,0,340,400]],
      ['celeri',[1040,0,365,410]],['fenouil',[1405,0,369,410]],['myrtilles',[0,310,400,195]],
    ].map(([name,box])=>[folder+name+'.png',box.map((n,i)=>n/(i%2===0?1774:505))])],
  ];
  window.LapinousPlantsReady=Promise.allSettled(sheets.map(([source,entries])=>window.LapinousImages.registerSheet(source,entries)));
})();
