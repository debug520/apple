'use strict';
const visitLabels={required:'需提前预约',conditional:'按条件预约','not-required':'免预约入场',unknown:'预约待核实'};
function visitBadge(p){const v=p.visit;if(!v)return '';return `<div class="visitBadges"><span class="visitTag ${v.reservationStatus}">${esc(v.availability||visitLabels[v.reservationStatus])}</span>${v.priceSource&&!v.availability?`<span class="priceTag">${esc(shortTicket(v.ticket))}</span>`:''}</div>`}
function shortTicket(text){const match=String(text||'').match(/¥\s*[\d,.]+(?:[—－-][\d,.]+)?(?:\s*起)?/);return match?'门票参考 '+match[0]:'票价见详情'}
function visitInfoHTML(p){
 const v=p.visit;if(!v)return '';
 const sources=v.sources||[];
 return `<section class="panel visitPanel"><div class="row"><h2>预约、门票与行前细节</h2><span class="visitTag ${v.reservationStatus}">${esc(v.availability?"暂停开放":visitLabels[v.reservationStatus])}</span></div>${v.availability?`<p class="closureNotice">${esc(v.availability)} · ${esc(v.availabilityCheckedAt||'')}核对</p>`:''}<div class="visitKeyFacts"><div><h3>预约与证件</h3><p>${esc(v.reservation)}</p>${v.policyCheckedAt?`<small>规则核对：${esc(v.policyCheckedAt)}</small>`:'<small>预约政策未核实，不代表无需预约</small>'}</div><div><h3>门票花费</h3><p>${esc(v.ticket)}</p>${v.priceCheckedAt?`<small>价格核对：${esc(v.priceCheckedAt)} · 人民币参考价</small>`:'<small>暂无已核实价格，不计作免费</small>'}</div></div>${v.verificationNote?`<p class="visitDisclaimer"><strong>核查说明（${esc(v.verificationCheckedAt||'')}）</strong>：${esc(v.verificationNote)}</p>`:''}<details class="visitMore"><summary>展开开放时间、交通与游玩细节</summary><dl><dt>开放与停止入场</dt><dd>${esc(v.hours)}</dd><dt>位置与交通</dt><dd>${esc(v.address)}<br>${esc(v.transport)}</dd><dt>建议预留</dt><dd>${p.duration||90} 分钟左右，为编辑规划建议；不包含市外往返、排队和用餐。</dd><dt>票内项目与额外花费</dt><dd>${esc(v.extra)}</dd><dt>同行与服务</dt><dd>${esc(v.accessibility)}</dd><dt>出发前再确认</dt><dd>所购票种、有效日期、身份证件、儿童与学生适用条件、最晚入场和退改政策。研究生是否享受学生优惠，需按各景区规定判断。</dd></dl></details><div class="visitSources">${sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')||'<span>当前政策未核实，请直接向景区官方确认。</span>'}</div><p class="visitDisclaimer">页面提供有日期的出行参考，未接入实时余票。优惠、附加体验、开放与退改条款，以官方订单和当日公告为准。</p></section>`;
}
const practicalOpenItem=openItem;openItem=function(key){
 practicalOpenItem(key);const {p,t,c}=resolve(key);if(!p||t!=='places')return;
 const title=document.querySelector('#overlay .detailTitle');title?.insertAdjacentHTML('afterend',visitInfoHTML(p));
 // The earlier extension used the currently selected city for its duplicate map link.
 const sheetNode=document.querySelector('#overlay .sheet');if(sheetNode)sheetNode.querySelectorAll('a').forEach(a=>{if(a.href.includes('uri.amap.com/search'))a.href='https://uri.amap.com/search?'+new URLSearchParams({keyword:c.name+' '+p.name,city:c.name,src:'chengji',callnative:'0'})});
};
const practicalCard=card;card=function(p,i,t='places',c=C()){const html=practicalCard(p,i,t,c);return t==='places'?html.replace('<div class="meta">',visitBadge(p)+'<div class="meta">'):html};
const practicalListcard=listcard;listcard=function(p,i,t='places',c=C()){const html=practicalListcard(p,i,t,c);return t==='places'?html.replace('<div class="row">',visitBadge(p)+'<div class="row">'):html};
placesPage=function(){
 const categories=['全部','主题乐园','动物海洋','历史人文','博物馆','街区夜游','自然公园'];
 const count=C().places.filter(p=>category==='全部'||p.group===category).length;
 document.getElementById('app').innerHTML=`<div class="section row"><div><h1>玩转${esc(C().name)}</h1><p class="muted">景点、乐园与亲子去处，按兴趣选择</p></div><button class="secondary mini" onclick="admissionDirectory()">预约与门票</button></div>${chipset(categories,category,'data-cat')}<div class="row placeFilter"><span class="muted">${count} 个地点 · 参考票价见详情</span><select aria-label="景点排序" onchange="order=this.value;render()"><option ${order==='精选顺序'?'selected':''}>精选顺序</option><option ${order==='短时优先'?'selected':''}>短时优先</option><option ${order==='收藏优先'?'selected':''}>收藏优先</option></select></div><div class="listLayout">${filteredPlaces().map(({p,i})=>listcard(p,i)).join('')}</div>${count?'':'<div class="empty">这个分类暂未收录，可以查看全部地点。</div>'}<button class="secondary wide" onclick="morePlacesSheet()">查找其他景点、游乐场与具体入口 ↗</button><p class="note">预约标签按已整理资料显示。“待核实”不代表免费或免预约；主题乐园建议单独留出一天。</p>`;
};
function admissionDirectory(){
 const places=C().places,prices=places.filter(p=>p.visit?.priceSource).length,policies=places.filter(p=>p.visit?.policySource&&p.visit.reservationStatus!=='unknown').length;
 sheet(`<h1>${esc(C().name)} · 预约与门票</h1><p>价格资料 ${prices}/${places.length} · 预约规则 ${policies}/${places.length}</p><p class="source">票务资料自2026-10-28起持续补充，每项详情附来源与实际核对日期；政府指导价、季节价和日期票会分别说明。暂未找到可靠公开资料的项目保留待核实，不能据此当作免费或免预约。</p><label class="srOnly" for="admissionQuery">筛选景点票务</label><input id="admissionQuery" class="searchInput" placeholder="搜索景点、乐园或预约关键词" oninput="admissionResults(this.value)"><div id="admissionResults"></div>`);admissionResults('');
}
function admissionResults(query){
 const q=query.trim().toLowerCase();const rows=C().places.map((p,i)=>({p,i})).filter(({p})=>(p.name+p.group+p.visit.reservation+p.visit.ticket).toLowerCase().includes(q));
 document.getElementById('admissionResults').innerHTML=`<p class="source">${rows.length} 个地点</p>`+rows.map(({p,i})=>`<button class="admissionRow" data-open="${K('places',i)}"><div class="row"><strong>${esc(p.name)}</strong><span>详情 ›</span></div>${visitBadge(p)}<p>${esc(p.visit.ticket)}</p>${p.visit.availability?`<p class="closureNotice">${esc(p.visit.availability)}</p>`:''}</button>`).join('');bind();
}
const practicalPlanner=planner;planner=function(){practicalPlanner();const select=document.getElementById('planInterest');if(select)for(const group of ['主题乐园','动物海洋'])select.insertAdjacentHTML('beforeend',`<option>${group}</option>`);const note=document.querySelector('#overlay .panel .source');if(note)note.textContent='按目录规则追加建议地点；主题乐园或动物海洋分类每天安排一个地点。未计算实时路况、余票或预约冲突，请按实际情况调整。';};
const practicalGeneratePlan=generatePlan;generatePlan=function(){
 const group=document.getElementById('planInterest')?.value;if(!['主题乐园','动物海洋'].includes(group)){
  const days=+document.getElementById('planDays').value,pace=document.getElementById('planPace').value,n={'轻松':2,'舒适':3,'充实':4}[pace],ps=C().places.map((p,i)=>({p,i})).filter(({p})=>!p.visit?.availability&&(group==='综合体验'||p.group===group)),fs=C().foods.map((p,i)=>({p,i})).filter(({p})=>!prefs.spicy||!p.spicy);let count=0;
  for(let d=1;d<=days;d++){for(let j=0;j<n;j++){const x=ps[(d-1)*n+j];if(x&&add(K('places',x.i),d))count++}if(fs[d-1]&&add(K('foods',fs[d-1].i),d))count++}
  day=1;go('trip');return toast(`已加入 ${count} 项，已避开目录标注暂不开放的地点；请核对预约与交通`);
 }
 const days=+document.getElementById('planDays').value;const rows=C().places.map((p,i)=>({p,i})).filter(({p})=>p.group===group&&!p.visit?.availability);let count=0;
 rows.slice(0,days).forEach(({p,i},index)=>{if(add(K('places',i),index+1))count++});
 if(!rows.length)return toast('本城暂未收录可安排的此类地点，请更换分类');day=1;go('trip');toast(`已加入 ${count} 项，每天一个地点；请核对已有行程、预约和往返交通`);
};
function bookingSheet(index){
 const step=tripList()[index];if(!step)return;const {p,t}=resolve(step.key);if(!p||t!=='places')return;
 sheet(`<h1>${esc(p.name)} · 行前核对</h1>${visitInfoHTML(p)}<form id="bookingForm" onsubmit="event.preventDefault();saveBooking(${index})"><label class="bookingCheck"><input id="bookingChecked" type="checkbox" ${step.bookingChecked?'checked':''}>已按本人票种核对预约、购票及入园凭证</label><label class="bookingField">这站门票计划花费（同行人合计，元）<input id="ticketEstimate" type="number" min="0" max="1000000" step="0.01" placeholder="未核算请留空，免费可填0" value="${Number.isFinite(step.ticketEstimate)?step.ticketEstimate:''}"></label><label class="bookingField">个人准备事项<input id="bookingNote" maxlength="300" placeholder="如：周五放票、儿童证件、演出场次" value="${esc(step.bookingNote||'')}"></label><p class="source">金额由你填写，作为门票预算，不会自动写入实际消费。勿填写身份证号码、订单验证码等信息。</p><button class="primary wide" type="submit">保存核对状态</button></form>`);
}
function saveBooking(index){
 const step=tripList()[index];if(!step)return;const raw=document.getElementById('ticketEstimate').value.trim();const amount=Number(raw);
 if(raw&&(!Number.isFinite(amount)||amount<0||amount>1000000))return toast('请填写0至1000000之间的金额，或留空');
 step.bookingChecked=document.getElementById('bookingChecked').checked;if(raw)step.ticketEstimate=Math.round(amount*100)/100;else delete step.ticketEstimate;
 step.bookingNote=document.getElementById('bookingNote').value.trim().slice(0,300);save('plans',plans);closeOverlay();render();toast('行前核对已保存');
}
function addTripPractical(app){
 const all=tripList().map((step,index)=>({step,index,...resolve(step.key)})).filter(x=>x.step.day===day&&x.t==='places'&&x.p);
 const steps=Array.from(app.querySelectorAll('.tripItinerary .step'));
 const today=tripList().map((step,index)=>({step,index,...resolve(step.key)})).filter(x=>x.step.day===day&&x.p);
 steps.forEach((node,i)=>{const x=today[i];if(x?.t!=='places')return;const b=document.createElement('button');b.className='bookingMini';b.textContent=(x.step.bookingChecked?'✓ 已核对票务':'◷ '+(x.p.visit.availability||visitLabels[x.p.visit.reservationStatus]))+' · 预约/费用';b.onclick=()=>bookingSheet(x.index);node.querySelector('.grow>p')?.after(b);});
 if(!all.length)return;const pending=all.filter(x=>!x.step.bookingChecked),costed=all.filter(x=>Number.isFinite(x.step.ticketEstimate)),total=costed.reduce((sum,x)=>sum+x.step.ticketEstimate,0);
 const panel=document.createElement('section');panel.className='panel bookingPanel';panel.innerHTML=`<details ${pending.some(x=>x.p.visit.reservationStatus==='required'||x.p.visit.availability)?'open':''}><summary><strong>行前核对</strong><span>${pending.length?pending.length+' 项待确认':'本日已核对 ✓'}</span></summary><p class="bookingBudget">已填写门票计划 ¥${total.toFixed(2)} <small>（${costed.length}/${all.length} 站；同行人合计）</small></p>${costed.length<all.length?'<p class="source">未填写的地点尚未计入，不代表免费。</p>':''}${all.map(x=>`<button class="bookingRow" onclick="bookingSheet(${x.index})"><span><b>${esc(x.p.name)}</b><small>${esc(x.p.visit.availability||visitLabels[x.p.visit.reservationStatus])}${x.step.bookingNote?' · '+esc(x.step.bookingNote):''}</small></span><span>${x.step.bookingChecked?'✓':'待核对'} ›</span></button>`).join('')}</details>`;
 app.querySelector('.tripSidebar')?.prepend(panel);
}
const practicalRender=render;render=function(){practicalRender();if(tab==='trip')addTripPractical(document.getElementById('app'));};
const practicalPickDay=pickDay;pickDay=function(key){practicalPickDay(key);const {p,t}=resolve(key);if(t==='places'){document.querySelector('#overlay .formrow')?.insertAdjacentHTML('beforebegin',`<div class="pickReminder">${visitBadge(p)}<p>${esc(p.visit.reservation)}</p>${p.visit.availability?`<p class="closureNotice">${esc(p.visit.availability)}，加入前请调整游玩日期。</p>`:''}<small>加入行程后，可记录预约核对状态与门票预算。</small></div>`);}};
const practicalValidateBackup=validateBackup;validateBackup=function(backup){const b=practicalValidateBackup(backup);for(const list of Object.values(b.data.plans||{}))for(const step of list){if(step.bookingChecked!==undefined&&typeof step.bookingChecked!=='boolean')throw Error('预约核对状态格式无效');if(step.ticketEstimate!==undefined&&(!Number.isFinite(step.ticketEstimate)||step.ticketEstimate<0||step.ticketEstimate>1000000))throw Error('门票计划金额无效');if(step.bookingNote!==undefined&&(typeof step.bookingNote!=='string'||step.bookingNote.length>300))throw Error('行前备注格式无效')}return b};
exportTrip=function(){
 const lines=[`# 城迹 · ${C().name}旅行手账`,`出发日期：${read('date:'+cid,'')||'待定'}`];
 for(let d=1;d<=7;d++){
  const rows=tripList().filter(s=>s.day===d);if(!rows.length)continue;lines.push(`\n## 第 ${d} 天`);
  rows.forEach(s=>{const {p,t}=resolve(s.key);if(!p)return;lines.push(`### ${s.time||'时间待定'} ${p.name} ${s.done?'✓':''}`,p.story||p.description||'',notes[s.key]?'我的笔记：'+notes[s.key]:'',`资料：${p.url}`);if(t==='places'&&p.visit){const v=p.visit;lines.push('预约：'+v.reservation,'门票参考：'+v.ticket,'开放：'+v.hours,'额外花费与提醒：'+v.extra,v.verificationNote?'核查说明（'+(v.verificationCheckedAt||'')+'）：'+v.verificationNote:'','预约/票务本人核对：'+(s.bookingChecked?'已核对':'待核对'),'门票计划（同行合计）：'+(Number.isFinite(s.ticketEstimate)?'¥'+s.ticketEstimate.toFixed(2):'尚未填写'),s.bookingNote?'个人准备事项：'+s.bookingNote:'',...(v.sources||[]).map(x=>x.label+'：'+x.url))}});
 }
 lines.push('\n## 实际消费记录',...expenses.filter(x=>x.city===cid).map(x=>`${x.type} ¥${x.amount.toFixed(2)} ${x.note||''}`),`实际消费合计 ¥${totalCost().toFixed(2)}`,'门票计划不计入实际消费；请出发前核对当前官方票务与开放安排。');
 writeFile('城迹_'+C().name+'_旅行手账.md',lines.filter(Boolean).join('\n\n'),'text/markdown');toast('旅行手账已准备下载');
};
featureGroups.explore.push(['乐园与行前准备',[['主题乐园','环球、欢乐谷、长隆等目的地',"go('place','主题乐园')",'🎢'],['动物与海洋','动物园、海洋馆与亲子观察',"go('place','动物海洋')",'🐼'],['预约与门票','查规则、价格参考和原始来源','admissionDirectory()','🎫']]]);
featureGroups.tools.push(['预约与花费',[['景点预约与门票','查看本城景点的行前信息','admissionDirectory()','🎫']]]);
const practicalAbout=about;about=function(){practicalAbout();document.querySelector('#overlay .sheet')?.insertAdjacentHTML('beforeend','<p>新增51个乐园、动物海洋及其他地点，现有302个景点。已核实的票价和预约规则附来源与日期；未核实部分明确标注。行前核对与门票计划随行程保存在本浏览器。</p>')};
render();
const practicalIncoming=new URL(location.href).searchParams.get('item');if(practicalIncoming&&validSharedItem(practicalIncoming))openItem(practicalIncoming);
