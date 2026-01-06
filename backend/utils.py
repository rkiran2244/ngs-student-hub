from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
import os
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = set(['pdf', 'doc', 'docx', 'zip', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tif', 'tiff', 'avif', 'ico', 'heic', 'jfif'])


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(hash: str, password: str) -> bool:
    return check_password_hash(hash, password)


def allowed_file(filename: str, mimetype: str = '') -> bool:
    """Return True if the file is allowed based on its extension or MIME type.

    Accept if the filename extension matches ALLOWED_EXTENSIONS, or if the uploaded
    file's MIME type indicates an image (e.g., image/jpeg, image/png)."""
    # Check extension first
    if filename and '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS:
        return True
    # Fall back to MIME type check for common image types
    if mimetype and mimetype.startswith('image/'):
        return True
    return False


from .storage import get_storage

def save_upload_file(file, user_id: str) -> str:
    """Save an uploaded file either to local disk or to configured S3 storage.

    Returns:
        - If local storage: the relative path under the uploads root (e.g., "userid/123_file.png")
        - If S3 storage: the public URL returned by the storage backend (starts with http...)
    """
    uploads_root = current_app.config.get('UPLOAD_FOLDER')
    storage = get_storage(current_app.config)

    filename = secure_filename(file.filename)
    rel_path = os.path.join(user_id, f"{int(__import__('time').time())}_{filename}").replace('\\', '/')

    # If using LocalStorage, write to disk and return relative key
    from .storage import LocalStorage
    if isinstance(storage, LocalStorage):
        storage.upload(file, rel_path)
        return rel_path

    # Otherwise (S3), upload to S3 with the key being the rel_path
    url = storage.upload(file, rel_path, content_type=(file.content_type or file.mimetype))
    return url
