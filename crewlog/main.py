import flask_login
from flask import request, render_template, redirect, url_for, jsonify, send_from_directory
import os

from crewlog import application
from crewlog.auth import auth_dao, auth_api
from crewlog.calendar import calendar_dao, calendar, calendar_api
from crewlog.event import event, event_api, event_dao
from crewlog.admin import admin, admin_api
from crewlog.api import auth_api as api_auth, user_api, calendar_api as api_calendar, event_api as api_event, admin_api as api_admin
from .auth import auth
from flask_login import LoginManager

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(application)


@login_manager.user_loader
def user_loader(id):
    return auth_dao.get_user_by_id(id)


@login_manager.unauthorized_handler
def unauthorized_handler():
    # For API requests, return JSON
    if request.path.startswith('/api/'):
        return jsonify({'message': 'Unauthorized'}), 401
    return redirect(url_for('auth.login', **request.args))


# Register legacy blueprints (for backward compatibility with old templates)
application.register_blueprint(event.bp)
application.register_blueprint(event_api.bp)
application.register_blueprint(calendar.bp)
application.register_blueprint(calendar_api.bp)
application.register_blueprint(auth_api.bp)
application.register_blueprint(auth.bp)
application.register_blueprint(admin.bp)
application.register_blueprint(admin_api.bp)

# Register new JSON API blueprints (CSRF exemption handled in __init__.py)
application.register_blueprint(api_auth.bp)
application.register_blueprint(user_api.bp)
application.register_blueprint(api_calendar.bp)
application.register_blueprint(api_event.bp)
application.register_blueprint(api_admin.bp)


@application.route('/')
def main():
    """Main route - serve React app or legacy template."""
    # Check if React build exists
    static_folder = application.static_folder
    if static_folder and os.path.exists(os.path.join(static_folder, 'index.html')):
        return send_from_directory(static_folder, 'index.html')
    
    # Fallback to legacy template if user is authenticated
    if flask_login.current_user.is_authenticated:
        if request.args.get('share'):
            calendar_dao.accept_share(request.args.get('share'))
            return redirect(url_for('main'))
        return render_template('main.html',
                               calendar=calendar_dao.get_current_calendar(), 
                               current_user=flask_login.current_user)
    
    # Redirect to login
    return redirect(url_for('auth.login'))


# Serve React app for all other routes (client-side routing)
@application.route('/<path:path>')
def serve_react(path):
    """Serve React frontend for client-side routing."""
    static_folder = application.static_folder
    
    if static_folder and os.path.exists(static_folder):
        # Serve static files
        if os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        # Serve index.html for client-side routing
        if os.path.exists(os.path.join(static_folder, 'index.html')):
            return send_from_directory(static_folder, 'index.html')
    
    # Return 404 for unknown paths
    return jsonify({'error': 'Not found'}), 404


@application.context_processor
def utility_processor():
    return dict(roles=auth_dao.get_roles, current_role=auth_dao.get_role, get_weekday=event_dao.get_weekday,
                get_weekday_occurrence=event_dao.get_weekday_occurrence, get_date=event_dao.get_date)
