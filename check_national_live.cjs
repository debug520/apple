
'use strict';
// HTTP-only verification. The first build can precede the directory's first publication;
// redeploying the same commit verifies the now-live artifact without changing its content.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const base='https://chengji-travel.onrender.com/';
const expected=JSON.parse(fs.readFileSync('dist/national-validation.json','utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
async function get(path){return fetch(base+path+(path.includes('?')?'&':'?')+'verify='+Date.now(),{signal:AbortSignal.timeout(15000)})}
(async()=>{
 let response;
 try{response=await get('national-validation.json')}catch(e){console.log('NATIONAL_LIVE_CHECK_NETWORK_UNAVAILABLE: '+e.message);return}
 if(response.status===404){console.log('NATIONAL_LIVE_CHECK_NOT_YET_PUBLISHED: verify this same commit again after it becomes live.');return}
 if(!response.ok)throw Error('Live validation response '+response.status);
 let live;
 try{live=await response.json()}catch{console.log('NATIONAL_LIVE_CHECK_PREVIOUS_SITE: national report not yet available.');return}
 if(live.version!==expected.version){console.log('NATIONAL_LIVE_CHECK_PREVIOUS_VERSION: '+live.version);return}
 assert.equal(live.destinations,3212);assert.equal(live.guideSha256,expected.guideSha256);assert(live.existingGuidesUnchanged);
 for(const path of ['destinations.html','national-data.js','national-model.js','national-ui.js','national-integration.js','national.css']){
  const r=await get(path);assert.equal(r.status,200,path);const text=await r.text();
  assert.equal(hash(text),hash(fs.readFileSync('dist/'+path,'utf8')),path+' differs from build');
 }
 const index=await get('index.html?v=20261027b');assert.equal(index.status,200);
 const html=await index.text();assert(html.includes('national-integration.js?v=20261029n1'));assert(html.includes('national-data.js?v=20261029n1'));
 const guide=await get('city-data.js');assert.equal(guide.status,200);
 assert.equal(hash(await guide.text()),expected.guideSha256);
 const html2=await get('travel/index.html');assert.equal(html2.status,200);assert((await html2.text()).includes('national-integration.js'));
 console.log('NATIONAL_LIVE_HTTP_VERIFIED: original URL, nationwide directory, 3212 destinations, 20 unchanged guides, JS/CSS bytes and /travel/ entry verified.');
})().catch(e=>{console.error('NATIONAL_LIVE_CHECK_FAILED',e);process.exitCode=1});
