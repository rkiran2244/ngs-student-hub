import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app
from backend.db import db
from backend.models import User, Feedback

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='testuser@example.com').first()
    if not user:
        print('No test user')
        sys.exit(1)
    fb = Feedback(user_id=user.id, category='Testing', subject='Rating test', message='rating float test', rating=4.5, attachments=None, status='submitted')
    db.session.add(fb)
    db.session.commit()
    print('Inserted feedback', fb.id)
    res = Feedback.query.order_by(Feedback.created_at.desc()).first()
    print('Latest feedback rating:', res.rating, type(res.rating))
