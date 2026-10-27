import json,pathlib,re,zipfile
R=pathlib.Path(__file__).parent
D=R/'dist'
def dump(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
base=zipfile.ZipFile(R/'assets-0.zip').read('city-data.js').decode()
data=json.loads(base[len('window.DATA='):].strip().rstrip(';'))
s=(R/'expansion-data.js').read_text().strip()
new=json.loads(s[len('window.DATA.push(...'):-2])
places={a[0]:a[1:] for a in [x.split('|') for x in (R/'content-details.tsv').read_text().splitlines() if x]}
foods={a[0]:a[1:] for a in [x.split('|') for x in (R/'food-details.tsv').read_text().splitlines() if x]}
photos=json.loads((R/'photo-manifest.json').read_text())
pm={p['key']:p for p in photos}
assert len(places)==100 and len(foods)==79
allphotos={}
routes={
 'guangzhou': [('西关建筑与街巷',[1,2,5],'从陈家祠的工艺细节走到沙面与恩宁路，片区之间另查交通。'),('珠江新城与江景',[6,0],'先看广东文物，再到珠江沿岸看现代城市；登塔可按兴趣另选。')],
 'shenzhen': [('中心区与城市记忆',[1,0],'博物馆与莲花山组合，兼顾室内展览和户外步行。'),('大鹏海防与海岸',[3,8],'远离中心城区，建议单独留一天；先核对大鹏片区交通。')],
 'wuhan': [('楚文化与东湖',[2,1],'先从文物建立背景，再到听涛湖岸散步。'),('汉口历史街区',[6,7,5],'沿商业街、历史建筑和江滩展开，江滩通行以水位管理为准。')],
 'changsha': [('书院与山林',[2,1],'围绕岳麓山南麓参观，不必为了打卡强行登顶。'),('老城与湘江',[4,5,7],'天心阁、太平街与江阁之间留出市内转场时间。')],
 'xiamen': [('岛内山海与港口',[1,3,4],'从寺院到避风坞与炮台，注意日晒和步行量。'),('集美建筑漫游',[5],'集美在岛外，适合单独安排半天；学校开放范围以校方为准。')],
 'qingdao': [('老城与海岸',[0,6,7],'栈桥、教堂与海岸公园串联，按实际街道路网调整顺序。'),('山海一日',[9],'崂山远离老城，单独安排一天并核对景区接驳。')],
 'tianjin': [('海河与近代街区',[7,3,2],'沿海河分段步行，较长段可改乘公共交通。'),('五大道与静园',[0,5],'以建筑外观和人物展陈为主，具体建筑能否进入需核对。')],
 'jinan': [('泉水与老城',[0,2,6,1],'选取泉池、护城河和老城湖岸；不必在一天内绕完整个大明湖。'),('山与齐鲁文物',[4,5],'千佛山与山东博物馆分段安排，中间需要市内交通。')],
 'kunming': [('翠湖与近代记忆',[0,1,7],'从湖岸步行到讲武堂与老街，室内外节奏交替。'),('滇池与西山',[4,5],'跨湖岸到山地需安排接驳，不能按直线距离估算耗时。')],
 'lanzhou': [('黄河两岸',[0,1,3],'中山桥、白塔山与河岸雕塑组合，山路会增加实际步行时间。'),('文物与街头风味',[2,7,6],'先参观甘肃省博物馆，再转场中心城区；夜市以实际营业情况为准。')]
}
for c in new:
    c['updatedAt']='2026-10-27'
    c['summary']=c['tagline']+'。从历史建筑、博物馆到城市自然空间，按兴趣发现地点；再从日常早餐与地方菜认识一座城的生活。'
    for t in ['places','foods']:
        for i,p in enumerate(c[t]):
            key=c['id']+':'+t+':'+str(i);im=pm[key]
            file='expanded-photos/'+key.replace(':','-')+'.jpg'
            assert (D/file).is_file(), 'Missing photo '+key
            p['photo']=file
            p['source']='图文参考：'+im['title'];p['url']=im['source']
            p['evidence']='编辑整理；参观建议与口味为参考，实时信息请向场馆或店家确认'
            if t=='places':
                group,story,look,advice=places[p['name']]
                p.update(group=group,category=group,tags=[group],story=story,nameOrigin=story,reading={'history':'','lookFor':look,'visitAdvice':advice},tip=advice)
                p.pop('year',None);p.pop('era',None)
            else:
                description,ingredients,taste,eating=foods[p['name']]
                if re.search('面|粉|饭|饺|肠粉|锅贴|饵块|馃子|包子|烧肉粽|糯米包|薄饼',p['name']):group='面食主食'
                elif re.search('汤|粥|醪糟|热冬果|灰豆|甜沫|面茶',p['name']):group='汤羹热食'
                elif re.search('糕|饼|奶|粑|麻花|欢喜坨|甜胚|破酥|虾饺|烧卖',p['name']):group='点心甜品'
                else:group='地方菜肴'
                p.update(description=description,story=description,ingredients=ingredients,taste=taste,eatingTip=eating,group=group,category=group,tags=[group],spicy='辣' in taste,allergens='请结合上方常见配料向店家确认，调味料、混合馅料和共用器具可能涉及其他过敏原。')
            allphotos[key]={'file':file,'name':p['name'],'city':c['name'],'source':im['source'],'sourceTitle':im['title'],'originalImage':im['image'],'checkedAt':'2026-10-27'}
    c['tier']='城市旅行目录'
    c['routes']=[{'title':title,'subtitle':'按片区安排，自由调整','placeNames':[c['places'][i]['name'] for i in indices],'foodNames':[],'duration':'半天至一天，按体力和交通调整','advice':advice+' 此为编辑建议，非实时最优路线。'} for title,indices,advice in routes[c['id']]]
    c['contentNote']='当前目录为精选收录，并非当地全部地点或商家。菜品照片是具体出品的资料图，配方、摆盘和现场状态会变化。'
data+=new
(D/'city-data.js').write_text('window.DATA='+dump(data)+';')
(D/'enriched-photos.js').write_text('Object.assign(REAL_PHOTOS,'+dump(allphotos)+');\n'+''.join('PHOTOS['+dump(c['id'])+']='+dump({'file':c['places'][0]['photo'],'title':c['places'][0]['name']})+';PHOTOCAP['+dump(c['id'])+']='+dump(c['places'][0]['name'])+';\n' for c in new))
assert len(data)==20 and sum(len(c['places']) for c in data)==251 and sum(len(c['foods']) for c in data)==200
print('Enriched 100 places + 80 foods; kept 20 cities / 251 places / 200 foods with stable keys.')
