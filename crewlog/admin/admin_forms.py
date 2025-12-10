"""Forms for admin module."""
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, SelectField, IntegerField, HiddenField
from wtforms.validators import DataRequired, Email, Optional, NumberRange


class UserEditForm(FlaskForm):
    """Form for editing user details."""
    user_id = HiddenField('User ID')
    email = StringField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[DataRequired()])
    last_name = StringField('Last Name', validators=[DataRequired()])
    is_admin = BooleanField('Admin')
    is_verified = BooleanField('Verified')
    submit = SubmitField('Save Changes')


class ResetPasswordForm(FlaskForm):
    """Form for resetting user password."""
    user_id = HiddenField('User ID')
    new_password = PasswordField('New Password', validators=[DataRequired()])
    submit = SubmitField('Reset Password')


class EmailConfigForm(FlaskForm):
    """Form for email configuration."""
    provider = SelectField('Provider', choices=[
        ('smtp', 'Standard SMTP'),
        ('sendgrid', 'SendGrid API'),
        ('smtp2go', 'SMTP2GO API')
    ], validators=[DataRequired()])
    is_active = BooleanField('Active', default=True)
    
    # SMTP fields
    smtp_server = StringField('SMTP Server', validators=[Optional()])
    smtp_port = IntegerField('SMTP Port', validators=[Optional(), NumberRange(min=1, max=65535)])
    smtp_login = StringField('SMTP Login', validators=[Optional()])
    smtp_password = PasswordField('SMTP Password', validators=[Optional()])
    smtp_mailbox = StringField('From Email (Mailbox)', validators=[Optional()])
    smtp_use_tls = BooleanField('Use TLS', default=True)
    
    # SendGrid fields
    sendgrid_api_key = PasswordField('SendGrid API Key', validators=[Optional()])
    sendgrid_from_email = StringField('From Email', validators=[Optional()])
    sendgrid_from_name = StringField('From Name', validators=[Optional()])
    
    # SMTP2GO fields
    smtp2go_api_key = PasswordField('SMTP2GO API Key', validators=[Optional()])
    smtp2go_sender = StringField('Sender Email', validators=[Optional()])
    
    submit = SubmitField('Save Configuration')


class TestEmailForm(FlaskForm):
    """Form for sending test email."""
    to_email = StringField('Send Test Email To', validators=[DataRequired(), Email()])
    submit = SubmitField('Send Test Email')