#!/bin/bash
set -e

echo "========================================="
echo "Starting GlobalMitra Backend"
echo "========================================="

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
max_attempts=30
attempt=0

until /opt/mssql-tools18/bin/sqlcmd -S "${DB_HOST}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C -Q "SELECT 1" > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "ERROR: SQL Server did not become ready in time"
    exit 1
  fi
  echo "SQL Server is unavailable - attempt $attempt/$max_attempts"
  sleep 2
done

echo "✓ SQL Server is ready!"

# Create database if it doesn't exist
echo "Checking if database '${DB_NAME}' exists..."
/opt/mssql-tools18/bin/sqlcmd -S "${DB_HOST}" -U "${DB_USER}" -P "${DB_PASSWORD}" -C -Q "
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${DB_NAME}')
BEGIN
  CREATE DATABASE [${DB_NAME}];
  PRINT 'Database ${DB_NAME} created successfully';
END
ELSE
BEGIN
  PRINT 'Database ${DB_NAME} already exists';
END
" || echo "Warning: Could not check/create database"

echo "✓ Database check complete"

# Run Django migrations
echo "Running Django migrations..."
python manage.py migrate --noinput

echo "✓ Migrations complete"

# Create superuser if it doesn't exist
echo "Checking for superuser..."
python manage.py shell << 'END'
from django.contrib.auth import get_user_model
import os

User = get_user_model()
username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin123')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f'✓ Superuser "{username}" created successfully')
else:
    print(f'✓ Superuser "{username}" already exists')
END

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "========================================="
echo "✓ Initialization complete!"
echo "========================================="
echo "Starting Django development server..."
echo ""

# Start the Django development server
exec python manage.py runserver 0.0.0.0:8000