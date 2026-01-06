if __name__ != '__main__':
    raise ImportError("This script is not importable. Run it directly as a script.")

import requests
url='http://127.0.0.1:5001/student/uploads'
# Use tokens from login step - replace with actual token or login first
login = requests.post('http://127.0.0.1:5001/auth/login', json={'email':'admin@nuhvin.com','password':'123456'}).json()
headers={'Authorization': f"Bearer {login['access_token']}"}
# Create a tiny JPEG-like file (magic bytes only)
jpeg_bytes = b'\xff\xd8\xff\xdb' + b'0'*1024 + b'\xff\xd9'
files={'file': ('test.jpg', jpeg_bytes, 'image/jpeg')}
resp = requests.post(url, headers=headers, files=files)
print('STATUS', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)
