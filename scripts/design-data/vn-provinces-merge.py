import json, math
from shapely.geometry import shape, Point, mapping
from shapely.ops import unary_union
g=json.load(open('adm1.geojson',encoding='utf-8'))
old={f['properties']['shapeName'].strip():shape(f['geometry']) for f in g['features']}
old['TP.HCM']=old.pop('Ho Chi Minh')
groups={
'Hà Nội':['Hà Nội'],'Cao Bằng':['Cao Bằng'],'Tuyên Quang':['Tuyên Quang','Hà Giang'],'Điện Biên':['Điện Biên'],'Lai Châu':['Lai Châu'],'Sơn La':['Sơn La'],
'Lào Cai':['Lào Cai','Yên Bái'],'Thái Nguyên':['Thái Nguyên','Bắc Kạn'],'Lạng Sơn':['Lạng Sơn'],'Quảng Ninh':['Quảng Ninh'],'Bắc Ninh':['Bắc Ninh','Bắc Giang'],
'Phú Thọ':['Phú Thọ','Vĩnh Phúc','Hòa Bình'],'Hải Phòng':['Hải Phòng','Hải Dương'],'Hưng Yên':['Hưng Yên','Thái Bình'],'Ninh Bình':['Ninh Bình','Hà Nam','Nam Định'],
'Thanh Hóa':['Thanh Hóa'],'Nghệ An':['Nghệ An'],'Hà Tĩnh':['Hà Tĩnh'],'Quảng Trị':['Quảng Trị','Quảng Bình'],'Huế':['Thừa Thiên Huế'],'Đà Nẵng':['Đà Nẵng','Quảng Nam'],
'Quảng Ngãi':['Quảng Ngãi','Kon Tum'],'Gia Lai':['Gia Lai','Bình Định'],'Khánh Hòa':['Khánh Hòa','Ninh Thuận'],'Đắk Lắk':['Đắk Lắk','Phú Yên'],'Lâm Đồng':['Lâm Đồng','Đắk Nông','Bình Thuận'],
'Đồng Nai':['Đồng Nai','Bình Phước'],'TP.HCM':['TP.HCM','Bình Dương','Bà Rịa–Vũng Tàu','Côn Đảo'],'Tây Ninh':['Tây Ninh','Long An'],'Đồng Tháp':['Đồng Tháp','Tiền Giang'],
'Vĩnh Long':['Vĩnh Long','Bến Tre','Trà Vinh'],'An Giang':['An Giang','Kiên Giang'],'Cần Thơ':['Cần Thơ','Sóc Trăng','Hậu Giang'],'Cà Mau':['Cà Mau','Bạc Liêu']}
used=[n for v in groups.values() for n in v]
miss=set(old)-set(used); extra=set(used)-set(old)
print('missing',miss,'extra',extra,len(groups))
LON0,LAT0=102.0,23.5
K=66.0 # px per degree latitude
C=math.cos(math.radians(16))
def prj(lon,lat): return ((lon-LON0)*C*K,(LAT0-lat)*K)
def path(geom):
    polys=[geom] if geom.geom_type=='Polygon' else list(geom.geoms)
    d=[]
    for p in polys:
        if p.area<0.0004: continue
        for ring in [p.exterior]+list(p.interiors):
            pts=[prj(*c) for c in ring.coords]
            d.append('M'+'L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+'Z')
    return ''.join(d)
out={}
for name,parts in groups.items():
    u=unary_union([old[p].buffer(0.004) for p in parts]).buffer(-0.004).simplify(0.012)
    rp=max(u.geoms,key=lambda a:a.area) if u.geom_type=='MultiPolygon' else u
    c=rp.representative_point()
    out[name]={'d':path(u),'c':prj(c.x,c.y),'area':u.area}
lm={'Sa Pa':(103.84,22.34),'Hà Nội':(105.85,21.03),'Hạ Long':(107.08,20.95),'Tràng An':(105.90,20.25),'Huế':(107.58,16.46),'Đà Nẵng':(108.22,16.05),'Hội An':(108.33,15.88),'Nha Trang':(109.19,12.24),'Đà Lạt':(108.44,11.94),'Sài Gòn':(106.70,10.78),'Cần Thơ':(105.78,10.04),'Phú Quốc':(103.96,10.2)}
lmo={}
polys={n:unary_union([old[p] for p in parts]) for n,parts in groups.items()}
for n,(lo,la) in lm.items():
    pr=[k for k,v in polys.items() if v.buffer(0.03).contains(Point(lo,la))]
    lmo[n]={'xy':prj(lo,la),'prov':pr}
print({k:v['prov'] for k,v in lmo.items()})
W=max(x for v in out.values() for x in [v['c'][0]])
print('size', prj(110.0,8.0))
json.dump({'prov':out,'lm':lmo,'K':K},open('vn_merged.json','w',encoding='utf-8'),ensure_ascii=False)
print(sum(len(v['d']) for v in out.values()))
