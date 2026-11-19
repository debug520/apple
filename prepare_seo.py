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
    html = html.replace('</head>', '<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icons/city-180.png"></head>')
    if path.startswith('/cities/') and path != '/cities/':
        offline = ('<section class="offline-guide" data-offline-guide hidden>'
                   '<button type="button">检查离线副本</button><span role="status"></span></section>')
        html = html.replace('</h1>', '</h1>' + offline, 1)
    p=out/path.lstrip('/')/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(html);urls.append(canonical)
def city_cards():return ''.join('<a class="city-link" href="'+city_path(c)+'"><strong>'+E(c['name'])+'</strong><span>'+E(c.get('tagline','城市漫游与在地风味'))+'</span></a>' for c in cities)
def city_topics(city):
    choices = [
        ('rainy-day', '雨天看展', 'places', '从博物馆中选一站。部分遗址含室外区域，出发前请核对展厅、预约和入口。',
         lambda place: place.get('group') == '博物馆'),
        ('park-walks', '独自散步去哪儿', 'places', '从公园和城市花园中选择散步起点，实际步道、开放时间和返程交通请在出发前确认。',
         lambda place: any(word in place['name'] for word in ('公园', '植物园'))),
        ('local-flavours', '预算有限吃什么', 'foods', '从攻略标为低预算的地方风味中选菜，具体门店、份量和当日售价请另行核对。',
         lambda dish: dish.get('budget') == '低')
    ]
    links = []
    for slug, label, kind, intro, matches in choices:
        rows = [(index, item) for index,item in enumerate(city[kind])
                if matches(item) and not item.get('visit', {}).get('availability')][:10]
        if not rows:
            continue
        path = '/topics/' + city['id'] + '/' + slug + '/'
        title = city['name'] + ' · ' + label
        crumbs = [('城迹','/'),(city['name'],city_path(city)),(label,path)]
        cards, entries = [], []
        for rank,(index,item) in enumerate(rows,1):
            url = item_path(city,kind,index)
            cards.append('<li><h2><a href="'+url+'">'+E(item['name'])+'</a></h2><p>'+E(description(item)[:140])+'</p></li>')
            entries.append({'@type':'ListItem','position':rank,'name':item['name'],'url':origin+url})
        body = breadcrumb(crumbs)+'<h1>'+E(title)+'</h1><p>'+E(intro)+'</p><ol>'+''.join(cards)+'</ol>'
        graph = [{'@type':'CollectionPage','name':title,'url':origin+path,'mainEntity':{
            '@type':'ItemList','numberOfItems':len(rows),'itemListElement':entries}},crumb_json(crumbs)]
        page(path,title+'｜城迹',title+'。'+intro,body,graph)
        links.append('<a class="cta secondary" href="'+path+'">'+E(label)+'</a>')
    return '<nav class="actions" aria-label="城市专题">'+''.join(links)+'</nav>' if links else ''
