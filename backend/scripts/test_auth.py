if __name__ != '__main__':
    raise ImportError("This script is not importable. Run it directly as a script.")

"""Test admin login and admin-only endpoint.
Usage: run with the project venv python from repo root.
"""
import sys
sys.path.append(r"C:\Users\T430\Desktop\studenthub")
import json
import urllib.request

API = 'http://127.0.0.1:5000'
email = 'admin@nuhvin.com'
password = '123456'

def post(path, data, headers=None):
    data_b = json.dumps(data).encode()
    req = urllib.request.Request(API + path, data=data_b, headers=headers or {'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())

if __name__ == '__main__':
    try:
        print('Logging in...')
        res = post('/auth/login', {'email': email, 'password': password})
        print('login res:', res)
        token = res.get('access_token')
        if not token:
            print('No access token, login failed')
            sys.exit(1)
        print('Calling admin /admin/students...')
        req = urllib.request.Request(API + '/admin/students', headers={'Authorization': f'Bearer {token}'})
        with urllib.request.urlopen(req, timeout=10) as r:
            print('admin students status', r.status)
            print('admin students body:', r.read().decode())
    except Exception as e:
        print('Error during test:', type(e), e)
        try:
            import traceback; traceback.print_exc()
        except Exception:
            pass
        sys.exit(1)
    print('Test completed')
