import uuid
from datetime import date, timedelta, datetime

from flask import current_app
from flask_login import UserMixin
from itsdangerous import URLSafeSerializer, BadSignature
from sqlalchemy import UniqueConstraint
from werkzeug.security import generate_password_hash, check_password_hash

from crewlog import db
from crewlog.database import GUID


def _gen_valid_until():
    valid_until = date.today() + timedelta(days=2)
    return valid_until


def _get_auth_serializer(salt):
    """Get a URLSafeSerializer with the current app's secret key."""
    return URLSafeSerializer(current_app.config['SECRET_KEY'], salt)


class User(db.Model, UserMixin):

    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    alias_id = db.Column(GUID(), default=uuid.uuid4, nullable=False, unique=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    roles = db.relationship('Role', backref='User', cascade="all,delete", lazy=True)

    def set_password(self, password):
        self.password = generate_password_hash(password)
        self.alias_id = uuid.uuid4()

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def generate_validate_token(self):
        auth_v = _get_auth_serializer("validate")
        return auth_v.dumps({"username": self.username, "valid_until": _gen_valid_until().strftime('%d-%m-%Y')})

    def check_validate_token(self, token):
        auth_v = _get_auth_serializer("validate")
        try:
            data = auth_v.loads(token)
        except BadSignature:
            return False
        self.username = data['username']
        return datetime.now() < datetime.strptime(data["valid_until"], '%d-%m-%Y')

    def generate_password_token(self):
        auth_p = _get_auth_serializer("password")
        return auth_p.dumps({"username": self.username, "valid_until": _gen_valid_until().strftime('%d-%m-%Y')})

    def check_password_token(self, token):
        auth_p = _get_auth_serializer("password")
        try:
            data = auth_p.loads(token)
        except BadSignature:
            return False
        self.username = data['username']
        return datetime.now() < datetime.strptime(data["valid_until"], '%d-%m-%Y')

    def get_id(self):
        return self.alias_id


class Role(db.Model):
    OWNER = 100
    MANAGER = 50
    USER = 10

    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    type = db.Column(db.Integer, nullable=False)
    calendar_id = db.Column(GUID(), db.ForeignKey('calendar.id'), nullable=False)
    calendar = db.relationship("Calendar")
    user_id = db.Column(GUID(), db.ForeignKey('user.id'), nullable=False)
    user = db.relationship("User")
    is_default = db.Column(db.Boolean, default=False, nullable=False)
    UniqueConstraint(calendar_id, user_id, name='role_cal_user_key')

    def has_role(self, role_type):
        return self.type >= role_type


class EmailConfig(db.Model):
    """Email configuration model for storing SMTP/SendGrid/SMTP2GO settings."""
    
    # Email provider types
    PROVIDER_SMTP = 'smtp'
    PROVIDER_SENDGRID = 'sendgrid'
    PROVIDER_SMTP2GO = 'smtp2go'
    
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)
    provider = db.Column(db.String(20), nullable=False, default=PROVIDER_SMTP)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Standard SMTP settings
    smtp_server = db.Column(db.String(255), nullable=True)
    smtp_port = db.Column(db.Integer, nullable=True)
    smtp_login = db.Column(db.String(255), nullable=True)
    smtp_password = db.Column(db.String(255), nullable=True)
    smtp_mailbox = db.Column(db.String(255), nullable=True)
    smtp_use_tls = db.Column(db.Boolean, default=True, nullable=False)
    
    # SendGrid settings
    sendgrid_api_key = db.Column(db.String(255), nullable=True)
    sendgrid_from_email = db.Column(db.String(255), nullable=True)
    sendgrid_from_name = db.Column(db.String(255), nullable=True)
    
    # SMTP2GO settings
    smtp2go_api_key = db.Column(db.String(255), nullable=True)
    smtp2go_sender = db.Column(db.String(255), nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by_id = db.Column(GUID(), db.ForeignKey('user.id'), nullable=True)
    created_by = db.relationship("User")
    
    def __repr__(self):
        return f'<EmailConfig {self.provider} active={self.is_active}>'
    
    @classmethod
    def get_active_config(cls):
        """Get the currently active email configuration."""
        return cls.query.filter_by(is_active=True).first()
    
    def to_dict(self):
        """Convert config to dictionary (excluding sensitive data)."""
        return {
            'id': str(self.id),
            'provider': self.provider,
            'is_active': self.is_active,
            'smtp_server': self.smtp_server,
            'smtp_port': self.smtp_port,
            'smtp_login': self.smtp_login,
            'smtp_mailbox': self.smtp_mailbox,
            'smtp_use_tls': self.smtp_use_tls,
            'sendgrid_from_email': self.sendgrid_from_email,
            'sendgrid_from_name': self.sendgrid_from_name,
            'smtp2go_sender': self.smtp2go_sender,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
