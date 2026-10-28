"""Append researched city content without changing existing item keys."""
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
DIST = ROOT / 'dist'
def read(name):
    return json.loads((ROOT / name).read_text())
def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))
def url_ok(url):
    assert urlparse(url).scheme in ('http', 'https') and urlparse(url).netloc, url

data = json.loads((DIST / 'city-data.js').read_text()[len('window.DATA='):].rstrip(';\n'))
original = {c['id']: {t: list(c[t]) for t in ('places', 'foods')} for c in data}
photos = {(p['city'], p['type'], p['name']): p for p in read('catalog-photo-manifest.json')['items']}
entries = {}
for row in read('catalog-expansion.json')['cities']:
    c = next(c for c in data if c['id'] == row['id'])
    for t in ('places', 'foods'):
        for seed in row[t]:
            p = dict(seed)
            assert not any(old['name'] == p['name'] for old in c[t]), (c['id'], p['name'])
            url_ok(p['url'])
            assert all(p.get(k) for k in (('name','category','area','duration','story','lookFor','tip','source','url') if t == 'places' else ('name','category','description','ingredients','taste','eatingTip','source','url'))), p
            p.pop('photoQuery', None)
            p['group'] = p['category']
            p['evidence'] = '地点介绍与游览背景资料（非当前票务核实）' if t == 'places' else '地方风味资料；配方因店家而异'
            p['catalogAddedAt'] = '2026-10-28'
            if t == 'places':
                assert p['category'] in ['历史人文','博物馆','街区夜游','自然公园','主题乐园','动物海洋']
                p['reading'] = {'history': p['story'], 'lookFor': p.pop('lookFor'), 'visitAdvice': p['tip']}
                p['duration'] = int(p['duration'])
                p['visit'] = {
                    'reservationStatus':'unknown',
                    'reservation':'当前预约规则待核实；请向官方确认预约渠道、日期时段与入场证件。',
                    'ticket':'当前票价待核实；请区分淡旺季、指定日期票、免费区域与单独收费项目。',
                    'hours':'开放日、停止入场及临时闭馆安排待核实，请查看官方当日公告。',
                    'address':c['name']+' · '+p['area']+' · '+p['name']+'（请在地图确认实际入口）',
                    'transport':'按实际入口查询交通；郊县地点需另外预留往返时间。',
                    'extra':'请确认门票包含项目，观光车、索道、游船、演出和特展可能另收费；未核实不代表免费。',
                    'accessibility':'无障碍通行、寄存、儿童及学生适用条件，请向运营方确认。',
                    'sources':[{'label':'地点背景资料（非票务核实）','url':p['url']}]
                }
                p['visit'].update(p.pop('visitOverride', {}))
                if p.get('excludeFromPlan'):
                    p['visit']['availability'] = p.get('closureNote', '有暂停开放提示，恢复情况待核实；自动行程暂不安排。')
                    p['visit']['availabilityCheckedAt'] = '2026-10-28'
                    if p.get('closureSource'):
                        url_ok(p['closureSource'])
                        p['visit']['sources'].append({'label':'开放状态提醒','url':p['closureSource']})
            else:
                assert p['category'] in ['面食主食','汤羹热食','点心甜品','地方菜肴']
                p.setdefault('story', p['description'])
                p['spicy'] = bool(p.get('spicy', False))
                p['allergenNote'] = '食材仅作认识菜品参考，过敏者须向店家核对完整配方及交叉接触。'
            photo = photos.get((c['id'], t, p['name']))
            if photo:
                assert (DIST / photo['file']).is_file(), photo['file']
                url_ok(photo['source'])
                p['photo'] = photo['file']
                entries[f"{c['id']}:{t}:{len(c[t])}"] = {**photo, 'city':c['name'], 'catalogPhoto':True}
            else:
                p['photoStatus'] = '暂无已核对资料照片，显示分类图标'
            c[t].append(p)
    c['merchants'] = row.get('merchants', [])
    for m in c['merchants']:
        url_ok(m['url'])
    c['updatedAt'] = '2026-10-28'

assert len(data) == 20
for c in data:
    assert len(c['places']) >= 40 and len(c['foods']) >= 30, c['id']
    for t in ('places','foods'):
        assert c[t][:len(original[c['id']][t])] == original[c['id']][t]
(DIST / 'city-data.js').write_text('window.DATA='+dump(data)+';')
(DIST / 'catalog-photos.js').write_text('Object.assign(REAL_PHOTOS,'+dump(entries)+');')
print('Expanded', len(data), 'cities:', sum(len(c['places']) for c in data), 'places /',sum(len(c['foods']) for c in data),'foods;',len(entries),'new photo records; original keys preserved.')
