import sys, os
sys.path.append(r'C:\Users\T430\Desktop\studenthub')
from backend.app import create_app
from backend.db import db

app = create_app()
print('SQLALCHEMY_DATABASE_URI =', app.config.get('SQLALCHEMY_DATABASE_URI'))
uri = app.config.get('SQLALCHEMY_DATABASE_URI')
if uri and uri.startswith('sqlite'):
    rel = uri.split('sqlite:///')[-1]
    print('Resolved path =', os.path.abspath(rel))
else:
    print('Non-sqlite URI or missing')

with app.app_context():
    try:
        print('Tables:', db.engine.table_names())
    except Exception as e:
        print('Tables error:', e)

# check users in DB
with app.app_context():
    try:
        res = db.session.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        print('sqlite_master entries:', res)
    except Exception as e:
        print('sqlite_master error:', e)

