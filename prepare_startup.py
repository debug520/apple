"""Package the existing classic scripts in order; let the city UI precede map I/O."""
from pathlib import Path
import hashlib
import json
import re

out = Path('dist')
html = (out / 'index.html').read_text()
scripts = re.findall(r'<script src="([^"]+)"[^>]*></script>', html)
styles = re.findall(r'<link rel="stylesheet" href="([^"]+)"[^>]*>', html)
assert len(scripts) == len(set(scripts))

def content(path):
    return (out / path.split('?')[0]).read_text()

def asset(name, text):
    digest = hashlib.sha256(text.encode()).hexdigest()[:12]
    relative = f'release-assets/{digest}/{name}'
    path = out / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return relative

engine_names = ['vendor-map/ol.js', 'vendor-map/olms.js']
engine = asset('map-engine.js', '\n;\n'.join(content(name) for name in engine_names))
sections = ["'use strict';\nwindow.__CJ_BOOTING__=true;\nwindow.CHENGJI_MAP_ENGINE=" + json.dumps(engine) + ';', Path('map-loader.js').read_text(),content('image-assets.js'),Path('web-vitals.iife.js').read_text(),Path('vitals-monitor.js').read_text(),Path('progressive-photos.js').read_text(),Path('sw-client.js').read_text()]
for path in scripts:
    if path in engine_names:
        continue
    code = content(path)
    name = path.split('/')[-1].split('?')[0]
    # Compact only pure JSON assignments, without changing the validated data files.
    if name in ['city-data.js', 'national-data.js', 'atlas-data.js']:
        prefix, value = code.split('=', 1)
        code = prefix + '=' + json.dumps(json.loads(value.strip().rstrip(';')), ensure_ascii=False, separators=(',', ':')) + ';'
    if name != 'explorer-ui.js':
        # Legacy modules install their features without repeatedly painting their old homepages.
        code = re.sub(r'(\bfunction render\(\)\{|\brender\s*=\s*function\(\)\{)', r'\1if(window.__CJ_BOOTING__)return;', code)
    sections.append('// ' + name + '\n' + code)
app = asset('city-startup.js', '\n;\n'.join(sections))
css = asset('city-startup.css', '\n'.join(content(path) for path in styles)+'\n'+Path('progressive-photos.css').read_text())
html = re.sub(r'<script src="([^"]+)"[^>]*></script>', '', html)
html = re.sub(r'<link rel="stylesheet" href="([^"]+)"[^>]*>', '', html)
html = re.sub(r'<script>if\(!new URL\(location.href\).*?</script>', '', html, count=1)
critical=Path('boot-shell.css').read_text()
critical=re.sub(r'/\*.*?\*/','',critical,flags=re.S)
critical=re.sub(r'\s+',' ',critical)
html=re.sub(r'<meta\s+[^>]*name="description"[^>]*>','',html,flags=re.I)
head='<style id="cj-critical">'+critical+'</style><link rel="preload" as="style" href="'+css+'" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="'+css+'"></noscript><script defer src="'+app+'"></script><link rel="canonical" href="https://chengji-travel.onrender.com/"><meta name="description" content="城迹提供28城的城市漫游、景点故事与美食文化攻略，可在地图中探索并安排行程。"><script type="application/ld+json">'+(out/'seo-home-schema.json').read_text()+'</script><link rel="describedby" href="/llms.txt"><link rel="alternate" type="text/markdown" href="/index.md">'
html=html.replace('<html lang="zh-CN">','<html lang="zh-CN" class="cjBoot">')
html=re.sub(r'<title>.*?</title>','<title>城迹｜中国城市漫游与美食地图</title>',html)
head += '<link rel="manifest" href="/manifest.webmanifest"><meta property="og:type" content="website"><meta property="og:site_name" content="城迹"><meta property="og:title" content="城迹｜中国城市漫游与美食地图"><meta property="og:url" content="https://chengji-travel.onrender.com/"><meta property="og:description" content="浏览城市去处与在地风味攻略，在地图中安排自己的漫游路线。">'
html = html.replace('</head>',head+'</head>')
html = html.replace('<main class="page" id="app"></main>', '<main class="page" id="app">'+(out/'seo-home.html').read_text()+'</main>')
(out / 'index.html').write_text(html)
(out / 'travel.html').write_text(html)
(out / 'travel/index.html').write_text(html.replace('<head>', '<head><base href="/">'))
report = {'scriptsBefore': len(scripts), 'initialScriptsAfter': 1, 'stylesBefore': len(styles), 'stylesAfter': 1, 'app': app, 'engine': engine, 'css': css, 'engineDeferred': True, 'sourceOrder': scripts}
(out / 'startup-assets.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print('STARTUP_PACKAGED', json.dumps({k:v for k,v in report.items() if k != 'sourceOrder'}))
