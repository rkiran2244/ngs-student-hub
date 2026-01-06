import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app
from backend.db import db
from backend.models import User, Profile

app = create_app()
with app.app_context():
    u = User.query.filter_by(email='testuser@example.com').first()
    if not u:
        print('User not found')
        sys.exit(1)
    p = u.profile
    if not p:
        p = Profile(user_id=u.id, username=u.email, full_name=u.email, email=u.email, status='active')
        db.session.add(p)
    # set to an existing image in uploads
    p.avatar_url = '/uploads/7f296cef-2cd4-488f-9a76-2f6924a71f89/1766992047_test.png'
    db.session.commit()
    print('Set avatar_url for', u.email)