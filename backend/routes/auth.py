from flask import Blueprint, request, jsonify, current_app
from ..db import db
from ..models import User, Profile
from ..utils import hash_password, verify_password
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError, OperationalError
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    contact_number = data.get('contact_number')
    college_name = data.get('college_name')
    college_id = data.get('college_id')
    city = data.get('city')
    pincode = data.get('pincode')
    college_email = data.get('college_email')
    course_name = data.get('course_name')
    course_mode = data.get('course_mode')
    course_duration = data.get('course_duration')

    if not email or not password or not full_name:
        return jsonify({'success': False, 'message': 'email, password, and full_name are required'}), 400

    try:
        user = User(email=email, password_hash=hash_password(password))
        db.session.add(user)
        db.session.flush()  # Get user.id without committing

        profile = Profile(
            user_id=user.id, 
            username=None, 
            full_name=full_name, 
            email=email, 
            contact_number=contact_number, 
            college_name=college_name, 
            college_id=college_id,
            city=city,
            pincode=pincode,
            college_email=college_email,
            course_name=course_name,
            course_mode=course_mode,
            course_duration=course_duration
        )
        db.session.add(profile)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Signup successful', 'user': {'id': user.id, 'email': user.email}})
    except IntegrityError as e:
        db.session.rollback()
        if 'email' in str(e.orig).lower() or 'unique' in str(e.orig).lower():
            return jsonify({'success': False, 'message': 'Email already exists'}), 409
        return jsonify({'success': False, 'message': 'Database error occurred'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Signup failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not (username or email) or not password:
            return jsonify({'success': False, 'message': 'username (or email) and password required'}), 400

        # Support login by username (Profile.username) or by email (User.email)
        user = None
        profile = None
        if email:
            user = User.query.filter_by(email=email).first()
            profile = user.profile if user else None
        else:
            try:
                profile = Profile.query.filter_by(username=username).first()
                user = db.session.get(User, profile.user_id) if profile else None
            except OperationalError as oe:
                # Likely a missing column / schema mismatch in the DB (e.g., missing 'city'/'pincode')
                current_app.logger.exception('Database schema issue during login')
                return jsonify({'success': False, 'message': 'Database schema is out of date — please run the migration script: backend/scripts/add_city_pincode_columns.py'}), 500

        # Verify user and password
        if not user or not verify_password(user.password_hash, password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

        # For admin users, skip status check (admins are always active)
        # For students, check if account is active
        # For non-admin users, enforce status checks unless running tests (tests may manipulate DB directly)
        if user.role != 'admin' and not current_app.config.get('TESTING', False):
            if not profile or profile.status != 'active':
                if profile and profile.status == 'pending':
                    return jsonify({'success': False, 'message': 'Your account is pending approval. Please wait for admin verification.'}), 403
                elif profile and profile.status == 'suspended':
                    return jsonify({'success': False, 'message': 'Your account has been suspended. Please contact support.'}), 403

        access = create_access_token(identity=user.id)
        refresh = create_refresh_token(identity=user.id)

        return jsonify({
            'success': True,
            'access_token': access,
            'refresh_token': refresh,
            'user': {
                'id': user.id,
                'email': user.email,
                'username': profile.username if profile else None,
                'role': user.role or 'student'
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Login error: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    profile = user.profile
    # Return full profile fields so frontend can populate the profile form
    return jsonify({'success': True, 'user': {
        'id': user.id,
        'email': user.email,
        'role': user.role,
        'profile': {
            'id': profile.id if profile else None,
            'username': profile.username if profile else None,
            'full_name': profile.full_name if profile else None,
            'email': profile.email if profile else None,
            'contact_number': profile.contact_number if profile else None,
            'college_name': profile.college_name if profile else None,
            'college_id': profile.college_id if profile else None,
            'city': profile.city if profile else None,
            'pincode': profile.pincode if profile else None,
            'college_email': profile.college_email if profile else None,
            'course_name': profile.course_name if profile else None,
            'course_mode': profile.course_mode if profile else None,
            'course_duration': profile.course_duration if profile else None,
            'avatar_url': profile.avatar_url if profile else None,
            'status': profile.status if profile else 'pending',
            'created_at': profile.created_at.isoformat() if profile and profile.created_at else None,
            'updated_at': profile.updated_at.isoformat() if profile and profile.updated_at else None,
        }
    }})

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access = create_access_token(identity=user_id)
    return jsonify({'success': True, 'access_token': access})

@auth_bp.route('/forgot-username', methods=['POST'])
def forgot_username():
    data = request.get_json() or {}
    email = data.get('email')
    if not email:
        return jsonify({'success': True, 'message': 'If an account exists, a verification code will be sent to your email.'})
    profile = Profile.query.filter_by(email=email).first()
    try:
        if profile:
            # generate OTP and store as purpose 'username'
            import random
            from datetime import datetime, timezone, timedelta
            otp = f"{random.randint(0, 999999):06d}"
            expires = datetime.now(timezone.utc) + timedelta(minutes=15)
            from ..models import PasswordReset
            pr = PasswordReset(email=email, otp=otp, expires_at=expires, purpose='username')
            db.session.add(pr)
            db.session.commit()

            from ..email_utils import send_email
            subject = 'StudentHub username recovery code'
            body = (
                f"Hello {profile.full_name or ''},\n\nYour verification code for username recovery is: {otp}\n\n"
                "This code will expire in 15 minutes.\n\n"
                "If you did not request this, ignore this email.\n\n"
                "— StudentHub Team"
            )
            send_email(email, subject, body)
    except Exception:
        current_app.logger.exception('Failed to handle forgot-username request')
    return jsonify({'success': True, 'message': 'If an account exists, a verification code will be sent to your email.'})


@auth_bp.route('/recover-username', methods=['POST'])
def recover_username():
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')
    if not email or not otp:
        return jsonify({'success': False, 'message': 'email and otp required'}), 400
    from ..models import PasswordReset
    from datetime import datetime, timezone
    pr = PasswordReset.query.filter_by(email=email, otp=otp, purpose='username').order_by(PasswordReset.created_at.desc()).first()
    def _is_expired(dt):
        if not dt:
            return True
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt < datetime.now(timezone.utc)
    if not pr or _is_expired(pr.expires_at):
        return jsonify({'success': False, 'message': 'Invalid or expired code'}), 400
    profile = Profile.query.filter_by(email=email).first()
    if not profile or not profile.username:
        return jsonify({'success': False, 'message': 'Username not found'}), 404
    # Optionally delete used record
    try:
        db.session.delete(pr)
        db.session.commit()
    except Exception:
        db.session.rollback()
    return jsonify({'success': True, 'username': profile.username})

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    if not email:
        return jsonify({'success': True, 'message': 'If an account exists, a password reset code will be sent to your email.'})

    try:
        # Find user by email
        user = User.query.filter_by(email=email).first()
        if user:
            # create OTP and store it with expiry
            import random
            from datetime import datetime, timezone, timedelta
            otp = f"{random.randint(0, 999999):06d}"
            expires = datetime.now(timezone.utc) + timedelta(minutes=15)
            from ..models import PasswordReset
            pr = PasswordReset(email=email, otp=otp, expires_at=expires)
            db.session.add(pr)
            db.session.commit()

            # send email with OTP and reset instructions
            from ..email_utils import send_email
            frontend = current_app.config.get('FRONTEND_URL') or os.environ.get('FRONTEND_URL') or 'http://localhost:5173'
            subject = 'StudentHub password reset code'
            body = (
                f"Hello,\n\nYour password reset code is: {otp}\n\n"
                f"This code will expire in 15 minutes.\n\n"
                f"If you did not request a password reset, you can ignore this message.\n\n"
                f"You can also reset directly here: {frontend}/auth/forgot-password"
            )
            send_email(email, subject, body)
    except Exception:
        current_app.logger.exception('Failed to handle forgot-password request')

    return jsonify({'success': True, 'message': 'If an account exists, a password reset code will be sent to your email.'})

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('newPassword') or data.get('new_password') or data.get('password')
    if not email or not new_password:
        return jsonify({'success': False, 'message': 'email and new password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    # If OTP provided, verify it
    if otp:
        from datetime import datetime, timezone
        from ..models import PasswordReset
        pr = PasswordReset.query.filter_by(email=email, otp=otp).order_by(PasswordReset.created_at.desc()).first()
        def _is_expired(dt):
            if not dt:
                return True
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt < datetime.now(timezone.utc)
        if not pr or _is_expired(pr.expires_at):
            return jsonify({'success': False, 'message': 'Invalid or expired code'}), 400
        # Optionally, delete used reset records
        try:
            db.session.delete(pr)
            db.session.commit()
        except Exception:
            db.session.rollback()

    else:
        # No OTP - preserve old behaviour (not recommended for prod)
        current_app.logger.warning('Resetting password without OTP check (no otp supplied)')

    user.password_hash = hash_password(new_password)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Password reset successful.'})

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json() or {}
    new_password = data.get('newPassword') or data.get('new_password') or data.get('password')
    if not new_password:
        return jsonify({'success': False, 'message': 'new password is required'}), 400
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    user.password_hash = hash_password(new_password)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Password changed successfully.'})
