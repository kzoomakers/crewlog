# CrewLog
CrewLog is an easy to use sign up sheet for volunteers. Also can be used for various events planning like football matches
or going out with friends.

# demo
URL: https://crewlog-app.herokuapp.com (can take few moments for a cold boot)
user: demo@github.com
pass: demo

Registration doesn't require an email verification (but it will still annoy you because this is the only way to recover lost password).
# features
* Plan events. Even recurrent ones. Resize and drag em how you want
* Sign up yourself or your friend for a shift
* Share calendar with your collective/family/friends
* Count number of shifts per person for a given period
* Control an access
* Different colors for events based on number of people signed up: gray - nobody yet, orange - one person, green - two or more
* Mobile friendly
* Powered by Python, Flask, Flask-Login, Fullcalendar, rrule, WTForms, SQLAlchemy and many more

# how to use
## create an event
1. Click the *Edit* button to activate an edit mode
2. Select the date to create an event (you can select multiple days, resize and drag events)
3. Put in the event title, description and recurrent preference
4. Click the *Save changes* button
5. Click the *Stop* button to go back to the View mode
## sign up for an event
1. Select an event
2. Press the *I'm in* button or manually put a name into the field
3. Click the *Save changes* button

# screenshots
![week view](/screenshots/week_view.png?raw=true "Week View")
![event view](/screenshots/event_view.png?raw=true "Event View")
![create view](/screenshots/create_view.png?raw=true "Create View")
![report_view](/screenshots/report_view.png?raw=true "Report View")

# Local Development with Docker Compose

## Prerequisites
- Docker and Docker Compose installed on your system
- Git (to clone the repository)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd crewlog
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and update the following variables:
   - `SECRET_KEY`: Change to a secure random string (required for production)
   - `SQLALCHEMY_DATABASE_URI`: Database connection string (default: SQLite)
   - `APP_URL`: Your application URL (default: http://localhost:5001)
   - `SMTP_*`: Email server settings (optional, for password recovery)

3. **Build and start the application**:
   ```bash
   docker-compose up --build
   ```
   
   The application will be available at: **http://localhost:5001**

4. **Database migrations** are automatically applied on startup. If you need to run them manually:
   ```bash
   docker-compose exec crewlog flask db upgrade
   ```

## Configuration Options

### Database Options

**SQLite (Default)**:
```env
SQLALCHEMY_DATABASE_URI=sqlite:///resources/database.db
```
Data persists in `./crewlog/resources/database.db`

**PostgreSQL**:
```env
SQLALCHEMY_DATABASE_URI=postgresql://username:password@host:5432/database_name
```

### Email Configuration (Optional)

For password recovery and email verification, configure SMTP settings:
```env
SMTP_LOGIN=your-email@example.com
SMTP_MAILBOX=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_PORT=587
SMTP_SERVER=smtp.example.com
```

## Docker Commands

**Start the application**:
```bash
docker-compose up
```

**Start in detached mode** (background):
```bash
docker-compose up -d
```

**Stop the application**:
```bash
docker-compose down
```

**View logs**:
```bash
docker-compose logs -f crewlog
```

**Rebuild after code changes**:
```bash
docker-compose up --build
```

**Access the container shell**:
```bash
docker-compose exec crewlog bash
```

## Development Notes

- The SQLite database file is persisted in `./crewlog/resources/` via Docker volume
- The application runs on port 5001 by default (configurable in [`docker-compose.yml`](docker-compose.yml:11))
- Hot reload is enabled in development mode
- Tested with SQLite and PostgreSQL databases

## Heroku Deployment

The repository contains a [`Procfile`](Procfile:1) for Heroku deployment. The Heroku-specific configuration has been preserved for backward compatibility.

# TODO
* add LDAP auth
* ????
