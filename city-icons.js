'use strict';
// One local vector catalogue for controls, categories, weather and map markers.
(function(root){
 const circle=(x,y,r)=>`M${x+r} ${y}a${r} ${r} 0 1 0 ${-2*r} 0a${r} ${r} 0 1 0 ${2*r} 0Z`;
 const paths={
  all:[circle(12,12,9),'m16 8-2.7 5.3L8 16l2.7-5.3L16 8Z'],
  search:[circle(10.5,10.5,6.5),'m15.5 15.5 5 5'],
  food:['M4 3v6a3 3 0 0 0 6 0V3M7 3v18','M19 3c-3 3-4 6-4 10h4V3Zm0 10v8'],
  scenic:['M2.5 20 9 7l6.5 13H2.5Z','m12.5 14 3.5-6 5.5 12H16',circle(18,4.5,1.5)],
  park:['M20 4C12 3 4 6 4 13a7 7 0 0 0 7 7c7 0 10-8 9-16Z','M4 21 15 10'],
  museum:['m3 9 9-5 9 5H3Z','M5 12v6m4-6v6m6-6v6m4-6v6M3 21h18'],
  heart:['M20.4 5.6a5 5 0 0 0-7.1 0L12 6.9l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.3a5 5 0 0 0 0-7.1Z'],
  filter:['M3 7h4m4 0h10M3 17h10m4 0h4',circle(9,7,2),circle(15,17,2)],
  locate:[circle(12,12,6),circle(12,12,1.5),'M12 2v3m0 14v3M2 12h3m14 0h3'],
  pin:['M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z',circle(12,10,2.5)],
  layers:['m3 8 9-5 9 5-9 5-9-5Z','m3 12 9 5 9-5m-18 5 9 5 9-5'],
  full:['M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'],
  rotate:['M3 10a9 9 0 1 1 2.6 8.5M3 4v6h6'],
  plus:['M12 5v14M5 12h14'],minus:['M5 12h14'],
  close:['m6 6 12 12M6 18 18 6'],
  arrow:['M4 12h16m-6-6 6 6-6 6'],
  'chevron-left':['m15 5-7 7 7 7'],'chevron-right':['m9 5 7 7-7 7'],'chevron-up':['m5 15 7-7 7 7'],'chevron-down':['m5 9 7 7 7-7'],
  navigate:['m3 10 18-7-7 18-3-8-8-3Z'],
  share:['M12 15V3m-4 4 4-4 4 4M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8'],
  trip:['M6 4h12a1 1 0 0 1 1 1v16H5V5a1 1 0 0 1 1-1Z','M8 2v4m8-4v4M8 10h8m-8 4h6m-6 4h3'],
  tools:['M4 3h5v6H3V4a1 1 0 0 1 1-1Zm11 0h5a1 1 0 0 1 1 1v5h-6V3ZM3 15h6v6H4a1 1 0 0 1-1-1v-5Zm12 0h6v5a1 1 0 0 1-1 1h-5v-6Z'],
  clock:[circle(12,12,9),'M12 7v5l3 2'],
  wallet:['M4 5h15a1 1 0 0 1 1 1v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13','M20 10h-5v5h5m-3-2.5h.1'],
  image:['M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z','m3 16 5-5 4 4 3-3 6 6',circle(16,7,1.5)],
  sun:[circle(12,12,4),'M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  moon:['M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z'],
  cloud:['M6 18a4 4 0 0 1-.8-7.9A6 6 0 0 1 17 8a5 5 0 1 1 1 10H6Z'],
  'cloud-sun':[circle(7,7,3),'M7 1v1M1 7h1m.8-4.2.7.7m7-1.4-.7.7','M8 20a4 4 0 1 1 0-8 5 5 0 0 1 9.6 1A3.5 3.5 0 1 1 18 20H8Z'],
  fog:['M5 13a4 4 0 0 1 .2-7.9A6 6 0 0 1 17 5a4 4 0 0 1 2 7.5M3 17h18M6 21h12'],
  rain:['M6 14a4 4 0 0 1-.8-7.9A6 6 0 0 1 17 5a4.5 4.5 0 0 1 1 9H6Z','m8 17-1 3m6-3-1 3m6-3-1 3'],
  snow:['M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7','m9 4 3 3 3-3m-6 16 3-3 3 3M4 10l4-1-1-4m13 9-4 1 1 4M4 14l4 1-1 4m13-9-4-1 1-4'],
  storm:['M6 14a4 4 0 0 1-.8-7.9A6 6 0 0 1 17 5a4.5 4.5 0 0 1 1 9','m12 12-3 6h5l-3 5']
 };
 function svg(name){const lines=paths[name]||paths.all;return '<svg class="me-icon cj-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+lines.map(d=>'<path d="'+d+'"/>').join('')+'</svg>'}
 function draw(ctx,name){for(const d of paths[name]||paths.all)ctx.stroke(new Path2D(d));}
 root.ChengjiIcons=Object.freeze({svg,draw});
})(window);
