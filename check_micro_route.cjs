const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),M=require('./explorer-model.js');
test('shared day previews in order and saves only on request',()=>{
 const ui=fs.readFileSync(require.resolve('./explorer-ui.js'),'utf8');
 const store=new Map();let link,html;
 const ctx={M,URL,location:{href:'https://example.org/index.html?item=private'},cityName:()=>'杭州',tripStops:()=>['乙','甲'].map(name=>({record:{name}})),sendCityShare:(_,url)=>link=url,E:x=>x,sheet:x=>html=x,closeOverlay(){},toast(){},storage:{get:(k,d)=>store.get(k)??d,set:(k,v)=>store.set(k,v)}};
 vm.runInNewContext(ui.slice(ui.indexOf(' let pendingRoute='),ui.indexOf(' window.MapExplorer=')),ctx);
 ctx.shareTrip();
 assert.equal(new URL(link).search,'');
 ctx.previewRoute(new URL(link).hash);
 assert.match(html,/<li>乙<\/li><li>甲<\/li>/);
 assert.equal(store.size,0);
 ctx.saveMicroRoute();ctx.previewRoute(new URL(link).hash);ctx.saveMicroRoute();
 assert.equal(store.get('micro-routes').length,1);
 ctx.savedRoutes();assert.match(html,/杭州/);
 ctx.previewRoute('#microRoute=%');ctx.saveMicroRoute();assert.equal(store.get('micro-routes').length,1);
});
