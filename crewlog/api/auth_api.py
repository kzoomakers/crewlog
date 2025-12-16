"""Authentication API endpoints for React frontend."""
import flask_login
from flask import Blueprint, request, jsonify
from flask_login import login_required, logout_user

from crewlog.auth import auth_dao
from crewlog.calendar import calendar_dao

bp = Blueprint("api_auth", __name__, url_prefix="/api/v1/auth")


def get_user_data(user):
    """Get user data for JSON response."""
    if not user:
        return None
    return {
        'id': str(user.id),
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_admin': user.is_admin,
        'is_verified': user.is_verified
    }


def get_calendars_data(user):
    """Get user's calendars data for JSON response."""
    if not user:
        return []
    calendars = []
    for role in user.roles:
        calendars.append({
            'calendar_id': str(role.calendar_id),
            'calendar_name': role.calendar.name,
            'type': role.type,
            'is_default': role.is_default
        })
    return calendars


def get_current_calendar_data(user):
    """Get current calendar data for JSON response."""
    if not user:
        return None
    for role in user.roles:
        if role.is_default:
            return {
                'id': str(role.calendar_id),
                'name': role.calendar.name,
                'settings': role.calendar.settings
            }
    return None


@bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user."""
    if flask_login.current_user.is_authenticated:
        return jsonify({
            'user': get_user_data(flask_login.current_user),
            'calendars': get_calendars_data(flask_login.current_user),
            'currentCalendar': get_current_calendar_data(flask_login.current_user)
        })
    return jsonify({'user': None, 'calendars': [], 'currentCalendar': None}), 401


@bp.route('/login', methods=['POST'])
def login():
    """Login user."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
    
    user = auth_dao.get_user(email)
    if user and user.check_password(password):
        flask_login.login_user(user, remember=True)
        return jsonify({
            'user': get_user_data(user),
            'calendars': get_calendars_data(user),
            'currentCalendar': get_current_calendar_data(user)
        })
    
    return jsonify({'message': 'Incorrect login or/and password'}), 401


@bp.route('/register', methods=['POST'])
def register():
    """Register new user."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    
    if not all([email, password, first_name, last_name]):
        return jsonify({'message': 'All fields are required'}), 400
    
    if auth_dao.get_user(email) is not None:
        return jsonify({'message': 'Such user already exists'}), 400
    
    user = auth_dao.add_user(
        username=email, 
        password=password, 
        first_name=first_name,
        last_name=last_name
    )
    flask_login.login_user(user, remember=True)
    
    return jsonify({
        'user': get_user_data(user),
        'calendars': get_calendars_data(user),
        'currentCalendar': get_current_calendar_data(user)
    })


@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout user."""
    logout_user()
    return jsonify({'message': 'Logged out successfully'})


@bp.route('/forgot', methods=['POST'])
def forgot_password():
    """Send password reset email."""
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
    
    auth_dao.password_email(email)
    return jsonify({'message': 'If the email exists, a reset link has been sent'})


@bp.route('/restore/<token>', methods=['POST'])
def restore_password(token):
    """Restore password with token."""
    data = request.get_json()
    new_password = data.get('password')
    
    if not new_password:
        return jsonify({'message': 'Password is required'}), 400
    
    if auth_dao.restore_password(token=token, new_password=new_password):
        user = flask_login.current_user
        return jsonify({
            'user': get_user_data(user),
            'calendars': get_calendars_data(user),
            'currentCalendar': get_current_calendar_data(user)
        })
    
    return jsonify({'message': 'Restoration link got expired. Please request a new one.'}), 400


@bp.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    """Verify email with token."""
    auth_dao.confirm_verify_email(token)
    return jsonify({'message': 'Email verified successfully'})