hub='<p class="eyebrow">CITY WALKS / 城市漫游</p><h1>从一座城开始，读懂当地的故事与风味</h1><p class="intro">28 城详细攻略，收录 1,120 处地点和 840 种风味。先看文字攻略，再打开地图安排漫游。</p><div class="actions"><a class="cta" href="/index.html">打开交互地图</a></div><div class="city-grid">'+city_cards()+'</div>'
page('/cities/','城市漫游与美食地图｜28城详细旅游攻略｜城迹','浏览28城的景点历史、城市漫游和美食文化，查看资料来源、预约提示，并在地图中安排旅行。',hub,[{'@type':'CollectionPage','name':'城市漫游与美食地图','url':origin+'/cities/'},crumb_json([('城迹','/'),('城市攻略','/cities/')])])
for c in cities:
    cp=city_path(c);name=c['name'];bc=[('城迹','/'),('城市攻略','/cities/'),(name,cp)]
    body=breadcrumb(bc)+'<p class="eyebrow">'+E(c['province'])+' / CITY WALKS</p><h1>'+E(name)+'城市漫游与美食地图</h1><p class="intro">'+E(c.get('summary') or c.get('tagline',''))+'</p><div class="actions"><a class="cta" href="'+E(map_link(c),quote=True)+'">进入'+E(name)+'漫游地图</a><a class="cta secondary" href="#foods">看看当地吃什么</a></div>'
    body += city_topics(c)
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
            text=breadcrumb(ibc)+'<p class="eyebrow">'+E(name)+' · '+('城市去处' if kind=='places' else '在地风味')+'</p><h1>'+E(p['name'])+'</h1><div class="actions"><a class="cta" href="'+E(map_link(c,p),quote=True)+'">在'+E(name)+'地图中查看</a><a class="cta secondary" href="'+cp+'">返回'+E(name)+'城市攻略</a></div>'+('<nav class="guide-jumps" aria-label="游览信息"><a href="#before-visit">查开放与预约</a><a href="#sources">查看来源</a></nav>' if kind=='places' else '')+'<div class="detail-grid"><article><h2>'+('认识这里' if kind=='places' else '这道风味是什么')+'</h2><p class="intro">'+E(description(p))+'</p>'
            for label,value in [('名称来历',p.get('nameOrigin')),('看什么',reading.get('lookFor')),('游览提示',p.get('tip') if kind=='places' else ''),('吃法与口味',p.get('taste') or p.get('tip') if kind=='foods' else ''),('文化线索',reading.get('culture'))]:
                if value:text+='<h2>'+label+'</h2><p>'+E(value)+'</p>'
            if kind=='places':
                history = reading.get('history')
                if history and history != description(p):
                    text += '<h2>历史背景</h2><p>' + E(history) + '</p>'
                duration = p.get('duration')
                if isinstance(duration, (int, float)) and duration > 0:
                    text += f'<p>建议停留约 {duration:g} 分钟（编辑估算，不含交通与排队）。</p>'
                text+='<h2 id="before-visit">出发前核对</h2><dl>'+''.join('<dt>'+label+'</dt><dd>'+E(str(value))+'</dd>' for label,value in [('开放时间',visit.get('hours')),('门票与费用',visit.get('ticket')),('预约提示',visit.get('reservation')),('交通与入口',visit.get('transport')),('开放状态',visit.get('availability'))] if value)+'</dl>'
                for label, date_key, source_key in [
                    ('开放公告', 'availabilityCheckedAt', 'availabilitySource'),
                    ('预约规则', 'policyCheckedAt', 'policySource'),
                    ('票价', 'priceCheckedAt', 'priceSource')
                ]:
                    date, url = visit.get(date_key), visit.get(source_key)
                    if date or safe(url):
                        stamp = ' · 资料核对：' + E(date) if date else ''
                        text += '<p class="note">' + link(url, label + '来源') + stamp + '</p>'
                for label, key in [('地址与入口', 'address'), ('无障碍与同行提示', 'accessibility')]:
                    if visit.get(key):
                        text += '<p><strong>' + label + '</strong>　' + E(visit[key]) + '</p>'
            else:
                text+='<p class="warning">本页介绍菜品与地方饮食文化，不代表具体餐馆或门店；摆盘、口味及售价依店家而异。</p>'
                for label, key in [('常见食材', 'ingredients'), ('点单建议', 'eatingTip')]:
                    if p.get(key) and p[key] not in (p.get('taste'), p.get('tip')):
                        value = p[key]
                        if isinstance(value, list):
                            value = '、'.join(value)
                        text += '<h2>' + label + '</h2><p>' + E(value) + '</p>'
            sources=[(p.get('url'),p.get('source') or '条目资料来源')]+[(s.get('url'),s.get('label','参考资料')) for s in visit.get('sources',[])]
            text+='<h2 id="sources">资料来源</h2><ul>'+''.join('<li>'+link(u,l)+'</li>' for u,l in sources if safe(u))+'</ul></article><aside>'
            if photo(p,True):text+='<figure class="hero-photo">'+photo(p,True)+'<figcaption class="source">'+p.get('credit','')+'<p>已等比缩放压缩，保留完整画面。</p></figcaption></figure>'
            else:text+='<p class="note">暂无已核对的条目照片。</p>'
            text+='</aside></div><section><h2>继续认识'+E(name)+'</h2><div class="related">'+''.join('<a href="'+item_path(c,kind,j)+'">'+E(q['name'])+'</a>' for j,q in enumerate(c[kind]) if abs(j-i)<=3 and i!=j)+'</div></section>'
            entity={'@type':'TouristAttraction' if kind=='places' else 'Thing','@id':origin+ip+'#subject','name':p['name'],'description':description(p),'url':origin+ip}
            if kind=='places':entity['containedInPlace']={'@type':'City','name':name}
            if safe(p.get('url')):entity['subjectOf']={'@type':'CreativeWork','name':p.get('source') or '条目资料来源','url':p['url']}
            if p.get('file') in images:entity['image']=origin+'/'+images[p['file']]['detail']['src']
            graph=[{'@type':'WebPage','name':title,'url':origin+ip,'inLanguage':'zh-CN','mainEntity':entity},crumb_json(ibc)]
            page(ip,title,description(p),text,graph)
