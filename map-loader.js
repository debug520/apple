'use strict';
(function(root){
 let pending=null;
 root.ChengjiLoadMap=function(){
  if(root.ol&&root.olms)return Promise.resolve();
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=root.CHENGJI_MAP_ENGINE;script.async=true;
   const finish=error=>{clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();pending=null;reject(error);}else resolve();};
   const timer=setTimeout(()=>finish(Error('地图组件加载超时')),8000);
   script.onload=()=>finish(root.ol&&root.olms?null:Error('地图组件未就绪'));
   script.onerror=()=>finish(Error('地图组件暂时无法加载'));
   document.head.append(script);
  });
  return pending;
 };
})(window);
