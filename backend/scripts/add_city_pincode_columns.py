"""Add city and pincode columns to profiles table if they don't exist."""
import os
import sys
import sqlite3

# Get database path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
db_path = os.path.join(backend_dir, 'studenthub.db')

print(f'Database path: {db_path}')

if not os.path.exists(db_path):
    print('Error: Database file does not exist')
    print(f'Looking for: {db_path}')
    sys.exit(1)

# Connect to SQLite directly
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if columns exist
    cursor.execute("PRAGMA table_info(profiles)")
    columns = [row[1] for row in cursor.fetchall()]
    
    print(f'Existing columns: {columns}')
    
    # Add city column if it doesn't exist
    if 'city' not in columns:
        print('Adding city column...')
        cursor.execute("ALTER TABLE profiles ADD COLUMN city TEXT")
        print('[OK] city column added')
    else:
        print('[OK] city column already exists')
    
    # Add pincode column if it doesn't exist
    if 'pincode' not in columns:
        print('Adding pincode column...')
        cursor.execute("ALTER TABLE profiles ADD COLUMN pincode TEXT")
        print('[OK] pincode column added')
    else:
        print('[OK] pincode column already exists')
    
    conn.commit()
    print('\n[SUCCESS] Migration completed successfully!')
    print('You can now restart the backend server and try logging in again.')
    
except Exception as e:
    conn.rollback()
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    conn.close()
