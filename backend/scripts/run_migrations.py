"""Run Alembic migrations programmatically.
Usage: python backend/scripts/run_migrations.py
It will read DATABASE_URL from environment and apply migrations (upgrade head).
"""
import os
from alembic.config import Config
from alembic import command

here = os.path.dirname(os.path.dirname(__file__))
ini_path = os.path.join(here, "alembic.ini")
cfg = Config(ini_path)
# ensure script_location is absolute
cfg.set_main_option('script_location', os.path.join(here, 'alembic'))

if "DATABASE_URL" in os.environ:
    cfg.set_main_option('sqlalchemy.url', os.environ['DATABASE_URL'])

print("Applying migrations using", cfg.get_main_option('sqlalchemy.url'))
command.upgrade(cfg, 'head')
print("Migrations applied.")