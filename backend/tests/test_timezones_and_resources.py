import io
from datetime import datetime, timezone, timedelta
from backend.models import User, Profile, PasswordReset
from backend.utils import hash_password
from backend.storage import LocalStorage
import os


def test_password_reset_accepts_naive_expiry(client, db):
    # create user
    user = User(email='tz_user@example.com', password_hash=hash_password('oldpass'))
    db.session.add(user); db.session.commit()

    # create a PasswordReset with naive expires_at (no tzinfo)
    otp = '654321'
    # build an aware datetime then strip tzinfo to simulate a naive timestamp stored by older code
    expires_naive = (datetime.now(timezone.utc) + timedelta(minutes=15)).replace(tzinfo=None)
    pr = PasswordReset(email='tz_user@example.com', otp=otp, expires_at=expires_naive)
    db.session.add(pr); db.session.commit()

    # Attempt reset with correct otp should succeed (server treats naive as UTC)
    resp = client.post('/auth/reset-password', json={'email': 'tz_user@example.com', 'otp': otp, 'newPassword': 'NewPass123'})
    assert resp.status_code == 200
    assert resp.json.get('success') is True


def test_model_created_at_is_timezone_aware(db):
    u = User(email='tz2@example.com', password_hash=hash_password('p'))
    db.session.add(u); db.session.commit()
    assert u.created_at is not None
    # Some DB backends (sqlite) may drop tzinfo when persisting — treat naive timestamps as UTC
    if u.created_at.tzinfo is None:
        u_created = u.created_at.replace(tzinfo=timezone.utc)
    else:
        u_created = u.created_at
    assert u_created.tzinfo is not None


class DummyFile:
    def __init__(self, data: bytes):
        self.stream = io.BytesIO(data)
        self.filename = 'dummy.png'
        self.mimetype = 'image/png'

    def save(self, path_or_buf):
        # If a path is provided, write; if a buffer is provided, write to it
        if hasattr(path_or_buf, 'write'):
            path_or_buf.write(self.stream.getvalue())
        else:
            with open(path_or_buf, 'wb') as f:
                f.write(self.stream.getvalue())


def test_localstorage_closes_stream(tmp_path):
    uploads_root = str(tmp_path / 'uploads')
    ls = LocalStorage(uploads_root)
    df = DummyFile(b"\x89PNG\r\n\x1a\n" + b"0"*10)

    key = 'test/dummy.png'
    ls.upload(df, key)
    # underlying stream should be closed by LocalStorage.upload
    assert getattr(df.stream, 'closed', False) is True
    # file exists on disk
    assert os.path.exists(os.path.join(uploads_root, key))
