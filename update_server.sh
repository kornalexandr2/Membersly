#!/bin/bash
echo "Stopping containers..."
docker-compose down

echo "Pulling latest changes..."
git pull

echo "Rebuilding and starting containers..."
docker-compose up -d --build

echo "Server updated successfully."