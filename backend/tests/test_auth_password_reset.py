import os
import tempfile
from backend.utils import hash_password
from backend.models import User, PasswordReset
from datetime import datetime, timezone, timedelta
import time


def test_forgot_password_sends_otp(client, db, app, monkeypatch):
    tmp = tempfile.mkdtemp(prefix='mail_out_')
    monkeypatch.setenv('MAIL_OUTPUT_DIR', tmp)

    # Create user
    user = User(email='fp_user@example.com', password_hash=hash_password('oldpass'))
    db.session.add(user); db.session.commit()

    # Request forgot password
    resp = client.post('/auth/forgot-password', json={'email': 'fp_user@example.com'})
    assert resp.status_code == 200
    assert resp.json.get('success') is True

    # Ensure PasswordReset entry exists
    pr = PasswordReset.query.filter_by(email='fp_user@example.com').first()
    assert pr is not None
    assert len(pr.otp) == 6

    # Ensure email file written
    files = os.listdir(tmp)
    assert len(files) >= 1
    files = sorted(files)
    path = os.path.join(tmp, files[-1])
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert pr.otp in content


def test_reset_password_with_otp(client, db, app):
    # Create user and PasswordReset record
    user = User(email='reset_user@example.com', password_hash=hash_password('oldpass'))
    db.session.add(user); db.session.commit()

    otp = '123456'
    expires = datetime.now(timezone.utc) + timedelta(minutes=15)
    pr = PasswordReset(email='reset_user@example.com', otp=otp, expires_at=expires)
    db.session.add(pr); db.session.commit()

    # Attempt reset with wrong otp
    resp = client.post('/auth/reset-password', json={'email': 'reset_user@example.com', 'otp': '000000', 'newPassword': 'NewPass123'})
    assert resp.status_code == 400

    # Attempt reset with correct otp
    resp2 = client.post('/auth/reset-password', json={'email': 'reset_user@example.com', 'otp': otp, 'newPassword': 'NewPass123'})
    assert resp2.status_code == 200
    assert resp2.json.get('success') is True

    # Verify password changed (by attempting login)
    login = client.post('/auth/login', json={'email': 'reset_user@example.com', 'password': 'NewPass123'})
    assert login.status_code == 200
    assert login.json.get('success') is True
