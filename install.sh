#!/bin/bash

# Membersly One-Line Installer
# Usage: curl -sSL https://raw.githubusercontent.com/kornalexandr2/Membersly/master/install.sh | bash

set -e

echo "--- Membersly Auto-Installer ---"

# 1. Check for Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed. Please install Docker first." >&2
  exit 1
fi

# 2. Check for Docker Compose
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Error: Docker Compose is not installed." >&2
  exit 1
fi

# 3. Clone Repository
if [ -d "Membersly" ]; then
  echo "Directory 'Membersly' already exists. Moving into it..."
  cd Membersly
else
  echo "Cloning repository..."
  git clone https://github.com/kornalexandr2/Membersly.git
  cd Membersly
fi

# 4. Setup Environment
if [ ! -f "backend/.env" ]; then
  echo "Creating default .env file..."
  cp backend/.env.example backend/.env
  echo "NOTE: Default .env created. You should edit it later to set your BOT_TOKEN."
fi

# 5. Build and Run
echo "Building and launching containers (this may take a few minutes)..."
docker-compose up -d --build

echo ""
echo "--- INSTALLATION COMPLETE ---"
echo "Membersly is now running!"
echo "API: http://localhost:8000"
echo "Frontend: http://localhost"
echo "Admin Login: admin"
echo "Admin Password: admin1234"
echo ""
echo "Don't forget to set your BOT_TOKEN in backend/.env and restart: docker-compose restart"
echo "-----------------------------"
