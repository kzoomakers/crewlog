#!/bin/bash
set -e

echo "Waiting for application to be ready..."
sleep 5

echo "Running database migrations..."
docker-compose exec crewlog flask db upgrade

echo "Database initialization complete!"