"""Add course_name, course_mode, course_duration columns to profiles table if they don't exist."""
import os
import sys
import sqlite3

# Get database path (relative to repository)
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

    added = False
    # Add course_name column if it doesn't exist
    if 'course_name' not in columns:
        print('Adding course_name column...')
        cursor.execute("ALTER TABLE profiles ADD COLUMN course_name TEXT")
        added = True
        print('[OK] course_name column added')
    else:
        print('[OK] course_name column already exists')

    # Add course_mode column if it doesn't exist
    if 'course_mode' not in columns:
        print('Adding course_mode column...')
        cursor.execute("ALTER TABLE profiles ADD COLUMN course_mode TEXT")
        added = True
        print('[OK] course_mode column added')
    else:
        print('[OK] course_mode column already exists')

    # Add course_duration column if it doesn't exist
    if 'course_duration' not in columns:
        print('Adding course_duration column...')
        cursor.execute("ALTER TABLE profiles ADD COLUMN course_duration TEXT")
        added = True
        print('[OK] course_duration column added')
    else:
        print('[OK] course_duration column already exists')

    if added:
        conn.commit()
        print('\n[SUCCESS] Course fields migration completed successfully!')
    else:
        print('\n[INFO] No changes made. All course fields already exist.')

    print('You can now restart the backend server and try signing up again.')

except Exception as e:
    conn.rollback()
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    conn.close()