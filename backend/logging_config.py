import logging
import os

def setup_logging():
    fmt = os.environ.get('LOG_FORMAT', '%(asctime)s %(levelname)s [%(name)s] %(message)s')
    level = os.environ.get('LOG_LEVEL', 'INFO')
    logging.basicConfig(level=level, format=fmt)
    # reduce noisy logs from some libraries by default
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
