"""Append destinations; never renumber existing saved-item keys."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / 'dist'
def read_json(name):
    return json.loads((ROOT / name).read_text())
def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

data = json.loads((DIST / 'city-data.js').read_text()[len('window.DATA='):].rstrip(';'))
before = {c['id']: [p['name'] for p in c['places']] for c in data}
photos = {p['name']: p for p in read_json('leisure-photo-manifest.json')}
photo_entries = {}
for row in read_json('leisure-data.json'):
    p = dict(row)
    city_id = p.pop('city')
    c = next(c for c in data if c['id'] == city_id)
    assert not any(old['name'] == p['name'] for old in c['places']), p['name']
    photo = photos[p['name']]
    assert 'file' in photo and (DIST / photo['file']).is_file(), p['name']
    p['photo'] = photo['file']
    key = f"{c['id']}:places:{len(c['places'])}"
    photo_entries[key] = {**photo, 'originalImage': photo['image'], 'city': c['name']}
    c['places'].append(p)

updates = read_json('admission-overrides.json')
for c in data:
    for p in c['places']:
        v = p.setdefault('visit', {
            'reservationStatus': 'unknown',
            'reservation': '该景点的当前预约要求尚未核实；请在官方渠道确认是否预约、是否分时段及入场证件。',
            'ticket': '尚未核实当前门票价格；免费区域、收费展区、演出和交通可能分别计费。',
            'hours': '开放日、停止入场及闭馆安排请向景区官方核对。',
            'address': c['name'] + ' · ' + p['name'] + '（请在地图中确认实际入口）',
            'transport': '查看高德中的实际入口与交通路线；本站参考坐标不等于验票入口。',
            'extra': p.get('tip') or p.get('reading', {}).get('visitAdvice') or '核对门票包含项目、退改政策及另收费服务。',
            'accessibility': '婴儿车、轮椅、寄存及优待证件要求，请向场馆确认。',
            'sources': []
        })
        patch = updates.get(p['name'], {})
        v.update(patch)
        for field, label in [('policySource', '预约与入园规则'), ('priceSource', '门票参考来源')]:
            if patch.get(field) and not any(s['url'] == patch[field] for s in v['sources']):
                v['sources'].append({'label': label, 'url': patch[field]})
        if p['name'] == '上海迪士尼度假区':
            p['group'] = p['category'] = '主题乐园'
            p['duration'] = 540
        assert v['reservationStatus'] in ['required', 'conditional', 'not-required', 'unknown']
    assert [p['name'] for p in c['places'][:len(before[c['id']])]] == before[c['id']]

(DIST / 'city-data.js').write_text('window.DATA=' + dump(data) + ';')
(DIST / 'leisure-photos.js').write_text('Object.assign(REAL_PHOTOS,' + dump(photo_entries) + ');')
assert len(data) == 20 and sum(len(c['places']) for c in data) == 302
assert sum(len(c['foods']) for c in data) == 200
print('Added 51 destinations across 20 cities; 302 places / 200 foods; original keys preserved.')
