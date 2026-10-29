"""Validate expansion invariants against the preceding published release."""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
DIST = ROOT / 'dist'
data = json.loads((DIST/'city-data.js').read_text()[len('window.DATA='):].rstrip(';\n'))
expansion = json.loads((ROOT/'catalog-expansion.json').read_text())
photos = json.loads((ROOT/'catalog-photo-manifest.json').read_text())['items']
assert len(data) == 20
assert sum(len(c['places']) for c in data) == 800
assert sum(len(c['foods']) for c in data) == 600
assert len({c['id'] for c in data}) == 20
for c in data:
    assert len(c['places']) == 40 and len(c['foods']) == 30, c['id']
    for t in ('places','foods'):
        assert len({p['name'] for p in c[t]}) == len(c[t]), (c['id'],t)
        for p in c[t]:
            assert p.get('url') and p.get('source'), p['name']
            assert urlparse(p['url']).scheme in ('https','http'), p['name']
            if p.get('photo'):
                assert (DIST/p['photo']).is_file(), p['photo']
            if p.get('catalogAddedAt') and t == 'places':
                if p['visit'].get('policySource'):
                    assert p['visit'].get('policyCheckedAt') and p['visit']['sources'], p['name']
                else:
                    assert p['visit']['reservationStatus'] == 'unknown', p['name']
                if p['visit'].get('priceSource'):
                    assert p['visit'].get('priceCheckedAt') and p['visit']['sources'], p['name']
                assert p['reading']['lookFor'] and p['reading']['visitAdvice']
    assert len(c.get('merchants',[])) >= 3, c['id']
for c_id,name in [('luoyang','洛阳博物馆'),('chengdu','金沙遗址博物馆'),('guangzhou','长隆水上乐园')]:
    c = next(c for c in data if c['id']==c_id)
    assert next(p for p in c['places'] if p['name']==name)['visit'].get('availability'), name
assert sum(len(c['places']) for c in expansion['cities']) == 498
assert sum(len(c['foods']) for c in expansion['cities']) == 400
assert len({(p['city'],p['type'],p['name']) for p in photos}) == len(photos)
for p in photos:
    assert (DIST/p['file']).is_file(), p['file']
    assert urlparse(p['source']).scheme in ('http','https')
    assert urlparse(p['originalImage']).scheme in ('http','https')
report = {'cities':20,'places':800,'foods':600,'newPlaces':498,'newFoods':400,'newPhotoRecords':len(photos),'merchants':sum(len(c['merchants']) for c in data),'priceSources':sum(bool(p['visit'].get('priceSource')) for c in data for p in c['places']),'reservationRules':sum(bool(p['visit'].get('policySource')) and p['visit']['reservationStatus']!='unknown' for c in data for p in c['places'])}
print(json.dumps(report,ensure_ascii=False,indent=2))
