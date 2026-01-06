import json
import os
from backend.models import User, Profile, Feedback
from backend.utils import hash_password


def register_and_activate(client, db, email='test@example.com', password='password', full_name='Test User'):
    resp = client.post('/auth/signup', json={'email': email, 'password': password, 'full_name': full_name})
    assert resp.status_code == 200
    # activate profile so login works
    with client.application.app_context():
        profile = Profile.query.filter_by(email=email).first()
        assert profile is not None
        profile.status = 'active'
        db.session.commit()


def login(client, email='test@example.com', password='password'):
    resp = client.post('/auth/login', json={'email': email, 'password': password})
    assert resp.status_code == 200
    data = resp.get_json()
    return data['access_token']


def test_feedback_requires_rating(client, db):
    register_and_activate(client, db)
    token = login(client)
    headers = {'Authorization': f'Bearer {token}'}

    payload = {'category': 'Platform', 'subject': 'Test', 'message': 'No rating here'}
    resp = client.post('/student/feedback', json=payload, headers=headers)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data.get('message') == 'rating is required'


def test_feedback_rating_range_and_increments(client, db):
    register_and_activate(client, db, email='rtest@example.com')
    token = login(client, email='rtest@example.com')
    headers = {'Authorization': f'Bearer {token}'}

    # Out of range
    payload = {'category': 'Platform', 'subject': 'Range', 'message': 'Too high', 'rating': 6}
    resp = client.post('/student/feedback', json=payload, headers=headers)
    assert resp.status_code == 400
    assert resp.get_json().get('message') == 'rating must be between 1 and 5'

    # Not 0.5 increment
    payload['rating'] = 4.3
    resp = client.post('/student/feedback', json=payload, headers=headers)
    assert resp.status_code == 400
    assert resp.get_json().get('message') == 'rating must be in 0.5 increments'


def test_feedback_success_and_get(client, db):
    register_and_activate(client, db, email='suc@example.com')
    token = login(client, email='suc@example.com')
    headers = {'Authorization': f'Bearer {token}'}

    payload = {'category': 'Mentor', 'subject': 'Great!', 'message': 'Loved it', 'rating': 4.5}
    resp = client.post('/student/feedback', json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert 'feedback_id' in data

    # GET should return the entry with rating
    resp = client.get('/student/feedback', headers=headers)
    assert resp.status_code == 200
    entries = resp.get_json()
    assert isinstance(entries, list)
    assert len(entries) >= 1
    assert any(e.get('rating') == 4.5 for e in entries)


def test_admin_students_avatar_normalization(client, db, tmp_path):
    # Create an admin user directly in DB with an avatar that is an absolute path inside UPLOAD_FOLDER
    app = client.application
    with app.app_context():
        uploads_root = app.config['UPLOAD_FOLDER']
        # create a dummy file
        p = tmp_path / 'avatar.png'
        p.write_bytes(b'PNGDATA')
        abs_path = str(p)

        # Copy file into uploads_root and set avatar_url to the absolute path
        import shutil
        dest = os.path.join(uploads_root, 'avatars')
        os.makedirs(dest, exist_ok=True)
        dest_path = os.path.join(dest, 'avatar.png')
        shutil.copy(p, dest_path)

        # Create admin user
        admin_user = User(email='admin@example.com', password_hash=hash_password('adminpw'), role='admin')
        db.session.add(admin_user)
        db.session.flush()
        profile = Profile(user_id=admin_user.id, full_name='Admin', email='admin@example.com', avatar_url=dest_path)
        db.session.add(profile)
        db.session.commit()

    # Login as admin
    resp = client.post('/auth/login', json={'email': 'admin@example.com', 'password': 'adminpw'})
    assert resp.status_code == 200
    token = resp.get_json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    resp = client.get('/admin/students', headers=headers)
    assert resp.status_code == 200
    students = resp.get_json()
    assert isinstance(students, list)
    # find our admin profile
    found = [s for s in students if s.get('email') == 'admin@example.com']
    assert len(found) == 1
    avatar_url = found[0].get('avatar_url')
    assert avatar_url is not None
    # Should be a /uploads/ relative URL (not absolute path)
    assert avatar_url.startswith('/uploads/')
