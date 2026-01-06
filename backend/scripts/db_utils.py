"""Utilities for DB backup and restore operations.

This file contains helpers to parse DATABASE_URL and build appropriate
backup and restore commands for supported DB engines (postgres, mysql).
It intentionally does not execute anything; higher-level scripts call
these helpers and run subprocesses so we can unit-test behavior.
"""
from urllib.parse import urlparse
import os
import shlex
import datetime


def parse_database_url(db_url: str):
    """Parse a DATABASE_URL and return a dict with components.

    Supports URLs like:
      postgres://user:pass@host:port/dbname
      postgresql://...
      mysql+pymysql://user:pass@host:port/dbname
      mysql://...

    Returns:
        dict with keys: scheme, user, password, host, port, dbname, raw
    """
    if not db_url:
        raise ValueError('DATABASE_URL is required')
    parsed = urlparse(db_url)
    scheme = parsed.scheme
    user = parsed.username
    password = parsed.password
    host = parsed.hostname or 'localhost'
    port = parsed.port
    dbname = parsed.path[1:] if parsed.path and parsed.path.startswith('/') else parsed.path
    return {
        'scheme': scheme,
        'user': user,
        'password': password,
        'host': host,
        'port': port,
        'dbname': dbname,
        'raw': db_url,
    }


def build_backup_command(parsed: dict, out_path: str):
    """Return the backup command list for subprocess for the given parsed URL.

    Currently supports Postgres (pg_dump) and MySQL (mysqldump).
    """
    scheme = parsed['scheme']
    if scheme.startswith('postgres') or scheme.startswith('postgresql'):
        # pg_dump -Fc -h host -p port -U user -f outfile dbname
        cmd = [
            'pg_dump',
            '-Fc',
            '-h', parsed['host'],
        ]
        if parsed['port']:
            cmd += ['-p', str(parsed['port'])]
        if parsed['user']:
            cmd += ['-U', parsed['user']]
        cmd += ['-f', out_path, parsed['dbname']]
        return cmd
    if scheme.startswith('mysql'):
        # mysqldump -h host -P port -u user -p'password' dbname > out.sql
        cmd = [
            'mysqldump',
            '-h', parsed['host'],
        ]
        if parsed['port']:
            cmd += ['-P', str(parsed['port'])]
        if parsed['user']:
            cmd += ['-u', parsed['user']]
        # note: -p arg without space is recommended to avoid interactive prompt
        if parsed['password']:
            cmd += [f"-p{parsed['password']}"]
        cmd += [parsed['dbname']]
        # We will let caller redirect stdout to file
        return cmd
    raise ValueError(f"Unsupported DB scheme: {scheme}")


def default_backup_path(backup_dir: str | None = None):
    if not backup_dir:
        backup_dir = os.environ.get('BACKUP_DIR', os.path.join(os.getcwd(), 'backups'))
    os.makedirs(backup_dir, exist_ok=True)
    ts = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    return os.path.join(backup_dir, f'db-backup-{ts}.dump')
