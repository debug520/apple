"""Append researched city guides and attributed photos, preserving existing keys."""
import copy
import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).parent
DIST=ROOT/'dist'
CHECKED='2026-10-29'
def read(p):return json.loads((ROOT/p).read_text())
def dump(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
def valid(url):assert urlparse(url).scheme in ('http','https') and urlparse(url).netloc,url
path=DIST/'city-data.js'
base=path.read_bytes()
data=json.loads(base.decode()[len('window.DATA='):].rstrip(';\n'))
original=copy.deepcopy(data)
assert len(data)==20 and sum(len(c['places']) for c in data)==800 and sum(len(c['foods']) for c in data)==600
assert hashlib.sha256(base).hexdigest()=='33503ed25f796d5b55580390d7ae92cdb54a267ad087ea2e1dbf4fca4eb6081e'
seeds=read('hot-cities.json')['cities']
assert len(seeds)==8
for raw in seeds:
 c=copy.deepcopy(raw)
 assert c['id'] not in {x['id'] for x in data}
 assert len(c['places'])==40 and len(c['foods'])==30,c['id']
 assert len(c['history'])>=3 and len(c['routes'])>=2
 c.update(hotAddedAt=CHECKED,updatedAt=CHECKED,tier='detailed',contentNote='地点与风味详介有出处；票务及资料照片分别标注核实程度。')
 c.setdefault('merchants',[])
 for t in ('places','foods'):
  assert len({p['name'] for p in c[t]})==len(c[t]),(c['id'],t)
  for p in c[t]:
   valid(p['url']);assert p.get('source');p.pop('photoQuery',None);p['hotAddedAt']=CHECKED;p['group']=p['category']
   if t=='places':
    assert p['category'] in ['历史人文','博物馆','街区夜游','自然公园','主题乐园','动物海洋']
    assert all(p.get(k) for k in ('area','duration','story','lookFor','tip')),p['name']
    p['duration']=int(p['duration']);p['durationNote']='编辑建议，不含往返、排队与用餐。'
    p['reading']={'history':p['story'],'lookFor':p.pop('lookFor'),'visitAdvice':p['tip']}
    v={'reservationStatus':'unknown','reservation':'当前预约规则待核实；请确认实名证件、预约渠道、日期与时段。','ticket':'当前票价待核实；请分别确认淡旺季、指定日期票、免费区域及独立收费项目。','hours':'开放日、停止入场和临时关闭安排待核实，请查官方当日公告。','address':c['name']+' · '+p['area']+' · '+p['name']+'（请在地图确认实际入口）','transport':'按实际入口查询路线；跨片区、郊县、海岛需额外安排往返及接驳。','extra':'索道、车船、演出、特展等是否包含在门票内须逐项确认，未核实不代表免费。','accessibility':'无障碍、儿童学生优惠、寄存及同行服务请向运营方确认。','sources':[]}
    v.update(p.pop('visitOverride',{}));v.update(p.pop('visit',{}))
    if p.get('excludeFromPlan'):
     v['availability']=v.get('availability') or p.get('closureNote') or '接待及开放条件待确认，自动行程暂不安排。'
     v.setdefault('availabilityCheckedAt',CHECKED)
     if not any(x in v['availability'] for x in ('闭馆','暂停开放','停馆','改造')):v['availabilityKind']='check-first'
    assert v['reservationStatus'] in ('unknown','required','conditional','not-required')
    v.setdefault('sources',[])
    for field,date,label in [('priceSource','priceCheckedAt','门票参考资料'),('policySource','policyCheckedAt','预约与入园规则')]:
     if v.get(field):
      valid(v[field]);assert v.get(date),p['name']
      if not any(s['url']==v[field] for s in v['sources']):v['sources'].append({'label':label,'url':v[field]})
    if not v.get('policySource'):assert v['reservationStatus']=='unknown',p['name']
    for label,url in [('地点背景资料（非当前票务依据）',p['url']),('开放或接待条件提醒',p.get('closureSource'))]:
     if url and not any(s['url']==url for s in v['sources']):valid(url);v['sources'].append({'label':label,'url':url})
    for s in v['sources']:valid(s['url'])
    p['visit']=v
   else:
    assert p['category'] in ['面食主食','汤羹热食','点心甜品','地方菜肴']
    assert all(p.get(k) for k in ('description','ingredients','taste','eatingTip')),p['name']
    p.setdefault('story',p['description']);p['spicy']=bool(p.get('spicy',False));p['allergenNote']='食材为菜品参考，配方因店而异；过敏者请核对完整配方与交叉接触。'
   p['photoStatus']='暂无已核对资料照片，显示分类图标'
 for h in c['history']:assert h.get('year') and h.get('text') and h.get('url');valid(h['url'])
 for r in c['routes']:
  assert all(n in {p['name'] for p in c['places']} for n in r['placeNames']),(c['id'],r)
  assert all(n in {p['name'] for p in c['foods']} for n in r.get('foodNames',[])),(c['id'],r)
  assert all(r.get(k) for k in ('title','subtitle','duration','advice'))
 data.append(c)
assert data[:20]==original and len(data)==28
photos=read('hot-photo-manifest.json')['items']
for p in sorted(ROOT.glob('photo-supplement-*.json')):
 d=json.loads(p.read_text());photos+=d['items'] if isinstance(d,dict) else d
aliases={('harbin','圣索菲亚教堂'):'圣索菲亚广场与教堂外观',('lijiang','玉龙雪山'):'玉龙雪山景区',('dali','崇圣寺三塔'):'崇圣寺三塔文化旅游区',('dali','乳扇'):'烤乳扇',('dali','饵块'):'烧饵块',('dunhuang','玉门关'):'玉门关遗址',('dunhuang','阳关'):'阳关遗址与阳关博物馆',('quanzhou','清源山'):'清源山主景区',('zhuhai','珠海大剧院'):'珠海大剧院（日月贝）',('zhangjiajie','天门山'):'天门山国家森林公园'}
entries={};covers={};used=[]
for photo in photos:
 c=next(x for x in data if x['id']==photo['city']);t=photo['type'];name=aliases.get((c['id'],photo['name']),photo['name'])
 indexes=[i for i,p in enumerate(c[t]) if p['name']==name]
 assert len(indexes)==1,(c['id'],name)
 i=indexes[0];p=c[t][i];key=f"{c['id']}:{t}:{i}"
 valid(photo['source']);valid(photo['originalImage']);assert (DIST/photo['file']).is_file(),photo['file']
 assert key not in entries,key
 entries[key]={**photo,'name':name,'city':c['name'],'catalogPhoto':True,'hotPhoto':True}
 used.append({'key':key,**photo,'matchedName':name})
 if c.get('hotAddedAt'):
  p['photo']=photo['file']
  if t=='places' and c['id'] not in covers:covers[c['id']]={**photo,'title':c['name']+' · '+name,'licenseUrl':photo.get('licenseUrl') or photo['source'],'modification':'已等比缩放与压缩，资料照片非当日实况。'}
assert all(c['id'] in covers for c in data[20:])
assert data[:20]==original
path.write_text('window.DATA='+dump(data)+';')
(DIST/'hot-photos.js').write_text('Object.assign(REAL_PHOTOS,'+dump(entries)+');\nObject.assign(PHOTOS,'+dump(covers)+');')
report={'version':'20261030-hot8','newGuides':8,'guideCount':28,'places':1120,'foods':840,'newPlaces':320,'newFoods':240,'newPhotoRecords':len(entries),'original20Unchanged':True,'original20Sha256':hashlib.sha256(base).hexdigest(),'newPriceSources':sum(bool(p['visit'].get('priceSource')) for c in data[20:] for p in c['places']),'newReservationRules':sum(bool(p['visit'].get('policySource')) and p['visit']['reservationStatus']!='unknown' for c in data[20:] for p in c['places'])}
(DIST/'hot-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
(DIST/'photo-additions.json').write_text(dump(used))
print('HOT_GUIDES_VALIDATED '+dump(report))
