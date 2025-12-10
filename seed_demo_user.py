#!/usr/bin/env python3
"""
Script to seed the database with demo user credentials.
Run this after the application starts for the first time.
"""
import sys
import os

# Add the parent directory to the path so we can import crewlog
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from crewlog import application, db
# Import all models to ensure SQLAlchemy relationships are properly configured
from crewlog.auth.models import User, Role
from crewlog.calendar.models import Calendar, Share
from crewlog.event.models import Event, Shift
from crewlog.auth.auth_dao import get_user, add_user

def seed_demo_user():
    """Create demo user if it doesn't exist, or update existing to be admin."""
    with application.app_context():
        demo_email = "demo@github.com"
        demo_password = "demo"
        
        # Check if demo user already exists
        existing_user = get_user(demo_email)
        if existing_user:
            # Update existing user to be admin if not already
            if not existing_user.is_admin:
                existing_user.is_admin = True
                existing_user.is_verified = True
                db.session.merge(existing_user)
                db.session.commit()
                print(f"Demo user '{demo_email}' updated to admin.")
            else:
                print(f"Demo user '{demo_email}' already exists and is admin.")
            return
        
        # Create demo user
        print(f"Creating demo user '{demo_email}'...")
        user = add_user(
            username=demo_email,
            password=demo_password,
            first_name="Demo",
            last_name="User"
        )
        
        # Mark as verified and admin
        user.is_verified = True
        user.is_admin = True
        db.session.merge(user)
        db.session.commit()
        
        print(f"Demo user created successfully!")
        print(f"  Email: {demo_email}")
        print(f"  Password: {demo_password}")
        print(f"  Admin: Yes")

if __name__ == "__main__":
    seed_demo_user()