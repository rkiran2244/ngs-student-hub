import traceback, os
print('ENV DATABASE_URL=', os.environ.get('DATABASE_URL'))
try:
    from backend.app import create_app
    app = create_app()
    print('GOT APP')
    print('URI=', app.config.get('SQLALCHEMY_DATABASE_URI'))
except Exception as e:
    traceback.print_exc()
    print('FAILED', e)
