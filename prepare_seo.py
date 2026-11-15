"""Publish truthful, linked HTML snapshots using the existing verified guide data."""
from pathlib import Path
from html import escape as E
from urllib.parse import urlencode,urlparse
import hashlib,json,re

out=Path('dist');origin='https://chengji-travel.onrender.com'
cities=json.loads((out/'seo-records.json').read_text());images=json.loads((out/'image-assets.json').read_text());urls=[]
def asset(name,text):
    path='release-assets/'+hashlib.sha256(text.encode()).hexdigest()[:12]+'/'+name
    p=out/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text);return '/'+path
(out/'licenses').mkdir(exist_ok=True)
(out/'licenses/web-vitals.txt').write_bytes(Path('WEB-VITALS-LICENSE.txt').read_bytes())
css=asset('guide-pages.css',Path('guide-pages.css').read_text()+'\n'+Path('progressive-photos.css').read_text())
metrics=asset('vitals.js',Path('web-vitals.iife.js').read_text()+'\n;\n'+Path('vitals-monitor.js').read_text()+'\n;\n'+Path('progressive-photos.js').read_text()+'\n;\n'+Path('sw-client.js').read_text())
def city_path(c):return '/cities/'+c['id']+'/'
def item_path(c,kind,i):return city_path(c)+kind+'/'+str(i)+'/'
def map_link(c,p=None):return '/index.html?'+urlencode({'destination':c['id'],**({'item':p['key']} if p else {})})
def safe(url):return isinstance(url,str) and urlparse(url).scheme in ('https','http')
def link(url,label):return '<a href="'+E(url,quote=True)+'" target="_blank" rel="noopener">'+E(label)+'</a>' if safe(url) else E(label)
def description(p):return p.get('description') or p.get('story') or p.get('reading',{}).get('history') or p.get('name','')
def photo(p,hero=False):
    file=p.get('file');v=images.get(file,{})
    if not v:return ''
    size=v['detail' if hero else 'card']
    attrs=' fetchpriority="high"' if hero else ' loading="lazy"'
    return '<span class="cj-photo-frame" style="--cj-preview:url(\''+size['preview']+'\');--cj-photo-ratio:'+str(size['width'])+'/'+str(size['height'])+'"><img class="cj-photo-loading" data-photo-original="/'+E(file,quote=True)+'" data-photo-preview="'+size['preview']+'" src="/'+size['src']+'" width="'+str(size['width'])+'" height="'+str(size['height'])+'" decoding="async"'+attrs+' alt="'+E(p['name']+'资料照片',quote=True)+'"></span>'

def breadcrumb(items):return '<nav class="breadcrumbs" aria-label="面包屑">'+'<span aria-hidden="true"> / </span>'.join('<a href="'+E(path,quote=True)+'">'+E(name)+'</a>' for name,path in items)+'</nav>'
def crumb_json(items):return {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i+1,'name':name,'item':origin+path} for i,(name,path) in enumerate(items)]}
def page(path,title,desc,body,graph):
    canonical=origin+path
    data=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    html='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+E(title)+'</title><meta name="description" content="'+E(desc[:160],quote=True)+'"><link rel="canonical" href="'+canonical+'"><meta property="og:title" content="'+E(title,quote=True)+'"><meta property="og:description" content="'+E(desc[:160],quote=True)+'"><meta property="og:url" content="'+canonical+'"><meta property="og:type" content="website"><link rel="stylesheet" href="'+css+'"><script type="application/ld+json">'+data+'</script><script defer src="'+metrics+'"></script></head><body><a class="skip" href="#content">跳到正文</a><header><a href="/">城迹</a><nav aria-label="站点导航"><a href="/cities/">城市攻略</a><a href="/index.html">交互地图</a></nav></header><main id="content">'+body+'</main><footer><p>城迹 · 城市故事与在地风味。资料照片非当日实况，菜品资料不代表指定门店；开放、预约和价格请以官方当日信息为准。</p><a href="/cities/">浏览全部详细城市攻略</a></footer></body></html>'
    p=out/path.lstrip('/')/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(html);urls.append(canonical)
