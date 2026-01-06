from flask import Blueprint, request, jsonify, current_app, send_file
from ..db import db
from ..models import User, Profile, DailyUpload, Feedback
from ..utils import allowed_file, save_upload_file, ALLOWED_EXTENSIONS
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import os

student_bp = Blueprint('student', __name__)

@student_bp.route('/uploads', methods=['GET'])
@jwt_required()
def get_uploads():
    import os
    try:
        user_id = get_jwt_identity()
        uploads = DailyUpload.query.filter_by(user_id=user_id).order_by(DailyUpload.created_at.desc()).all()
        result = []
        uploads_root = current_app.config.get('UPLOAD_FOLDER')
        for u in uploads:
            file_url = u.file_url
            if not file_url.startswith('/uploads/'):
                try:
                    rel = os.path.relpath(file_url, uploads_root)
                    # Convert to forward slashes for URL
                    rel = rel.replace('\\', '/')
                    file_url = f"/uploads/{rel}"
                except Exception:
                    # leave as is if conversion fails
                    pass
            else:
                # Ensure forward slashes in stored URL paths
                file_url = file_url.replace('\\', '/')
            result.append({
                'id': u.id,
                'user_id': u.user_id,
                'file_name': u.file_name,
                'file_url': file_url,
                'file_type': u.file_type,
                'file_size': u.file_size,
                'upload_date': u.upload_date.isoformat() if u.upload_date else None,
                'description': u.description,
                'status': u.status,
                'admin_feedback': u.admin_feedback,
                'reviewed_by': u.reviewed_by,
                'reviewed_at': u.reviewed_at.isoformat() if u.reviewed_at else None,
                'created_at': u.created_at.isoformat() if u.created_at else None,
            })
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Failed to fetch uploads: {str(e)}'}), 500

@student_bp.route('/uploads', methods=['POST'])
@jwt_required()
def upload_file():
    # multipart/form-data
    user_id = get_jwt_identity()
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400
        file = request.files['file']
        description = request.form.get('description')

        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400
        # Validate file type using filename extension OR MIME type
        mimetype = (file.content_type or file.mimetype or '')
        if not allowed_file(file.filename, mimetype):
            # Try to sniff the file header (magic bytes) as a fallback for browsers that omit mimetype or extension
            try:
                head = file.read(64)
                # Reset stream position for later file.save()
                file.seek(0)
                magic = head[:16]
                magic_hex = __import__('binascii').hexlify(magic).decode('ascii')
                sniffed = None
                if magic.startswith(b'\xff\xd8'):
                    sniffed = 'jpeg'
                elif magic.startswith(b'\x89PNG\r\n\x1a\n'):
                    sniffed = 'png'
                elif magic.startswith(b'GIF8'):
                    sniffed = 'gif'
                elif magic.startswith(b'RIFF') and magic[8:12] == b'WEBP':
                    sniffed = 'webp'
                elif magic.startswith(b'II*\x00') or magic.startswith(b'MM\x00*'):
                    sniffed = 'tiff'
                elif magic.startswith(b'BM'):
                    sniffed = 'bmp'
                elif magic.startswith(b'\x00\x00\x01\x00'):
                    sniffed = 'ico'
                elif b'ftyp' in head and (b'avif' in head or b'heic' in head or b'qt  ' in head):
                    sniffed = 'avif/heic'
                if sniffed:
                    current_app.logger.debug(f"Sniffed file type {sniffed} from magic bytes for filename={file.filename!r}")
                    # allow the upload to continue
                else:
                    current_app.logger.debug(f"Rejected upload: filename={file.filename!r}, mimetype={mimetype!r}, magic={magic_hex}")
                    return jsonify({
                        'success': False,
                        'message': f'Invalid file type for {file.filename or "file"}',
                        'filename': file.filename,
                        'mimetype': mimetype,
                        'magic_hex': magic_hex,
                        'allowed_extensions': sorted(list(ALLOWED_EXTENSIONS))
                    }), 400
            except Exception as e:
                current_app.logger.exception('Error sniffing file header')
                return jsonify({'success': False, 'message': 'Invalid file type and header sniff failed'}), 400

        # Get file size before saving (saving may close the underlying stream)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)  # Reset file pointer

        path = save_upload_file(file, user_id)

        # Decide stored file_url: for S3 this will be an absolute URL, for local storage it's a relative path
        file_url = path if path.startswith('http') else path

        upload = DailyUpload(
            user_id=user_id,
            file_name=file.filename,
            file_url=file_url,
            file_type=file.content_type or file.mimetype,
            file_size=file_size,
            description=description,
        )
        db.session.add(upload)
        db.session.commit()

        # Return file URL so client can use it (e.g., set profile avatar)
        resp_url = file_url if file_url.startswith('http') else f"/uploads/{file_url}"
        return jsonify({'success': True, 'message': 'File uploaded successfully', 'upload': {'id': upload.id, 'file_url': resp_url}})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to upload file: {str(e)}'}), 500

