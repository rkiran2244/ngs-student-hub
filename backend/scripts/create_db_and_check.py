"""Create DB tables and print status for debugging"""
from backend.app import create_app
import os
from backend.db import db

app = create_app()
print('APP DB URI', app.config.get('SQLALCHEMY_DATABASE_URI'))
print('Backend cwd:', os.getcwd())
pre = os.path.exists(os.path.join('backend', 'studenthub.db'))
print('Pre exists backend/studenthub.db:', pre)
with app.app_context():
    db.create_all()

# Only run SQLite-specific helper scripts when using a sqlite database
print('\nRunning DB helper scripts (SQLite-only)...')
if app.config.get('SQLALCHEMY_DATABASE_URI', '').startswith('sqlite'):
    import subprocess
    import sys
    try:
        subprocess.check_call([sys.executable, os.path.join('backend', 'scripts', 'add_course_fields.py')])
    except subprocess.CalledProcessError:
        print('Warning: add_course_fields script failed. You may need to run it manually.')
else:
    print('Skipping SQLite-only helpers since non-sqlite DATABASE_URL is configured.')

post = os.path.exists(os.path.join('backend', 'studenthub.db'))
print('Post exists backend/studenthub.db:', post)
if post:
    print('size:', os.path.getsize(os.path.join('backend', 'studenthub.db')))
