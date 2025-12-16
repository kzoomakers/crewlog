"""Admin API endpoints for user management and email configuration."""
import flask_login
from flask import Blueprint, request, flash, url_for, jsonify
from werkzeug.utils import redirect

from crewlog import db
from crewlog.admin import admin_dao
from crewlog.auth.models import EmailConfig

bp = Blueprint("admin_api", __name__, url_prefix="/legacy/admin")


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
    user = admin_dao.get_user_by_id(user_id)
    if not user:
        flash('User not found.', 'danger')
        return redirect(url_for('admin.users_list'))
    
    # Update fields
    if 'email' in request.form:
        new_email = request.form['email']
        if new_email != user.username:
            success, message = admin_dao.update_user_email(user_id, new_email)
            if not success:
                flash(message, 'danger')
                return redirect(url_for('admin.users_list'))
    
    if 'firstName' in request.form:
        user.first_name = request.form['firstName']
    if 'lastName' in request.form:
        user.last_name = request.form['lastName']
    
    # Handle admin checkbox
    is_admin = 'isAdmin' in request.form
    user.is_admin = is_admin
    
    # Handle verified checkbox
    is_verified = 'isVerified' in request.form
    user.is_verified = is_verified
    
    db.session.merge(user)
    db.session.commit()
    
    flash('User updated successfully.', 'success')
    return redirect(url_for('admin.users_list'))


@bp.route("/users/<user_id>/toggle-admin", methods=['POST'])
@admin_dao.require_admin
def toggle_admin(user_id):
    """Toggle admin status for a user."""
    user = admin_dao.toggle_admin_status(user_id)
    if user:
        status = "granted" if user.is_admin else "revoked"
        flash(f'Admin privileges {status} for {user.username}.', 'success')
    else:
        flash('User not found.', 'danger')
    return redirect(url_for('admin.users_list'))


@bp.route("/users/<user_id>/reset-password", methods=['POST'])
@admin_dao.require_admin
def reset_password(user_id):
    """Reset user password."""
    new_password = request.form.get('newPassword')
    if not new_password:
        flash('Password is required.', 'danger')
        return redirect(url_for('admin.users_list'))
    
    if admin_dao.reset_user_password(user_id, new_password):
        flash('Password reset successfully.', 'success')
    else:
        flash('Failed to reset password.', 'danger')
    return redirect(url_for('admin.users_list'))


@bp.route("/users/<user_id>/send-reset-email", methods=['POST'])
@admin_dao.require_admin
def send_reset_email(user_id):
    """Send password reset email to user."""
    if admin_dao.send_password_reset_email(user_id):
        flash('Password reset email sent.', 'success')
    else:
        flash('Failed to send reset email.', 'danger')
    return redirect(url_for('admin.users_list'))


@bp.route("/users/<user_id>/verify", methods=['POST'])
@admin_dao.require_admin
def verify_user(user_id):
    """Manually verify a user."""
    if admin_dao.verify_user(user_id):
        flash('User verified successfully.', 'success')
    else:
        flash('Failed to verify user.', 'danger')
    return redirect(url_for('admin.users_list'))


@bp.route("/users/<user_id>/delete", methods=['POST', 'DELETE'])
@admin_dao.require_admin
def delete_user(user_id):
    """Delete a user."""
    success, message = admin_dao.delete_user(user_id)
    if success:
        flash(message, 'success')
    else:
        flash(message, 'danger')
    return redirect(url_for('admin.users_list'))


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
    provider = request.form.get('provider', EmailConfig.PROVIDER_SMTP)
    
    config_data = {
        'is_active': 'is_active' in request.form,
        'smtp_server': request.form.get('smtp_server'),
        'smtp_port': int(request.form.get('smtp_port')) if request.form.get('smtp_port') else None,
        'smtp_login': request.form.get('smtp_login'),
        'smtp_password': request.form.get('smtp_password'),
        'smtp_mailbox': request.form.get('smtp_mailbox'),
        'smtp_use_tls': 'smtp_use_tls' in request.form,
        'sendgrid_api_key': request.form.get('sendgrid_api_key'),
        'sendgrid_from_email': request.form.get('sendgrid_from_email'),
        'sendgrid_from_name': request.form.get('sendgrid_from_name'),
        'smtp2go_api_key': request.form.get('smtp2go_api_key'),
        'smtp2go_sender': request.form.get('smtp2go_sender'),
    }
    
    config = admin_dao.create_email_config(provider, **config_data)
    flash('Email configuration created successfully.', 'success')
    return redirect(url_for('admin.email_settings'))


@bp.route("/email/configs/<config_id>", methods=['PUT', 'POST'])
@admin_dao.require_admin
def update_email_config(config_id):
    """Update an email configuration."""
    config_data = {
        'provider': request.form.get('provider'),
        'is_active': 'is_active' in request.form,
        'smtp_server': request.form.get('smtp_server'),
        'smtp_port': int(request.form.get('smtp_port')) if request.form.get('smtp_port') else None,
        'smtp_login': request.form.get('smtp_login'),
        'smtp_mailbox': request.form.get('smtp_mailbox'),
        'smtp_use_tls': 'smtp_use_tls' in request.form,
        'sendgrid_from_email': request.form.get('sendgrid_from_email'),
        'sendgrid_from_name': request.form.get('sendgrid_from_name'),
        'smtp2go_sender': request.form.get('smtp2go_sender'),
    }
    
    # Only update passwords if provided
    if request.form.get('smtp_password'):
        config_data['smtp_password'] = request.form.get('smtp_password')
    if request.form.get('sendgrid_api_key'):
        config_data['sendgrid_api_key'] = request.form.get('sendgrid_api_key')
    if request.form.get('smtp2go_api_key'):
        config_data['smtp2go_api_key'] = request.form.get('smtp2go_api_key')
    
    config = admin_dao.update_email_config(config_id, **config_data)
    if config:
        flash('Email configuration updated successfully.', 'success')
    else:
        flash('Failed to update email configuration.', 'danger')
    return redirect(url_for('admin.email_settings'))


@bp.route("/email/configs/<config_id>/delete", methods=['POST', 'DELETE'])
@admin_dao.require_admin
def delete_email_config(config_id):
    """Delete an email configuration."""
    if admin_dao.delete_email_config(config_id):
        flash('Email configuration deleted.', 'success')
    else:
        flash('Failed to delete email configuration.', 'danger')
    return redirect(url_for('admin.email_settings'))


@bp.route("/email/configs/<config_id>/activate", methods=['POST'])
@admin_dao.require_admin
def activate_email_config(config_id):
    """Activate an email configuration."""
    if admin_dao.activate_email_config(config_id):
        flash('Email configuration activated.', 'success')
    else:
        flash('Failed to activate email configuration.', 'danger')
    return redirect(url_for('admin.email_settings'))


@bp.route("/email/test", methods=['POST'])
@admin_dao.require_admin
def test_email():
    """Test email configuration by sending a test email."""
    to_email = request.form.get('to_email')
    if not to_email:
        flash('Email address is required.', 'danger')
        return redirect(url_for('admin.email_settings'))
    
    if admin_dao.send_test_email(to_email):
        flash(f'Test email sent to {to_email}.', 'success')
    else:
        flash('Failed to send test email. Check your configuration.', 'danger')
    return redirect(url_for('admin.email_settings'))


@bp.route("/email/test-connection", methods=['POST'])
@admin_dao.require_admin
def test_connection():
    """Test email connection without sending."""
    success, message = admin_dao.test_email_config()
    if success:
        flash(message, 'success')
    else:
        flash(message, 'danger')
    return redirect(url_for('admin.email_settings'))