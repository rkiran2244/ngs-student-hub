import multiprocessing

workers = int(multiprocessing.cpu_count() * 2 + 1)
bind = '0.0.0.0:5001'
timeout = 30
accesslog = '-'  # log to stdout
errorlog = '-'
loglevel = 'info'
