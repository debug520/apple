"""Validate crawlable pages, honest metadata and responsive image outputs."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import json,re,xml.etree.ElementTree as ET
from PIL import Image

out=Path('dist');report=json.loads((out/'seo-validation.json').read_text())
class Page(HTMLParser):
    def __init__(self):super().__init__();self.tags=[];self.jsonld=[];self.active=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.tags.append((tag,a))
        if tag=='script' and a.get('type')=='application/ld+json':self.active=True
    def handle_endtag(self,tag):
        if tag=='script':self.active=False
    def handle_data(self,data):
        if self.active:self.jsonld.append(json.loads(data))
urls=[x.text for x in ET.parse(out/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
topics=[url for url in urls if urlparse(url).path.startswith('/topics/')]
assert topics and len(urls)==len(set(urls))==1991+len(topics)
assert 'Sitemap: https://chengji-travel.onrender.com/sitemap.xml' in (out/'robots.txt').read_text()
for url in urls:
    path=urlparse(url).path
    file=out/path.lstrip('/')
    if path.endswith('/'):file=file/'index.html'
    text=file.read_text();p=Page();p.feed(text)
    assert '<h1>' in text and p.jsonld and 'lang="zh-CN"' in text,(path,'HTML content missing')
    assert any(t=='link' and a.get('rel')=='canonical' and a.get('href')==url for t,a in p.tags),(path,'canonical')
    assert 'noindex' not in text
    if url in topics:
        entries=p.jsonld[0]['@graph'][0]['mainEntity']['itemListElement']
        assert entries and all(item['url'] in urls for item in entries)
    if path == '/destinations.html':
        assert '/cities/shanghai/' in text and '/cities/beijing/' in text
    if path.startswith('/cities/'):
        assert 'city-startup.js' not in text and 'map-engine.js' not in text
        assert len([1 for t,a in p.tags if t=='script' and 'src' in a])==1
        assert not any('aggregateRating' in json.dumps(x) or 'LocalBusiness' in json.dumps(x) for x in p.jsonld)
    for t,a in p.tags:
        if t=='img':assert a.get('width') and a.get('height') and a.get('alt'),path
    if '/foods/' in path:assert p.jsonld[0]['@graph'][0]['mainEntity']['@type']=='Thing'
    if '/places/' in path:assert p.jsonld[0]['@graph'][0]['mainEntity']['@type']=='TouristAttraction'
manifest=json.loads((out/'image-assets.json').read_text())
for original,variants in manifest.items():
    assert (out/original).is_file()
    for v in variants.values():
        with Image.open(out/v['src']) as im:assert im.format=='WEBP' and im.size==(v['width'],v['height'])
home=(out/'index.html').read_text();assert 'id="cj-critical"' in home and 'rel="preload" as="style"' in home
assert '/cities/beijing/' in home and '/cities/shanghai/' in home
assert home.count('name="description"')==1
assert '跳到文本地点列表' in Path('explorer-ui.js').read_text()
assert 'tabindex="0"' in Path('explorer-ui.js').read_text()
report.update({'sitemapURLsVerified':len(urls),'responsivePhotosVerified':len(manifest),'staticHTMLReadableWithoutJS':True,'fieldVitalsPassed':False,'physicalPhoneTested':False})
(out/'delivery-validation.json').write_text(json.dumps(report,indent=2))
print('DELIVERY_CHECKS_PASSED',json.dumps(report))