@student_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    profile = user.profile
    # If profile does not exist, create a default one on PUTs (allow user to save profile/avatar even if missing)
    if not profile and request.method == 'PUT':
        profile = Profile(user_id=user.id, username=None, full_name=user.email or '', email=user.email, status='active')
        db.session.add(profile)
        db.session.commit()

    if not profile:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404
    
    if request.method == 'GET':
        return jsonify({
            'id': profile.id,
            'user_id': profile.user_id,
            'username': profile.username,
            'email': profile.email,
            'full_name': profile.full_name,
            'contact_number': profile.contact_number,
            'college_name': profile.college_name,
            'college_id': profile.college_id,
            'city': profile.city,
            'pincode': profile.pincode,
            'college_email': profile.college_email,
            'course_name': profile.course_name,
            'course_mode': profile.course_mode,
            'course_duration': profile.course_duration,
            'avatar_url': profile.avatar_url,
            'status': profile.status,
        })
    else:
        try:
            data = request.get_json() or {}
            if 'fullName' in data:
                profile.full_name = data.get('fullName')
            if 'contactNumber' in data:
                profile.contact_number = data.get('contactNumber')
            if 'collegeName' in data:
                profile.college_name = data.get('collegeName')
            if 'collegeId' in data:
                profile.college_id = data.get('collegeId')
            if 'collegeEmail' in data:
                profile.college_email = data.get('collegeEmail')
            if 'courseName' in data:
                profile.course_name = data.get('courseName')
            if 'courseMode' in data:
                profile.course_mode = data.get('courseMode')
            if 'courseDuration' in data:
                profile.course_duration = data.get('courseDuration')
            # Allow updating avatar URL (either camelCase or snake_case)
            if 'avatarUrl' in data:
                profile.avatar_url = data.get('avatarUrl')
            if 'avatar_url' in data:
                profile.avatar_url = data.get('avatar_url')
            # Support updating email (and propagate to User.email) with uniqueness check
            if 'email' in data and data.get('email'):
                new_email = data.get('email')
                if new_email != user.email:
                    existing = User.query.filter_by(email=new_email).first()
                    if existing:
                        return jsonify({'success': False, 'message': 'Email already in use'}), 409
                    user.email = new_email
                    profile.email = new_email
            profile.updated_at = datetime.now(timezone.utc)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Profile updated'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Failed to update profile: {str(e)}'}), 500

@student_bp.route('/uploads/<upload_id>/download', methods=['GET'])
@jwt_required()
def download_upload(upload_id):
    import os
    upload = db.session.get(DailyUpload, upload_id)
    if not upload:
        return jsonify({'success': False, 'message': 'Upload not found'}), 404
    # stored file_url is a served URL like /uploads/<rel_path>
    rel = upload.file_url
    # If the file_url is an absolute URL (S3 or CDN), redirect to it
    if isinstance(rel, str) and (rel.startswith('http://') or rel.startswith('https://')):
        from flask import redirect
        return redirect(rel)

    if rel.startswith('/uploads/'):
        rel = rel[len('/uploads/'):]
    # Convert forward slashes to OS-specific path separators
    rel = rel.replace('/', os.sep)
    uploads_root = current_app.config.get('UPLOAD_FOLDER')
    full_path = os.path.join(uploads_root, rel)
    if not os.path.exists(full_path):
        return jsonify({'success': False, 'message': 'File not found on server'}), 404
    return send_file(full_path, as_attachment=True, download_name=upload.file_name)


