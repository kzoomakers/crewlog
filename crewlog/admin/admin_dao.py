"""Data access layer for admin operations."""
import uuid
from functools import wraps

import flask_login
from flask import flash, current_app

from crewlog import db
from crewlog.auth.models import User, EmailConfig
from crewlog.auth.email_service import get_email_service


def require_admin(function):
    """Decorator to require admin privileges."""
    @wraps(function)
    def wrapper(*args, **kwargs):
        if not flask_login.current_user.is_authenticated:
            return current_app.login_manager.unauthorized()
        if not flask_login.current_user.is_admin:
            flash('Admin privileges required.', 'danger')
            return current_app.login_manager.unauthorized()
        return function(*args, **kwargs)
    return wrapper


def is_admin():
    """Check if current user is an admin."""
    return flask_login.current_user.is_authenticated and flask_login.current_user.is_admin


# ============ User Management ============

def get_all_users():
    """Get all users in the system."""
    return User.query.order_by(User.created_at.desc()).all()


def get_user_by_id(user_id):
    """Get a user by their ID."""
    try:
        return User.query.filter(User.id == uuid.UUID(str(user_id))).first()
    except (ValueError, AttributeError):
        return None


def toggle_admin_status(user_id):
    """Toggle admin status for a user."""
    user = get_user_by_id(user_id)
    if user:
        user.is_admin = not user.is_admin
        db.session.merge(user)
        db.session.commit()
        return user
    return None


def set_admin_status(user_id, is_admin):
    """Set admin status for a user."""
    user = get_user_by_id(user_id)
    if user:
        user.is_admin = is_admin
        db.session.merge(user)
        db.session.commit()
        return user
    return None


def reset_user_password(user_id, new_password):
    """Reset a user's password (admin action)."""
    user = get_user_by_id(user_id)
    if user:
        user.set_password(new_password)
        db.session.merge(user)
        db.session.commit()
        return True
    return False


def update_user_email(user_id, new_email):
    """Update a user's email address (admin action)."""
    user = get_user_by_id(user_id)
    if user:
        # Check if email is already taken
        existing = User.query.filter(User.username == new_email).first()
        if existing and str(existing.id) != str(user_id):
            return False, "Email already in use"
        
        user.username = new_email
        user.is_verified = False  # Require re-verification
        db.session.merge(user)
        db.session.commit()
        return True, "Email updated successfully"
    return False, "User not found"


def delete_user(user_id):
    """Delete a user (admin action)."""
    user = get_user_by_id(user_id)
    if user:
        # Don't allow deleting yourself
        if str(user.id) == str(flask_login.current_user.id):
            return False, "Cannot delete your own account"
        
        db.session.delete(user)
        db.session.commit()
        return True, "User deleted successfully"
    return False, "User not found"


def verify_user(user_id):
    """Manually verify a user's email (admin action)."""
    user = get_user_by_id(user_id)
    if user:
        user.is_verified = True
        db.session.merge(user)
        db.session.commit()
        return True
    return False


def send_password_reset_email(user_id):
    """Send password reset email to a user (admin action)."""
    user = get_user_by_id(user_id)
    if user:
        from crewlog.auth.auth_dao import password_email
        password_email(user.username)
        return True
    return False


# ============ Email Configuration ============

def get_email_config():
    """Get the active email configuration."""
    return EmailConfig.get_active_config()


def get_all_email_configs():
    """Get all email configurations."""
    return EmailConfig.query.order_by(EmailConfig.created_at.desc()).all()


def create_email_config(provider, **kwargs):
    """Create a new email configuration."""
    # Deactivate all existing configs if this one is active
    if kwargs.get('is_active', True):
        EmailConfig.query.update({'is_active': False})
    
    config = EmailConfig(
        provider=provider,
        is_active=kwargs.get('is_active', True),
        smtp_server=kwargs.get('smtp_server'),
        smtp_port=kwargs.get('smtp_port'),
        smtp_login=kwargs.get('smtp_login'),
        smtp_password=kwargs.get('smtp_password'),
        smtp_mailbox=kwargs.get('smtp_mailbox'),
        smtp_use_tls=kwargs.get('smtp_use_tls', True),
        sendgrid_api_key=kwargs.get('sendgrid_api_key'),
        sendgrid_from_email=kwargs.get('sendgrid_from_email'),
        sendgrid_from_name=kwargs.get('sendgrid_from_name'),
        smtp2go_api_key=kwargs.get('smtp2go_api_key'),
        smtp2go_sender=kwargs.get('smtp2go_sender'),
        created_by_id=flask_login.current_user.id if flask_login.current_user.is_authenticated else None
    )
    
    db.session.add(config)
    db.session.commit()
    return config


def update_email_config(config_id, **kwargs):
    """Update an email configuration."""
    try:
        config = EmailConfig.query.filter(EmailConfig.id == uuid.UUID(str(config_id))).first()
    except (ValueError, AttributeError):
        return None
    
    if not config:
        return None
    
    # If activating this config, deactivate others
    if kwargs.get('is_active', False) and not config.is_active:
        EmailConfig.query.filter(EmailConfig.id != config.id).update({'is_active': False})
    
    # Update fields
    for key, value in kwargs.items():
        if hasattr(config, key) and value is not None:
            setattr(config, key, value)
    
    db.session.merge(config)
    db.session.commit()
    return config


def delete_email_config(config_id):
    """Delete an email configuration."""
    try:
        config = EmailConfig.query.filter(EmailConfig.id == uuid.UUID(str(config_id))).first()
    except (ValueError, AttributeError):
        return False
    
    if config:
        db.session.delete(config)
        db.session.commit()
        return True
    return False


def activate_email_config(config_id):
    """Activate a specific email configuration."""
    try:
        config = EmailConfig.query.filter(EmailConfig.id == uuid.UUID(str(config_id))).first()
    except (ValueError, AttributeError):
        return False
    
    if config:
        # Deactivate all others
        EmailConfig.query.update({'is_active': False})
        config.is_active = True
        db.session.merge(config)
        db.session.commit()
        return True
    return False


def test_email_config(config_id=None):
    """Test an email configuration."""
    service = get_email_service()
    return service.test_connection()


def send_test_email(to_email):
    """Send a test email to verify configuration."""
    service = get_email_service()
    subject = "[CrewLog] Test Email"
    content = "This is a test email from CrewLog to verify your email configuration is working correctly."
    html_content = """
    <html>
    <body>
        <h2>CrewLog Test Email</h2>
        <p>This is a test email from CrewLog to verify your email configuration is working correctly.</p>
        <p>If you received this email, your email settings are configured properly!</p>
    </body>
    </html>
    """
    return service.send_email(to_email, subject, content, html_content)