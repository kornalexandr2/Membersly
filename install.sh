#!/bin/bash

# Membersly Fully Automatic Installer (Linux only)
# Usage: curl -sSL https://raw.githubusercontent.com/kornalexandr2/Membersly/master/install.sh | bash

set -e

echo "--- Membersly Comprehensive Auto-Installer ---"

# Function to check and install a package
ensure_package() {
    if ! command -v "$1" &> /dev/null; then
        echo "Installing $1..."
        if [ -x "$(command -v apt-get)" ]; then
            sudo apt-get update -y && sudo apt-get install -y "$2"
        elif [ -x "$(command -v yum)" ]; then
            sudo yum install -y "$2"
        elif [ -x "$(command -v dnf)" ]; then
            sudo dnf install -y "$2"
        else
            echo "Error: Package manager not found. Please install $1 manually."
            exit 1
        fi
    else
        echo "$1 is already installed."
    fi
}

# 1. Ensure Git is installed
ensure_package "git" "git"

# 2. Ensure Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker using official script..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# 3. Ensure Docker Compose is installed
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found. Installing..."
    # Attempt to install docker-compose-plugin (modern)
    if [ -x "$(command -v apt-get)" ]; then
        sudo apt-get update -y && sudo apt-get install -y docker-compose-plugin
    else
        # Fallback to binary download
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    echo "Docker Compose installed."
else
    echo "Docker Compose is already available."
}

# 4. Clone Repository
if [ -d "Membersly" ]; then
    echo "Directory 'Membersly' already exists. Moving into it..."
    cd Membersly
else
    echo "Cloning Membersly repository..."
    git clone https://github.com/kornalexandr2/Membersly.git
    cd Membersly
fi

# 5. Setup Environment
if [ ! -f "backend/.env" ]; then
    echo "Creating default .env file..."
    cp backend/.env.example backend/.env
fi

# 6. Build and Run
echo "Building and launching containers (this may take a few minutes)..."
# Try 'docker compose' first, then 'docker-compose'
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo "--- INSTALLATION COMPLETE ---"
echo "Membersly is now running!"
echo "Admin Login: admin"
echo "Admin Password: admin1234"
echo ""
echo "NOTE: If this was the first time Docker was installed, you might need to re-log or use 'sudo' for future docker commands."
echo "Don't forget to set your BOT_TOKEN in backend/.env"
echo "-----------------------------"
