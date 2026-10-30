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
cp national-model.js national-ui.js national-integration.js national.css destinations.html hot-ui.js dist/
python3 - <<'PY'
from pathlib import Path
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
p.write_text(s)
Path('dist/index.html').write_text(s)
Path('dist/travel').mkdir(exist_ok=True)
Path('dist/travel/index.html').write_text(s.replace('<head>','<head><base href="/">'))
PY
node --check dist/national-ui.js
node --check dist/national-integration.js
node check_national.cjs
node check_hot.cjs
