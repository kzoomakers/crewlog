import os

from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_wtf.csrf import CSRFProtect

# Create Flask app
application = Flask(__name__,
                   static_folder='../frontend/build',
                   static_url_path='')

# Configuration
application.config.from_object('crewlog.default_settings')

# Override with environment variables
if os.environ.get("SECRET_KEY"):
    application.secret_key = os.environ.get("SECRET_KEY")
if os.environ.get("SQLALCHEMY_DATABASE_URI"):
    application.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get("SQLALCHEMY_DATABASE_URI")
if os.environ.get("SQLALCHEMY_TRACK_MODIFICATIONS"):
    application.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.environ.get("SQLALCHEMY_TRACK_MODIFICATIONS")
if os.environ.get("SMTP_MAILBOX"):
    application.config['SMTP_MAILBOX'] = os.environ.get("SMTP_MAILBOX")
if os.environ.get("SMTP_LOGIN"):
    application.config['SMTP_LOGIN'] = os.environ.get("SMTP_LOGIN")
if os.environ.get("SMTP_PASSWORD"):
    application.config['SMTP_PASSWORD'] = os.environ.get("SMTP_PASSWORD")
if os.environ.get("SMTP_SERVER"):
    application.config['SMTP_SERVER'] = os.environ.get("SMTP_SERVER")
if os.environ.get("SMTP_PORT"):
    application.config['SMTP_PORT'] = os.environ.get("SMTP_PORT")
if os.environ.get("APP_URL"):
    application.config['APP_URL'] = os.environ.get("APP_URL")

# Enable CORS for API routes
CORS(application,
     resources={r"/api/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Initialize CSRF protection but disable it globally
# We'll enable it only for non-API routes
csrf = CSRFProtect()
csrf.init_app(application)

# Disable CSRF for all routes by default
application.config['WTF_CSRF_ENABLED'] = False
application.config['WTF_CSRF_CHECK_DEFAULT'] = False

# Initialize database
db = SQLAlchemy(application)
migrate = Migrate(application, db)
