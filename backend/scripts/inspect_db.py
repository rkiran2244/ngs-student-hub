"""Inspect DB engine, tables, and attempt to insert a row."""
import sys, os
sys.path.append(r'C:\Users\T430\Desktop\studenthub')
from backend.app import create_app
from backend.db import db

app = create_app()
print('engine url', db.engine.url)
with app.app_context():
    try:
        print('tables:', db.engine.table_names())
    except Exception as e:
        print('tables error', e)
    try:
        res = db.session.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
        print('sqlite_master:', res)
    except Exception as e:
        print('sqlite_master error', e)
    try:
        from backend.models import User
        u = User(email='probe@example.com', password_hash='x', role='student')
        db.session.add(u)
        db.session.commit()
        print('inserted user id', u.id)
    except Exception as e:
        print('insert error', e)

print('cwd', os.getcwd())
print('abs db path', os.path.abspath('./studenthub.db'))
print('backend/studenthub.db exists', os.path.exists(os.path.join('backend','studenthub.db')))
