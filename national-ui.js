'use strict';
(function(){
 const data=window.NATIONAL, model=window.ChengjiNationalModel(data);
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const standalone=!!document.getElementById('national-app');
 const state={query:'',region:'',province:'',scope:'cities',parent:'',page:1,view:'directory',selected:''};
 const pageSize=48, regions=['华北','东北','华东','华中','华南','西南','西北','港澳台'];
 let root=null;
 const isGuide=d=>d.coverage==='detailed';
 const link=(url,label,cls='secondary')=>`<a class="${cls}" href="${E(url)}" target="_blank" rel="noopener">${E(label)} ↗</a>`;
 const tile=d=>`<button class="nationalTile" onclick="NationalTravel.pick('${d.id}')"><span class="nationalTileTop">${E(d.province)} · ${E(d.kind)}</span><strong>${E(d.name)}</strong><span class="nationalTileParent">${E(d.level==='county'?d.prefecture||'省级直辖':d.region)}</span><span class="nationalBadge ${isGuide(d)?'complete':''}">${isGuide(d)?`${d.guidePlaces} 地点 · ${d.guideFoods} 风味`:'基础目录'}</span><span class="nationalTileArrow" aria-hidden="true">↗</span></button>`;
 function open(){
  if(standalone){root=document.getElementById('national-app');render();return}
  window.sheet('<div id="national-root" class="nationalRoot"></div>');root=document.getElementById('national-root');render();
 }
 function ensureRoot(){if(!root?.isConnected)open()}
 function header(){
  return `<div class="nationalIntro"><span class="nationalEyebrow">城迹 · 全国目的地</span><h1>下一站，去哪里？</h1><p>从城市到小城与县乡，沿着地图慢慢发现。</p><div class="nationalStats"><span><b>361</b> 城市 / 州盟等</span><span><b>2,851</b> 区县目的地</span><span><b>20</b> 城详细攻略</span></div></div>`;
 }
 function directory(){
  root.innerHTML=`${header()}<div class="nationalScopeNote">已收录 3,212 个目的地名称与查询入口。20 城有详细攻略，其余为基础目录，景点和美食正在整理。目录收录不代表当前开放或可直接进入。</div><div class="nationalFilters"><label class="nationalSearch"><span>搜索目的地</span><input id="national-query" aria-label="搜索全国目的地" type="search" placeholder="城市、区县、拼音，如哈尔滨 / 敦煌" value="${E(state.query)}" oninput="NationalTravel.query(this.value)"></label><div class="nationalRegions" aria-label="选择区域">${['',...regions].map(r=>`<button class="${state.region===r?'active':''}" aria-pressed="${state.region===r}" onclick="NationalTravel.region('${r}')">${r||'全国'}</button>`).join('')}</div><div class="nationalSelects"><label>省 / 自治区 / 港澳台<select id="national-province" aria-label="筛选省级地区" onchange="NationalTravel.province(this.value)"><option value="">全部地区</option>${data.provinces.filter(p=>!state.region||p.region===state.region).map(p=>`<option value="${p.code}" ${state.province===p.code?'selected':''}>${E(p.name)}</option>`).join('')}</select></label><label>目录范围<select id="national-scope" aria-label="选择目的地层级" onchange="NationalTravel.scope(this.value)">${[['cities','城市 / 州盟等 · 361'],['county','区县目的地 · 2851'],['all','全部目的地 · 3212'],['guides','已有详细攻略 · 20']].map(([value,label])=>`<option value="${value}" ${state.scope===value?'selected':''}>${label}</option>`).join('')}</select></label></div>${state.parent?`<button class="secondary mini" onclick="NationalTravel.clearParent()">正在查看${E(data.destinations.find(d=>d.code===state.parent)?.name||'本地')}所辖区县 · 清除 ×</button>`:''}<p class="nationalHint">输入关键词时会同时搜索城市和区县；同名地区会标明省份与上级地区。</p></div><div class="nationalResultsHeading"><p id="national-result-count" role="status" aria-live="polite"></p><button class="nationalTextButton" onclick="NationalTravel.sources()">数据来源与收录范围 ↗</button></div><div class="nationalGrid" id="national-results"></div><div class="nationalPagination" id="national-pagination"></div><div class="nationalFootnote">先从官方信息开始：<button class="nationalTextButton" onclick="NationalTravel.scenic()">浏览官方景区名录线索 ↗</button><br>景区名录截止 2025-03-11；当前票价、预约与开放状态须另行核实。</div>`;
  results();
 }
 function results(){
  if(!document.getElementById('national-results'))return;
  const rows=model.filter(state),pages=Math.max(1,Math.ceil(rows.length/pageSize));state.page=Math.min(state.page,pages);
  document.getElementById('national-result-count').textContent=`找到 ${rows.length.toLocaleString('zh-CN')} 个目的地 · 第 ${state.page} / ${pages} 页`;
  document.getElementById('national-results').innerHTML=rows.slice((state.page-1)*pageSize,state.page*pageSize).map(tile).join('')||'<div class="nationalEmpty"><h2>暂未找到匹配的目的地</h2><p>试试完整名称、拼音，或清除省份和区域筛选。</p><button class="secondary" onclick="NationalTravel.reset()">清除全部筛选</button></div>';
  document.getElementById('national-pagination').innerHTML=`<button class="secondary" ${state.page<=1?'disabled':''} onclick="NationalTravel.page(-1)">上一页</button><span>${state.page} / ${pages}</span><button class="secondary" ${state.page>=pages?'disabled':''} onclick="NationalTravel.page(1)">下一页</button>`;
 }
 function render(){if(state.view==='profile')profile();else if(state.view==='sources')sources();else if(state.view==='scenic')scenicPage();else directory()}
 function pick(id,enterGuide=true){
  const d=model.byId.get(id);if(!d)return;
  if(isGuide(d)&&enterGuide&&!standalone&&typeof window.chooseCity==='function'){window.chooseCity(d.guideId);return}
  state.selected=id;state.view='profile';ensureRoot();profile();
  if(standalone)history.replaceState(null,'','#'+id);
  scrollTop();
 }
 function back(){state.view='directory';ensureRoot();directory();if(standalone)history.replaceState(null,'',location.pathname+location.search);scrollTop()}
 function scrollTop(){if(standalone)window.scrollTo({top:0,behavior:'smooth'});else root?.closest('.sheet')?.scrollTo({top:0,behavior:'smooth'})}
 function scenicCard(item,d){
  const dest=d||model.byId.get(item.destinationId);
  const mapDest=dest||{province:item.province,prefecture:'',name:item.city||item.province};
  return `<article class="nationalScenic"><div class="nationalEyebrow">官方名录线索 · ${E(item.province)}${item.city?' · '+E(item.city):''}</div><h3>${E(item.name)}</h3><p class="nationalHint">名录标注年份：${E(item.year)} · 当前票价、预约和开放状态待核实。</p><div class="nationalActions">${link(item.url,'文旅部名录')}${link(model.map(mapDest,item.name),'地图查找')}</div></article>`;
 }
 function profile(){
  const d=model.byId.get(state.selected);if(!d)return back();
  const parent=model.parent(d),children=model.children(d),leads=d.scenicIds.map(i=>data.scenic[i]);
  root.innerHTML=`<button class="nationalTextButton nationalBack" onclick="NationalTravel.back()">← 返回目的地目录</button><div class="nationalProfileHero"><span class="nationalEyebrow">${E(d.province)}${d.prefecture&&d.prefecture!==d.name?' · '+E(d.prefecture):''} · ${E(d.kind)}</span><h1>${E(d.name)}</h1><span class="nationalBadge ${isGuide(d)?'complete':''}">${isGuide(d)?'已有详细攻略':'基础目录 · 攻略待完善'}</span><p>${isGuide(d)?`已收录 ${d.guidePlaces} 个地点与 ${d.guideFoods} 种地方风味。`:'已收录目的地名称、所属地区与官方文旅入口。景点详介、美食与资料照片尚未补齐。'}</p>${isGuide(d)?`<a class="primary" href="index.html?destination=${E(d.guideId)}">进入${E(d.shortName)}详细攻略 →</a>`:''}</div><div class="nationalActions">${link(d.travelUrl,d.travelLabel,'primary')}${link(model.map(d,'景点'),'地图发现景点')}${link(model.map(d,'本地餐馆'),'查找本地餐馆')}${link(model.map(d,'酒店'),'查找住宿')}</div><p class="nationalScopeNote">地图与官方链接在新窗口打开。基础目录没有已核实的当前票价、预约、开放安排或逐店美食资料；请在实际出发日期核对。</p>${parent?`<section class="nationalSection"><h2>所属地区</h2>${tile(parent)}</section>`:''}${children.length?`<section class="nationalSection"><div class="nationalSectionHeading"><h2>下辖区县 · ${children.length}</h2><button class="nationalTextButton" onclick="NationalTravel.children('${d.id}')">查看全部 ↗</button></div><div class="nationalGrid">${children.slice(0,12).map(tile).join('')}</div></section>`:''}<section class="nationalSection"><div class="nationalSectionHeading"><h2>${leads.length?'本地官方景区名录线索 · '+leads.length:'继续了解当地'}</h2><button class="nationalTextButton" onclick="NationalTravel.scenic('${d.provinceCode}')">查看${E(d.province)}名录 ↗</button></div>${leads.length?leads.map(item=>scenicCard(item,d)).join(''):`<div class="nationalEmpty"><p>尚未整理可明确归属本目的地的景区名录线索。可先查看官方文旅信息、地图及所在地区的名录。</p>${link(d.travelUrl,'官方文旅入口')}</div>`}<p class="nationalHint">名录来源：文化和旅游部；数据截止 2025-03-11，核对日期 2026-10-29。名录用于发现地点，不代表当前等级、票务或营业实况。跨地区及归属不明条目仅在省级名录展示。</p></section><div class="nationalFootnote"><a href="destinations.html#${E(d.id)}">本目的地独立链接 ↗</a> · <button class="nationalTextButton" onclick="NationalTravel.sources()">收录范围与来源</button></div>`;
 }
 let scenicProvince='',scenicPageIndex=1;
 function scenicPage(){
  const rows=data.scenic.filter(x=>!scenicProvince||x.provinceCode===scenicProvince),pages=Math.max(1,Math.ceil(rows.length/24));
  scenicPageIndex=Math.min(scenicPageIndex,pages);
  root.innerHTML=`<button class="nationalTextButton nationalBack" onclick="NationalTravel.back()">← 返回目的地目录</button><span class="nationalEyebrow">从官方资料出发</span><h1>景区名录线索</h1><p>文化和旅游部国家 5A 级旅游景区公开名录，截止 2025-03-11。共 359 条省级名录记录，名称去重后 358 处；黄河壶口瀑布在山西、陕西分别列出。</p><p class="nationalScopeNote">名录不等于当前票务资料。票价、淡旺季、日期票、预约、附加项目费用与开放状态均需另行核实。</p><label class="nationalProvinceLabel">所在地区<select aria-label="景区名录按地区筛选" onchange="NationalTravel.scenic(this.value)"><option value="">全国名录</option>${data.provinces.filter(p=>!['71','81','82'].includes(p.code)).map(p=>`<option value="${p.code}" ${p.code===scenicProvince?'selected':''}>${E(p.name)}</option>`).join('')}</select></label><p class="nationalHint">${rows.length} 条 · 第 ${scenicPageIndex}/${pages} 页</p>${rows.slice((scenicPageIndex-1)*24,scenicPageIndex*24).map(item=>scenicCard(item)).join('')}<div class="nationalPagination"><button class="secondary" ${scenicPageIndex<=1?'disabled':''} onclick="NationalTravel.scenicPage(-1)">上一页</button><span>${scenicPageIndex} / ${pages}</span><button class="secondary" ${scenicPageIndex>=pages?'disabled':''} onclick="NationalTravel.scenicPage(1)">下一页</button></div>${link(data.scenicMetadata.source,'查看官方完整名录')}`;
 }
 function sources(){
  root.innerHTML=`<button class="nationalTextButton nationalBack" onclick="NationalTravel.back()">← 返回目的地目录</button><span class="nationalEyebrow">城迹 · 收录说明</span><h1>目录覆盖到哪里？</h1><div class="nationalSourceBlock"><h2>3,212 个目的地，分层收录</h2><p>大陆 333 个地级行政区、4 个直辖市，以及 2,847 个县级行政区；另收录大兴安岭 4 个行政管理区。港澳各设目的地入口，台湾收录 22 个县市。城市、自治州、地区、盟与区县分别标注，不把全部条目称作“城市”。</p><p>行政名称目录帮助检索，并不代表每一处均为景区、当前开放或适合直接进入。省直辖县级目的地保留在区县目录中，未重复升格为地级市。</p></div><div class="nationalSourceBlock"><h2>20 城详细攻略继续保留</h2><p>原有 800 个地点、600 种风味、真实资料照片、收藏与行程功能保持原有内容和条目编号。其余目的地为基础目录，提供官方文旅与地图查询入口，不以通用照片、编造美食或未知价格充数。</p></div><div class="nationalSourceBlock"><h2>来源与日期</h2><p>目录采用 cn-division 2026.0.1 开源整理数据，上游来源为民政部地名服务接口，并核对近期地方政府变更公告。核对时官方接口未能正常响应，使用固定版本数据；2026-10-29 是整理核对日期，不代表每日实时官方数据。</p>${data.directoryMetadata.sources.map(s=>`<p>${link(s.url,s.label,'nationalSourceLink')}</p>`).join('')}<p>${link('https://wlt.hubei.gov.cn/fzlm/yqlj/gswlwz/','各省文旅官网链接来源（湖北文旅厅）','nationalSourceLink')}</p><p>${link(data.scenicMetadata.source,'文旅部景区名录（数据截止 2025-03-11）','nationalSourceLink')}</p><p>港澳台使用当地官方旅游信息入口，各目的地卡片附链接。官方入口不等于实时营业、票价或出入安排核实。</p></div><div class="nationalSourceBlock"><h2>保留“待核实”</h2><p>景区名录只提供发现地点的线索。淡旺季价格、指定日期票、免费区域、索道、交通车、游船、演出及特展费用需分别确认；没有可靠资料时保留待核实。</p><details><summary>开源数据许可</summary><p>${E(data.directoryMetadata.license?.name||'MIT')} · ${E(data.directoryMetadata.license?.project||'cn-division')}</p><pre class="nationalLicense">${E(data.directoryMetadata.license?.text||'')}</pre></details></div>`;
 }
 const api={
  open,back,pick,sources:()=>{state.view='sources';ensureRoot();sources();scrollTop()},
  query:q=>{state.query=q;state.scope='all';state.page=1;const s=document.getElementById('national-scope');if(s)s.value='all';results()},
  region:r=>{state.region=r;state.province='';state.parent='';state.page=1;directory()},
  province:p=>{state.province=p;state.parent='';state.page=1;directory()},
  scope:s=>{state.scope=s;state.page=1;results()},
  page:step=>{state.page=Math.max(1,state.page+step);results();root.querySelector('.nationalResultsHeading')?.scrollIntoView({block:'start',behavior:'smooth'})},
  reset:()=>{Object.assign(state,{query:'',region:'',province:'',scope:'cities',parent:'',page:1});directory()},
  clearParent:()=>{state.parent='';state.page=1;directory()},
  children:id=>{const d=model.byId.get(id);if(!d)return;Object.assign(state,{view:'directory',province:d.provinceCode,region:'',parent:d.code,scope:'county',query:'',page:1});directory();scrollTop()},
  scenic:province=>{state.view='scenic';scenicProvince=province||'';scenicPageIndex=1;ensureRoot();scenicPage();scrollTop()},
  scenicPage:step=>{scenicPageIndex=Math.max(1,scenicPageIndex+step);scenicPage();scrollTop()},
  searchMarkup:q=>model.search(q).slice(0,12).map(tile).join(''),
  model
 };
 window.NationalTravel=api;
 if(standalone){root=document.getElementById('national-app');root.classList.add('nationalRoot');const id=decodeURIComponent(location.hash.slice(1));if(model.byId.has(id)){state.selected=id;state.view='profile'}render();window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(model.byId.has(id))pick(id,false);else back()})}
})();
