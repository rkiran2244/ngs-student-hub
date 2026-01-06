"""Print SQLALCHEMY_DATABASE_URI and resolved DB path for debugging."""
from backend.app import create_app
import os

app = create_app()
uri = app.config.get('SQLALCHEMY_DATABASE_URI')
print('SQLALCHEMY_DATABASE_URI=', uri)
# Resolve sqlite path if using sqlite:/// or sqlite:///./path
if uri and uri.startswith('sqlite'):
    # remove sqlite:/// prefix
    path_part = uri.split('sqlite:///')[-1]
    abs_path = os.path.abspath(path_part)
    print('Resolved DB path:', abs_path)
else:
    print('Non-sqlite or unset URI')
