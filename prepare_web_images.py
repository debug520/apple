"""Generate responsive WebP derivatives; retain every credited original unchanged."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

out=Path('dist')
records=json.loads((out/'seo-records.json').read_text())
files=sorted({p['file'] for c in records for t in ['places','foods'] for p in c[t] if p.get('file') and not p['file'].startswith('http')})
target=out/'responsive-photos';target.mkdir(exist_ok=True)
def prepare(file):
    raw=(out/file).read_bytes()
    digest=hashlib.sha256(raw+b'cj-webp-v1-q74').hexdigest()[:16]
    variants={}
    with Image.open(out/file) as source:
        source=ImageOps.exif_transpose(source).convert('RGB')
        for name,width in [('card',320),('detail',640)]:
            photo=source.copy();photo.thumbnail((width,width),Image.Resampling.LANCZOS)
            path=f'responsive-photos/{digest}-{width}.webp'
            if not (out/path).exists():photo.save(out/path,'WEBP',quality=74,method=4)
            variants[name]={'src':path,'width':photo.width,'height':photo.height}
    return file,variants,len(raw),sum((out/v['src']).stat().st_size for v in variants.values())
with ThreadPoolExecutor(max_workers=4) as pool: prepared=list(pool.map(prepare,files))
manifest={file:variants for file,variants,_,_ in prepared}
(out/'image-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
(out/'image-assets.js').write_text('window.CHENGJI_IMAGES='+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\nwindow.ChengjiImage=function(file,kind="card"){return window.CHENGJI_IMAGES[file]?.[kind]||{src:file,width:640,height:480}};\n')
report={'uniqueImages':len(files),'variants':len(files)*2,'originalBytes':sum(x[2] for x in prepared),'webpBytesBothSizes':sum(x[3] for x in prepared),'cardBytes':sum((out/v['card']['src']).stat().st_size for v in manifest.values()),'originalsPreserved':True}
(out/'image-optimization.json').write_text(json.dumps(report,indent=2));print('RESPONSIVE_IMAGES_READY',json.dumps(report))
