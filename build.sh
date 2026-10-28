set -eu
mkdir -p dist
for archive in assets-*.zip; do unzip -qo "$archive" -d dist; done
cp expansion-ui.js catalog-ui.js compact-ui.js compact.css practical-ui.js practical.css dist/
python3 enrich.py
python3 enrich_leisure.py
python3 - <<'PY'
from pathlib import Path
p=Path('dist/travel.html')
s=p.read_text().replace('<script src="app.js">','<script src="enriched-photos.js?v=20261027"></script><script src="app.js">')
s=s.replace('</body>','<script src="expansion-ui.js"></script><script src="catalog-ui.js?v=20261027"></script></body>').replace('浏览十座城市','浏览二十座城市')
s=s.replace('src="city-data.js"','src="city-data.js?v=20261028b"')
s=s.replace('<script src="app.js">','<script src="leisure-photos.js?v=20261028b"></script><script src="app.js">')
s=s.replace('</head>','<link rel="stylesheet" href="compact.css?v=20261027c"></head>').replace('</body>','<script src="compact-ui.js?v=20261027c"></script></body>')
s=s.replace('</head>','<link rel="stylesheet" href="practical.css?v=20261028b"></head>').replace('</body>','<script src="practical-ui.js?v=20261028b"></script></body>')
b=Path('dist/basic.js')
b.write_text('\n'.join(line for line in b.read_text().splitlines() if not line.startswith('const basicMine=minePage;'))+'\n')
p.write_text(s)
Path('dist/index.html').write_text(s)
Path('dist/travel').mkdir(exist_ok=True)
Path('dist/travel/index.html').write_text(s.replace('<head>','<head><base href="/">'))
PY
