from flask import Blueprint, request, jsonify, current_app
import os
from ..db import db
from ..models import Profile, DailyUpload, User, Feedback
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone

admin_bp = Blueprint('admin', __name__)

def admin_only(fn):
    # simple decorator to check role
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user or user.role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

@admin_bp.route('/students', methods=['GET'])
@jwt_required()
@admin_only
def get_students():
    try:
        profiles = Profile.query.order_by(Profile.created_at.desc()).all()
        result = []
        uploads_root = current_app.config.get('UPLOAD_FOLDER')
        for p in profiles:
            avatar_url = p.avatar_url
            try:
                if avatar_url and not (avatar_url.startswith('data:') or avatar_url.startswith('http') or avatar_url.startswith('/uploads/')):
                    # if it's stored as an absolute path, make it a predictable URL like /uploads/<rel>
                    import os
                    rel = os.path.relpath(avatar_url, uploads_root)
                    rel = rel.replace('\\', '/')
                    avatar_url = f"/uploads/{rel}"
            except Exception:
                # fallback to raw avatar_url
                pass

            result.append({
                'id': p.id,
                'user_id': p.user_id,
                'username': p.username,
                'email': p.email,
                'full_name': p.full_name,
                'contact_number': p.contact_number,
                'college_name': p.college_name,
                'college_id': p.college_id,
                'city': p.city,
                'pincode': p.pincode,
                'college_email': p.college_email,
                'course_name': p.course_name,
                'course_mode': p.course_mode,
                'course_duration': p.course_duration,
                'avatar_url': avatar_url,
                'status': p.status,
                'created_at': p.created_at.isoformat() if p.created_at else None
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch students: {str(e)}'}), 500

@admin_bp.route('/students/<profile_id>/approve', methods=['POST'])
@jwt_required()
@admin_only
def approve_student(profile_id):
    data = request.get_json() or {}
    username = data.get('username')
    if not username:
        return jsonify({'success': False, 'message': 'username is required'}), 400
    
    # Check if username already exists
    existing_profile = Profile.query.filter_by(username=username).first()
    if existing_profile and existing_profile.id != profile_id:
        return jsonify({'success': False, 'message': f'Username "{username}" is already taken'}), 400
    
    profile = db.session.get(Profile, profile_id)
    if not profile:
        return jsonify({'success': False, 'message': 'Profile not found'}), 404
    
    try:
        profile.username = username
        profile.status = 'active'
        db.session.commit()

        # Send approval email containing the username to the student's registered email
        try:
            from ..email_utils import send_email
            if profile.email:
                subject = 'Your StudentHub account has been approved'
                body = (
                    f"Hello {profile.full_name or username},\n\n"
                    f"Your account has been approved by the administrator. Your username is: {username}\n\n"
                    "You can now sign in using your email and username. If you have any issues, reply to this email.\n\n"
                    "— StudentHub Team"
                )
                send_email(profile.email, subject, body)
        except Exception:
            # Do not fail approval if email sending fails; log and continue
            import traceback
            current_app.logger.exception('Failed to send approval email: %s', traceback.format_exc())

        return jsonify({'success': True, 'message': f'Student approved with username: {username}'})
    except IntegrityError as e:
        db.session.rollback()
        if 'username' in str(e.orig).lower() or 'unique' in str(e.orig).lower():
            return jsonify({'success': False, 'message': f'Username "{username}" is already taken. Please choose a different username.'}), 400
        return jsonify({'success': False, 'message': 'Database constraint violation. Please try again.'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to approve student: {str(e)}'}), 500

@admin_bp.route('/students/<profile_id>/suspend', methods=['POST'])
@jwt_required()
@admin_only
def suspend_student(profile_id):
    try:
        profile = db.session.get(Profile, profile_id)
        if not profile:
            return jsonify({'success': False, 'message': 'Profile not found'}), 404
        profile.status = 'suspended'
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student suspended successfully.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to suspend student: {str(e)}'}), 500

@admin_bp.route('/students/<profile_id>/activate', methods=['POST'])
@jwt_required()
@admin_only
def activate_student(profile_id):
    try:
        profile = db.session.get(Profile, profile_id)
        if not profile:
            return jsonify({'success': False, 'message': 'Profile not found'}), 404
        profile.status = 'active'
        db.session.commit()
        return jsonify({'success': True, 'message': 'Student activated successfully.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to activate student: {str(e)}'}), 500

@admin_bp.route('/uploads', methods=['GET'])
@jwt_required()
@admin_only
def get_uploads():
    import os
    try:
        uploads = DailyUpload.query.order_by(DailyUpload.created_at.desc()).all()
        # fetch profile names
        result = []
        uploads_root = current_app.config.get('UPLOAD_FOLDER')
        for u in uploads:
            profile = Profile.query.filter_by(user_id=u.user_id).first()
            file_url = u.file_url
            if not file_url.startswith('/uploads/'):
                try:
                    rel = os.path.relpath(file_url, uploads_root)
                    # Convert to forward slashes for URL
                    rel = rel.replace('\\', '/')
                    file_url = f"/uploads/{rel}"
                except Exception:
                    pass
            else:
                # Ensure forward slashes in stored URL paths
                file_url = file_url.replace('\\', '/')
            result.append({
                **{
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
                },
                'student_name': profile.full_name if profile else 'Unknown'
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch uploads: {str(e)}'}), 500

@admin_bp.route('/uploads/<upload_id>/status', methods=['POST'])
@jwt_required()
@admin_only
def update_upload_status(upload_id):
    try:
        data = request.get_json() or {}
        status = data.get('status')
        feedback = data.get('feedback')
        if status not in ('reviewed', 'approved', 'rejected'):
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        upload = db.session.get(DailyUpload, upload_id)
        if not upload:
            return jsonify({'success': False, 'message': 'Upload not found'}), 404
        upload.status = status
        upload.admin_feedback = feedback
        upload.reviewed_by = get_jwt_identity()
        upload.reviewed_at = datetime.now(timezone.utc)
        db.session.commit()
        return jsonify({'success': True, 'message': f'Upload marked as {status}.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update upload status: {str(e)}'}), 500


# Feedback management
@admin_bp.route('/feedback', methods=['GET'])
@jwt_required()
@admin_only
def list_feedback():
    try:
        # filters
        category = request.args.get('category')
        rating = request.args.get('rating')
        status = request.args.get('status')
        start = request.args.get('start')
        end = request.args.get('end')

        q = Feedback.query
        if category:
            q = q.filter_by(category=category)
        if rating:
            try:
                q = q.filter_by(rating=int(rating))
            except Exception:
                pass
        if status:
            q = q.filter_by(status=status)
        if start:
            try:
                from datetime import datetime
                s = datetime.fromisoformat(start)
                q = q.filter(Feedback.created_at >= s)
            except Exception:
                pass
        if end:
            try:
                from datetime import datetime
                e = datetime.fromisoformat(end)
                q = q.filter(Feedback.created_at <= e)
            except Exception:
                pass
        fbs = q.order_by(Feedback.created_at.desc()).all()
        result = []
        for f in fbs:
            profile = Profile.query.filter_by(user_id=f.user_id).first()
            attachments = []
            try:
                import json
                attachments = json.loads(f.attachments) if f.attachments else []
            except Exception:
                attachments = []
            result.append({
                'id': f.id,
                'user_id': f.user_id,
                'student_name': profile.full_name if profile else None,
                'student_email': profile.email if profile else None,
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
        return jsonify({'success': False, 'message': f'Failed to list feedback: {str(e)}'}), 500


@admin_bp.route('/feedback/<feedback_id>', methods=['GET'])
@jwt_required()
@admin_only
def get_feedback(feedback_id):
    try:
        f = db.session.get(Feedback, feedback_id)
        if not f:
            return jsonify({'success': False, 'message': 'Feedback not found'}), 404
        profile = Profile.query.filter_by(user_id=f.user_id).first()
        import json
        attachments = json.loads(f.attachments) if f.attachments else []
        return jsonify({
            'id': f.id,
            'user_id': f.user_id,
            'student_name': profile.full_name if profile else None,
            'student_email': profile.email if profile else None,
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
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to fetch feedback: {str(e)}'}), 500


@admin_bp.route('/feedback/<feedback_id>/response', methods=['POST'])
@jwt_required()
@admin_only
def respond_feedback(feedback_id):
    try:
        data = request.get_json() or {}
        response = data.get('response')
        status = data.get('status')
        if not response and not status:
            return jsonify({'success': False, 'message': 'response or status required'}), 400
        f = db.session.get(Feedback, feedback_id)
        if not f:
            return jsonify({'success': False, 'message': 'Feedback not found'}), 404
        if response:
            f.admin_response = response
            f.responded_by = get_jwt_identity()
            f.responded_at = datetime.now(timezone.utc)
        if status:
            if status not in ('in_review', 'resolved', 'rejected', 'submitted'):
                return jsonify({'success': False, 'message': 'Invalid status'}), 400
            f.status = status
        db.session.commit()
        return jsonify({'success': True, 'message': 'Feedback updated'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update feedback: {str(e)}'}), 500


@admin_bp.route('/feedback/<feedback_id>/status', methods=['POST'])
@jwt_required()
@admin_only
def update_feedback_status(feedback_id):
    try:
        data = request.get_json() or {}
        status = data.get('status')
        if status not in ('in_review', 'resolved', 'rejected', 'submitted'):
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        f = db.session.get(Feedback, feedback_id)
        if not f:
            return jsonify({'success': False, 'message': 'Feedback not found'}), 404
        f.status = status
        db.session.commit()
        return jsonify({'success': True, 'message': f'Feedback status set to {status}'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to update feedback status: {str(e)}'}), 500
@admin_bp.route('/students/<profile_id>', methods=['DELETE'])
@jwt_required()
@admin_only
def delete_student(profile_id):
    try:
        profile = db.session.get(Profile, profile_id)
        if not profile:
            return jsonify({'success': False, 'message': 'Profile not found'}), 404

        # Delete uploads from disk and DB
        uploads = DailyUpload.query.filter_by(user_id=profile.user_id).all()
        uploads_root = current_app.config.get('UPLOAD_FOLDER')
        for u in uploads:
            # try to delete file if exists
            try:
                file_path = u.file_url
                if not file_path.startswith('/'):
                    # stored as absolute path
                    path = file_path
                else:
                    # relative URL like /uploads/relpath
                    rel = file_path.replace('/uploads/', '')
                    path = os.path.join(uploads_root, rel.replace('/', os.sep))
                if os.path.exists(path):
                    os.remove(path)
            except Exception:
                pass
            db.session.delete(u)

        # Delete profile and user
        user = db.session.get(User, profile.user_id)
        db.session.delete(profile)
        if user:
            db.session.delete(user)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Student deleted successfully.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete student: {str(e)}'}), 500
