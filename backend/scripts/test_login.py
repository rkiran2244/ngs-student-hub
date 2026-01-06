"""Test login and admin endpoint access against local Flask backend."""
import requests
import os
import sys

def main():
    API = os.environ.get('API_URL', 'http://127.0.0.1:5000')
    email = 'admin@nuhvin.com'
    password = '123456'

    print('Using API:', API)
    try:
        r = requests.post(f"{API}/auth/login", json={'email': email, 'password': password}, timeout=5)
        print('login status:', r.status_code)
        print('login response:', r.text)
        r.raise_for_status()
        data = r.json()
        token = data.get('access_token')
        if not token:
            print('No access token returned')
            sys.exit(2)
        headers = {'Authorization': f'Bearer {token}'}
        s = requests.get(f"{API}/admin/students", headers=headers, timeout=5)
        print('/admin/students status:', s.status_code)
        print('students:', s.text)
    except Exception as e:
        print('ERROR:', e)
        sys.exit(1)


if __name__ == '__main__':
    main()
