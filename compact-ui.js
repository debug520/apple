'use strict';
tripRouteHTML=function(){
 const stops=tripList().filter(s=>s.day===day).map(s=>resolve(s.key)).filter(s=>s.p);
 const rows=stops.slice(1).map((s,i)=>{const a=stops[i].p,b=s.p,located=hasPoint(a)&&hasPoint(b);return `<div class="tripLeg"><div class="legHeading"><span>${esc(a.name)} <span class="legArrow">→</span> ${esc(b.name)}</span><span class="legDistance">${located?'直线 '+lineKm(a,b).toFixed(1)+' km':'待选具体地址'}</span></div><div class="legActions">${located?routeLinks(a,b):`<a class="secondary mini" target="_blank" rel="noopener" href="${esc(routeSearch(b))}">高德选地点或店家 ↗</a>`}</div></div>`});
 return `<section class="panel compactRoutes" id="trip-route-panel"><div class="row"><h2>第 ${day} 天路线</h2><span class="muted">${Math.max(0,stops.length-1)} 段路程</span></div>${rows.length?rows.slice(0,3).join(''):'<p class="routeEmpty">加入至少两个地点后查看路线。</p>'}${rows.length>3?`<details class="routeMore"><summary>展开其余 ${rows.length-3} 段路线</summary>${rows.slice(3).join('')}</details>`:''}<details class="routeHelp"><summary>距离说明</summary><p>本站显示参考点的直线距离。实际里程、预计时间和入口请在高德查看；美食需先选具体店家。</p></details></section>`;
};
const compactRender=render;render=function(){compactRender();const app=document.getElementById('app');app.classList.toggle('travelCompact',tab==='travel'||tab==='trip');if(tab==='trip'){app.querySelector('input[type="date"]')?.closest('.panel')?.classList.add('tripDate');}};
render();
