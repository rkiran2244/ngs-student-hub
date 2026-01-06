import pytest
import tempfile
import os
from backend.app import create_app
from backend.db import db as _db

@pytest.fixture(scope='session')
def app():
    # Create app with testing config passed at creation time
    # Use a temp sqlite file to ensure the DB persists across request contexts
    tmp_db = os.path.join(tempfile.mkdtemp(prefix='studenthub_test_db_'), 'test_db.sqlite')
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{tmp_db}',
        'UPLOAD_FOLDER': tempfile.mkdtemp(prefix='studenthub_test_uploads_'),
        'JWT_SECRET_KEY': 'test-secret',
    }
    app = create_app(test_config)

    # Recreate database tables for the test DB
    with app.app_context():
        _db.drop_all()
        _db.create_all()
    yield app

    # Teardown: remove uploads dir
    try:
        import shutil
        shutil.rmtree(app.config['UPLOAD_FOLDER'])
    except Exception:
        pass

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def db(app):
    # Provide a clean db session for tests
    with app.app_context():
        yield _db
