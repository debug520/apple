'use strict';
(function(root){
 document.documentElement.classList.add('cj-photo-enhance');
 const recover=img=>{
  if(!img?.dataset||!img.matches('img'))return;
  if(!img.dataset.photoOriginal){const path=img.getAttribute('src'),files=root.CHENGJI_IMAGES||{},key=Object.keys(files).find(k=>k===path||files[k].card.src===path||files[k].detail.src===path);img.dataset.photoOriginal=key||path||'';if(key)img.dataset.photoPreview=files[key].card.preview;}
  const original=img.dataset.photoOriginal,preview=img.dataset.photoPreview;
  if(original&&img.dataset.photoTriedOriginal!=='1'){
   img.dataset.photoTriedOriginal='1';img.classList.add('cj-photo-loading');img.src=original;return;
  }
  if(preview&&img.src!==preview){
   img.dataset.photoLowres='1';img.src=preview;return;
  }
  img.classList.remove('cj-photo-loading');img.classList.add('cj-photo-neutral');
 };
 const loaded=img=>{if(!img?.matches?.('img'))return;img.classList.remove('cj-photo-loading');img.classList.toggle('cj-photo-lowres',img.dataset.photoLowres==='1');};
 document.addEventListener('error',e=>{if(e.target?.matches?.('img')&&e.target.closest('#app,#overlay,.photo-viewer,.hero-photo,.card'))recover(e.target)},true);
 document.addEventListener('load',e=>loaded(e.target),true);
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('img[data-photo-original]').forEach(img=>{if(img.complete){if(img.naturalWidth)loaded(img);else recover(img)}});
 },{once:true});
 root.ChengjiPhotoRecovery={recover,loaded};
})(window);
