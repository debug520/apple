'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process'),M=require('./explorer-model.js');
const destinations=[{id:'cn-a',name:'基础目的地'},{id:'cn-b',guideId:'beijing'}],guideIds=['beijing','shanghai','luoyang'];
const target=(query,options={})=>M.startupTarget({params:new URLSearchParams(query),city:'shanghai',storedDestination:'cn-a',guideIds,destinations,...options});
assert.deepEqual(target('destination=beijing'),{city:'beijing',destination:null},'a shared city must override the old basic destination');
assert.deepEqual(target('destination=shanghai&item=beijing:places:0',{itemCity:'beijing'}),{city:'beijing',destination:null},'the shared item opens in its own city from the first frame');
assert.deepEqual(target('mapDestination=cn-b'),{city:'beijing',destination:null});
assert.equal(target('').destination.id,'cn-a');
assert.equal(target('poi=osm:node:1').destination,null,'a public shared item must not inherit an unrelated saved destination');
assert.equal(target('destination=not-a-city').destination,null);
assert.equal(target('',{city:'removed',storedDestination:''}).city,'beijing');
assert.equal(M.savedView({center:[121.47,31.23],zoom:12,bearing:0,city:'shanghai'},'beijing',[116.4,39.9]),null);
assert.equal(M.savedView({center:[121.47,31.23],zoom:12,bearing:0,city:'beijing'},'beijing',[116.4,39.9]),null,'a view panned to another city must not be restored under the wrong city label');
assert(M.savedView({center:[116.41,39.91],zoom:14,bearing:0,city:'beijing'},'beijing',[116.4,39.9]));
// Late or superseded geolocation callbacks cannot move the selected city.
const source=fs.readFileSync('explorer-ui.js','utf8'),line=source.split('\n').find(l=>l.startsWith('  locate(){'));
let callbacks=[],moves=[];
const ctx={locationRequest:0,navigator:{geolocation:{getCurrentPosition(ok,fail){callbacks.push([ok,fail])}}},notice(){},toast(){},fly(p){moves.push(p)},updateSource(){},drawList(){}};
vm.createContext(ctx);vm.runInContext('var locator=({'+line.trim().replace(/,$/,'')+'});locator.locate();locationRequest++;',ctx);
callbacks[0][0]({coords:{longitude:121.47,latitude:31.23}});assert.equal(moves.length,0);
vm.runInContext('locator.locate();locator.locate()',ctx);callbacks[1][0]({coords:{longitude:1,latitude:1}});callbacks[2][0]({coords:{longitude:116.4,latitude:39.9}});assert.equal(moves.length,1);
assert.deepEqual(Array.from(moves[0]),[116.4,39.9]);
assert(!source.includes('navigator.permissions.query'),'opening the page must not start automatic geolocation');
const manifest=JSON.parse(fs.readFileSync('dist/startup-assets.json')),html=fs.readFileSync('dist/index.html','utf8'),scriptTags=[...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)];
assert.equal(scriptTags.length,1);assert(scriptTags[0][0].includes('defer'));assert.equal(scriptTags[0][1],manifest.app);
assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);assert(!html.includes('vendor-map/ol.js'));assert(html.includes('正在打开城市地图'));
const bundle=fs.readFileSync('dist/'+manifest.app,'utf8');assert(bundle.indexOf('// atlas-ui.js')<bundle.indexOf('// explorer-ui.js'));
assert(bundle.includes('window.__CJ_BOOTING__=false;render();'));assert(bundle.includes('startupTarget'));
for(const p of [manifest.app,manifest.engine,'explorer-map.js','map-loader.js'])cp.execFileSync(process.execPath,['--check',p.includes('release-assets/')?'dist/'+p:p]);
console.log('STARTUP_CHECKS_PASSED: URL priority, city/view consistency, late location rejection, deferred bundles and retained script order');
// An unreachable basemap style must not delay local POI overlays or map controls.
(async()=>{
 let resolveStyle,ready=false,styleReady=false,clears=0;
 const projection={fromLonLat:p=>p,toLonLat:p=>p};
 class View{constructor(o){this.options=o}on(){}getZoom(){return this.options.zoom}}
 class Group{constructor(){this.layers=[];this.layers.clear=()=>{this.layers.length=0}}getLayers(){return this.layers}}
 class MapStub{on(){}updateSize(){}addLayer(){}}
 const sandbox={window:null,queueMicrotask,Map,Set,ol:{View,layer:{Group},Map:MapStub,control:{Attribution:class{}},proj:projection,format:{GeoJSON:class{readFeatures(d){return d.features}}}},olms:{apply(){return new Promise(r=>resolveStyle=r)}}};sandbox.window=sandbox;
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync('explorer-map.js','utf8'),sandbox);
 const map=new sandbox.ChengjiMap.Map({container:{},style:'https://example.com/style',center:[116.4,39.9],zoom:11});map.on('load',()=>ready=true);map.on('baseready',()=>styleReady=true);
 await Promise.resolve();assert(ready,'local map controls and POIs must be ready before the remote style');assert(!styleReady);
 map.sources.set('test',{source:{clear(){clears++},addFeatures(){}}});const api=map.getSource('test'),data={type:'FeatureCollection',features:[]};api.setData(data);api.setData(data);assert.equal(clears,1,'unchanged POIs must not rebuild clusters');
 resolveStyle();await Promise.resolve();await Promise.resolve();assert(styleReady);
 console.log('MAP_STARTUP_RACES_PASSED: basemap-independent readiness and identical-source deduplication');
})().catch(e=>{console.error(e);process.exitCode=1});
