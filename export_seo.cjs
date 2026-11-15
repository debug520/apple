'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const context={URL,document:{addEventListener(){}}};context.window=context;vm.createContext(context);
for(const name of ['city-data.js','photos.js','real-photos.js','enriched-photos.js','leisure-photos.js','catalog-photos.js','hot-photos.js','verified-photos.js'])vm.runInContext(fs.readFileSync('dist/'+name,'utf8'),context);
const app=fs.readFileSync('dist/app.js','utf8');
for(const prefix of ['const $=','const imageFor=','const isIllustration=','function photoCredit(']){const line=app.split('\n').find(l=>l.startsWith(prefix));if(line)vm.runInContext(line,context);}
vm.runInContext(fs.readFileSync('photo-ui.js','utf8'),context);
for(const [name,needle] of [['discovery-ui.js','const discoveryPhotoCredit='],['hot-ui.js','const previousCredit=photoCredit;']])vm.runInContext(fs.readFileSync(name,'utf8').split('\n').find(l=>l.includes(needle)),context);
const result=vm.runInContext("DATA.map(c=>({id:c.id,name:c.name,province:c.province,summary:c.summary,tagline:c.tagline,history:c.history,places:c.places.map((p,i)=>({...p,key:c.id+':places:'+i,file:imageFor(p,c,'places'),credit:imageFor(p,c,'places')?photoCredit(imageFor(p,c,'places')):''})),foods:c.foods.map((p,i)=>({...p,key:c.id+':foods:'+i,file:imageFor(p,c,'foods'),credit:imageFor(p,c,'foods')?photoCredit(imageFor(p,c,'foods')):''}))}))",context);
fs.writeFileSync('dist/seo-records.json',JSON.stringify(result));
console.log('SEO_EXPORT_READY',result.length,'cities');
