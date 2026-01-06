"""Seed an admin into backend/studenthub.db using an absolute DATABASE_URL path."""
import os, sys
sys.path.append(r'C:\Users\T430\Desktop\studenthub')
# Force DB path to backend/studenthub.db absolute
os.environ['DATABASE_URL'] = 'sqlite:///C:/Users/T430/Desktop/studenthub/backend/studenthub.db'

from backend.app import create_app
from backend.db import db
from backend.models import User, Profile
from backend.utils import hash_password

app = create_app()
with app.app_context():
    existing = User.query.filter_by(email='admin@nuhvin.com').first()
    if existing:
        print('Found existing, promoting/updating')
        existing.role = 'admin'
        existing.password_hash = hash_password('123456')
        if not existing.profile:
            p = Profile(user_id=existing.id, username='admin@nuhvin.com', full_name='admin@nuhvin.com', email=existing.email, status='active')
            db.session.add(p)
        else:
            existing.profile.username = 'admin@nuhvin.com'
            existing.profile.full_name = 'admin@nuhvin.com'
            existing.profile.status = 'active'
        db.session.commit()
        print('Updated admin', existing.email)
    else:
        u = User(email='admin@nuhvin.com', password_hash=hash_password('123456'), role='admin')
        db.session.add(u)
        db.session.commit()
        p = Profile(user_id=u.id, username='admin@nuhvin.com', full_name='admin@nuhvin.com', email=u.email, status='active')
        db.session.add(p)
        db.session.commit()
        print('Created admin user:', u.email)    
