FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/togger/resources

# Expose port
EXPOSE 5000

# Run database migrations, seed demo user, and start the application
CMD flask db upgrade && python seed_demo_user.py && gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 togger.main:application
