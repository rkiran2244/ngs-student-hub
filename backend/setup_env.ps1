Param()
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$venv = Join-Path $root '.venv'
if (-not (Test-Path $venv)) {
  python -m venv $venv
}
& "$venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
# install development tools (linters, test runner)
pip install -r backend/dev-requirements.txt || Write-Host "dev requirements install failed (non-fatal)"
# install pre-commit and enable hooks
pip install pre-commit
pre-commit install || Write-Host "pre-commit install failed (non-fatal)"
pre-commit run --all-files || Write-Host "pre-commit checks failed (non-fatal)"

Write-Host "Installing frontend dependencies..."
Push-Location (Join-Path $root 'frontend')
npm ci
Pop-Location
Write-Host "Building frontend..."
Push-Location (Join-Path $root 'frontend')
npm run build
Pop-Location
if (-not $env:DATABASE_URL) { $env:DATABASE_URL = "sqlite:///backend/dev_alembic.db" }
python backend/scripts/run_migrations.py
Write-Host "✅ Environment ready. Activate with: .\.venv\Scripts\Activate.ps1"