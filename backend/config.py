import os
import logging
from dotenv import load_dotenv

# During test runs (pytest), prefer deterministic environment control via
# monkeypatch/setenv in tests rather than loading a local `.env` file which
# may contain developer secrets and interfere with test expectations.
if 'PYTEST_CURRENT_TEST' not in os.environ:
    load_dotenv()

# Get the backend directory path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

logger = logging.getLogger(__name__)

class Config:
    """Application configuration with production safety checks.

    The class-level attributes are evaluated at import time. A production
    validation is performed automatically when running in production mode
    (FLASK_ENV=production and not TESTING) to fail-fast on missing or
    insecure configuration.
    """

    # Environment
    ENV = os.environ.get('FLASK_ENV', 'production')  # 'production' or 'development'
    DEBUG = os.environ.get('DEBUG', '0').lower() in ('1', 'true', 'yes')
    TESTING = os.environ.get('TESTING', '0').lower() in ('1', 'true', 'yes')

    # Database
    DEFAULT_DEV_DB = 'mysql+pymysql://root:password@127.0.0.1:3306/studenthub'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', DEFAULT_DEV_DB)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Secrets
    DEFAULT_INSECURE_SECRET = 'change-me-secret'
    SECRET_KEY = os.environ.get('SECRET_KEY', DEFAULT_INSECURE_SECRET)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)

    # Debug endpoints and dev fallbacks are explicitly opt-in
    ENABLE_DEBUG_ENDPOINTS = os.environ.get('ENABLE_DEBUG_ENDPOINTS', '0').lower() in ('1','true','yes')
    DEV_SQLITE_FALLBACK = os.environ.get('DEV_SQLITE_FALLBACK', '1').lower() in ('1','true','yes')

    # CORS configuration (comma-separated list of allowed origins). Use a specific origin in production.
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')

    # Uploads
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join(BACKEND_DIR, 'uploads')
    # Only create a local uploads folder in non-production environments
    if ENV != 'production' or TESTING:
        try:
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        except Exception:
            logger.exception('Failed to create upload folder %s', UPLOAD_FOLDER)

    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB

    @classmethod
    def validate_production_config(cls):
        """Fail fast for missing critical configuration in production."""
        if cls.ENV != 'production' or cls.TESTING:
            return

        errors = []

        # SECRET_KEY must be set and not the insecure default
        if not cls.SECRET_KEY or cls.SECRET_KEY == cls.DEFAULT_INSECURE_SECRET:
            errors.append('SECRET_KEY must be set to a secure value in production')

        # DATABASE_URL must be set explicitly and not the default dev DB
        if not os.environ.get('DATABASE_URL') or cls.SQLALCHEMY_DATABASE_URI == cls.DEFAULT_DEV_DB:
            errors.append('DATABASE_URL must be set to a managed DB in production')

        # Using a local uploads folder inside the project is discouraged in production
        if cls.UPLOAD_FOLDER.startswith(PROJECT_ROOT):
            # don't fail the process for this, but log a clear warning for operators
            logger.warning(
                'UPLOAD_FOLDER is inside project directory; for production use object storage (S3) or set UPLOAD_FOLDER to an external path'
            )

        if errors:
            # Combine errors into a single RuntimeError to fail-fast on boot
            raise RuntimeError('; '.join(errors))

# Perform production validation at import time (fail-fast behaviour)
try:
    Config.validate_production_config()
except RuntimeError as exc:  # re-raise with clearer context
    raise RuntimeError(f'Unsafe production configuration: {exc}')
