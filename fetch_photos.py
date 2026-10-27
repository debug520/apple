import json, urllib.request, urllib.parse, concurrent.futures, pathlib, time
ROOT=pathlib.Path(__file__).parent
OUT=ROOT/'dist'/'expanded-photos'
OUT.mkdir(parents=True,exist_ok=True)
items=json.loads((ROOT/'photo-manifest.json').read_text())
def fetch(it):
    target=OUT/(it['key'].replace(':','-')+'.jpg')
    if target.exists() and target.stat().st_size>1000:return it['key'], 'cached'
    url=urllib.parse.quote(it['image'].strip(),safe=":/?&=%+;,@!$'()*[]~")
    for attempt in range(2):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
            with urllib.request.urlopen(req,timeout=18) as r:
                data=r.read(12_000_000)
            if len(data)<1000 or not (data.startswith(b'\xff\xd8') or data.startswith(b'\x89PNG') or data.startswith(b'RIFF') or data.startswith(b'GIF8')):raise ValueError('not a supported image')
            target.write_bytes(data)
            return it['key'],'ok'
        except Exception as e: error=str(e)
    return it['key'],error
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=10).map(fetch,items))
errors=[(key,status) for key,status in results if status not in ('ok','cached')]
(ROOT/'photo-download-report.json').write_text(json.dumps(errors,ensure_ascii=False))
print(json.dumps({'total':len(items),'downloaded':len(items)-len(errors),'errors':errors},ensure_ascii=False),flush=True)
if errors:raise SystemExit(1)
