import json, math
from shapely.geometry import shape, Polygon, MultiPolygon, box
g=json.load(open('ne50.geojson',encoding='utf-8'))
# ---------- ASIA (equirect, lon 25..150, lat -12..56)
LON0,LAT1=25.0,56.0; K=10.6; C=math.cos(math.radians(26))
def prj(lo,la): return ((lo-LON0)*C*K,(LAT1-la)*K)
def ring_d(r): return 'M'+'L'.join(f'{x:.1f} {y:.1f}' for x,y in (prj(*c) for c in r.coords))+'Z'
def geom_d(geom,minarea=0.15):
    polys=[geom] if geom.geom_type=='Polygon' else list(geom.geoms)
    return ''.join(ring_d(p.exterior) for p in polys if p.area>=minarea)
clip=box(20,-14,152,58)
asia={}
for f in g['features']:
    p=f['properties']; geom=shape(f['geometry'])
    if p['CONTINENT']=='Asia' or p['ADMIN'] in('Russia','Egypt','Turkey','Papua New Guinea','Australia'):
        gg=geom.intersection(clip)
        if gg.is_empty: continue
        gg=gg.simplify(0.06)
        asia[p['ADMIN']]={'d':geom_d(gg,0.05),'asia':p['CONTINENT']=='Asia','c':prj(*gg.representative_point().coords[0])}
asialm={'Vạn Lý Trường Thành':(116.57,40.43,'Trung Quốc'),'Núi Phú Sĩ':(138.73,35.36,'Nhật Bản'),'Cung Gyeongbok':(126.98,37.58,'Hàn Quốc'),'Taj Mahal':(78.04,27.17,'Ấn Độ'),'Đỉnh Everest':(86.92,28.0,'Nepal'),'Angkor Wat':(103.87,13.41,'Campuchia'),'Cung điện Hoàng gia':(100.49,13.75,'Thái Lan'),'Tháp đôi Petronas':(101.71,3.15,'Malaysia'),'Marina Bay':(103.86,1.28,'Singapore'),'Borobudur':(110.20,-7.61,'Indonesia'),'Burj Khalifa':(55.27,25.20,'UAE'),'Petra':(35.44,30.33,'Jordan')}
asiaout={'countries':asia,'lm':{k:{'xy':prj(v[0],v[1]),'country':v[2]} for k,v in asialm.items()},'size':prj(152,-14)}
json.dump(asiaout,open('asia.json','w',encoding='utf-8'),ensure_ascii=False)
print('asia',len(asia),asiaout['size'],sum(len(v['d']) for v in asia.values()))
# ---------- EARTH orthographic
LON_C,LAT_C=45.0,18.0
R=300.0
cl=math.radians(LAT_C); sl=math.sin(cl); cc=math.cos(cl)
def orth(lo,la):
    lam=math.radians(lo-LON_C); ph=math.radians(la)
    cosc=sl*math.sin(ph)+cc*math.cos(ph)*math.cos(lam)
    x=math.cos(ph)*math.sin(lam)
    y=cc*math.sin(ph)-sl*math.cos(ph)*math.cos(lam)
    return x,y,cosc
def proj_pt(lo,la):
    x,y,c=orth(lo,la)
    if c<0:
        n=math.hypot(x,y) or 1
        x,y=x/n,y/n
    return (R+x*R, R-y*R), c>=0
CONT_COL={'Asia':'asia','Europe':'eu','Africa':'af','North America':'na','South America':'sa','Oceania':'oc','Antarctica':'an','Seven seas (open ocean)':'oc'}
cont={}
from shapely.ops import unary_union
for f in g['features']:
    p=f['properties']; geom=shape(f['geometry']).simplify(0.2)
    cont.setdefault(CONT_COL.get(p['CONTINENT'],'oc'),[]).append(geom)
def dens(ring,step=2.0):
    pts=list(ring.coords); out=[]
    for a,b in zip(pts,pts[1:]):
        n=max(1,int(math.hypot(b[0]-a[0],b[1]-a[1])/step))
        for i in range(n): out.append((a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n))
    return out
earth={}
for k,gs in cont.items():
    u=unary_union(gs)
    polys=[u] if u.geom_type=='Polygon' else list(u.geoms)
    d=''
    for p in polys:
        if p.area<2: continue
        pts=[proj_pt(*c) for c in dens(p.exterior)]
        if not any(v for _,v in pts): continue
        d+='M'+'L'.join(f'{x:.1f} {y:.1f}' for (x,y),_ in pts)+'Z'
    earth[k]=d
# flat minimap (equirect 360x180 *1.4)
def eq(lo,la): return ((lo+180)*1.4,(90-la)*1.4)
flat={}
for k,gs in cont.items():
    u=unary_union(gs); polys=[u] if u.geom_type=='Polygon' else list(u.geoms)
    flat[k]=''.join('M'+'L'.join(f'{x:.1f} {y:.1f}' for x,y in (eq(*c) for c in p.exterior.coords))+'Z' for p in polys if p.area>1.5)
elm={'Tháp Eiffel':(2.29,48.86,'Pháp','Châu Âu'),'Đấu trường La Mã':(12.49,41.89,'Ý','Châu Âu'),'Kim tự tháp Giza':(31.13,29.98,'Ai Cập','Châu Phi'),'Núi Kilimanjaro':(37.35,-3.07,'Tanzania','Châu Phi'),'Vạn Lý Trường Thành':(116.57,40.43,'Trung Quốc','Châu Á'),'Nhà hát Opera Sydney':(151.21,-33.86,'Úc','Châu Đại Dương'),'Uluru':(131.04,-25.34,'Úc','Châu Đại Dương'),'Tượng Nữ thần Tự do':(-74.04,40.69,'Mỹ','Bắc Mỹ'),'Grand Canyon':(-112.11,36.10,'Mỹ','Bắc Mỹ'),'Tượng Chúa Cứu Thế':(-43.21,-22.95,'Brazil','Nam Mỹ'),'Machu Picchu':(-72.55,-13.16,'Peru','Nam Mỹ'),'Chim cánh cụt':(0,-75,'Nam Cực','Châu Nam Cực')}
lmout={}
for k,(lo,la,c,ct) in elm.items():
    (x,y),vis=proj_pt(lo,la); fx,fy=eq(lo,la)
    lmout[k]={'xy':[x,y],'vis':vis,'flat':[fx,fy],'country':c,'cont':ct}
json.dump({'cont':earth,'flat':flat,'lm':lmout,'R':R},open('earth.json','w',encoding='utf-8'),ensure_ascii=False)
print('earth',{k:len(v) for k,v in earth.items()}, {k:v['vis'] for k,v in lmout.items()})
