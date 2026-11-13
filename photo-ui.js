'use strict';
(function () {
 function safe(url) { try { const u = new URL(url); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; } }
 function escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
 window.verifiedPhotoCredit = function (file) {
  const p = Object.values(REAL_PHOTOS).find(r => r.file === file && r.artist && r.license);
  if (!p || !safe(p.source)) return '';
  const link = (url, label) => safe(url) ? `<a href="${escape(safe(url))}" target="_blank" rel="noopener">${escape(label)}</a>` : escape(label);
  return `<p class="source">${p.photoCaption ? `<strong>${escape(p.photoCaption)}</strong><br>` : ''}照片：${escape(p.artist)} · ${link(p.source, p.sourceTitle || '文件说明')} · ${link(p.licenseUrl, p.license)}${safe(p.originalImage) ? ' · ' + link(p.originalImage, '来源原图') : ''}。已等比缩放与压缩。${p.scope === 'dish-reference' ? '菜品资料照片，不代表指定门店出品。' : '地点资料照片，非当日实况。'}</p>`;
 };
 let viewer, gallery = [], current = 0, opener;
 function showPhoto() {
  const photo = gallery[current];
  viewer.querySelector('h2').textContent = photo.title + ' · ' + (current + 1) + ' / ' + gallery.length;
  const img = viewer.querySelector('.photo-viewer-image');
  img.src = photo.file; img.alt = photo.title + '资料照片'; img.hidden = false;
  viewer.querySelector('.photo-viewer-error').hidden = true;
  viewer.querySelector('[data-photo-prev]').disabled = current === 0;
  viewer.querySelector('[data-photo-next]').disabled = current === gallery.length - 1;
  viewer.querySelector('.photo-viewer-source').innerHTML = typeof photoCredit === 'function' ? photoCredit(photo.file) : window.verifiedPhotoCredit(photo.file);
 }
 function createViewer() {
  viewer = document.createElement('dialog'); viewer.className = 'photo-viewer';
  viewer.setAttribute('aria-labelledby', 'photo-viewer-title');
  viewer.innerHTML = `<header><h2 id="photo-viewer-title"></h2><button data-photo-close aria-label="关闭照片预览" autofocus>${window.ChengjiIcons.svg('close')}</button></header><div class="photo-viewer-stage"><img class="photo-viewer-image"><p class="photo-viewer-error" hidden>照片暂时无法加载，请关闭后重试。</p></div><nav aria-label="切换照片"><button data-photo-prev>${window.ChengjiIcons.svg('chevron-left')} 上一张</button><span>资料照片 · 非当日实况</span><button data-photo-next>下一张 ${window.ChengjiIcons.svg('chevron-right')}</button></nav><div class="photo-viewer-source"></div>`;
  viewer.addEventListener('click', e => {
   if (e.target === viewer || e.target.closest('[data-photo-close]')) viewer.close();
   else if (e.target.closest('[data-photo-prev]') && current > 0) { current--; showPhoto(); }
   else if (e.target.closest('[data-photo-next]') && current < gallery.length - 1) { current++; showPhoto(); }
  });
  viewer.addEventListener('keydown', e => {
   if (e.key === 'ArrowLeft' && current > 0) { e.preventDefault(); current--; showPhoto(); }
   if (e.key === 'ArrowRight' && current < gallery.length - 1) { e.preventDefault(); current++; showPhoto(); }
  });
  viewer.querySelector('img').addEventListener('error', e => { e.target.hidden = true; viewer.querySelector('.photo-viewer-error').hidden = false; });
  viewer.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); });
  document.body.append(viewer);
 }
 document.addEventListener('click', e => {
  const button = e.target.closest?.('[data-photo-open]');
  if (!button) return;
  const buttons = [...button.closest('.me-gallery').querySelectorAll('[data-photo-open]')];
  gallery = buttons.map(b => ({file:b.dataset.photoOpen, title:b.dataset.photoTitle || '地点照片'}));
  current = buttons.indexOf(button); opener = button;
  if (!viewer) createViewer();
  showPhoto(); viewer.showModal();
 });
 function failed(img) {
  if (!(img instanceof HTMLImageElement) || !img.closest('#app, #overlay, .me-root') || !img.parentNode) return;
  const placeholder = document.createElement('span');
  placeholder.className = img.className + ' photo-unavailable' + (img.closest('.me-root') ? ' me-image-placeholder' : '');
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', (img.alt || '资料照片') + '暂时无法加载');
  const mark = document.createElement('b'); mark.innerHTML = window.ChengjiIcons.svg('image'); mark.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('small'); caption.textContent = '照片暂时无法加载';
  placeholder.append(mark, caption);
  img.replaceWith(placeholder);
 }
 document.addEventListener('error', event => failed(event.target), true);
 document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('#app img, #overlay img, .me-root img').forEach(img => { if (img.complete && !img.naturalWidth) failed(img); }), {once: true});
})();
