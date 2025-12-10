"""Admin blueprint for user management and RBAC settings."""
import flask_login
from flask import Blueprint, render_template, flash, redirect, url_for

from crewlog.admin import admin_dao
from crewlog.admin.admin_forms import EmailConfigForm, TestEmailForm

bp = Blueprint("admin", __name__, url_prefix="/admin", template_folder="templates")


@bp.route('/')
@admin_dao.require_admin
def admin_dashboard():
    """Admin dashboard."""
    users = admin_dao.get_all_users()
    email_config = admin_dao.get_email_config()
    return render_template('admin/dashboard.html', users=users, email_config=email_config)


@bp.route('/users')
@admin_dao.require_admin
def users_list():
    """List all users."""
    users = admin_dao.get_all_users()
    return render_template('admin/users.html', users=users)


@bp.route('/users/<user_id>')
@admin_dao.require_admin
def user_detail(user_id):
    """View user details."""
    user = admin_dao.get_user_by_id(user_id)
    if not user:
        flash('User not found.', 'danger')
        return redirect(url_for('admin.users_list'))
    return render_template('admin/user_detail.html', user=user)


@bp.route('/users/<user_id>/edit')
@admin_dao.require_admin
def render_user_edit(user_id):
    """Render user edit modal."""
    user = admin_dao.get_user_by_id(user_id)
    if not user:
        return "User not found", 404
    return render_template('admin/user_edit_modal.html', user=user)


@bp.route('/users/<user_id>/reset-password')
@admin_dao.require_admin
def render_reset_password(user_id):
    """Render reset password modal."""
    user = admin_dao.get_user_by_id(user_id)
    if not user:
        return "User not found", 404
    return render_template('admin/reset_password_modal.html', user=user)


@bp.route('/email')
@admin_dao.require_admin
def email_settings():
    """Email configuration settings."""
    configs = admin_dao.get_all_email_configs()
    active_config = admin_dao.get_email_config()
    form = EmailConfigForm()
    test_form = TestEmailForm()
    return render_template('admin/email_settings.html', 
                         configs=configs, 
                         active_config=active_config,
                         form=form,
                         test_form=test_form)


@bp.route('/email/new')
@admin_dao.require_admin
def render_new_email_config():
    """Render new email config modal."""
    form = EmailConfigForm()
    return render_template('admin/email_config_modal.html', form=form, config=None)


@bp.route('/email/<config_id>/edit')
@admin_dao.require_admin
def render_edit_email_config(config_id):
    """Render edit email config modal."""
    from crewlog.auth.models import EmailConfig
    import uuid
    try:
        config = EmailConfig.query.filter(EmailConfig.id == uuid.UUID(str(config_id))).first()
    except (ValueError, AttributeError):
        return "Configuration not found", 404
    
    if not config:
        return "Configuration not found", 404
    
    form = EmailConfigForm(obj=config)
    return render_template('admin/email_config_modal.html', form=form, config=config)