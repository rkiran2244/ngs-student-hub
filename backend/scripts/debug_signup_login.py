"""Create a user via /auth/signup, show profile status, then set active and attempt login."""
from backend.app import create_app
from backend.db import db
from backend.models import Profile
from backend.db import db
from backend.models import Profile

app = create_app({'TESTING': True})
client = app.test_client()

email = 'course2@example.com'
payload = {
    'email': email,
    'password': 'password',
    'full_name': 'Course User',
    'course_name': 'Computer Science',
    'course_mode': 'online',
    'course_duration': 'long'
}
resp = client.post('/auth/signup', json=payload)
print('signup status', resp.status_code, resp.get_json())
with app.app_context():
    profile = Profile.query.filter_by(email=email).first()
    print('after signup profile found:', profile is not None, 'status=', profile.status)
    profile.status = 'active'
    db.session.commit()
    profile2 = Profile.query.filter_by(email=email).first()
    print('after set status profile status=', profile2.status)

login = client.post('/auth/login', json={'email': email, 'password': 'password'})
print('login status', login.status_code, login.get_json())
