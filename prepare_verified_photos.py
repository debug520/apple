"""Add individually verified photos without changing guide data or stable item IDs."""
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
DIST = ROOT / 'dist'
data = json.loads((DIST / 'city-data.js').read_text()[12:].rstrip(';\n'))
manifest = json.loads((ROOT / 'verified-photo-manifest.json').read_text())
entries = {}
for row in manifest['items']:
    city, kind, number = row['key'].split(':')
    assert kind in ('places', 'foods') and number.isdigit(), row['key']
    guide = next(c for c in data if c['id'] == city)
    assert guide[kind][int(number)]['name'] == row['name'], row['key']
    assert row['key'] not in entries, row['key']
    assert all(row.get(k) for k in ('artist', 'license', 'sourceTitle', 'identityEvidence')), row['key']
    for field in ('source', 'originalImage', 'licenseUrl'):
        u = urlparse(row[field])
        assert u.scheme == 'https' and u.netloc, row[field]
    assert re.fullmatch(r'verified-photos/[a-z0-9-]+\.jpg', row['file']), row['file']
    file = DIST / row['file']
    assert file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest() == row['sha256'], row['key']
    entries[row['key']] = {**row, 'city': guide['name'], 'catalogPhoto': True}

(DIST / 'verified-photos.js').write_text('Object.assign(REAL_PHOTOS,' + json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + ');\n')
app = DIST / 'app.js'
source = app.read_text()
needle = 'function photoCredit(file){'
assert source.count(needle) == 1
source = source.replace(needle, needle + "const verified=window.verifiedPhotoCredit?.(file);if(verified)return verified;")
app.write_text(source)
report = {'version': '20261112-photos-recovery', 'addedPhotoRecords': len(entries), 'places': sum(r['type'] == 'places' for r in entries.values()), 'foods': sum(r['type'] == 'foods' for r in entries.values()), 'guideSha256': hashlib.sha256((DIST / 'city-data.js').read_bytes()).hexdigest(), 'sourceAndLicensePresent': True, 'allAssetsVerified': True}
(DIST / 'verified-photo-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
print('VERIFIED_PHOTOS_VALIDATED ' + json.dumps(report, ensure_ascii=False))
