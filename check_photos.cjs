'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={URL};ctx.window=ctx;vm.createContext(ctx);
for(const name of ['city-data.js','photos.js','real-photos.js','enriched-photos.js','leisure-photos.js','catalog-photos.js','hot-photos.js'])vm.runInContext(fs.readFileSync('dist/'+name,'utf8'),ctx);
const app=fs.readFileSync('dist/app.js','utf8');
vm.runInContext(app.split('\n').find(line=>line.startsWith('const imageFor=')),ctx);
const evaluate=()=>vm.runInContext("DATA.flatMap(c=>['places','foods'].flatMap(t=>c[t].map((p,i)=>({key:c.id+':'+t+':'+i,name:p.name,file:imageFor(p,c,t)}))))",ctx);
const before=evaluate();
vm.runInContext(fs.readFileSync('dist/verified-photos.js','utf8'),ctx);
const after=evaluate(),manifest=JSON.parse(fs.readFileSync('verified-photo-manifest.json','utf8'));
const previous=new Map(before.map(r=>[r.key,r]));
for(const row of after){const old=previous.get(row.key);assert.equal(row.name,old.name);if(old.file)assert.equal(row.file,old.file,'previous photo must remain unchanged');if(row.file)assert(fs.existsSync('dist/'+row.file),row.file);}
assert.equal(after.filter(r=>r.file).length-before.filter(r=>r.file).length,manifest.items.length);
for(const p of manifest.items){const row=after.find(r=>r.key===p.key);assert.equal(row.file,p.file);assert.equal(row.name,p.name);assert(p.artist&&p.license&&p.licenseUrl&&p.identityEvidence);}
const html=fs.readFileSync('dist/index.html','utf8');
assert(html.indexOf('verified-photos.js')>html.indexOf('hot-photos.js'));
assert(html.indexOf('verified-photos.js')<html.indexOf('app.js?'));
assert(html.includes('photo-ui.css')&&html.includes('photo-ui.js'));
assert(app.includes('window.verifiedPhotoCredit?.(file)'));
ctx.document={addEventListener(){}};
vm.runInContext('const esc=value=>String(value??\'\').replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\"":"&quot;","\'":"&#39;"}[c]));',ctx);
vm.runInContext(fs.readFileSync('dist/photo-ui.js','utf8'),ctx);
vm.runInContext(app.split('\n').find(line=>line.startsWith('function photoCredit(')),ctx);
vm.runInContext(fs.readFileSync('dist/discovery-ui.js','utf8').split('\n').find(line=>line.startsWith('const discoveryPhotoCredit=')),ctx);
vm.runInContext(fs.readFileSync('dist/hot-ui.js','utf8').split('\n').find(line=>line.includes('const previousCredit=photoCredit;')),ctx);
for(const photo of manifest.items){const credit=vm.runInContext('photoCredit('+JSON.stringify(photo.file)+')',ctx);assert(credit.includes('href="'+photo.licenseUrl+'"'),photo.key+' must retain a clickable license after all UI wrappers');}
const report={totalRecords:after.length,photosBefore:before.filter(r=>r.file).length,photosAfter:after.filter(r=>r.file).length,added:manifest.items.length,remainingWithoutPhoto:after.filter(r=>!r.file).length,previousPhotosUnchanged:true,allLocalFilesPresent:true};
fs.writeFileSync('dist/photo-coverage.json',JSON.stringify(report,null,2));console.log('PHOTO_COVERAGE_CHECKS_PASSED '+JSON.stringify(report));
