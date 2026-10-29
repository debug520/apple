'use strict';
// Shared pure model: used by both directory pages and build checks.
window.ChengjiNationalModel = function(data) {
 const byId=new Map(data.destinations.map(d=>[d.id,d]));
 const compact=s=>String(s||'').toLowerCase().replace(/\s+/g,'');
 function matches(d,q){
  q=compact(q);if(!q)return true;
  return [d.name,d.shortName,d.pinyin,d.province,d.provinceName,d.prefecture,...(d.aliases||[])].some(s=>compact(s).includes(q));
 }
 function filter(s){
  return data.destinations.filter(d=>
   (!s.region||d.region===s.region)&&(!s.province||d.provinceCode===s.province)&&
   (!s.parent||d.prefectureCode===s.parent&&d.level==='county')&&
   (s.scope==='all'||s.scope==='guides'&&d.coverage==='detailed'||s.scope==='county'&&d.level==='county'||s.scope==='cities'&&d.level!=='county')&&matches(d,s.query));
 }
 function children(d){return data.destinations.filter(x=>x.level==='county'&&x.prefectureCode===d.code)}
 function parent(d){return d.level==='county'&&d.prefectureCode?data.destinations.find(x=>x.code===d.prefectureCode&&x.level!=='county'):null}
 function search(q){return q.trim()?data.destinations.filter(d=>matches(d,q)):[]}
 function map(d,query){return 'https://uri.amap.com/search?'+new URLSearchParams({keyword:[d.province,d.prefecture,d.name,query].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(' '),city:d.prefecture||d.name,src:'chengji',callnative:'0'})}
 return {byId,filter,children,parent,search,map};
};
