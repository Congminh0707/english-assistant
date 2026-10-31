import json,subprocess,urllib.parse,urllib.request
qs=["Ngo Mon gate Hue citadel","Dragon Bridge Da Nang","Po Nagar Nha Trang towers","Da Lat railway station"]
for q in qs:
    u="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({'action':'query','generator':'search','gsrnamespace':6,'gsrsearch':q+' filetype:bitmap','gsrlimit':2,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':420,'format':'json'})
    r=urllib.request.Request(u,headers={'User-Agent':'EnglishAssistantDesign/1.0 (design reference)'})
    d=json.load(urllib.request.urlopen(r,timeout=25))
    for k,p in d.get('query',{}).get('pages',{}).items():
        i=p['imageinfo'][0];t=i.get('thumburl')
        if not t: continue
        f='ref%s.jpg'%k
        try:
            b=urllib.request.urlopen(urllib.request.Request(t,headers=r.headers),timeout=25).read(); open(f,'wb').write(b)
            print(f,p['title'].encode('ascii','ignore').decode()[:60])
        except Exception as e: print('x',e)
