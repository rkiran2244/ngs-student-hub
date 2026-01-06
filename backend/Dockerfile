# Backend Dockerfile (production)
FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install pip deps
COPY backend/requirements.txt ./
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy backend source
COPY backend ./backend

# Create uploads dir and ensure permissions
RUN mkdir -p /app/backend/uploads && chown -R 1000:1000 /app/backend/uploads || true

ENV PORT=5001
EXPOSE 5001

# Use Gunicorn with an included config for production
ENTRYPOINT ["sh", "-c", "gunicorn -c backend/gunicorn_config.py wsgi:app"]
