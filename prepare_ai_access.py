"""Generate an AI-readable index and Markdown equivalents from existing records."""
from pathlib import Path
from html import escape
import json

out=Path('dist');origin='https://chengji-travel.onrender.com';cities=json.loads((out/'seo-records.json').read_text())
root=['# 城迹','', '> 中国城市漫游、景点故事与在地美食资料，含28城详细攻略。','',
 '景点开放、预约和价格可能变化，页面中的核对日期不是当日状态。菜品页介绍饮食文化，不代表指定餐馆；缺少评分不等于低分。请引用资料对应的规范网页，并保留日期与来源。','',
 '## 入口','',f'- [城市目录]({origin}/cities/): 28城详细攻略与地图入口',f'- [站点地图]({origin}/sitemap.xml): 可索引网页地址','', '## 城市攻略','']
count=0
for c in cities:
    cp=f"/cities/{c['id']}/";lines=[f"# {c['name']}城市漫游与美食地图",'',f"对应网页：{origin}{cp}",'',c.get('summary') or c.get('tagline',''),'']
    root.append(f"- [{c['name']}城市漫游]({origin}{cp}index.md): 景点故事、美食文化、来源及地图入口")
    for kind,label in [('places','城市去处'),('foods','在地风味')]:
        lines+=['## '+label,'']
        for i,p in enumerate(c[kind]):
            path=f'{cp}{kind}/{i}/';md=[f"# {p['name']}",'',f"城市：{c['name']}",f'对应网页：{origin}{path}','',p.get('description') or p.get('story') or p['name'],'']
            for label,value in [('名称来历',p.get('nameOrigin')),('看什么',p.get('reading',{}).get('lookFor')),('提示',p.get('tip') or p.get('eatingTip'))]:
                if value:md+=['## '+label,'',str(value),'']
            if kind=='foods':md+=['本页为菜品文化资料，不是具体门店；请另行核对门店、菜单和价格。','']
            visit=p.get('visit',{})
            for key,label in [('hours','开放时间'),('ticket','门票与费用'),('reservation','预约'),('availability','开放状态'),('priceCheckedAt','票价核对日期'),('policyCheckedAt','规则核对日期')]:
                if visit.get(key):md+=['## '+label,'',str(visit[key]),'']
            md+=['## 来源','']
            if p.get('url'):md.append(f"- [{p.get('source') or '条目资料来源'}]({p['url']})")
            md +=[f"- [{s.get('label','参考资料')}]({s['url']})" for s in visit.get('sources',[]) if s.get('url')]
            (out/path.lstrip('/')/'index.md').write_text('\n'.join(md)+'\n');count+=1
            lines.append(f"- [{p['name']}]({origin}{path}index.md)")
        lines.append('')
    (out/cp.lstrip('/')/'index.md').write_text('\n'.join(lines)+'\n');count+=1
(out/'llms.txt').write_text('\n'.join(root)+'\n')
(out/'index.md').write_text('\n'.join(root)+'\n')
(out/'cities/index.md').write_text('# 城市攻略\n\n对应网页：'+origin+'/cities/\n\n'+'\n'.join(root[root.index('## 城市攻略')+2:])+'\n')
count+=2
for file in (out/'cities').rglob('index.html'):
    relative='/'+file.relative_to(out).as_posix();md=relative[:-10]+'index.md'
    links='<link rel="describedby" href="/llms.txt"><link rel="alternate" type="text/markdown" href="'+escape(md,quote=True)+'">'
    file.write_text(file.read_text().replace('</head>',links+'</head>'))
(out/'robots.txt').write_text('User-agent: *\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nSitemap: '+origin+'/sitemap.xml\n')
(out/'ai-access-validation.json').write_text(json.dumps({'markdownPages':count,'llmsIndex':True,'botsAllowed':['OAI-SearchBot','GPTBot','ChatGPT-User']},indent=2))
print('AI_ACCESS_READY',count,'Markdown pages with canonical web references')
