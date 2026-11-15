'use strict';
// Replaced at build time. The worker never caches API responses or user records.
const VERSION='__CJ_VERSION__',PRECACHE=__CJ_PRECACHE__;
const PREFIX='chengji-public-',CORE=PREFIX+VERSION+'-core',PAGES=PREFIX+VERSION+'-pages',IMAGES=PREFIX+VERSION+'-images';
const origin=self.location.origin;
async function trim(cache,limit){const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-limit)))await cache.delete(key);}
function navigationKey(url){return ['/','/index.html','/travel.html','/travel/','/travel/index.html'].includes(url.pathname)?origin+'/index.html':origin+url.pathname;}
function publicPage(path){return /^\/cities\/(?:[a-z0-9-]+\/(?:(?:places|foods)\/\d+\/)?)?$/.test(path)||['/','/index.html','/travel.html','/travel/','/travel/index.html'].includes(path);}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CORE);
 // A partial connection must not discard an otherwise usable installation.
 await Promise.allSettled(PRECACHE.map(async path=>{const r=await fetch(path,{cache:'no-cache'});if(r.ok)await cache.put(path,r);}));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith(PREFIX)&&![CORE,PAGES,IMAGES].includes(name))await caches.delete(name);
 await self.clients.claim();
})()));
async function cacheFirst(event,name,limit){
 const cache=await caches.open(name),hit=await cache.match(event.request);
 if(hit)return hit;
 const response=await fetch(event.request);
 if(response.ok&&response.type!=='opaque')event.waitUntil(cache.put(event.request,response.clone()).then(()=>trim(cache,limit)));
 return response;
}
async function navigate(event,url){
 const key=navigationKey(url),pages=await caches.open(PAGES),core=await caches.open(CORE);
 const network=fetch(event.request).then(response=>{
  if(response.ok){event.waitUntil(pages.put(key,response.clone()).then(()=>trim(pages,40)));return response;}
  return response.status<500?response:null;
 }).catch(()=>null);
 const cached=await pages.match(key)||await core.match(key);
 if(cached){const fast=await Promise.race([network,new Promise(resolve=>setTimeout(()=>resolve(null),2500))]);if(fast)return fast;event.waitUntil(network);return cached;}
 const response=await network;
 return response||await core.match('/offline.html')||new Response('暂时离线，请联网后打开这座城市。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==origin)return;
 if(request.mode==='navigate'&&publicPage(url.pathname)){event.respondWith(navigate(event,url).catch(()=>fetch(request)));return;}
 if(/^\/release-assets\/[a-f0-9]{12}\//.test(url.pathname)){event.respondWith(cacheFirst(event,CORE,24).catch(()=>fetch(request)));return;}
 if(/^\/responsive-photos\/[a-f0-9]{16}-(320|640)\.webp$/.test(url.pathname))event.respondWith(cacheFirst(event,IMAGES,100).catch(()=>fetch(request)));
});

self.addEventListener('message',event=>{
 if(event.data?.type!=='CACHE_PAGE')return;
 let url;try{url=new URL(event.data.url);}catch{return}
 if(url.origin!==origin||!publicPage(url.pathname))return;
 event.waitUntil((async()=>{
  const pages=await caches.open(PAGES),key=navigationKey(url);const r=await fetch(key,{credentials:'omit'});if(r.ok){await pages.put(key,r);await trim(pages,40);}
  const images=await caches.open(IMAGES);for(const item of (event.data.images||[]).slice(0,12)){let picture;try{picture=new URL(item);}catch{continue}
   if(picture.origin!==origin||!/^\/responsive-photos\/[a-f0-9]{16}-(320|640)\.webp$/.test(picture.pathname))continue;
   const response=await fetch(picture.href,{credentials:'omit'});if(response.ok)await images.put(picture.href,response);
  }await trim(images,100);
 })().catch(()=>{}));
});
