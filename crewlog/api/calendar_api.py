"""Calendar API endpoints for React frontend."""
import flask_login
from flask import Blueprint, request, jsonify
from flask_login import login_required

from crewlog.auth import auth_dao
from crewlog.auth.models import Role
from crewlog.calendar import calendar_dao

bp = Blueprint("api_calendar", __name__, url_prefix="/api/v1/calendars")


@bp.route('/', methods=['POST'])
@login_required
def create_calendar():
    """Create a new calendar."""
    data = request.get_json()
    calendar_name = data.get('calendarName')
    
    if not calendar_name:
        return jsonify({'message': 'Calendar name is required'}), 400
    
    calendar_dao.create(calendar_name)
    return jsonify({'message': 'Calendar created successfully'})


@bp.route('/', methods=['DELETE'])
@login_required
@auth_dao.has_role(Role.OWNER)
def delete_calendar():
    """Delete current calendar."""
    calendar_dao.delete()
    return jsonify({'message': 'Calendar deleted successfully'})


@bp.route('/default', methods=['POST'])
@login_required
def set_default():
    """Set default calendar."""
    data = request.get_json()
    calendar_id = data.get('calendarId')
    
    if not calendar_id:
        return jsonify({'message': 'Calendar ID is required'}), 400
    
    calendar_dao.set_default(calendar_id)
    
    # Get updated calendar data
    for role in flask_login.current_user.roles:
        if str(role.calendar_id) == calendar_id:
            return jsonify({
                'calendar': {
                    'id': str(role.calendar_id),
                    'name': role.calendar.name,
                    'settings': role.calendar.settings
                }
            })
    
    return jsonify({'message': 'Calendar not found'}), 404


@bp.route('/share', methods=['POST'])
@login_required
@auth_dao.has_role(Role.MANAGER)
def create_share():
    """Generate share link."""
    data = request.get_json()
    role_name = int(data.get('roleName', 10))
    expiration_days = int(data.get('expirationDays', 7))
    no_expiration = data.get('noExpiration', False)
    
    share = calendar_dao.share_calendar(role_name, expiration_days, no_expiration)
    if share:
        from flask import request as flask_request
        url = flask_request.host_url + "?share=" + share.generate_token()
        return jsonify(url)
    
    return jsonify({'message': 'Failed to generate share link'}), 500


@bp.route('/share', methods=['PUT'])
@login_required
@auth_dao.has_role(Role.OWNER)
def change_share():
    """Change user's role in calendar."""
    data = request.get_json()
    user_id = data.get('userId')
    role_name = int(data.get('roleNameShares'))
    
    if not user_id or not role_name:
        return jsonify({'message': 'User ID and role are required'}), 400
    
    calendar_dao.change_share(user_id, role_name)
    return jsonify({'message': 'Role updated successfully'})


@bp.route('/shares', methods=['GET'])
@login_required
@auth_dao.has_role(Role.OWNER)
def get_shares():
    """Get all shares for current calendar."""
    current_role = auth_dao.get_role()
    if not current_role:
        return jsonify([])
    
    shares = []
    for role in current_role.calendar.roles:
        shares.append({
            'user_id': str(role.user_id),
            'username': role.user.username,
            'first_name': role.user.first_name,
            'last_name': role.user.last_name,
            'role_type': role.type
        })
    
    return jsonify(shares)


@bp.route('/settings', methods=['POST'])
@login_required
@auth_dao.has_role(Role.OWNER)
def save_settings():
    """Save calendar settings."""
    data = request.get_json()
    settings = {
        'scrollTime': data.get('scrollTime', '16:00:00'),
        'firstDay': data.get('firstDay', '1'),
        'slotMinTime': data.get('slotMinTime', '09:00:00'),
        'slotMaxTime': data.get('slotMaxTime', '22:00:00'),
        'nextDayThreshold': data.get('nextDayThreshold', '00:00:00')
    }
    
    if calendar_dao.save_settings(settings):
        return jsonify({'message': 'Settings saved successfully'})
    
    return jsonify({'message': 'Failed to save settings'}), 500