"""User API endpoints for React frontend."""
import flask_login
from flask import Blueprint, request, jsonify
from flask_login import login_required

from crewlog.auth import auth_dao

bp = Blueprint("api_user", __name__, url_prefix="/api/v1/users")


@bp.route("/", methods=['PUT', 'POST'])
@login_required
def update_user():
    """Update current user profile."""
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    first_name = data.get('firstName', '').strip()
    last_name = data.get('lastName', '').strip()
    
    if not first_name:
        return jsonify({'message': 'First name is required'}), 400
    if not last_name:
        return jsonify({'message': 'Last name is required'}), 400
    
    if auth_dao.update_user(first_name=first_name, last_name=last_name):
        return jsonify({'message': 'Profile updated successfully'})
    
    return jsonify({'message': 'Failed to update profile'}), 500


@bp.route("/resend_email", methods=['POST'])
@login_required
def resend_email():
    """Resend verification email."""
    user = flask_login.current_user
    auth_dao.verify_email(user)
    return jsonify({'message': 'Verification email sent'})


@bp.route('/password', methods=['POST'])
@login_required
def change_password():
    """Change user password."""
    data = request.get_json()
    old_password = data.get('oldPassword')
    new_password = data.get('newPassword')
    
    if not old_password or not new_password:
        return jsonify({'message': 'Old and new passwords are required'}), 400
    
    if auth_dao.change_password(old_password, new_password):
        return jsonify({'message': 'Password changed successfully'})
    
    return jsonify({'message': 'Current password is incorrect'}), 400