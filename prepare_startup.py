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
sections = ["'use strict';\nwindow.__CJ_BOOTING__=true;\nwindow.CHENGJI_MAP_ENGINE=" + json.dumps(engine) + ';', Path('map-loader.js').read_text()]
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
css = asset('city-startup.css', '\n'.join(content(path) for path in styles))
html = re.sub(r'<script src="([^"]+)"[^>]*></script>', '', html)
html = re.sub(r'<link rel="stylesheet" href="([^"]+)"[^>]*>', '', html)
html = re.sub(r'<script>if\(!new URL\(location.href\).*?</script>', '', html, count=1)
html = html.replace('</head>', '<link rel="stylesheet" href="' + css + '"><script defer src="' + app + '"></script></head>')
html = html.replace('<main class="page" id="app"></main>', '<main class="page" id="app"><div role="status" style="padding:48px 28px;font:16px/1.8 system-ui;color:#284b62"><b style="font-size:30px">城迹</b><p>正在打开城市地图…</p><small>搜索与地点列表会先就绪，底图随后显示。</small></div></main>')
(out / 'index.html').write_text(html)
(out / 'travel.html').write_text(html)
(out / 'travel/index.html').write_text(html.replace('<head>', '<head><base href="/">'))
report = {'scriptsBefore': len(scripts), 'initialScriptsAfter': 1, 'stylesBefore': len(styles), 'stylesAfter': 1, 'app': app, 'engine': engine, 'css': css, 'engineDeferred': True, 'sourceOrder': scripts}
(out / 'startup-assets.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print('STARTUP_PACKAGED', json.dumps({k:v for k,v in report.items() if k != 'sourceOrder'}))
