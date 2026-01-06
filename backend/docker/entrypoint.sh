#!/bin/sh
set -e

# Wait for DB using Python helper
python backend/docker/wait_for_db.py

# Run Alembic migrations
alembic upgrade head

# Ensure uploads directory exists
mkdir -p /app/backend/uploads

# Start Gunicorn
exec gunicorn -w 4 -b 0.0.0.0:${PORT:-5001} wsgi:app
