"""Restore a DB backup file into the configured database.

Usage:
  python restore_db.py --file /path/to/backup.dump

For Postgres it uses `pg_restore`; for MySQL it uses `mysql` with input redirection.
"""
import os
import argparse
import subprocess
import sys
from .db_utils import parse_database_url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--file', '-f', required=True, help='Backup file to restore')
    parser.add_argument('--db', help='DATABASE_URL override (optional)')
    args = parser.parse_args()

    backup_file = args.file
    if not os.path.exists(backup_file):
        print('Backup file not found:', backup_file, file=sys.stderr)
        sys.exit(2)

    db_url = args.db or os.environ.get('DATABASE_URL')
    if not db_url:
        print('DATABASE_URL is not set. Aborting.', file=sys.stderr)
        sys.exit(2)

    parsed = parse_database_url(db_url)

    try:
        if parsed['scheme'].startswith('postgres') or parsed['scheme'].startswith('postgresql'):
            cmd = ['pg_restore', '-d', parsed['dbname'], '-h', parsed['host']]
            if parsed['port']:
                cmd += ['-p', str(parsed['port'])]
            if parsed['user']:
                cmd += ['-U', parsed['user']]
            cmd += [backup_file]
            subprocess.check_call(cmd)
        elif parsed['scheme'].startswith('mysql'):
            cmd = ['mysql', '-h', parsed['host']]
            if parsed['port']:
                cmd += ['-P', str(parsed['port'])]
            if parsed['user']:
                cmd += ['-u', parsed['user']]
            if parsed['password']:
                cmd += [f"-p{parsed['password']}"]
            cmd += [parsed['dbname']]
            with open(backup_file, 'rb') as fh:
                subprocess.check_call(cmd, stdin=fh)
        else:
            print('Unsupported DB scheme for restore:', parsed['scheme'], file=sys.stderr)
            sys.exit(3)
        print('Restore completed successfully')
    except FileNotFoundError:
        print('Required DB client not found. Install the proper client for your DB and retry.', file=sys.stderr)
        sys.exit(3)
    except subprocess.CalledProcessError as e:
        print('Restore command failed:', e, file=sys.stderr)
        sys.exit(4)


if __name__ == '__main__':
    main()
