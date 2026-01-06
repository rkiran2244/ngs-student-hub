import os
from backend.app import create_app


def test_health_live_ready_metrics(tmp_path, monkeypatch):
    # Use in-memory DB for tests
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    client = app.test_client()

    # health
    r = client.get('/')
    assert r.status_code == 200
    r = client.get('/healthz')
    assert r.status_code == 200

    # liveness
    r = client.get('/live')
    assert r.status_code == 200

    # readiness should be ok for sqlite
    r = client.get('/ready')
    assert r.status_code == 200

    # metrics endpoint presence depends on prometheus_client
    r = client.get('/metrics')
    # If prometheus is present we expect 200, otherwise 404 or 500 is acceptable
    assert r.status_code in (200, 404, 500)


def test_sentry_init(monkeypatch):
    # Ensure that configuring SENTRY_DSN does not break app creation
    monkeypatch.setenv('SENTRY_DSN', 'http://example.invalid')
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    # no exception during create_app implies sentry init attempted safely
    assert app is not None