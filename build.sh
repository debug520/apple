set -eu
mkdir -p dist
for archive in assets-*.zip; do unzip -qo "$archive" -d dist; done
cp expansion-data.js expansion-ui.js dist/
python3 - <<'PY'
from pathlib import Path
p=Path('dist/travel.html')
s=p.read_text().replace('<script src="basic-state.js">','<script src="expansion-data.js"></script><script src="basic-state.js">')
s=s.replace('</body>','<script src="expansion-ui.js"></script></body>').replace('浏览十座城市','浏览二十座城市')
p.write_text(s)
Path('dist/index.html').write_text(s)
Path('dist/travel').mkdir(exist_ok=True)
Path('dist/travel/index.html').write_text(s.replace('<head>','<head><base href="/">'))
PY
