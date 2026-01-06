"""Generate an initial alembic migration programmatically.
Run: python backend/scripts/generate_initial_migration.py
"""
import os
from alembic.config import Config
from alembic import command

here = os.path.dirname(os.path.dirname(__file__))
ini_path = os.path.join(here, "alembic.ini")
cfg = Config(ini_path)
# ensure alembic script_location is absolute so ScriptDirectory can be found
cfg.set_main_option('script_location', os.path.join(here, 'alembic'))

# prefer DATABASE_URL from environment if present
if "DATABASE_URL" in os.environ:
    cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
else:
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{os.path.join(here, 'dev_alembic.db')}")

print("Using alembic.ini:", ini_path)
print("sqlalchemy.url:", cfg.get_main_option("sqlalchemy.url"))

command.revision(cfg, message="initial migration", autogenerate=True)
print("Revision generated.")
