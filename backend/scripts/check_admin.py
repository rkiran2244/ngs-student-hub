"""Check for admin users in the database."""
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.app import create_app
from backend.db import db
from backend.models import User, Profile

app = create_app()
with app.app_context():
    admins = User.query.filter_by(role='admin').all()
    if admins:
        print("Admin users found:")
        for admin in admins:
            profile = admin.profile
            print(f"  Email: {admin.email}")
            print(f"  Username: {profile.username if profile else 'No profile'}")
            print(f"  Full Name: {profile.full_name if profile else 'No profile'}")
            print(f"  Status: {profile.status if profile else 'No profile'}")
            print()
    else:
        print("No admin users found in the database.")
        print("\nTo create an admin user, run:")
        print("  python backend/scripts/seed_admin.py --email <email> --username <username> --password <password>")

