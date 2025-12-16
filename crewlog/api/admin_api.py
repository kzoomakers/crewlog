"""Admin API endpoints for React frontend."""
import flask_login
from flask import Blueprint, request, jsonify

from crewlog import db
from crewlog.admin import admin_dao
from crewlog.auth.models import EmailConfig

bp = Blueprint("api_admin", __name__, url_prefix="/api/v1/admin")


# ============ User Management API ============

@bp.route("/users", methods=['GET'])
@admin_dao.require_admin
def get_users():
    """Get all users."""
    users = admin_dao.get_all_users()
    return jsonify([{
        'id': str(u.id),
        'username': u.username,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'is_admin': u.is_admin,
        'is_verified': u.is_verified,
        'created_at': u.created_at.isoformat() if u.created_at else None
    } for u in users])


@bp.route("/users/<user_id>", methods=['GET'])
@admin_dao.require_admin
def get_user(user_id):
    """Get a specific user."""
    user = admin_dao.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'id': str(user.id),
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_admin': user.is_admin,
        'is_verified': user.is_verified,
        'created_at': user.created_at.isoformat() if user.created_at else None
    })


@bp.route("/users/<user_id>", methods=['PUT', 'POST'])
@admin_dao.require_admin
def update_user(user_id):
    """Update user details."""
    data = request.get_json()
    user = admin_dao.get_user_by_id(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    # Update email if changed
    if 'email' in data and data['email'] != user.username:
        success, message = admin_dao.update_user_email(user_id, data['email'])
        if not success:
            return jsonify({'message': message}), 400
    
    # Update other fields
    if 'firstName' in data:
        user.first_name = data['firstName']
    if 'lastName' in data:
        user.last_name = data['lastName']
    if 'isAdmin' in data:
        user.is_admin = data['isAdmin']
    if 'isVerified' in data:
        user.is_verified = data['isVerified']
    
    db.session.merge(user)
    db.session.commit()
    
    return jsonify({'message': 'User updated successfully'})


@bp.route("/users/<user_id>/toggle-admin", methods=['POST'])
@admin_dao.require_admin
def toggle_admin(user_id):
    """Toggle admin status for a user."""
    user = admin_dao.toggle_admin_status(user_id)
    if user:
        status = "granted" if user.is_admin else "revoked"
        return jsonify({'message': f'Admin privileges {status}'})
    return jsonify({'message': 'User not found'}), 404


@bp.route("/users/<user_id>/reset-password", methods=['POST'])
@admin_dao.require_admin
def reset_password(user_id):
    """Reset user password."""
    data = request.get_json()
    new_password = data.get('newPassword')
    
    if not new_password:
        return jsonify({'message': 'Password is required'}), 400
    
    if admin_dao.reset_user_password(user_id, new_password):
        return jsonify({'message': 'Password reset successfully'})
    return jsonify({'message': 'Failed to reset password'}), 500


@bp.route("/users/<user_id>/send-reset-email", methods=['POST'])
@admin_dao.require_admin
def send_reset_email(user_id):
    """Send password reset email to user."""
    if admin_dao.send_password_reset_email(user_id):
        return jsonify({'message': 'Password reset email sent'})
    return jsonify({'message': 'Failed to send reset email'}), 500


@bp.route("/users/<user_id>/verify", methods=['POST'])
@admin_dao.require_admin
def verify_user(user_id):
    """Manually verify a user."""
    if admin_dao.verify_user(user_id):
        return jsonify({'message': 'User verified successfully'})
    return jsonify({'message': 'Failed to verify user'}), 500


@bp.route("/users/<user_id>/delete", methods=['POST', 'DELETE'])
@admin_dao.require_admin
def delete_user(user_id):
    """Delete a user."""
    success, message = admin_dao.delete_user(user_id)
    if success:
        return jsonify({'message': message})
    return jsonify({'message': message}), 400


# ============ Email Configuration API ============

@bp.route("/email/configs", methods=['GET'])
@admin_dao.require_admin
def get_email_configs():
    """Get all email configurations."""
    configs = admin_dao.get_all_email_configs()
    return jsonify([c.to_dict() for c in configs])


@bp.route("/email/configs", methods=['POST'])
@admin_dao.require_admin
def create_email_config():
    """Create a new email configuration."""
    data = request.get_json()
    provider = data.get('provider', EmailConfig.PROVIDER_SMTP)
    
    config_data = {
        'is_active': data.get('is_active', False),
        'smtp_server': data.get('smtp_server'),
        'smtp_port': data.get('smtp_port'),
        'smtp_login': data.get('smtp_login'),
        'smtp_password': data.get('smtp_password'),
        'smtp_mailbox': data.get('smtp_mailbox'),
        'smtp_use_tls': data.get('smtp_use_tls', True),
        'sendgrid_api_key': data.get('sendgrid_api_key'),
        'sendgrid_from_email': data.get('sendgrid_from_email'),
        'sendgrid_from_name': data.get('sendgrid_from_name'),
        'smtp2go_api_key': data.get('smtp2go_api_key'),
        'smtp2go_sender': data.get('smtp2go_sender'),
    }
    
    config = admin_dao.create_email_config(provider, **config_data)
    return jsonify({'message': 'Email configuration created', 'id': str(config.id)})


@bp.route("/email/configs/<config_id>", methods=['PUT', 'POST'])
@admin_dao.require_admin
def update_email_config(config_id):
    """Update an email configuration."""
    data = request.get_json()
    
    config_data = {
        'provider': data.get('provider'),
        'is_active': data.get('is_active', False),
        'smtp_server': data.get('smtp_server'),
        'smtp_port': data.get('smtp_port'),
        'smtp_login': data.get('smtp_login'),
        'smtp_mailbox': data.get('smtp_mailbox'),
        'smtp_use_tls': data.get('smtp_use_tls', True),
        'sendgrid_from_email': data.get('sendgrid_from_email'),
        'sendgrid_from_name': data.get('sendgrid_from_name'),
        'smtp2go_sender': data.get('smtp2go_sender'),
    }
    
    # Only update passwords if provided
    if data.get('smtp_password'):
        config_data['smtp_password'] = data['smtp_password']
    if data.get('sendgrid_api_key'):
        config_data['sendgrid_api_key'] = data['sendgrid_api_key']
    if data.get('smtp2go_api_key'):
        config_data['smtp2go_api_key'] = data['smtp2go_api_key']
    
    config = admin_dao.update_email_config(config_id, **config_data)
    if config:
        return jsonify({'message': 'Email configuration updated'})
    return jsonify({'message': 'Failed to update configuration'}), 500


@bp.route("/email/configs/<config_id>/delete", methods=['POST', 'DELETE'])
@admin_dao.require_admin
def delete_email_config(config_id):
    """Delete an email configuration."""
    if admin_dao.delete_email_config(config_id):
        return jsonify({'message': 'Email configuration deleted'})
    return jsonify({'message': 'Failed to delete configuration'}), 500


@bp.route("/email/configs/<config_id>/activate", methods=['POST'])
@admin_dao.require_admin
def activate_email_config(config_id):
    """Activate an email configuration."""
    if admin_dao.activate_email_config(config_id):
        return jsonify({'message': 'Email configuration activated'})
    return jsonify({'message': 'Failed to activate configuration'}), 500


@bp.route("/email/test", methods=['POST'])
@admin_dao.require_admin
def test_email():
    """Test email configuration by sending a test email."""
    data = request.get_json()
    to_email = data.get('to_email')
    
    if not to_email:
        return jsonify({'message': 'Email address is required'}), 400
    
    if admin_dao.send_test_email(to_email):
        return jsonify({'message': f'Test email sent to {to_email}'})
    return jsonify({'message': 'Failed to send test email'}), 500


@bp.route("/email/test-connection", methods=['POST'])
@admin_dao.require_admin
def test_connection():
    """Test email connection without sending."""
    success, message = admin_dao.test_email_config()
    if success:
        return jsonify({'message': message})
    return jsonify({'message': message}), 500