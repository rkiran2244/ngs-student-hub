from .db import db
from datetime import datetime, timezone
import uuid

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(255), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255), default='student')  # student or admin
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete')
    uploads = db.relationship('DailyUpload', backref='user', cascade='all, delete')

class Profile(db.Model):
    __tablename__ = 'profiles'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    username = db.Column(db.String, unique=True, nullable=True)
    full_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, nullable=False)
    contact_number = db.Column(db.String, nullable=True)
    college_name = db.Column(db.String, nullable=True)
    college_id = db.Column(db.String, nullable=True)  # Keep for backward compatibility
    city = db.Column(db.String, nullable=True)
    pincode = db.Column(db.String, nullable=True)
    college_email = db.Column(db.String, nullable=True)
    course_name = db.Column(db.String, nullable=True)
    course_mode = db.Column(db.String, nullable=True)
    course_duration = db.Column(db.String, nullable=True)
    status = db.Column(db.String, default='pending')
    avatar_url = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DailyUpload(db.Model):
    __tablename__ = 'daily_uploads'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    file_name = db.Column(db.String, nullable=False)
    file_url = db.Column(db.String, nullable=False)
    file_type = db.Column(db.String, nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    upload_date = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    description = db.Column(db.String, nullable=True)
    status = db.Column(db.String, default='pending')
    admin_feedback = db.Column(db.String, nullable=True)
    reviewed_by = db.Column(db.String, nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Feedback(db.Model):
    __tablename__ = 'feedbacks'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    category = db.Column(db.String, nullable=False)  # e.g., Training, Platform, Mentor, Support, Course Content, Other
    subject = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    # Allow fractional ratings (e.g., 4.5)
    rating = db.Column(db.Float, nullable=True)
    attachments = db.Column(db.Text, nullable=True)  # JSON-encoded list of file URLs
    status = db.Column(db.String, default='submitted')  # submitted, in_review, resolved, rejected
    admin_response = db.Column(db.String, nullable=True)
    responded_by = db.Column(db.String, nullable=True)
    responded_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String, nullable=False, index=True)
    otp = db.Column(db.String, nullable=False)
    purpose = db.Column(db.String, nullable=False, default='password')  # 'password' or 'username'
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

