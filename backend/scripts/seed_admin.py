"""Seed or promote an admin user.

Usage:
  python backend/scripts/seed_admin.py --email <email> --username <username> --password <password> [--force]

If the user already exists, this script will promote them to admin and ensure a Profile exists.
"""
import argparse
import sys

from backend.app import create_app
from backend.db import db
from backend.models import User, Profile
from backend.utils import hash_password


def main():
    parser = argparse.ArgumentParser(description='Create or promote an admin user')
    parser.add_argument('--email', required=True, help='Email for admin user')
    parser.add_argument('--username', required=True, help='Username for profile')
    parser.add_argument('--password', required=True, help='Password for admin user')
    parser.add_argument('--force', action='store_true', help='Force overwrite password and username if user exists')
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        existing = User.query.filter_by(email=args.email).first()
        if existing:
            print(f"Found existing user: {existing.email} (id={existing.id})")
            if existing.role != 'admin':
                existing.role = 'admin'
                print('Promoted user to admin')
            if args.force:
                existing.password_hash = hash_password(args.password)
                print('Password updated')
            # ensure profile exists
            if not existing.profile:
                p = Profile(user_id=existing.id, username=args.username, full_name=args.username, email=existing.email, status='active')
                db.session.add(p)
                print('Created profile for existing user')
            else:
                if args.force:
                    existing.profile.username = args.username
                    existing.profile.full_name = args.username
                    existing.profile.status = 'active'
                    print('Updated profile username/full_name/status')
            db.session.commit()
            print('Done')
            return

        # create new user + profile
        u = User(email=args.email, password_hash=hash_password(args.password), role='admin')
        db.session.add(u)
        db.session.commit()
        p = Profile(user_id=u.id, username=args.username, full_name=args.username, email=u.email, status='active')
        db.session.add(p)
        db.session.commit()
        print('Created admin user:', args.email)


if __name__ == '__main__':
    main()
