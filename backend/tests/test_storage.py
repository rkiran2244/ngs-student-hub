import os
import importlib
import sys
import pytest
from io import BytesIO

MODULE = 'backend.utils'

def reload_utils():
    if MODULE in sys.modules:
        del sys.modules[MODULE]
    return importlib.import_module(MODULE)


def test_save_upload_file_local(tmp_path, monkeypatch):
    # Use development env defaults
    monkeypatch.setenv('FLASK_ENV', 'development')
    upload_folder = tmp_path / 'uploads'
    monkeypatch.setenv('UPLOAD_FOLDER', str(upload_folder))

    # Create an app with the upload folder configured and push context
    from backend.app import create_app
    app = create_app({'UPLOAD_FOLDER': str(upload_folder), 'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    utils = reload_utils()

    class DummyFile:
        def __init__(self, filename, data=b'hello'):
            self.filename = filename
            self._stream = BytesIO(data)
            self.content_type = 'text/plain'
        def save(self, path):
            with open(path, 'wb') as fh:
                fh.write(self._stream.getvalue())

    f = DummyFile('test.txt')
    with app.app_context():
        rel = utils.save_upload_file(f, 'user1')
    # Ensure returned path is relative and file exists
    assert rel.startswith('user1/')
    full = os.path.join(str(upload_folder), rel)
    assert os.path.exists(full)

def test_save_upload_file_s3(monkeypatch):
    # Configure S3 via env
    monkeypatch.setenv('S3_BUCKET', 'test-bucket')
    monkeypatch.setenv('S3_REGION', 'us-test-1')

    # Monkeypatch S3Storage.upload to avoid real AWS
    import backend.storage as storage
    def fake_upload(self, fileobj, key, content_type=None):
        return f"https://storage.example/{self.bucket}/{key}"
    monkeypatch.setattr(storage.S3Storage, 'upload', fake_upload)

    # Create an app to provide a current_app config for storage factory
    from backend.app import create_app
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    utils = reload_utils()

    class DummyFile:
        def __init__(self, filename, data=b'hello'):
            self.filename = filename
            self._stream = BytesIO(data)
            self.content_type = 'text/plain'
        def save(self, path):
            with open(path, 'wb') as fh:
                fh.write(self._stream.getvalue())

    f = DummyFile('s3file.txt')
    with app.app_context():
        url = utils.save_upload_file(f, 'user2')
    assert url.startswith('https://')
    assert '/user2/' in url
