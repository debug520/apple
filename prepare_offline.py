"""Version a bounded first-party cache without storing API or personal data."""
from pathlib import Path
import hashlib,json
out=Path('dist');startup=json.loads((out/'startup-assets.json').read_text());guides=json.loads((out/'seo-validation.json').read_text())
offline='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>暂时离线｜城迹</title><style>body{margin:0;padding:40px 24px;background:#fbfaf6;color:#20384b;font:16px/1.8 system-ui}main{max-width:680px;margin:auto}a{display:inline-flex;align-items:center;min-height:44px;padding:8px 16px;border-radius:10px;background:#24485f;color:white;margin:8px;text-decoration:none}</style></head><body><main><h1>这份攻略尚未缓存</h1><p>当前无法联网。可以先打开已缓存的城市目录或地图列表；首次阅读的页面需要联网加载。</p><p>离线内容可能过时，天气、路况、预约和票价请联网后核对。</p><a href="/cities/">城市目录</a><a href="/index.html">地图与地点列表</a></main></body></html>'''
(out/'offline.html').write_text(offline)
precache=['/index.html','/cities/','/offline.html']+['/'+startup[k] for k in ['app','css','engine']]+[guides['css'],guides['metrics']]
digest=hashlib.sha256((json.dumps(precache)+Path('service-worker.js').read_text()).encode())
for path in precache:digest.update((out/path.lstrip('/')).read_bytes() if not path.endswith('/') else (out/path.lstrip('/')/'index.html').read_bytes())
version=digest.hexdigest()[:16]
worker=Path('service-worker.js').read_text().replace('__CJ_VERSION__',version).replace('__CJ_PRECACHE__',json.dumps(precache,separators=(',',':')))
(out/'sw.js').write_text(worker)
(out/'offline-validation.json').write_text(json.dumps({'version':version,'precache':precache,'pageLimit':40,'imageLimit':100,'apiResponsesCached':False,'personalRecordsCached':False},indent=2))
print('OFFLINE_CACHE_READY',version,'bounded public pages and immutable assets only')
