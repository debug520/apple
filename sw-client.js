'use strict';
(function(){
 const message='离线浏览缓存攻略；地图、天气、路况和票务状态需联网更新。';
 function connection(){
  document.documentElement.dataset.cjNetwork=navigator.onLine?'online':'offline';
  let note=document.getElementById('cj-offline-note');
  if(document.body.classList.contains('meMode')){
   if(note)note.hidden=true;
   const status=document.getElementById('me-map-status');
   if(status&&!navigator.onLine){status.hidden=false;status.textContent=message;}
   else if(status?.textContent===message){status.hidden=true;status.textContent='';}
   return;
  }
  if(!note){note=document.createElement('p');note.id='cj-offline-note';note.className='cj-offline-note';note.setAttribute('role','status');document.body.append(note);}
  note.textContent=message;note.hidden=navigator.onLine;
 }
 window.addEventListener('online',connection);window.addEventListener('offline',connection);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',connection,{once:true});else connection();
 if(!('serviceWorker' in navigator))return;
 const register=()=>navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(reg=>{document.documentElement.dataset.cjSw='ready';const images=[...document.images].map(img=>img.currentSrc||img.src).filter(url=>url.includes('/responsive-photos/')).slice(0,12);reg.active?.postMessage({type:'CACHE_PAGE',url:location.href,images});}).catch(()=>{document.documentElement.dataset.cjSw='unavailable';});
 const start=()=>window.requestIdleCallback?requestIdleCallback(register,{timeout:2000}):setTimeout(register,500);
 if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
})();
