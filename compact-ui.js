'use strict';
tripRouteHTML=function(){
 const stops=tripList().filter(s=>s.day===day).map(s=>resolve(s.key)).filter(s=>s.p);
 const rows=stops.slice(1).map((s,i)=>{const a=stops[i].p,b=s.p,located=hasPoint(a)&&hasPoint(b);return `<div class="tripLeg"><div class="legHeading"><span>${esc(a.name)} <span class="legArrow">→</span> ${esc(b.name)}</span><span class="legDistance">${located?'直线 '+lineKm(a,b).toFixed(1)+' km':'待选具体地址'}</span></div><div class="legActions">${located?routeLinks(a,b):`<a class="secondary mini" target="_blank" rel="noopener" href="${esc(routeSearch(b))}">高德选地点或店家 ↗</a>`}</div></div>`});
 return `<section class="panel compactRoutes" id="trip-route-panel"><div class="row"><h2>第 ${day} 天路线</h2><span class="muted">${Math.max(0,stops.length-1)} 段路程</span></div>${rows.length?rows.slice(0,3).join(''):'<p class="routeEmpty">加入至少两个地点后查看路线。</p>'}${rows.length>3?`<details class="routeMore"><summary>展开其余 ${rows.length-3} 段路线</summary>${rows.slice(3).join('')}</details>`:''}<details class="routeHelp"><summary>距离说明</summary><p>本站显示参考点的直线距离。实际里程、预计时间和入口请在高德查看；美食需先选具体店家。</p></details></section>`;
};
function tripDayLabel(start,offset){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start))return '自由安排，按你的节奏出发';
 const date=new Date(start+'T12:00:00');
 if(!Number.isFinite(date.getTime()))return '自由安排，按你的节奏出发';
 date.setDate(date.getDate()+offset-1);
 return new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(date);
}
function refineTripLayout(app){
 const dateInput=app.querySelector('input[type="date"]'),datePanel=dateInput?.closest('.panel'),chips=app.querySelector('.chips');
 if(!datePanel||!chips)return;
 const toolbar=document.createElement('div');toolbar.className='tripToolbar';
 datePanel.before(toolbar);datePanel.classList.add('tripDate');toolbar.append(datePanel,chips);
 dateInput.onchange=function(){save('date:'+cid,this.value);render()};
 chips.setAttribute('aria-label','选择行程天数');
 chips.querySelector('.active')?.setAttribute('aria-current','date');
 const addDay=chips.lastElementChild;
 if(day===7&&addDay){addDay.disabled=true;addDay.title='最多安排 7 天'}
 const route=app.querySelector('#trip-route-panel'),steps=Array.from(app.querySelectorAll('.step'));
 const budget=app.querySelector('input[aria-label="旅行预算"]')?.closest('.panel');
 const addRow=Array.from(app.children).find(el=>el.classList.contains('row')&&el.querySelector('button[onclick="go(\'place\')"]'));
 const exportButton=app.querySelector('button[onclick="exportTrip()"].wide');
 const empty=app.querySelector('.empty'),note=exportButton?.nextElementSibling;
 const layout=document.createElement('div');layout.className='tripLayout';
 const itinerary=document.createElement('section');itinerary.className='tripItinerary';itinerary.setAttribute('aria-label','当天行程');
 const sidebar=document.createElement('aside');sidebar.className='tripSidebar';sidebar.setAttribute('aria-label','路线与预算');
 const today=tripList().filter(s=>s.day===day&&resolve(s.key).p),done=today.filter(s=>s.done).length;
 itinerary.innerHTML=`<div class="tripDayHeading"><div><h2>第 ${day} 天 <span>· ${esc(tripDayLabel(read('date:'+cid,''),day))}</span></h2></div><span class="tripDone">${done} / ${today.length} 已完成</span></div><progress class="tripDayProgress" aria-label="第 ${day} 天完成进度" max="${Math.max(1,today.length)}" value="${done}"></progress>`;
 toolbar.after(layout);layout.append(itinerary,sidebar);
 steps.forEach((step,n)=>{
  itinerary.append(step);
  const item=today[n];if(!item)return;
  step.classList.toggle('stepDone',item.done);
  const {p,c,t}=resolve(item.key),photo=imageFor(p,c,t),heading=step.querySelector('h3');
  if(heading){heading.removeAttribute('data-open');heading.innerHTML=`<button class="stepTitle" data-open="${esc(item.key)}">${esc(p.name)}</button>`}
  if(photo&&!isIllustration(photo)){
   const thumb=document.createElement('button');thumb.className='tripThumb';thumb.dataset.open=item.key;thumb.setAttribute('aria-label','查看'+p.name);
   thumb.innerHTML=`<img src="${esc(photo)}" alt="${esc(p.name)}" loading="lazy" width="64" height="64">`;
   step.querySelector('.badge').after(thumb);
  }
  const form=step.querySelector('.formrow');
  if(form){
   const details=document.createElement('details');details.className='stepSchedule';
   const summary=document.createElement('summary');summary.textContent='时间与天数 · '+(item.time||'待定')+' · 第 '+item.day+' 天';
   form.before(details);details.append(summary,form);
   form.querySelector('input[type="time"]')?.addEventListener('change',event=>{summary.textContent='时间与天数 · '+(event.target.value||'待定')+' · 第 '+item.day+' 天'});
  }
  const up=step.querySelector('button[aria-label^="上移"]'),down=step.querySelector('button[aria-label^="下移"]');
  if(up)up.disabled=n===0;if(down)down.disabled=n===steps.length-1;
 });
 if(empty)itinerary.append(empty);
 if(addRow){addRow.classList.add('tripAdd');itinerary.append(addRow)}
 if(route)sidebar.append(route);if(budget)sidebar.append(budget);if(exportButton)sidebar.append(exportButton);if(note)sidebar.append(note);
 bind();
}
const compactRender=render;render=function(){compactRender();const app=document.getElementById('app');app.classList.toggle('travelCompact',tab==='travel'||tab==='trip');if(tab==='trip')refineTripLayout(app);};
render();
