import pytest
from backend.scripts.db_utils import parse_database_url, build_backup_command, default_backup_path


def test_parse_postgres_url():
    url = 'postgresql://user:pass@dbhost:5432/mydb'
    p = parse_database_url(url)
    assert p['scheme'].startswith('postgres')
    assert p['user'] == 'user'
    assert p['password'] == 'pass'
    assert p['host'] == 'dbhost'
    assert p['port'] == 5432
    assert p['dbname'] == 'mydb'


def test_parse_mysql_url():
    url = 'mysql+pymysql://u:p@localhost:3306/dbname'
    p = parse_database_url(url)
    assert p['scheme'].startswith('mysql')
    assert p['user'] == 'u'
    assert p['password'] == 'p'
    assert p['port'] == 3306
    assert p['dbname'] == 'dbname'


def test_build_backup_command_postgres(tmp_path):
    p = parse_database_url('postgresql://user:pass@h:5432/db')
    out = str(tmp_path / 'out.dump')
    cmd = build_backup_command(p, out)
    assert 'pg_dump' in cmd[0]
    assert '-f' in cmd


def test_build_backup_command_mysql(tmp_path):
    p = parse_database_url('mysql+pymysql://user:pw@h:3306/db')
    out = str(tmp_path / 'out.sql')
    cmd = build_backup_command(p, out)
    assert cmd[0] == 'mysqldump'
    assert 'db' in cmd[-1]


def test_default_backup_path(tmp_path, monkeypatch):
    monkeypatch.setenv('BACKUP_DIR', str(tmp_path))
    p = default_backup_path()
    assert str(tmp_path) in p
