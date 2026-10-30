'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const parse=(file,prefix)=>JSON.parse(fs.readFileSync(file,'utf8').slice(prefix.length).replace(/;\s*$/,''));
const guides=parse('dist/city-data.js','window.DATA='),national=parse('dist/national-data.js','window.NATIONAL=');
const report=JSON.parse(fs.readFileSync('dist/hot-validation.json','utf8'));
assert.equal(guides.length,28);assert.equal(report.newGuides,8);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(hash('window.DATA='+JSON.stringify(guides.slice(0,20))+';'),report.original20Sha256);
const expected={harbin:'230100',dunhuang:'620982',lijiang:'530700',dali:'532900',zhangjiajie:'430800',huangshan:'341000',quanzhou:'350500',zhuhai:'440400'};
for(const c of guides){assert.equal(c.places.length,40);assert.equal(c.foods.length,30)}
for(const [id,admin]of Object.entries(expected)){
 const c=guides.find(c=>c.id===id);assert(c,id);assert.equal(c.adminCode,admin);assert(c.history.length>=3);assert(c.routes.length>=2);
 const d=national.destinations.find(d=>d.code===admin);assert.equal(d.guideId,id);assert.equal(d.coverage,'detailed');
 assert(c.places.some(p=>p.photo),id+' real photo');
 for(const r of c.routes){for(const n of r.placeNames)assert(c.places.some(p=>p.name===n),n);for(const n of r.foodNames||[])assert(c.foods.some(p=>p.name===n),n)}
 for(const p of c.places){assert(p.reading.lookFor&&p.reading.visitAdvice);assert(p.visit.ticket&&p.visit.reservation);if(!p.visit.policySource)assert.equal(p.visit.reservationStatus,'unknown');if(p.photo)assert(fs.existsSync('dist/'+p.photo))}
 for(const p of c.foods)assert(p.ingredients&&p.eatingTip&&p.description);
}
assert.equal(national.destinations.filter(d=>d.guideAddedAt).length,8);
assert.equal(national.destinations.find(d=>d.guideId==='dunhuang').level,'county');
assert.equal(national.destinations.find(d=>d.guideId==='dali').name,'大理白族自治州');
for(const [id,name] of [['luoyang','洛阳博物馆'],['chengdu','金沙遗址博物馆'],['guangzhou','长隆水上乐园']])assert(guides.find(c=>c.id===id).places.find(p=>p.name===name).visit.availability);
const q=guides.find(c=>c.id==='quanzhou').places.find(p=>/海外交通史博物馆.*东湖/.test(p.name));assert(q?.visit.availability);
const additions=JSON.parse(fs.readFileSync('dist/photo-additions.json','utf8'));
for(const p of additions){assert(fs.existsSync('dist/'+p.file));assert(p.source&&p.originalImage);assert(!/^(javascript|data):/.test(p.source))}
assert.equal(additions.length,report.newPhotoRecords);
console.log('HOT_GUIDE_CHECKS_PASSED: 28 guides at 40/30, old item keys unchanged, correct admin links, sources, photos and closure flags.');
