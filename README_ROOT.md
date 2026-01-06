# Project layout

This repository has been reorganized into two top-level folders:

- `frontend/` — Vite + React app. Run within this folder:
  - npm install: `npm ci --prefix frontend`
  - dev: `npm run dev --prefix frontend`
  - build: `npm run build --prefix frontend`

- `backend/` — Flask API. Run within this folder:
  - create venv: `python -m venv .venv && .venv\Scripts\pip.exe install -r requirements.txt`
  - run: `python -m backend.app`

Notes:
- `node_modules` has been moved under `frontend/` but you may delete and re-install locally if you run into permission issues: `rm -rf frontend/node_modules && npm ci --prefix frontend`.
- The repo root now contains only `.git`, `.gitignore`, and the `frontend/` & `backend/` folders.

If you want, I can also add a root `README.md` (instead of `README_ROOT.md`) or update `frontend/README.md` to include consolidated instructions.

Quick unified environment setup

To create a single environment that installs Python deps, Node deps and builds the frontend (cross-platform):

  # Unix/macOS
  make env

  # Windows (PowerShell)
  .\setup_env.ps1

This will create a `.venv` in the repo root, install backend and frontend dependencies, enable pre-commit hooks and run migrations.

## Local development with Docker (MySQL + backend + frontend dev)

1. Start the dev stack:

   - PowerShell: `scripts\dev_up.ps1`
   - Bash: `scripts/dev_up.sh`

   Or run directly:

   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

2. The backend will be available at: `http://localhost:5001`
   The frontend dev server will be available at: `http://localhost:5173` (hot reload enabled).

3. The dev helper seeds an admin user at `admin@local` / password `adminpass` — change this in a real environment.

Makefile & smoke tests

- Use the provided `Makefile` for common dev tasks. Examples:
  - `make up` — build & start the dev stack
  - `make smoke` — run `scripts/smoke_test.py` against `http://localhost:5001` and `http://localhost:5173`
  - `make migrate` — apply Alembic migrations locally

- Smoke test scripts are in `scripts/` (`smoke_test.py`, `smoke_test.sh`, `smoke_test.ps1`). They use `BACKEND_URL` and `FRONTEND_URL` env vars, defaulting to `http://localhost:5001` and `http://localhost:5173`.

Staging Compose

- I added `docker-compose.staging.yml` to build backend and the production frontend (nginx) for staging environments. It binds the frontend to port `8080`.

Production readiness notes:
- Debug endpoints (e.g., `/debug/db`) are disabled by default in production. To temporarily enable them for internal troubleshooting, set `ENABLE_DEBUG_ENDPOINTS=1` in your staging/prod environment (use cautiously).
- The application will NOT automatically fall back to SQLite in production unless `DEV_SQLITE_FALLBACK` is intentionally enabled. Ensure `DATABASE_URL` is reachable and migrations are applied before promoting to production.
- See `DEPLOYMENT.md` for a concise deployment checklist and recommended pre-deploy items.
- I added `docker-compose.staging.yml` to build backend and the production frontend (nginx) for staging environments. It binds the frontend to port `8080`.

Notes:
- If you prefer local MySQL instead of Docker, create a DB and user and export `DATABASE_URL` before running the backend:

  ```sql
  CREATE DATABASE studenthub_db;
  CREATE USER 'username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
  GRANT ALL PRIVILEGES ON studenthub_db.* TO 'username'@'localhost';
  FLUSH PRIVILEGES;
  ```

  Then export `DATABASE_URL=mysql+pymysql://username:password@localhost:3306/studenthub_db?charset=utf8mb4` and run the backend.

- To apply migrations manually:

  ```bash
  alembic upgrade head
  ```

- Before promoting to staging/production, run the pre-deploy checks:

  ```bash
  python scripts/predeploy_check.py
  ```
  The script will report warnings or errors for unsafe production configuration (e.g., DEBUG enabled, SQLite fallback enabled, missing `SECRET_KEY`).

## Production operations

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions, including:
- Database provisioning (managed DB setup)
- Backup and restore procedures
- CI/CD secrets and workflows
- Monitoring, logging, and alerting setup
- Health check endpoints for Kubernetes

### Rollback procedure

1. Identify the commit or image tag to roll back to: `git log --oneline` or your Docker registry tags.
2. Update your deployment configuration (docker-compose, Kubernetes manifest, etc.) to the previous image tag.
3. Restart services: `docker compose -f docker-compose.prod.yml up -d` or apply K8s manifests.
4. Verify: run smoke tests or manual sanity checks against the endpoints.
5. Check monitoring dashboards and logs to ensure no lingering errors after rollback.

### Incident response runbook

**Issue: Database connectivity lost**
1. Check that `DATABASE_URL` is still set and correct on the deployment host.
2. Verify the managed DB is online and accessible from the app host (security groups, firewall, etc.).
3. Restart the backend container: `docker compose restart backend` or restart the pod.
4. If DB is down, restore from a recent backup using `backend/scripts/restore_db.py`.

**Issue: High error rate in Sentry / logs**
1. Check Sentry dashboard or centralized logs for error patterns.
2. If errors are related to a specific endpoint or feature, check recent code changes.
3. Roll back the last deploy if the errors started after a recent push.
4. Investigate DB slowness if errors appear to be query-related.

**Issue: API requests timing out**
1. Check CPU and memory utilization on the app host.
2. Verify database performance (slow queries, locks).
3. Check if `/ready` endpoint still returns 200; if not, the app may be unhealthy.
4. Restart the app container and verify health probes before resuming traffic.

**Issue: Frontend build or deployment failed**
1. Check the GitHub Actions log for the specific failure.
2. Common causes: missing env vars, npm dependency issue, or TypeScript compilation error.
3. Fix the issue locally, commit, and re-push to trigger a new deploy.
4. For manual rollback, revert to a previous image tag in the deployment.

### Secrets management

In production, store secrets securely using your provider's secret manager:
- AWS: use Secrets Manager or Parameter Store
- GCP: use Secret Manager
- DigitalOcean: use App Platform Secrets
- Manual: use a `.env` file on the host (less secure, suitable for non-critical envs)

Inject secrets into the app via environment variables at container runtime.

### Monitoring and alerting

- Prometheus metrics are exposed on `GET /metrics`. Configure your monitoring tool to scrape this endpoint regularly.
- Sentry is configured via `SENTRY_DSN` env var; all unhandled errors are automatically reported.
- Centralized logs: ensure stdout/stderr are captured by your log aggregation service.
- Set up alerts for:
  - `/ready` probe returns non-200 (DB unhealthy)
  - Error rate spike in Sentry
  - High latency on key endpoints
  - High resource utilization (CPU, memory, disk)
