import os, sys
if __name__ == '__main__' and __package__ is None:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, repo_root)
    __package__ = 'backend'

from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.db import db
from backend.auth import jwt
from backend.logging_config import setup_logging

# configure logging as early as possible
setup_logging()


def create_app(config_overrides: dict | None = None):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # Apply runtime config overrides (useful for tests and scripts)
    if config_overrides:
        app.config.update(config_overrides)

    # Configurable CORS
    cors_origins = app.config.get('CORS_ORIGINS', '*')
    CORS(
        app,
        supports_credentials=True,
        resources={r"/*": {"origins": cors_origins}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # Try connecting to the configured DB early and provide a helpful fallback only in development
    from sqlalchemy import create_engine
    from sqlalchemy.exc import OperationalError

    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    print('DB URI at init:', db_uri)
    fallback_used = False
    try:
        engine = create_engine(db_uri)
        with engine.connect():
            pass
    except Exception as e:
        # Only allow automatic SQLite fallback when running in development and explicitly enabled
        fallback_allowed = app.config.get('DEV_SQLITE_FALLBACK', False) and app.config.get('ENV', 'production') != 'production'
        if fallback_allowed and not app.config.get('TESTING', False):
            # Only fall back for local/dev (not during tests or when explicitly disabled)
            fallback_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dev_fallback.db')
            fallback_uri = f"sqlite:///{fallback_path}"
            print(f"WARNING: failed to connect to DB ({e}); falling back to SQLite at {fallback_uri}")
            app.config['SQLALCHEMY_DATABASE_URI'] = fallback_uri
            fallback_used = True
        else:
            # Re-raise so the error is visible (production should not silently fall back)
            print('ERROR: failed to connect to DB (no fallback allowed):', e)
            raise

    # Initialize extensions after ensuring the DB URI is usable
    db.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        # ensure models are imported so SQLAlchemy metadata includes them before create_all()
        try:
            print('IMPORTING backend.models')
            from . import models  # noqa: F401 - import for side-effects (register models)
            print('IMPORTED backend.models')
            app.logger.info('Imported backend.models')
        except Exception as e:
            print('FAILED to import backend.models', e)
            app.logger.exception('Failed to import backend.models')
        # If we used the SQLite fallback, ensure tables are present and optionally seed a dev admin
        if fallback_used and not app.config.get('TESTING', False):
            try:
                print('Fallback to SQLite detected — creating tables with db.create_all()')
                db.create_all()
            except Exception as e:
                print('Failed to create tables on fallback SQLite:', e)

            # Optionally seed a dev admin user for convenience
            if os.environ.get('DEV_AUTO_SEED', '1').lower() in ('1', 'true', 'yes'):
                try:
                    from backend.models import User, Profile
                    from backend.utils import hash_password
                    admin_email = os.environ.get('DEV_ADMIN_EMAIL', 'admin@local')
                    admin_username = os.environ.get('DEV_ADMIN_USERNAME', 'admin')
                    admin_password = os.environ.get('DEV_ADMIN_PASSWORD', 'adminpass')
                    existing = User.query.filter_by(email=admin_email).first()
                    if existing:
                        print('Dev admin exists:', admin_email)
                        if existing.role != 'admin':
                            existing.role = 'admin'
                        if existing.profile:
                            existing.profile.username = admin_username
                            existing.profile.status = 'active'
                        else:
                            p = Profile(user_id=existing.id, username=admin_username, full_name=admin_username, email=admin_email, status='active')
                            db.session.add(p)
                        db.session.commit()
                    else:
                        u = User(email=admin_email, password_hash=hash_password(admin_password), role='admin')
                        db.session.add(u)
                        db.session.commit()
                        p = Profile(user_id=u.id, username=admin_username, full_name=admin_username, email=admin_email, status='active')
                        db.session.add(p)
                        db.session.commit()
                        print('Created dev admin', admin_email)
                except Exception as e:
                    print('Failed to seed dev admin:', e)

        # create db tables only if explicitly requested via AUTO_CREATE_DB, and not during testing
        if os.environ.get('AUTO_CREATE_DB', '0').lower() in ('1', 'true', 'yes') and not app.config.get('TESTING', False):
            if app.config.get('ENV') == 'production':
                app.logger.warning('AUTO_CREATE_DB is enabled in production; skipping automatic create_all() for safety.')
            else:
                db.create_all()

    # register blueprints
    from .routes.auth import auth_bp
    from .routes.student import student_bp
    from .routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(student_bp, url_prefix="/student")
    app.register_blueprint(admin_bp, url_prefix="/admin")

    # Serve uploaded files
    @app.route('/uploads/<path:relpath>')
    def serve_upload(relpath):
        import os
        from flask import send_from_directory, abort
        uploads_root = app.config.get('UPLOAD_FOLDER')
        # Normalize to a safe OS path for filesystem checks
        rel_parts = [p for p in relpath.replace('\\', '/').split('/') if p and p != '..']
        full = os.path.join(uploads_root, *rel_parts)
        if not os.path.isfile(full):
            # Don't leak filesystem details; return a simple 404 JSON
            return jsonify({'success': False, 'message': 'File not found'}), 404
        # For send_from_directory, use a POSIX-style relative path
        rel_for_send = '/'.join(rel_parts)
        try:
            return send_from_directory(uploads_root, rel_for_send)
        except Exception:
            # If send_from_directory fails for any reason, return generic 404
            return jsonify({'success': False, 'message': 'File not found'}), 404

    # Debug DB endpoint - only enabled when debug endpoints are explicitly allowed
    if app.config.get('ENABLE_DEBUG_ENDPOINTS', False) or app.config.get('ENV', 'production') != 'production':
        @app.get('/debug/db')
        def debug_db():
            uri = app.config.get('SQLALCHEMY_DATABASE_URI')
            # Redact credentials in URI when showing
            redacted = uri
            try:
                if '://' in uri and '@' in uri:
                    prefix, rest = uri.split('://', 1)
                    creds, host = rest.split('@', 1)
                    redacted = f"{prefix}://<redacted>@{host}"
                else:
                    redacted = uri
            except Exception:
                redacted = '<error>'

            info = {'SQLALCHEMY_DATABASE_URI': redacted}

            if uri and uri.startswith('sqlite'):
                rel = uri.split('sqlite:///')[-1]
                info['resolved_path'] = os.path.abspath(rel)
                info['exists'] = os.path.exists(info['resolved_path'])

                try:
                    import sqlite3
                    conn = sqlite3.connect(info['resolved_path'])
                    cur = conn.cursor()
                    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    info['tables'] = [r[0] for r in cur.fetchall()]
                    conn.close()
                except Exception as e:
                    info['tables_error'] = str(e)

            return jsonify(info)
    else:
        # In production this endpoint is disabled to avoid leaking environment or DB details
        pass

    @app.get('/')
    def health():
        return jsonify({"status": "ok"})

    # Kubernetes/readiness healthcheck endpoint
    @app.get('/healthz')
    def healthz():
        return jsonify({"status": "ok"})

    @app.get('/live')
    def live():
        """Liveness probe: returns 200 when app process is alive."""
        return jsonify({"status": "ok"})

    @app.get('/ready')
    def ready():
        """Readiness probe: verifies DB connectivity before reporting ready."""
        try:
            # lightweight DB check
            from sqlalchemy import text
            with db.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return jsonify({"status": "ok"})
        except Exception as e:
            app.logger.exception('Readiness check failed')
            return jsonify({"status": "error", "message": "db unavailable"}), 500

    # Prometheus metrics endpoint
    try:
        from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
        from flask import Response

        @app.get('/metrics')
        def metrics():
            try:
                data = generate_latest()
                return Response(data, mimetype=CONTENT_TYPE_LATEST)
            except Exception:
                return jsonify({'status': 'error', 'message': 'metrics unavailable'}), 500
    except Exception:
        # prometheus_client is optional for local dev
        app.logger.info('prometheus_client not available; /metrics disabled')

    # Initialize Sentry if configured
    sentry_dsn = os.environ.get('SENTRY_DSN') or app.config.get('SENTRY_DSN')
    if sentry_dsn:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.flask import FlaskIntegration
            sentry_sdk.init(dsn=sentry_dsn, integrations=[FlaskIntegration()], traces_sample_rate=float(os.environ.get('SENTRY_TRACES_SAMPLE_RATE', '0.0')))
            app.logger.info('Sentry initialized')
        except Exception:
            app.logger.exception('Failed to initialize Sentry')

    return app


# ✅ RAILWAY-SAFE RUN
if __name__ == '__main__':
    # Allow overriding the port with the PORT env var (default to 5001 for local dev)
    port = int(os.environ.get('PORT', 5001))
    # Respect the configured PORT env var instead of hardcoding
    create_app().run(host='0.0.0.0', port=port, debug=True)

