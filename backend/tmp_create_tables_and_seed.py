from backend.app import create_app
from backend.db import db
from backend.models import User, Profile
from backend.utils import hash_password

app = create_app()
with app.app_context():
    env = app.config.get('ENV')
    uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    print('ENV =', env)
    print('SQLALCHEMY_DATABASE_URI =', uri)
    if env == 'production':
        print('Refusing to run create_all() in production. Aborting.')
        raise SystemExit(1)

    print('Creating tables with db.create_all()...')
    db.create_all()
    print('Tables created (or already existed).')

    email = 'admin@nuhvin.com'
    username = 'admin@nuhvin.com'
    password = '123456'

    existing = User.query.filter_by(email=email).first()
    if existing:
        print('Found existing user:', existing.email)
        existing.role = 'admin'
        existing.password_hash = hash_password(password)
        if not existing.profile:
            p = Profile(user_id=existing.id, username=username, full_name=username, email=existing.email, status='active')
            db.session.add(p)
            print('Created profile for existing user')
        else:
            existing.profile.username = username
            existing.profile.full_name = username
            existing.profile.status = 'active'
            print('Updated profile for existing user')
        db.session.commit()
        print('Updated admin user and password')
    else:
        u = User(email=email, password_hash=hash_password(password), role='admin')
        db.session.add(u)
        db.session.commit()
        p = Profile(user_id=u.id, username=username, full_name=username, email=u.email, status='active')
        db.session.add(p)
        db.session.commit()
        print('Created admin user:', u.email)
