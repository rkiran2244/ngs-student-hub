if __name__ != '__main__':
    raise ImportError("This script is not importable. Run it directly as a script.")

import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import json, urllib.request
API='http://127.0.0.1:5001'

def post(path, data, headers=None):
    data_b = json.dumps(data).encode()
    req = urllib.request.Request(API + path, data=data_b, headers=headers or {'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())

if __name__ == '__main__':
    print('Logging in as admin')
    res = post('/auth/login', {'email': 'testuser@example.com', 'password': 'pass123'})
    token = res.get('access_token')
    headers={'Authorization': f'Bearer {token}'}
    print('Fetching admin /admin/students')
    req = urllib.request.Request(API + '/admin/students', headers=headers)
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read().decode())
        print('First student sample:', data[0] if data else 'no students')
        # check avatar_url presence
        if data and 'avatar_url' in data[0]:
            print('avatar_url present:', data[0].get('avatar_url'))
        else:
            print('avatar_url missing')