set -eu
mkdir -p dist
for archive in assets-*.zip; do unzip -qo "$archive" -d dist; done
cp expansion-ui.js catalog-ui.js compact-ui.js compact.css practical-ui.js practical.css discovery-ui.js discovery.css dist/
python3 enrich.py
python3 enrich_leisure.py
python3 enrich_catalog.py
python3 check_catalog.py
python3 enrich_hot.py
python3 prepare_national.py
python3 prepare_atlas.py
python3 prepare_verified_photos.py
cp photo-ui.js photo-ui.css city-journal.css city-icons.js dist/
cp national-model.js national-ui.js national-integration.js national.css destinations.html hot-ui.js atlas-ui.js atlas.css explorer-model.js explorer-ui.js explorer-map.js explorer.css dist/
python3 - <<'PY'
from pathlib import Path
import hashlib,re,json
p=Path('dist/travel.html')
s=p.read_text().replace('<script src="app.js">','<script src="enriched-photos.js?v=20261027"></script><script src="app.js">')
s=s.replace('</body>','<script src="expansion-ui.js"></script><script src="catalog-ui.js?v=20261027"></script></body>').replace('浏览十座城市','浏览二十座城市')
s=s.replace('src="city-data.js"','src="city-data.js?v=20261028c"')
s=s.replace('<script src="app.js">','<script src="leisure-photos.js?v=20261028c"></script><script src="app.js">')
s=s.replace('</head>','<link rel="stylesheet" href="compact.css?v=20261027c"></head>').replace('</body>','<script src="compact-ui.js?v=20261027c"></script></body>')
s=s.replace('</head>','<link rel="stylesheet" href="practical.css?v=20261028c"></head>').replace('</body>','<script src="practical-ui.js?v=20261028c"></script></body>')
s=s.replace('v=20261028c','v=20261029c')
s=s.replace('<script src="app.js">','<script src="catalog-photos.js?v=20261029c"></script><script src="app.js">')
s=s.replace('</head>','<link rel="stylesheet" href="discovery.css?v=20261029c"></head>').replace('</body>','<script src="discovery-ui.js?v=20261029c"></script></body>')
s=s.replace('</head>','<link rel="stylesheet" href="national.css?v=20261029n1"></head>')
s=s.replace('</body>','<script src="national-data.js?v=20261029n1"></script><script src="national-model.js?v=20261029n1"></script><script src="national-ui.js?v=20261029n1"></script><script src="national-integration.js?v=20261029n1"></script></body>')
s=s.replace('<script src="app.js">','<script src="hot-photos.js?v=20261030h8"></script><script src="app.js">')
s=s.replace('</body>','<script src="hot-ui.js?v=20261030h8"></script></body>')
s=s.replace('v=20261029n1','v=20261030h8').replace('src="city-data.js?v=20261029c"','src="city-data.js?v=20261030h8"')
b=Path('dist/basic.js')
b.write_text('\n'.join(line for line in b.read_text().splitlines() if not line.startswith('const basicMine=minePage;'))+'\n')
s=s.replace('<head>','<head><script>if(!new URL(location.href).searchParams.get("destination")){document.documentElement.classList.add("atlasBoot");document.addEventListener("DOMContentLoaded",()=>document.documentElement.classList.remove("atlasBoot"),{once:true})}</script>')
s=s.replace('</head>','<link rel="stylesheet" href="atlas.css?v=20261030m2"></head>').replace('</body>','<script src="atlas-data.js?v=20261030m2"></script><script src="atlas-ui.js?v=20261030m2"></script></body>')
s=s.replace('</head>','<link rel="stylesheet" href="vendor-map/ol.css"><link rel="stylesheet" href="explorer.css?v=20261031e3"></head>').replace('</body>','<script src="vendor-map/ol.js"></script><script src="vendor-map/olms.js"></script><script src="explorer-map.js?v=20261031e3"></script><script src="explorer-centres.js?v=20261031e3"></script><script src="explorer-model.js?v=20261031e3"></script><script src="explorer-ui.js?v=20261031e3"></script></body>')
s=s.replace('<script src="app.js">','<script src="city-icons.js"></script><script src="verified-photos.js?v=20261105p4"></script><script src="photo-ui.js?v=20261105p4"></script><script src="app.js?v=20261105p1">')
s=s.replace('</head>','<link rel="stylesheet" href="photo-ui.css?v=20261105p4"></head>').replace('explorer-ui.js?v=20261031e3','explorer-ui.js?v=20261105p4').replace('explorer-model.js?v=20261031e3','explorer-model.js?v=20261105p4').replace('discovery-ui.js?v=20261029c','discovery-ui.js?v=20261105p2')
reference_centres=json.loads(Path('map-source/centres.json').read_text())
for feature in json.loads(Path('map-source/china.json').read_text())['features']:
    prop=feature['properties']
    if str(prop.get('adcode')) in ['110000','120000','310000','500000']:
        reference_centres.setdefault(str(prop['adcode']),prop['center'])
Path('dist/explorer-centres.js').write_text('window.EXPLORER_CENTRES='+json.dumps(reference_centres,ensure_ascii=False,separators=(',',':'))+';')
s=s.replace('</head>','<link rel="stylesheet" href="city-journal.css"></head>')
# A content hash in the path avoids CDN caches that ignore query parameters.
for name in ['verified-photos.js','photo-ui.js','photo-ui.css','explorer-model.js','explorer-ui.js','explorer.css','explorer-map.js','explorer-centres.js','city-journal.css','city-icons.js']:
    content=Path('dist',name).read_bytes()
    relative='release-assets/'+hashlib.sha256(content).hexdigest()[:12]+'/'+name
    target=Path('dist',relative)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_bytes(content)
    s=re.sub(r'(src|href)="'+re.escape(name)+r'(?:\?[^"]*)?"',lambda match:match.group(1)+'="'+relative+'"',s)
p.write_text(s)
Path('dist/index.html').write_text(s)
Path('dist/travel').mkdir(exist_ok=True)
Path('dist/travel/index.html').write_text(s.replace('<head>','<head><base href="/">'))
PY
node --check dist/national-ui.js
node --check dist/national-integration.js
node check_national.cjs
node check_hot.cjs

node --check dist/atlas-ui.js
node check_atlas.cjs

node --check dist/explorer-ui.js
node --check dist/city-icons.js
node --check dist/photo-ui.js
node --check dist/verified-photos.js
node check_explorer.cjs
node check_photos.cjs

node check_search.cjs