@student_bp.route('/feedback', methods=['GET', 'POST'])
@jwt_required()
def feedback():
    import json
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # POST -> submit feedback
        if request.method == 'POST':
            # Accept multipart/form-data or JSON
            if request.content_type and request.content_type.startswith('multipart/form-data'):
                category = request.form.get('category')
                subject = request.form.get('subject')
                message = request.form.get('message')
                rating = request.form.get('rating')
                files = request.files.getlist('files')
            else:
                data = request.get_json() or {}
                category = data.get('category')
                subject = data.get('subject')
                message = data.get('message')
                rating = data.get('rating')
                files = []

            if not category or not subject or not message:
                return jsonify({'success': False, 'message': 'category, subject and message are required'}), 400

            # One active feedback per day per student
            from datetime import datetime, timezone, timedelta
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            existing = Feedback.query.filter_by(user_id=user_id).filter(Feedback.created_at >= today_start).first()
            if existing:
                return jsonify({'success': False, 'message': 'You can only submit one feedback per day'}), 400

            attachment_urls = []
            uploads_root = current_app.config.get('UPLOAD_FOLDER')
            # handle files if any
            for f in files:
                if f and f.filename:
                    # reuse allowed_file/save_upload_file logic
                    if not allowed_file(f.filename, f.mimetype or f.content_type):
                        # try sniffing first 64 bytes
                        head = f.read(64)
                        f.seek(0)
                        # if sniff looks ok, continue, else reject
                        import binascii
                        magic = head[:16]
                        magic_hex = binascii.hexlify(magic).decode('ascii')
                        return jsonify({'success': False, 'message': 'Invalid file type', 'filename': f.filename, 'mimetype': f.mimetype or f.content_type, 'magic_hex': magic_hex}), 400
                    path = save_upload_file(f, user_id)
                    attachment_urls.append(path if path.startswith('http') else f"/uploads/{path}")

            # Normalize rating to float (accept strings like '4.5' or numbers)
            rating_val = None
            if rating is not None and rating != '':
                try:
                    rating_val = float(rating)
                except Exception:
                    rating_val = None

            # Enforce rating presence and validate value (1 to 5, 0.5 increments)
            if rating_val is None:
                return jsonify({'success': False, 'message': 'rating is required'}), 400
            if not (1.0 <= rating_val <= 5.0):
                return jsonify({'success': False, 'message': 'rating must be between 1 and 5'}), 400
            if not float(rating_val * 2).is_integer():
                return jsonify({'success': False, 'message': 'rating must be in 0.5 increments'}), 400

            fb = Feedback(
                user_id=user_id,
                category=category,
                subject=subject,
                message=message,
                rating=rating_val,
                attachments=json.dumps(attachment_urls) if attachment_urls else None,
                status='submitted'
            )
            db.session.add(fb)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Feedback submitted', 'feedback_id': fb.id})

        # GET -> list user's feedback
        else:
            fbs = Feedback.query.filter_by(user_id=user_id).order_by(Feedback.created_at.desc()).all()
            result = []
            for f in fbs:
                attachments = []
                try:
                    attachments = json.loads(f.attachments) if f.attachments else []
                except Exception:
                    attachments = []
                result.append({
                    'id': f.id,
                    'user_id': f.user_id,
                    'category': f.category,
                    'subject': f.subject,
                    'message': f.message,
                    'rating': f.rating,
                    'attachments': attachments,
                    'status': f.status,
                    'admin_response': f.admin_response,
                    'responded_by': f.responded_by,
                    'responded_at': f.responded_at.isoformat() if f.responded_at else None,
                    'created_at': f.created_at.isoformat() if f.created_at else None,
                })
            return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Feedback error: {str(e)}'}), 500
