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
        return {'error': body, 'code': e.code}

if __name__ == '__main__':
    print('Logging in')
    res = post('/auth/login', {'email': 'testuser@example.com', 'password': 'pass123'})
    token = res.get('access_token')
    headers={'Content-Type':'application/json', 'Authorization': f'Bearer {token}'}
    print('Posting feedback without rating')
    res2 = post('/student/feedback', {'category':'Testing','subject':'Test feedback no rating','message':'This is a test without rating'}, headers=headers)
    print('feedback post res', res2)