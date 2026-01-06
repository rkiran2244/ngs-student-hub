# Flask Backend for StudentHub

This lightweight Flask backend provides:
- JWT-based auth (signup, login, refresh, me)
- Student endpoints: upload files, list uploads, update profile
- Admin endpoints: list students, approve/suspend/activate students, manage uploads
- Configurable DB (MySQL preferred in this repo) and file uploads stored on disk in `backend/uploads/`

Quick start (Windows / PowerShell):

1. Create venv and install deps

   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt

2. Copy example env (set production DB values accordingly)

   copy .env.example .env
   # edit .env to set DATABASE_URL (MySQL), JWT_SECRET_KEY, UPLOAD_FOLDER

3. Run server

   python -m backend.app

The server runs on http://localhost:5001 by default.

MySQL setup notes

- This project is configured to use MySQL (via `pymysql`) by default when `DATABASE_URL` is set to a MySQL URI (e.g. `mysql+pymysql://user:pass@host:3306/dbname`).
- To initialize schema on a fresh MySQL database, run:

```powershell
python backend/scripts/create_db_and_check.py
```

- For local testing, `docker-compose.prod.yml` includes a `mysql` service. Running `docker-compose -f docker-compose.prod.yml up --build` will start MySQL for you (password: `password` in the compose file - change for production).

- The project also includes SQLite-only helper scripts (e.g., `add_course_fields.py`) that will be skipped automatically when a non-sqlite `DATABASE_URL` is used.

Database migrations (Alembic)

- Alembic is configured inside `backend/alembic/` and migrations live in `backend/alembic/versions/`.
- To generate a new migration from the current models (autogenerate):

  ```powershell
  # from repo root (ensure DATABASE_URL is set)
  $env:DATABASE_URL='sqlite:///backend/dev_alembic.db'
  python backend/scripts/generate_initial_migration.py
  ```

- To apply migrations (recommended for CI / deploy):

  ```powershell
  # from repo root (ensure DATABASE_URL points to your DB)
  python backend/scripts/run_migrations.py
  ```

- CI: the GitHub Actions workflow runs `backend/scripts/run_migrations.py` against a sqlite test DB before executing the test suite.


Notes:
- Email flows are stubbed (they return success for dev). Replace with a real SMTP provider for production.
- Admin access is protected by an `admin` role on `users.role`. Use DB seed or update a user to role `admin` to access admin endpoints.

To seed an admin with the credentials used here run (from project root):

```powershell
python backend/scripts/seed_admin.py --email admin@nuhvin.com --username admin@nuhvin.com --password 123456 --force
```

