import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app
from backend.db import db
from backend.models import User, Profile

app = create_app()
with app.app_context():
    u = User.query.filter_by(email='testuser@example.com').first()
    if not u:
        print('Test user not found')
        sys.exit(1)
    p = u.profile
    if not p:
        p = Profile(user_id=u.id, username=None, full_name=u.email, email=u.email, status='active')
        db.session.add(p)
        print('Created profile and activated')
    else:
        p.status = 'active'
        print('Set profile status active')
    db.session.commit()
    print('Done')