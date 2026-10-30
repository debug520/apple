"""Prepare locally served map paths and reference centres; no runtime map API."""
import json,math
from pathlib import Path
R=Path(__file__).parent
D=R/'map-source'
def project(p):return [round(35+(p[0]-73)*14.3,2),round(35+(math.log(math.tan(math.pi/4+math.radians(54)/2))-math.log(math.tan(math.pi/4+math.radians(p[1])/2)))*819.33,2)]
def sea(p):return [round(825+(p[0]-105)*7,2),round(510+(24-p[1])*8,2)]
def rings(g):return g['coordinates'] if g['type']=='Polygon' else [r for poly in g['coordinates'] for r in poly]
def path(rs,fn):
 out=[]
 for ring in rs:
  pts=[]
  for p in ring:
   q=fn(p)
   if not pts or q!=pts[-1]:pts.append(q)
  if len(pts)>2:out.append('M'+'L'.join(','.join(map(str,p))for p in pts)+'Z')
 return ''.join(out)
features=json.loads((D/'china.json').read_text())['features'];provinces=[];islands=[];centres={}
for f in features:
 prop=f['properties'];rs=rings(f['geometry'])
 if prop['adcode']=='100000_JD':islands+=rs;continue
 code=str(prop['adcode'])[:2];main=[r for r in rs if max(p[1]for p in r)>=18];off=[r for r in rs if max(p[1]for p in r)<18];islands+=off
 pts=[project(p)for r in main for p in r];xs,ys=zip(*pts)
 provinces.append({'code':code,'name':prop['name'],'path':path(main,project),'bounds':[min(xs),min(ys),max(xs)-min(xs),max(ys)-min(ys)],'label':project(prop.get('centroid')or prop['center'])})
 centres[str(prop['adcode'])]=project(prop['center'])
for code,point in json.loads((D/'centres.json').read_text()).items():centres[code]=project(point)
# Retain only compact reference centres from drill-down source files.
payload={'version':'20261030-map2','source':'https://datav.aliyun.com/portal/school/atlas/area_selector','dataSource':'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json','checkedAt':'2026-10-30','provinces':provinces,'seaPath':path(islands,sea),'centres':centres}
assert len(provinces)==34 and len({p['code']for p in provinces})==34
(R/'dist/atlas-data.js').write_text('window.CHENGJI_ATLAS='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';')
print('ATLAS_GEOMETRY_VALIDATED: 34 provinces, island inset and reference centres')
