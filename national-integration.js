'use strict';
(function(){
 if(!window.NationalTravel)return;
 const guideCount=DATA.length;
 cityCountText=function(){return `全国 ${NATIONAL.counts.destinations.toLocaleString('zh-CN')} 个目的地 · ${guideCount} 城详细攻略（800 地点 / 600 风味）`};
 citySheet=function(){NationalTravel.open()};
 const priorCoverage=coverageSheet;
 coverageSheet=function(){priorCoverage();document.querySelector('#overlay .sheet')?.insertAdjacentHTML('afterbegin','<div class="nationalMiniBanner"><strong>全国目的地已扩展</strong><span>下表统计原有 20 城详细攻略；另外收录全国城市、州盟和区县的基础目录。</span><button class="primary mini" onclick="NationalTravel.open()">浏览全国 3,212 个目的地 →</button></div>')};
 const oldSearchSheet=searchSheet,oldSearchResults=searchResults;
 searchSheet=function(){
  sheet(`<h1>想发现什么？</h1><p>搜索全国目的地，以及 20 城详细攻略中的景点与美食。</p><input class="searchInput" id="globalSearch" aria-label="搜索全国目的地与攻略" placeholder="城市、区县、景点、美食或拼音" oninput="searchResults(this.value)"><div id="national-global-results"></div><div id="searchResults"><p class="note">输入关键词开始查找。</p></div><button class="secondary wide" onclick="NationalTravel.open()">打开全国目的地目录 →</button>`);
 };
 searchResults=function(q){
  oldSearchResults(q);
  const node=document.getElementById('national-global-results');if(!node)return;
  node.innerHTML=q.trim()?`<h2>目的地</h2><div class="nationalGrid nationalSearchGrid">${NationalTravel.searchMarkup(q)||'<p class="note">暂无匹配的目的地名称。</p>'}</div><p class="note">最多显示 12 个名称匹配结果，可在全国目录中按地区继续筛选。</p><h2>已收录的景点与风味</h2>`:'';
 };
 about=function(){sheet(`<h1>城迹 · 全国旅行目录</h1><p>${cityCountText()}</p><p>全国目录收录 361 个城市、州盟等目的地与 2,851 个区县目的地，标明所属地区并提供官方文旅、景区名录和地图入口。原有 20 城保留详细攻略；其余为基础目录，景点详介、美食与照片逐步整理。</p><p>资料照片有出处，没有已核对照片的条目显示图标。当前票价、预约与开放状态有已核实和待核实之分；待核实不代表免费或免预约。</p><p>收藏、行程与消费记录保存在当前浏览器，无需登录。</p><button class="primary wide" onclick="NationalTravel.sources()">查看全国目录的来源与范围</button>`)};
 if(typeof featureGroups!=='undefined')featureGroups.explore.unshift(['全国目的地',[['全国城市与区县','按地区检索 3,212 个目的地','NationalTravel.open()','⌕'],['官方景区线索','从文旅部公开名录发现更多地点','NationalTravel.scenic()','▤']]]);
 const priorRender=render;
 render=function(){
  priorRender();
  if(typeof tab!=='undefined'&&['home','travel'].includes(tab)){
   document.getElementById('app')?.insertAdjacentHTML('afterbegin',`<button class="nationalHomeBanner" onclick="NationalTravel.open()"><span><small>城迹 · 全国目的地</small><strong>不止 20 城，下一站去哪里？</strong><span>361 个城市 / 州盟等 · 2,851 个区县 · 20 城详细攻略</span></span><b aria-hidden="true">→</b></button>`);
  }
 };
 const selected=new URL(location.href).searchParams.get('destination');
 if(selected&&DATA.some(c=>c.id===selected))chooseCity(selected);else render();
})();
