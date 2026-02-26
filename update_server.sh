#!/bin/bash
echo "Stopping containers..."
docker-compose down

echo "Pulling latest changes..."
git pull origin main

echo "Rebuilding and starting containers..."
docker-compose up -d --build

echo "Applying migrations..."
docker-compose exec backend alembic upgrade head

echo "Server updated successfully."