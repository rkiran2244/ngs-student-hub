import os
import time
from sqlalchemy import create_engine

url = os.environ.get('DATABASE_URL')
if not url:
    # Fallback to individual vars
    host = os.environ.get('DATABASE_HOST', 'mysql')
    port = os.environ.get('DATABASE_PORT', '3306')
    user = os.environ.get('DATABASE_USER', 'root')
    password = os.environ.get('DATABASE_PASSWORD', 'password')
    db = os.environ.get('DATABASE_NAME', 'studenthub_db')
    url = f"mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4"

print('Waiting for DB at', url)
engine = create_engine(url, pool_pre_ping=True)

for i in range(60):
    try:
        with engine.connect() as conn:
            print('DB is available')
            break
    except Exception as e:
        print('DB not ready yet:', str(e))
        time.sleep(1)
else:
    raise RuntimeError('Timed out waiting for DB')
