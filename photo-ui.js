'use strict';
(function () {
 function safe(url) { try { const u = new URL(url); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null; } catch { return null; } }
 function escape(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
 window.verifiedPhotoCredit = function (file) {
  const p = Object.values(REAL_PHOTOS).find(r => r.file === file && r.artist && r.license);
  if (!p || !safe(p.source)) return '';
  const link = (url, label) => safe(url) ? `<a href="${escape(safe(url))}" target="_blank" rel="noopener">${escape(label)}</a>` : escape(label);
  return `<p class="source">照片：${escape(p.artist)} · ${link(p.source, p.sourceTitle || '文件说明')} · ${link(p.licenseUrl, p.license)}${safe(p.originalImage) ? ' · ' + link(p.originalImage, '来源原图') : ''}。已等比缩放与压缩。${p.scope === 'dish-reference' ? '菜品资料照片，不代表指定门店出品。' : '地点资料照片，非当日实况。'}</p>`;
 };
 function failed(img) {
  if (!(img instanceof HTMLImageElement) || !img.closest('#app, #overlay, .me-root') || !img.parentNode) return;
  const placeholder = document.createElement('span');
  placeholder.className = img.className + ' photo-unavailable' + (img.closest('.me-root') ? ' me-image-placeholder' : '');
  placeholder.setAttribute('role', 'img');
  placeholder.setAttribute('aria-label', (img.alt || '资料照片') + '暂时无法加载');
  const mark = document.createElement('b'); mark.textContent = '▧'; mark.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('small'); caption.textContent = '照片暂时无法加载';
  placeholder.append(mark, caption);
  img.replaceWith(placeholder);
 }
 document.addEventListener('error', event => failed(event.target), true);
 document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('#app img, #overlay img, .me-root img').forEach(img => { if (img.complete && !img.naturalWidth) failed(img); }), {once: true});
})();
