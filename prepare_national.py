"""Build a nationwide destination directory without changing any existing guide."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / 'dist'
def read(name):
    return json.loads((ROOT / name).read_text())
def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

guide_file = DIST / 'city-data.js'
guide_bytes = guide_file.read_bytes()
guides = json.loads(guide_bytes.decode()[len('window.DATA='):].rstrip(';\n'))
assert len(guides) == 20
assert sum(len(c['places']) for c in guides) == 800
assert sum(len(c['foods']) for c in guides) == 600

base, regional, scenic = (read(f) for f in ('national-directory.json', 'regional-travel-sources.json', 'national-scenic.json'))
provinces = copy.deepcopy(regional['provinces'])
by_province = {p['code']: p for p in provinces}
rows = copy.deepcopy(base['destinations'] + regional['extraDestinations'])
assert len(rows) == 3212 and len({r['id'] for r in rows}) == 3212
for r in rows:
    r['provinceCode'] = r['provinceCode'][:2]
    p = by_province[r['provinceCode']]
    r['fullName'] = r['name']
    r['provinceName'] = r['province']
    r['province'] = p['name']
    r['region'] = p['region']
    r['travelUrl'] = r.get('url') or p['travelUrl']
    r['travelLabel'] = r.get('source') or p['travelLabel']
    r['scenicIds'] = []
    r['coverage'] = 'directory'
    r['pinyin'] = ''.join(r.get('pinyin', '').lower().split())
    r.setdefault('aliases', [])
    r.setdefault('code', '')
    r.setdefault('prefectureCode', '')
    r.setdefault('prefecture', '')
    # Common place-name polyphones; pinyin is only a search aid.
    for prefix, spelling in {'朝阳':'chaoyang','都匀':'duyun','阿勒泰':'aletai'}.items():
        if r['name'].startswith(prefix):
            r['aliases'].append(r['pinyin'])
            r['pinyin'] = spelling
            break

# Retain old city IDs and item indexes. The directory only links to those guides.
for c in guides:
    matches = [r for r in rows if r['level'] in ('prefecture', 'municipality') and
               (r['shortName'] == c['name'] or r['name'] == c['name'] or r['name'] == c['name']+'市')]
    assert len(matches) == 1, (c['id'], c['name'], len(matches))
    r = matches[0]
    r.update(coverage='detailed', guideId=c['id'], guidePlaces=len(c['places']), guideFoods=len(c['foods']))
assert sum(r['coverage']=='detailed' for r in rows) == 20

# Keep the entire official list, including entries whose city cannot be established
# from the official name. Such entries remain in a clearly labelled provincial pool.
items = copy.deepcopy(scenic['items'])
unassigned = []
for i, item in enumerate(items):
    item['id'] = i
    group = '新疆' if item['province'] == '兵团' else item['province']
    ps = [p for p in provinces if p['name'] == group]
    assert len(ps) == 1, group
    item['provinceCode'] = ps[0]['code']
    item['destinationId'] = None
    city = item.get('city')
    if city:
        candidates = [r for r in rows if r['provinceCode'] == ps[0]['code']]
        exact = [r for r in candidates if r['name'] == city]
        if not exact:
            key = city.removesuffix('市').removesuffix('州').removesuffix('盟').removesuffix('地区')
            levels = ('prefecture', 'municipality') if city.endswith(('州','盟','地区')) else ('prefecture','municipality','county')
            exact = [r for r in candidates if r['level'] in levels and (r['shortName'] == key or r['name'].startswith(key))]
        if len(exact) == 1:
            r = exact[0]
            r['scenicIds'].append(i)
            item['destinationId'] = r['id']
    if item['destinationId'] is None:
        unassigned.append(i)
assert len(items) == 359 and len({x['name'] for x in items}) == 358
assert sum(r['level']=='county' for r in rows) == 2851
assert sum(r['level']!='county' for r in rows) == 361
assert sum(r['level']=='municipality' for r in rows) == 4
assert all(len(r['code']) == 6 for r in rows if r['id'].startswith('cn-'))
ids = {r['id'] for r in rows}
codes = {r['code'] for r in rows if r['code']}
assert all(not r['prefectureCode'] or r['prefectureCode'] in codes for r in rows)
for name in ('哈尔滨市','丽江市','大理白族自治州','阿勒泰地区','敦煌市','凤凰县','婺源县','岑岭县','草湖市','两江新区','香港','澳门','台北市'):
    assert any(r['name']==name for r in rows), name
assert 'cn-500105' not in ids and 'cn-500112' not in ids
assert guide_file.read_bytes() == guide_bytes

payload = {
    'version':'20261029-national1',
    'checkedAt':'2026-10-29',
    'counts':{'destinations':len(rows),'cityLevel':361,'countyLevel':2851,'detailedGuides':20,'guidePlaces':800,'guideFoods':600,'scenicRows':359},
    'provinces':provinces, 'destinations':rows, 'scenic':items,
    'scenicMetadata':scenic['metadata'],
    'directoryMetadata':base['metadata'],
    'sourceNotes':regional.get('sourceNotes', []),
}
(DIST/'national-data.js').write_text('window.NATIONAL='+dump(payload)+';')
report = {**payload['counts'], 'assignedScenicRows':len(items)-len(unassigned),
          'unassignedScenicRows':len(unassigned), 'guideSha256':hashlib.sha256(guide_bytes).hexdigest(),
          'existingGuidesUnchanged':True, 'checkedAt':payload['checkedAt'], 'version':payload['version']}
(DIST/'national-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print('NATIONAL_DIRECTORY_VALIDATED '+dump(report))