home = (
    '<div class="boot-guide"><section><p class="eyebrow">城迹</p>'
    '<h1>中国城市漫游与美食地图</h1>'
    f'<p>从 {len(cities)} 座城市中选一站，查景点、找当地美食。</p>'
    '<a class="cta" href="/cities/">浏览城市攻略</a> <a class="boot-directory" href="/destinations.html">全国目的地目录</a>'
    '<p class="boot-status" role="status">正在打开城市地图…</p>'
    '<button class="boot-retry" hidden onclick="location.reload()">重新加载地图</button>'
    '<script>(()=>{const status=document.querySelector(".boot-status"),retry=document.querySelector(".boot-retry");'
    'status.textContent="城市攻略已就绪，正在载入地图组件…";'
    'function recover(){if(status.isConnected){status.textContent="地图尚未就绪，可先阅读下方城市攻略，或重新加载。";retry.hidden=false;}}'
    'setTimeout(recover,8000);window.addEventListener("error",event=>{if(event.target?.src?.includes("/city-startup.js"))recover();},true);})();</script>'
    '<noscript><style>.boot-status{display:none}</style></noscript>'
    '<div class="city-grid">' + city_cards() + '</div></section></div>'
)
(out/'seo-home.html').write_text(home)
home_graph={'@context':'https://schema.org','@type':'WebSite','name':'城迹','url':origin+'/','inLanguage':'zh-CN','description':'中国城市漫游、景点故事与在地美食地图'}
(out/'seo-home-schema.json').write_text(json.dumps(home_graph,ensure_ascii=False).replace('<','\\u003c'))
directory_url = origin + '/destinations.html'
directory = Path('destinations.html').read_text()
directory = directory.replace('</head>', '<link rel="canonical" href="' + directory_url + '"></head>')
directory = directory.replace('<p>正在载入城市与区县目录……</p>',
                              '<p>按省份和城市探索目的地，或直接阅读下列城市的景点与美食攻略。</p>'
                              '<ul>' + ''.join('<li><a href="' + city_path(city) + '">' + E(city['name']) +
                                               '攻略</a></li>' for city in cities) + '</ul>')
directory_schema = {'@context':'https://schema.org', '@type':'CollectionPage', 'name':'全国目的地', 'url':directory_url}
directory = directory.replace('</head>', '<script type="application/ld+json">' + json.dumps(directory_schema,ensure_ascii=False) + '</script></head>')
(out/'destinations.html').write_text(directory)
all_urls=[origin+'/', directory_url]+urls
(out/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+E(u)+'</loc></url>' for u in all_urls)+'</urlset>')
(out/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n')
(out/'seo-validation.json').write_text(json.dumps({'cities':len(cities),'placePages':sum(len(c['places']) for c in cities),'foodPages':sum(len(c['foods']) for c in cities),'indexablePages':len(all_urls),'unverifiedBusinessesAdded':0,'css':css,'metrics':metrics},indent=2))
print('STATIC_GUIDES_READY',len(all_urls),'indexable pages; no JavaScript needed for guide content')
