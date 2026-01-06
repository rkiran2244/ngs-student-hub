from backend.app import create_app

app = create_app()
with app.test_client() as c:
    r = c.get('/ready')
    print('status_code=', r.status_code)
    print('json=', r.get_json())
