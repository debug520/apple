'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=(name,prefix)=>JSON.parse(fs.readFileSync('dist/'+name,'utf8').slice(prefix.length).replace(/;\s*$/,''));
const DATA=read('city-data.js','window.DATA='),NATIONAL=read('national-data.js','window.NATIONAL='),geo=read('atlas-data.js','window.CHENGJI_ATLAS=');
const before=JSON.stringify(DATA);assert.equal(geo.provinces.length,34);assert(geo.seaPath.length>100);assert(geo.provinces.every(p=>p.path&&p.bounds.every(Number.isFinite)));
for(const d of NATIONAL.destinations.filter(d=>d.coverage==='detailed'))assert(geo.centres[d.code],d.name+' map location');
function runtime(destination=''){
 const nodes=new Map();function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}},insertAdjacentHTML(pos,s){this.innerHTML+=s},scrollIntoView(){}});return nodes.get(id)}
 const c={DATA,NATIONAL,CHENGJI_ATLAS:geo,URL,Map,Set,console,plans:{},tab:'home',location:{href:'https://chengji-travel.onrender.com/index.html'+(destination?'?destination='+destination:'')},history:{replaceState(a,b,url){c.location.href=String(url)}},PHOTOS:{},C:()=>DATA[0],$:s=>node(s),esc:s=>String(s??''),head(){},render(){node('#app').innerHTML='CITY_GUIDE'},chooseCity(id){c.chosen=id;c.render()},go(t){c.tab=t;c.render()},closeOverlay(){},sheet(s){c.sheetText=s},matchMedia:()=>({matches:false}),scrollTo(){},document:{body:{classList:{add(){},remove(){}}},getElementById:id=>node(id),querySelector:()=>null}};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync('national-model.js','utf8'),c);c.NationalTravel={model:c.ChengjiNationalModel(NATIONAL),open(){c.opened=true},pick(id){c.directoryPicked=id},province(code){c.directoryProvince=code},sources(){}};vm.runInContext(fs.readFileSync('atlas-ui.js','utf8'),c);return {c,node};
}
let {c,node}=runtime();assert(node('#app').innerHTML.includes('下一站，'));assert(node('#app').innerHTML.includes('atlasSvg'));
c.TravelAtlas.province('41');assert(node('atlas-breadcrumb').textContent.includes('河南'));assert(node('atlas-results').innerHTML.includes('洛阳'));assert(node('atlas-map').innerHTML.includes('zoomed'));
c.TravelAtlas.pick('cn-410300');assert(node('atlas-preview').innerHTML.includes('进入洛阳攻略'));
c.TravelAtlas.enter('luoyang');assert.equal(c.chosen,'luoyang');assert(node('#app').innerHTML.includes('返回全国地图'));assert(c.location.href.includes('destination=luoyang'));
c.TravelAtlas.reset();assert(node('#app').innerHTML.includes('atlasWorkspace'));assert(!c.location.href.includes('destination='));
c.TravelAtlas.reset();c.TravelAtlas.search('haerbin');assert(node('atlas-results').innerHTML.includes('哈尔滨'));
c.TravelAtlas.province('71');assert(node('atlas-results').innerHTML.includes('台北'));c.TravelAtlas.pick('tw-taipei');assert(node('atlas-preview').innerHTML.includes('攻略待完善'));assert(!node('atlas-preview').innerHTML.includes('进入台北攻略'));c.TravelAtlas.details('tw-taipei');assert.equal(c.directoryPicked,'tw-taipei');
c.TravelAtlas.province('81');assert(node('atlas-results').innerHTML.includes('香港'));c.TravelAtlas.province('82');assert(node('atlas-results').innerHTML.includes('澳门'));
c.TravelAtlas.reset();c.TravelAtlas.scope('county');c.TravelAtlas.search('敦煌');assert(node('atlas-results').innerHTML.includes('敦煌'));
const deep=runtime('harbin');assert(deep.node('#app').innerHTML.includes('CITY_GUIDE'));assert.equal(JSON.stringify(DATA),before);
for(const p of ['index.html','travel.html','travel/index.html']){const s=fs.readFileSync('dist/'+p,'utf8');assert(s.includes('atlas-ui.js?v=20261030m1'));assert(s.indexOf('atlas-ui.js')>s.indexOf('hot-ui.js'));}
const report={version:geo.version,provinces:34,detailedGuides:DATA.length,guideSha256:crypto.createHash('sha256').update(fs.readFileSync('dist/city-data.js')).digest('hex'),checks:['province drill-down','guide preview and entry','directory-only destinations','pinyin and county search','return to map','deep links','unchanged guide data']};fs.writeFileSync('dist/atlas-validation.json',JSON.stringify(report,null,2));
console.log('ATLAS_INTERACTION_CHECKS_PASSED: '+JSON.stringify(report));
