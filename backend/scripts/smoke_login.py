import urllib.request, json
url='http://127.0.0.1:5001/auth/login'
data=json.dumps({'email':'admin@nuhvin.com','password':'123456'}).encode('utf-8')
req=urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'})
try:
    resp=urllib.request.urlopen(req)
    print('STATUS', resp.status)
    print(resp.read().decode())
except Exception as e:
    print('ERR', e)
    try:
        print(e.read().decode())
    except Exception:
        pass
