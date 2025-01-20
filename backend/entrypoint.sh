#!/bin/bash

set -e

# Debug: Print environment variables
echo "DEBUG: $DEBUG"
echo "DJANGO_SECRET_KEY: $DJANGO_SECRET_KEY"
echo "DB_NAME: $DB_NAME"
echo "DB_USER: $DB_USER"
echo "DB_PASSWORD: $DB_PASSWORD"

# Check if manage.py exists
if [ ! -f "/app/manage.py" ]; then
    echo "manage.py not found. Creating Django project..."
    django-admin startproject transcendence .
    python manage.py startapp core
fi

# Copy settings.py to the transcendence directory
if [ -f "/app/settings.py" ]; then
    echo "Copying settings.py to transcendence directory..."
    cp settings.py /app/transcendence/settings.py
else
    echo "settings.py not found in /app directory."
fi

cp urls.py /app/transcendence/urls.py
cp core-health_check.py /app/core/health_check.py
cp core-models.py /app/core/models.py
cp core-serializers.py /app/core/serializers.py
cp core-leaderboard.py /app/core/leaderboard.py
cp core-views.py /app/core/views.py
cp core-urls.py /app/core/urls.py
cp core-admin.py /app/core/admin.py
cp core-utils.py /app/core/utils.py

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Check avatar files
python manage.py collectstatic --noinput
echo "Listing /app/static/images:"
ls -l /app/static/images
echo "Listing /app/media/avatars:"
ls -l /app/media/avatars


cp settings-second.py /app/transcendence/settings.py
cp urls-second.py /app/transcendence/urls.py
python manage.py makemigrations
python manage.py migrate
# echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'password') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'password') if not User.objects.filter(username='admin').exists() else print('Superuser already exists.')" | python manage.py shell
# Start server
python manage.py runserver 0.0.0.0:8000