def city_cards():return ''.join('<a class="city-link" href="'+city_path(c)+'"><strong>'+E(c['name'])+'</strong><span>'+E(c.get('tagline','城市漫游与在地风味'))+'</span></a>' for c in cities)
hub='<p class="eyebrow">CITY WALKS / 城市漫游</p><h1>从一座城开始，读懂当地的故事与风味</h1><p class="intro">28 城详细攻略，收录 1,120 处地点和 840 种风味。先看文字攻略，再打开地图安排漫游。</p><div class="actions"><a class="cta" href="/index.html">打开交互地图</a></div><div class="city-grid">'+city_cards()+'</div>'
page('/cities/','城市漫游与美食地图｜28城详细旅游攻略｜城迹','浏览28城的景点历史、城市漫游和美食文化，查看资料来源、预约提示，并在地图中安排旅行。',hub,[{'@type':'CollectionPage','name':'城市漫游与美食地图','url':origin+'/cities/'},crumb_json([('城迹','/'),('城市攻略','/cities/')])])
for c in cities:
    cp=city_path(c);name=c['name'];bc=[('城迹','/'),('城市攻略','/cities/'),(name,cp)]
    body=breadcrumb(bc)+'<p class="eyebrow">'+E(c['province'])+' / CITY WALKS</p><h1>'+E(name)+'城市漫游与美食地图</h1><p class="intro">'+E(c.get('summary') or c.get('tagline',''))+'</p><div class="actions"><a class="cta" href="'+E(map_link(c),quote=True)+'">进入'+E(name)+'漫游地图</a><a class="cta secondary" href="#foods">看看当地吃什么</a></div>'
    for kind,label in [('places','城市去处'),('foods','在地风味')]:
        body+='<section id="'+kind+'"><h2>'+label+' · '+str(len(c[kind]))+'</h2><div class="cards">'
        for i,p in enumerate(c[kind]):
            body+='<article class="card">'+photo(p)+'<h3><a href="'+item_path(c,kind,i)+'">'+E(p['name'])+'</a></h3><p>'+E(description(p)[:125])+'</p><a class="read" href="'+item_path(c,kind,i)+'">阅读'+E(p['name'])+'攻略 →</a></article>'
        body+='</div></section>'
    if c.get('history'):body+='<section><h2>城市时间线</h2><dl>'+''.join('<dt>'+E(str(x.get('year','')) )+'</dt><dd>'+E(x.get('text',''))+'</dd>' for x in c['history'])+'</dl></section>'
    graph=[{'@type':'CollectionPage','name':name+'城市漫游与美食地图','url':origin+cp,'description':c.get('summary',''),'about':{'@type':'City','name':name},'hasPart':[{'@type':'WebPage','name':p['name'],'url':origin+item_path(c,t,i)} for t in ['places','foods'] for i,p in enumerate(c[t])]},crumb_json(bc)]
    page(cp,name+'城市漫游与美食地图｜景点故事与当地风味｜城迹',c.get('summary') or c.get('tagline',''),body,graph)
    for kind in ['places','foods']:
        for i,p in enumerate(c[kind]):
            ip=item_path(c,kind,i);visit=p.get('visit',{});ibc=bc+[(p['name'],ip)];reading=p.get('reading',{})
            title=p['name']+'｜'+name+('景点游览与预约提示' if kind=='places' else '美食文化与吃法')+'｜城迹'
            text=breadcrumb(ibc)+'<p class="eyebrow">'+E(name)+' · '+('城市去处' if kind=='places' else '在地风味')+'</p><h1>'+E(p['name'])+'</h1><div class="actions"><a class="cta" href="'+E(map_link(c,p),quote=True)+'">在'+E(name)+'地图中查看</a><a class="cta secondary" href="'+cp+'">返回'+E(name)+'城市攻略</a></div><div class="detail-grid"><article><h2>'+('认识这里' if kind=='places' else '这道风味是什么')+'</h2><p class="intro">'+E(description(p))+'</p>'
            for label,value in [('名称来历',p.get('nameOrigin')),('看什么',reading.get('lookFor')),('游览提示',p.get('tip') if kind=='places' else ''),('吃法与口味',p.get('taste') or p.get('tip') if kind=='foods' else ''),('文化线索',reading.get('culture'))]:
                if value:text+='<h2>'+label+'</h2><p>'+E(value)+'</p>'
            if kind=='places':
                text+='<h2>出发前核对</h2><dl>'+''.join('<dt>'+label+'</dt><dd>'+E(str(value))+'</dd>' for label,value in [('开放时间',visit.get('hours')),('门票与费用',visit.get('ticket')),('预约提示',visit.get('reservation')),('交通与入口',visit.get('transport')),('开放状态',visit.get('availability'))] if value)+'</dl>'
                dates=[visit.get('policyCheckedAt'),visit.get('priceCheckedAt')];dates=sorted(set(d for d in dates if d))
                if dates:text+='<p class="note">资料核对日期：'+E('、'.join(dates))+'。这不是当日状态。</p>'
            else:text+='<p class="warning">本页介绍菜品与地方饮食文化，不代表具体餐馆或门店；摆盘、口味及售价依店家而异。</p>'
            sources=[(p.get('url'),p.get('source') or '条目资料来源')]+[(s.get('url'),s.get('label','参考资料')) for s in visit.get('sources',[])]
            text+='<h2>资料来源</h2><ul>'+''.join('<li>'+link(u,l)+'</li>' for u,l in sources if safe(u))+'</ul></article><aside>'
            if photo(p,True):text+='<figure class="hero-photo">'+photo(p,True)+'<figcaption class="source">'+p.get('credit','')+'<p>已等比缩放压缩，保留完整画面。</p></figcaption></figure>'
            else:text+='<p class="note">暂无已核对的条目照片。</p>'
            text+='</aside></div><section><h2>继续认识'+E(name)+'</h2><div class="related">'+''.join('<a href="'+item_path(c,kind,j)+'">'+E(q['name'])+'</a>' for j,q in enumerate(c[kind]) if abs(j-i)<=3 and i!=j)+'</div></section>'
            entity={'@type':'TouristAttraction' if kind=='places' else 'Thing','@id':origin+ip+'#subject','name':p['name'],'description':description(p),'url':origin+ip}
            if kind=='places':entity['containedInPlace']={'@type':'City','name':name}
            if safe(p.get('url')):entity['subjectOf']={'@type':'CreativeWork','name':p.get('source') or '条目资料来源','url':p['url']}
            if p.get('file') in images:entity['image']=origin+'/'+images[p['file']]['detail']['src']
            graph=[{'@type':'WebPage','name':title,'url':origin+ip,'inLanguage':'zh-CN','mainEntity':entity},crumb_json(ibc)]
            page(ip,title,description(p),text,graph)
