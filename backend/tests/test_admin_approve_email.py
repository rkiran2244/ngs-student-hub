import os
import tempfile
from backend.utils import hash_password
from backend.models import User, Profile


def test_approve_sends_email_to_maildir(client, db, app, monkeypatch):
    # Use a temporary directory as MAIL_OUTPUT_DIR
    tmp = tempfile.mkdtemp(prefix='mail_out_')
    monkeypatch.setenv('MAIL_OUTPUT_DIR', tmp)

    # Create a student user and profile (pending)
    student = User(email='student1@example.com', password_hash=hash_password('pass1'))
    db.session.add(student)
    db.session.commit()
    p = Profile(user_id=student.id, full_name='Student One', email='student1@example.com', status='pending')
    db.session.add(p)

    # Create an admin user
    admin = User(email='admin1@example.com', password_hash=hash_password('adminpw'), role='admin')
    db.session.add(admin)
    db.session.commit()
    admin_profile = Profile(user_id=admin.id, username='admin', full_name='Admin', email='admin1@example.com', status='active')
    db.session.add(admin_profile)
    db.session.commit()

    # Login as admin to obtain token
    login = client.post('/auth/login', json={'email': 'admin1@example.com', 'password': 'adminpw'})
    assert login.status_code == 200
    token = login.json.get('access_token')

    headers = {'Authorization': f'Bearer {token}'}

    # Approve with a chosen username
    resp = client.post(f'/admin/students/{p.id}/approve', json={'username': 'student1name'}, headers=headers)
    assert resp.status_code == 200
    assert resp.json.get('success') is True

    # Ensure student profile updated
    updated = db.session.get(Profile, p.id)
    assert updated.username == 'student1name'
    assert updated.status == 'active'

    # Confirm an email file was written to MAIL_OUTPUT_DIR
    files = os.listdir(tmp)
    assert len(files) >= 1
    # Read latest file and assert the username is mentioned
    files = sorted(files)
    path = os.path.join(tmp, files[-1])
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert 'Your username is: student1name' in content
