"""Backup the configured DATABASE_URL to a file.

Usage:
  python backup_db.py [--out /path/to/backup.dump]

The script will detect DB engine and call the appropriate native client
(`pg_dump` or `mysqldump`). It requires that the native client is
installed and available in PATH on the machine running the script.
"""
import os
import argparse
import subprocess
import sys
from .db_utils import parse_database_url, build_backup_command, default_backup_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', '-o', help='Output backup path (optional)')
    parser.add_argument('--db', help='DATABASE_URL override (optional)')
    args = parser.parse_args()

    db_url = args.db or os.environ.get('DATABASE_URL')
    if not db_url:
        print('DATABASE_URL is not set. Aborting.', file=sys.stderr)
        sys.exit(2)

    parsed = parse_database_url(db_url)

    out = args.out or default_backup_path()

    cmd = build_backup_command(parsed, out)

    print('Running backup command:', ' '.join(map(str, cmd)))
    try:
        if cmd[0] == 'mysqldump':
            # For mysqldump, redirect stdout to out file
            with open(out, 'wb') as fh:
                subprocess.check_call(cmd, stdout=fh)
        else:
            subprocess.check_call(cmd)
        print('Backup written to', out)
    except FileNotFoundError:
        print(f"Required DB client not found: {cmd[0]}. Install it on the host and retry.", file=sys.stderr)
        sys.exit(3)
    except subprocess.CalledProcessError as e:
        print('Backup command failed:', e, file=sys.stderr)
        sys.exit(4)


if __name__ == '__main__':
    main()
