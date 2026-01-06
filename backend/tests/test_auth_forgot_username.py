import os
import tempfile
from backend.models import User, Profile, PasswordReset
from backend.utils import hash_password


def test_forgot_username_sends_otp_and_recovery(client, db, app, monkeypatch):
    tmp = tempfile.mkdtemp(prefix='mail_out_')
    monkeypatch.setenv('MAIL_OUTPUT_DIR', tmp)

    # create user
    user = User(email='fu_user@example.com', password_hash=hash_password('pass'))
    db.session.add(user); db.session.commit()
    profile = Profile(user_id=user.id, username='fuuser', full_name='FU User', email='fu_user@example.com', status='active')
    db.session.add(profile); db.session.commit()

    # Request forgot username
    resp = client.post('/auth/forgot-username', json={'email': 'fu_user@example.com'})
    assert resp.status_code == 200
    assert resp.json.get('success') is True

    pr = PasswordReset.query.filter_by(email='fu_user@example.com', purpose='username').first()
    assert pr is not None

    # Ensure email file written
    files = os.listdir(tmp)
    assert len(files) >= 1
    files = sorted(files)
    path = os.path.join(tmp, files[-1])
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    assert pr.otp in content

    # Recover username with otp
    resp2 = client.post('/auth/recover-username', json={'email': 'fu_user@example.com', 'otp': pr.otp})
    assert resp2.status_code == 200
    assert resp2.json.get('success') is True
    assert resp2.json.get('username') == 'fuuser'
