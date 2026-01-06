import os
import json
os.environ['DATABASE_URL'] = 'sqlite:///C:/Users/T430/Downloads/studenthub/backend/dev_seed.db'
from backend.app import create_app
app = create_app()
with app.test_client() as c:
    r = c.post('/auth/login', json={'email':'admin@nuhvin.com','password':'123456'})
    print('status', r.status_code)
    try:
        print('json', r.get_json())
    except Exception:
        print('text', r.data)
