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
 function pageMessage(worker,type,images=[]){
  return new Promise((resolve,reject)=>{
   const channel=new MessageChannel();
   const timer=setTimeout(()=>{channel.port1.close();reject(new Error('timeout'));},12000);
   channel.port1.onmessage=event=>{
    clearTimeout(timer);
    channel.port1.close();
    resolve(event.data?.saved===true);
   };
   worker.postMessage({type,url:location.href,images},[channel.port2]);
  });
 }
 async function register(){
  const panel=document.querySelector('[data-offline-guide]');
  const button=panel?.querySelector('button'), status=panel?.querySelector('[role="status"]');
  try{
   await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});
   const registration=await navigator.serviceWorker.ready;
   document.documentElement.dataset.cjSw='ready';
   const images=[...document.images].map(img=>img.currentSrc||img.src).filter(url=>url.includes('/responsive-photos/')).slice(0,12);
   if(!panel){
    registration.active?.postMessage({type:'CACHE_PAGE',url:location.href,images});
    return;
   }
   const save=async()=>{
    button.disabled=true;
    status.textContent='正在准备离线正文…';
    let saved=false;
    try{saved=await pageMessage(registration.active,'CACHE_PAGE',images);}catch{}
    button.hidden=saved;
    button.disabled=false;
    status.textContent=saved?'本页正文已可离线阅读。此浏览器最多暂存 40 页，照片和实时地图可能需要联网。':'暂时无法确认离线副本，请联网后重试。';
   };
   button.textContent='重试保存本页';
   button.addEventListener('click',save);
   panel.hidden=false;
   await save();
  }catch{
   document.documentElement.dataset.cjSw='unavailable';
   if(panel){panel.hidden=false;button.hidden=true;status.textContent='此浏览器暂时无法保存离线攻略。';}
  }
 }
 const start=()=>window.requestIdleCallback?requestIdleCallback(register,{timeout:2000}):setTimeout(register,500);
 if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
})();
