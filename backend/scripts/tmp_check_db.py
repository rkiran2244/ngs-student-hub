import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app

app = create_app()
with app.app_context():
    import sqlite3
    dbp = app.config['SQLALCHEMY_DATABASE_URI'].split('sqlite:///')[-1]
    conn = sqlite3.connect(dbp)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print([r[0] for r in cur.fetchall()])
    conn.close()
