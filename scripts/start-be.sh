#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project directory
cd "$PROJECT_DIR"

# Create resources directory if it doesn't exist
mkdir -p crewlog/resources

export FLASK_APP=crewlog.main:application
export FLASK_ENV=development
export SECRET_KEY=your-secret-key
# Don't set SQLALCHEMY_DATABASE_URI - let default_settings.py handle it with absolute path
export APP_URL=http://localhost:3000

# Initialize database
echo "Initializing database..."
flask db upgrade

# Seed demo user (ignore errors if already exists)
echo "Seeding demo user..."
python seed_demo_user.py 2>/dev/null || echo "Demo user may already exist"

# Run Flask server on port 5001 (port 5000 is often used by AirPlay on macOS)
echo "Starting Flask server on http://127.0.0.1:5001"
flask run --port=5001
