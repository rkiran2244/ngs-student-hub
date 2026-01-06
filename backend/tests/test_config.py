import importlib
import os
import sys
import pytest

MODULE = 'backend.config'


def reload_config():
    if MODULE in sys.modules:
        del sys.modules[MODULE]
    return importlib.import_module(MODULE)


def test_production_requires_secret_key(monkeypatch):
    monkeypatch.setenv('FLASK_ENV', 'production')
    monkeypatch.setenv('TESTING', '0')
    monkeypatch.setenv('DATABASE_URL', 'mysql+pymysql://user:pass@db:3306/prod')
    monkeypatch.delenv('SECRET_KEY', raising=False)

    with pytest.raises(RuntimeError) as exc:
        reload_config()
    assert 'SECRET_KEY must be set' in str(exc.value)


def test_production_requires_database_url(monkeypatch):
    monkeypatch.setenv('FLASK_ENV', 'production')
    monkeypatch.setenv('TESTING', '0')
    monkeypatch.setenv('SECRET_KEY', 'super-secret')
    # Ensure DATABASE_URL is missing
    monkeypatch.delenv('DATABASE_URL', raising=False)

    with pytest.raises(RuntimeError) as exc:
        reload_config()
    assert 'DATABASE_URL must be set' in str(exc.value)


def test_dev_allows_defaults_and_creates_upload_dir(monkeypatch, tmp_path):
    monkeypatch.setenv('FLASK_ENV', 'development')
    monkeypatch.setenv('UPLOAD_FOLDER', str(tmp_path / 'uploads'))

    # Should not raise
    cfg = reload_config()
    assert os.path.isdir(cfg.Config.UPLOAD_FOLDER)
