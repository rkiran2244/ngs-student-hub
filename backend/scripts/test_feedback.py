if __name__ != '__main__':
    raise ImportError("This script is not importable. Run it directly as a script.")

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import json, urllib.request

API='http://127.0.0.1:5001'

def post(path, data, headers=None):
    data_b = json.dumps(data).encode()
    req = urllib.request.Request(API + path, data=data_b, headers=headers or {'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ''
        print('HTTPError', e.code, body)
        raise
    except Exception as e:
        print('Error', e)
        raise

if __name__ == '__main__':
    print('Logging in')
    res = post('/auth/login', {'email': 'testuser@example.com', 'password': 'pass123'})
    print('login res', res)
    token = res.get('access_token')
    headers={'Content-Type':'application/json', 'Authorization': f'Bearer {token}'}
    print('Posting feedback')
    res2 = post('/student/feedback', {'category':'Testing','subject':'Test feedback','message':'This is a test from script','rating':4.5}, headers=headers)
    print('feedback post res', res2)
    print('Fetching feedbacks')
    req = urllib.request.Request(API + '/student/feedback', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req) as r:
        print('feedbacks', json.loads(r.read().decode()))