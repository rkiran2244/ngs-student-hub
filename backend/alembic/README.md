This directory contains Alembic migration environment for the backend.

How to generate a migration:

1. Ensure `DATABASE_URL` is set to your database (local dev or production).
2. From the backend folder, run:

   alembic revision --autogenerate -m "initial migration"

3. Inspect the generated migration script under `backend/alembic/versions/` and adjust as necessary.
4. Apply migrations with:

   alembic upgrade head

Note: The project uses SQLAlchemy with metadata exported from `backend.db.db` and `backend.models` imported in `env.py` for autogenerate to pick up models.