'use strict';
(function(){
 if(!window.webVitals)return;
 const report=metric=>{document.documentElement.setAttribute('data-cj-'+metric.name.toLowerCase(),String(Math.round(metric.value*1000)/1000));const nodes=metric.entries.flatMap(e=>e.sources?.map(s=>s.node)||[e.target]).filter(Boolean).map(n=>n.id||n.className||n.tagName).slice(0,8);document.documentElement.setAttribute('data-cj-'+metric.name.toLowerCase()+'-targets',JSON.stringify(nodes));};
 for(const name of ['onLCP','onINP','onCLS'])webVitals[name](report,{reportAllChanges:true});
 // Measurements stay in this page. No analytics request or personal data is sent.
})();
