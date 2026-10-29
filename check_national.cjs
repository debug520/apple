
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function loadData(path,prefix){return JSON.parse(fs.readFileSync(path,'utf8').slice(prefix.length).replace(/;\s*$/,''))}
const data=loadData('dist/national-data.js','window.NATIONAL='),guides=loadData('dist/city-data.js','window.DATA=');
const report=JSON.parse(fs.readFileSync('dist/national-validation.json','utf8'));
assert.equal(data.destinations.length,3212);assert.equal(guides.length,20);
assert.equal(new Set(data.destinations.map(d=>d.id)).size,3212);
assert.equal(data.provinces.length,34);
assert.equal(data.destinations.filter(d=>d.coverage==='detailed').length,20);
assert.equal(guides.reduce((n,c)=>n+c.places.length,0),800);
assert.equal(guides.reduce((n,c)=>n+c.foods.length,0),600);
for(const d of data.destinations){assert.match(d.travelUrl,/^https:\/\//);assert.equal(typeof d.pinyin,'string');if(d.coverage==='detailed')assert(guides.some(g=>g.id===d.guideId))}
for(const [id,name] of [['luoyang','洛阳博物馆'],['chengdu','金沙遗址博物馆'],['guangzhou','长隆水上乐园']])assert(guides.find(c=>c.id===id).places.find(p=>p.name===name).visit.availability);
function node(){return {innerHTML:'',textContent:'',value:'',isConnected:true,classList:{add(){}},querySelector(){return null},closest(){return {scrollTo(){}}},scrollIntoView(){},insertAdjacentHTML(where,html){this.innerHTML+=html}}}
function runtime(standalone){
 const nodes=new Map();const root=node();nodes.set(standalone?'national-app':'national-root',root);
 const context={NATIONAL:data,DATA:guides,console,URL,URLSearchParams,Map,Set,location:{href:'https://chengji-travel.onrender.com/index.html',hash:'',pathname:'/destinations.html',search:''},history:{replaceState(){}},document:{getElementById(id){if(id==='national-app'&&!standalone)return null;if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelector(){return node()}},scrollTo(){},addEventListener(){},sheet(){},chooseCity(id){context.chosen=id},tab:'home',featureGroups:{explore:[]},render(){context.rendered=true},coverageSheet(){},searchSheet(){},searchResults(){},about(){},cityCountText(){},citySheet(){}};
 context.window=context;vm.createContext(context);
 for(const file of ['national-model.js','national-ui.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),context,{filename:file});
 return {context,nodes,root};
}
const {context:c,nodes,root}=runtime(true),M=c.NationalTravel.model;
const state={scope:'cities',query:'',province:'',region:'',parent:''};
assert.equal(M.filter(state).length,361);
assert.equal(M.filter({...state,scope:'county'}).length,2851);
assert.equal(M.filter({...state,scope:'guides'}).length,20);
for(const q of ['哈尔滨','丽江','大理','阿勒泰','敦煌','凤凰','婺源','香港','澳門','臺北','aletai','haerbin'])assert(M.search(q).length>0,q);
assert.equal(M.search('大理').filter(d=>d.shortName==='大理').length,2);
c.NationalTravel.query('敦煌');assert(nodes.get('national-results').innerHTML.includes('敦煌市'));
c.NationalTravel.pick('cn-230100');assert(root.innerHTML.includes('哈尔滨市'));assert(root.innerHTML.includes('当前票价'));
assert(root.innerHTML.includes('官方'));assert(root.innerHTML.includes('nationalScenic'));
c.NationalTravel.pick('cn-620982');assert(root.innerHTML.includes('敦煌市'));assert(root.innerHTML.includes('酒泉市'));
c.NationalTravel.pick('tw-taipei');assert(root.innerHTML.includes('台北市'));assert(root.innerHTML.includes('taiwan.net.tw'));
c.NationalTravel.sources();assert(root.innerHTML.includes('2026.0.1'));assert(root.innerHTML.includes('2025-03-11'));
c.NationalTravel.scenic('65');assert(root.innerHTML.includes('景区名录线索'));
c.NationalTravel.back();c.NationalTravel.children('cn-230100');assert(nodes.get('national-result-count').textContent.includes('18'));
const modal=runtime(false);vm.runInContext(fs.readFileSync('dist/national-integration.js','utf8'),modal.context);
modal.context.citySheet();assert(modal.root.innerHTML.includes('3,212'));
const guide=data.destinations.find(d=>d.coverage==='detailed');
modal.context.NationalTravel.pick(guide.id);assert.equal(modal.context.chosen,guide.guideId);
modal.context.searchSheet();modal.context.searchResults('哈尔滨');assert(modal.nodes.get('national-global-results').innerHTML.includes('哈尔滨市'));
assert(modal.context.cityCountText().includes('详细攻略'));
assert(report.existingGuidesUnchanged);
console.log('NATIONAL_UI_MODEL_CHECKS_PASSED: scope, pinyin, aliases, hierarchy, official sources, modal integration, old guide IDs and closure flags.');
