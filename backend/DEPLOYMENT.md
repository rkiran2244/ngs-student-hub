# Deployment checklist

This document lists the steps to deploy the application to staging/production.

## Environment variables (required)
- DATABASE_URL (e.g., mysql+pymysql://user:pass@host:3306/dbname?charset=utf8mb4)
- SECRET_KEY (secure random string)
- JWT_SECRET_KEY (secure random string)
- DEBUG=0
- TESTING=0
- ENABLE_DEBUG_ENDPOINTS=0
- DEV_SQLITE_FALLBACK=0
- UPLOAD_FOLDER=/var/app/uploads
- SMTP_SERVER (optional) - SMTP hostname for sending transactional emails in production
- SMTP_PORT (optional) - SMTP port (defaults to 587 when TLS is enabled)
- SMTP_USER (optional) - SMTP username
- SMTP_PASSWORD (optional) - SMTP password
- SMTP_USE_TLS (optional) - true/false to enable STARTTLS
- MAIL_OUTPUT_DIR (optional) - directory where emails are written when SMTP is not configured (useful for staging/dev)

## Steps
1. Build Docker images (CI should handle this): use the `publish` workflow.
2. Run Alembic migrations:
   - `alembic -c backend/alembic.ini upgrade head` (or use provided scripts/run_migrations.sh)
3. Start services (docker-compose, Kubernetes manifests, etc.)
4. Run pre-deploy checks:
   - `python scripts/predeploy_check.py` (will exit non-zero when critical issues are present)
5. Run smoke tests:
   - `python scripts/smoke_test.py` against the deployed endpoints
6. Optionally run the E2E smoke test (signup -> admin approve -> login):
   - `ADMIN_EMAIL=<admin> ADMIN_PASSWORD=<pass> python scripts/e2e_smoke.py`
7. Verify login/signup/E2E flows in staging (seed an admin or use an onboarding flow)

## Rollback
- Keep a tracked image tag for each deploy so you can re-deploy previous tag.
- Ensure DB backups are available and restore plan is tested.

## Database provisioning & backups

- Use a managed database (Amazon RDS / Cloud SQL / DigitalOcean Managed DB) instead of running DB on the app host. Set `DATABASE_URL` to the connection string for the managed DB in production.
- Backups: use the provided scripts in `backend/scripts/backup_db.py` and `backend/scripts/restore_db.py`.
  - The backup script invokes `pg_dump` for Postgres or `mysqldump` for MySQL. Ensure the native client is present on the host where you run backups.
  - Example: `DATABASE_URL=postgresql://user:pw@host:5432/db python backend/scripts/backup_db.py --out /backups/mydump.dump`
  - Restores are done with `python backend/scripts/restore_db.py --file /backups/mydump.dump`.
- Aim to run backups regularly (daily) and stream them to durable storage (S3 or provider snapshots).
- Test restore procedures periodically by restoring into a staging DB (do this at least monthly).

## CI/CD

- A GitHub Actions workflow (`.github/workflows/ci.yml`) runs frontend builds and backend tests on PRs and pushes. It also builds and pushes Docker images when code is pushed to `main`/`master`.
- To enable image publishing, add the following secrets in GitHub:
  - `DOCKER_REGISTRY` (e.g., `docker.io` or your registry host)
  - `REGISTRY_USERNAME`
  - `REGISTRY_TOKEN`
  - `IMAGE_NAME` (repository/name to tag)
- To enable automatic staging deployments, set either:
  - `STAGING_DEPLOY_WEBHOOK` — a webhook that triggers staging deploys, or
  - `STAGING_SSH_PRIVATE_KEY`, `STAGING_SSH_USER`, `STAGING_SSH_HOST` — to enable SSH-based deploy from GitHub Actions using `scripts/deploy_to_staging.sh`.

## Monitoring, Logging & Alerting

- Health endpoints (available without auth):
  - `GET /` and `GET /healthz`: simple status check
  - `GET /live`: Kubernetes liveness probe
  - `GET /ready`: Kubernetes readiness probe (checks DB connectivity)
  - `GET /metrics`: Prometheus metrics endpoint
- Configure your orchestrator's probes to use `/live` (liveness) and `/ready` (readiness).
- Sentry error tracking: set `SENTRY_DSN` env var to enable error reporting. Optionally configure `SENTRY_TRACES_SAMPLE_RATE` (default `0.0`) to enable performance tracing.
- Logs: the app outputs to stdout/stderr. Direct these to your centralized log aggregation service (e.g., CloudWatch, Stackdriver, ELK).

## Pre-deploy & smoke testing

Before promoting to production, run validation:
1. `python scripts/predeploy_check_enhanced.py` — checks env vars, config, migrations, and dependencies.
2. Deploy to staging and run smoke tests:
   - `python scripts/smoke_test_enhanced.py --backend-url https://staging-api.example.com`
   - Or with admin credentials: `python scripts/smoke_test_enhanced.py --backend-url https://staging-api.example.com --admin-email admin@example.com --admin-password <password>`
3. Verify logs in Sentry and centralized logging.
4. Check Prometheus metrics and monitoring dashboards.
5. Perform manual QA of critical user flows (signup, login, profile, uploads).
6. Only promote to production once all checks pass and staging is stable for at least a few hours.

## Notes
- The app will NOT automatically fall back to SQLite in production unless `DEV_SQLITE_FALLBACK` is intentionally enabled.
- The `/debug/*` endpoints are disabled by default in production; enable only for internal troubleshooting using `ENABLE_DEBUG_ENDPOINTS=1`.

---

## Recent changes (2026-01-02)
- Fixed deprecations and improved timezone handling:
  - Replaced legacy SQLAlchemy `Query.get()` usages with `db.session.get()`.
  - Replaced naive `datetime.utcnow()` usages with timezone-aware `datetime.now(timezone.utc)` where applicable and made model DateTime columns timezone-aware when possible.
  - Added tests to ensure PasswordReset expiry handling works with both naive and aware datetimes.
- Improved resource handling for uploads:
  - Ensured uploaded file streams are closed after write to avoid ResourceWarning.
  - Deferred heavy S3 client imports until upload time and ensured temporary upload buffers are closed.
- Tests updated and all backend tests pass locally.
