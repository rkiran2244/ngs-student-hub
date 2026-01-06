from backend.app import create_app

# WSGI entrypoint for Gunicorn and other WSGI servers
app = create_app()

if __name__ == "__main__":
    # Allow local runs with `python backend/wsgi.py`
    app.run(host='0.0.0.0', port=int(__import__('os').environ.get('PORT', 5001)), debug=True)