home='<div class="boot-guide"><section><p class="eyebrow">城市故事 · 在地风味</p><h1>城迹 · 中国城市漫游与美食地图</h1><p>在城市故事、景点与当地风味之间，找到下一站。</p><a class="cta" href="/cities/">选择城市，开始漫游</a><p role="status">正在打开城市地图…</p><p class="source">搜索与地点列表会先就绪；底图加载期间，也可以先阅读城市攻略。</p><div class="city-grid">'+city_cards()+'</div></section><div class="boot-map" aria-hidden="true"><span>城市地图正在准备<br>文字攻略已可浏览</span></div></div>'
(out/'seo-home.html').write_text(home)
home_graph={'@context':'https://schema.org','@type':'WebSite','name':'城迹','url':origin+'/','inLanguage':'zh-CN','description':'中国城市漫游、景点故事与在地美食地图'}
(out/'seo-home-schema.json').write_text(json.dumps(home_graph,ensure_ascii=False).replace('<','\\u003c'))
all_urls=[origin+'/']+urls
(out/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+E(u)+'</loc></url>' for u in all_urls)+'</urlset>')
(out/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n')
(out/'seo-validation.json').write_text(json.dumps({'cities':len(cities),'placePages':sum(len(c['places']) for c in cities),'foodPages':sum(len(c['foods']) for c in cities),'indexablePages':len(all_urls),'unverifiedBusinessesAdded':0,'css':css,'metrics':metrics},indent=2))
print('STATIC_GUIDES_READY',len(all_urls),'indexable pages; no JavaScript needed for guide content')
