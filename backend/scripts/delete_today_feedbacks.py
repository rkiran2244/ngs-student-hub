import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app import create_app
from backend.db import db
from backend.models import User, Feedback
from datetime import datetime, timezone

app = create_app()
with app.app_context():
    u = User.query.filter_by(email='testuser@example.com').first()
    if not u:
        print('Test user not found')
        sys.exit(1)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    fbs = Feedback.query.filter_by(user_id=u.id).filter(Feedback.created_at >= today_start).all()
    print('Found', len(fbs), 'feedbacks for today; deleting')
    for f in fbs:
        db.session.delete(f)
    db.session.commit()
    print('Deleted')