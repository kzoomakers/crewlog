#!/usr/bin/env python3
"""
Script to seed the database with demo user credentials.
Run this after the application starts for the first time.
"""
import sys
import os

# Add the parent directory to the path so we can import togger
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from togger import application, db
# Import all models to ensure SQLAlchemy relationships are properly configured
from togger.auth.models import User, Role
from togger.calendar.models import Calendar, Share
from togger.event.models import Event, Shift
from togger.auth.auth_dao import get_user, add_user

def seed_demo_user():
    """Create demo user if it doesn't exist."""
    with application.app_context():
        demo_email = "demo@github.com"
        demo_password = "demo"
        
        # Check if demo user already exists
        existing_user = get_user(demo_email)
        if existing_user:
            print(f"Demo user '{demo_email}' already exists.")
            return
        
        # Create demo user
        print(f"Creating demo user '{demo_email}'...")
        user = add_user(
            username=demo_email,
            password=demo_password,
            first_name="Demo",
            last_name="User"
        )
        
        # Mark as verified to avoid email verification requirement
        user.is_verified = True
        db.session.merge(user)
        db.session.commit()
        
        print(f"Demo user created successfully!")
        print(f"  Email: {demo_email}")
        print(f"  Password: {demo_password}")

if __name__ == "__main__":
    seed_demo_user()