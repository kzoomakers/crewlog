# CrewLog - Calendar and Event Management

CrewLog is a calendar and event management application built with a React frontend and Flask API backend.

## Requirements

- **Python**: 3.8+
- **Node.js**: 16+ (for frontend development)
- **npm**: 8+

## Architecture

- **Frontend**: React 18 with React Bootstrap and FullCalendar
- **Backend**: Flask REST API with SQLAlchemy ORM
- **Database**: PostgreSQL (production) or SQLite (development)

## Features

- 📅 Interactive calendar with FullCalendar
- 👥 User authentication and authorization
- 🔗 Calendar sharing with role-based permissions
- 📊 Event reporting
- 🔄 Recurring events support
- 👤 Volunteer/shift management
- 🛠️ Admin dashboard for user and email management

## Quick Start

### Using Docker (Recommended)

#### Production Build
```bash
# Build and run the production container
docker-compose up --build
```

The application will be available at `http://localhost:5002`

#### Development Mode
```bash
# Run with hot-reloading for both frontend and backend
docker-compose -f docker-compose.dev.yml up --build
```

- Frontend (React): `http://localhost:3000`
- Backend (Flask API): `http://localhost:5000`

### Manual Setup with virtualenv

#### Quick Start (Using Script)

The easiest way to run the backend locally:

```bash
# Make the script executable (first time only)
chmod +x scripts/start-be.sh

# Run the backend
bash scripts/start-be.sh
```

This script will:
- Create the database directory if needed
- Set up environment variables
- Initialize the database
- Seed a demo user
- Start the Flask server on `http://localhost:5001`

> **Note for macOS users:** Port 5000 is used by AirPlay Receiver on macOS Monterey+, so we use port 5001 instead.

#### Step-by-Step Setup

If you prefer to set things up manually:

1. Create and activate a virtual environment:
```bash
# Create virtual environment
python -m venv venv

# Activate on macOS/Linux
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create the database directory:
```bash
mkdir -p crewlog/resources
```

4. Set up environment variables:
```bash
# Option A: Copy and edit the example file (recommended)
cp .env.example .env
# Then edit .env with your settings

# Option B: Export variables directly (macOS/Linux)
export FLASK_APP=crewlog.main:application
export FLASK_ENV=development
export SECRET_KEY=your-secret-key-here
# Note: Don't set SQLALCHEMY_DATABASE_URI - the default uses an absolute path that works correctly
export APP_URL=http://localhost:3000

# Option B: Set variables on Windows (PowerShell)
$env:FLASK_APP="crewlog.main:application"
$env:FLASK_ENV="development"
$env:SECRET_KEY="your-secret-key-here"
$env:APP_URL="http://localhost:3000"
```

5. Initialize the database:
```bash
flask db upgrade
python seed_demo_user.py
```

6. Run the Flask server:
```bash
flask run --port=5000
```

The Flask API will be available at `http://localhost:5001`

#### Frontend (React)

**Prerequisites:** Node.js 16+ is required. Check your version with `node -v`.

**Using the script (recommended):**
```bash
bash scripts/start-fe.sh
```

**Or manually:**

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The React app will be available at `http://localhost:3000`

#### Troubleshooting

**"unable to open database file" error:**
- Make sure the `crewlog/resources/` directory exists: `mkdir -p crewlog/resources`
- Don't override `SQLALCHEMY_DATABASE_URI` - the default settings use an absolute path that works correctly

**".env files present" warning:**
- This is just a tip. The app includes `python-dotenv` so `.env` files are automatically loaded

**Node.js "Library not loaded" or ICU errors (macOS):**
- This means your Node.js version is too old or corrupted
- The frontend requires Node.js 16+
- Fix options:
  1. Download Node.js 18+ from https://nodejs.org/
  2. Use nvm: `brew install nvm && nvm install 18 && nvm use 18`
  3. Use Homebrew: `brew uninstall node@12 && brew install node@18`
- After installing, verify with: `node -v` (should show v16+ or v18+)

## Project Structure

```
crewlog/
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.js           # Main app component
│   └── package.json
├── crewlog/                  # Flask backend
│   ├── api/                  # JSON API endpoints
│   ├── auth/                 # Authentication module
│   ├── calendar/             # Calendar module
│   ├── event/                # Event module
│   ├── admin/                # Admin module
│   ├── app.py                # Main Flask application
│   └── database.py           # Database utilities
├── migrations/               # Database migrations
├── Dockerfile                # Production Dockerfile
├── Dockerfile.dev            # Development Dockerfile
├── docker-compose.yml        # Production compose
├── docker-compose.dev.yml    # Development compose
└── requirements.txt          # Python dependencies
```

## API Endpoints

### Authentication
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/forgot` - Request password reset
- `POST /api/v1/auth/restore/:token` - Reset password

### Users
- `PUT /api/v1/users/` - Update profile
- `POST /api/v1/users/password` - Change password
- `POST /api/v1/users/resend_email` - Resend verification email

### Calendars
- `POST /api/v1/calendars/` - Create calendar
- `DELETE /api/v1/calendars/` - Delete calendar
- `POST /api/v1/calendars/default` - Set default calendar
- `POST /api/v1/calendars/share` - Generate share link
- `PUT /api/v1/calendars/share` - Update share role
- `GET /api/v1/calendars/shares` - Get all shares
- `POST /api/v1/calendars/settings` - Save settings

### Events
- `GET /api/v1/calendars/events/` - Get events
- `POST /api/v1/calendars/events/` - Create/update event
- `DELETE /api/v1/calendars/events/` - Delete event
- `GET /api/v1/calendars/events/:id/details` - Get event details
- `POST /api/v1/calendars/events/shifts` - Save shifts
- `POST /api/v1/calendars/events/recurrent` - Update recurrent event

### Admin
- `GET /api/v1/admin/users` - Get all users
- `PUT /api/v1/admin/users/:id` - Update user
- `POST /api/v1/admin/users/:id/reset-password` - Reset password
- `POST /api/v1/admin/users/:id/verify` - Verify user
- `DELETE /api/v1/admin/users/:id/delete` - Delete user
- `GET /api/v1/admin/email/configs` - Get email configs
- `POST /api/v1/admin/email/configs` - Create email config
- `POST /api/v1/admin/email/test` - Send test email

## User Roles

- **Owner (100)**: Full access including delete calendar
- **Manager (50)**: Can edit events and manage shares
- **User (10)**: Can view and sign up for shifts

## Demo Account

After running `seed_demo_user.py`, you can login with:
- Email: `demo@example.com`
- Password: `demo123`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | Required |
| `SQLALCHEMY_DATABASE_URI` | Database connection string | SQLite |
| `APP_URL` | Application URL for emails | http://localhost:3000 |
| `SMTP_SERVER` | SMTP server hostname | - |
| `SMTP_PORT` | SMTP server port | - |
| `SMTP_LOGIN` | SMTP login username | - |
| `SMTP_PASSWORD` | SMTP login password | - |
| `SMTP_MAILBOX` | From email address | - |

## License

MIT License
