#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
VENV_DIR="$ROOT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"

echo "Creating virtualenv at $VENV_DIR (if missing)"
python -m venv "$VENV_DIR"
# shellcheck disable=SC1091
. "$VENV_DIR/bin/activate"

echo "Upgrading pip and installing backend requirements"
$PYTHON -m pip install --upgrade pip
pip install -r backend/requirements.txt
# install development tools (linters, test runner)
pip install -r backend/dev-requirements.txt || true

echo "Installing frontend dependencies"
cd frontend
npm ci
cd "$ROOT_DIR"

echo "Building frontend"
cd frontend
npm run build
cd "$ROOT_DIR"

echo "Installing and enabling pre-commit hooks"
$PYTHON -m pip install pre-commit
pre-commit install || true
pre-commit run --all-files || true

echo "Running database migrations"
DATABASE_URL=${DATABASE_URL:-sqlite:///backend/dev_alembic.db}
export DATABASE_URL
python backend/scripts/run_migrations.py

cat <<EOF
✅ Environment ready.
To activate the Python venv run:
  source .venv/bin/activate
Run the backend:
  python -m backend.app
EOF