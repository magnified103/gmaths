#!/bin/bash

# GMATHS AWS Deployment Script
# This script builds and deploys the application to AWS EC2

set -e # Exit on any error

echo "🚀 Starting GMATHS deployment..."

# Configuration
PROJECT_ROOT="/var/www/gmaths"
BACKUP_DIR="/var/backups/gmaths"
LOG_FILE="/var/log/gmaths/deploy.log"

# Create directories if they don't exist
sudo mkdir -p "$PROJECT_ROOT"
sudo mkdir -p "$BACKUP_DIR"
sudo mkdir -p "/var/log/gmaths"
sudo mkdir -p "/etc/ssl/certs"
sudo mkdir -p "/etc/ssl/private"

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | sudo tee -a "$LOG_FILE"
}

log "Starting deployment process..."

# Check if running as proper user
if [ "$EUID" -eq 0 ]; then
    log "WARNING: Running as root. Consider using ubuntu user with sudo."
fi

# Update system packages
log "Updating system packages..."
sudo apt-get update -y

# Install required packages if not present
log "Installing required packages..."
sudo apt-get install -y nginx postgresql-client redis-tools curl wget git

# Install Node.js 20 if not present
if ! command -v node &> /dev/null; then
    log "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    log "Installing pnpm..."
    sudo npm install -g pnpm
fi

# Install PM2 if not present
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2..."
    sudo npm install -g pm2
    sudo pm2 startup
fi

# Backup current deployment if exists
if [ -d "$PROJECT_ROOT" ]; then
    log "Creating backup of current deployment..."
    sudo cp -r "$PROJECT_ROOT" "$BACKUP_DIR/gmaths-$(date +%Y%m%d-%H%M%S)"
fi

# Stop current PM2 processes
log "Stopping current backend processes..."
sudo pm2 stop gmaths-backend || true
sudo pm2 delete gmaths-backend || true

# Clone/update repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    log "Cloning repository..."
    sudo git clone https://github.com/gmaths-education/gmaths-education-website.git "$PROJECT_ROOT"
else
    log "Updating repository..."
    cd "$PROJECT_ROOT"
    sudo git fetch origin
    sudo git reset --hard origin/main
fi

cd "$PROJECT_ROOT"

# Set proper ownership
sudo chown -R ubuntu:ubuntu "$PROJECT_ROOT"

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile

# Build frontend
log "Building frontend..."
cd frontend
pnpm build
cd ..

# Build backend
log "Building backend..."
cd backend
pnpm build
cd ..

# Setup Nginx configuration
log "Configuring Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/gmaths
sudo ln -sf /etc/nginx/sites-available/gmaths /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start backend with PM2
log "Starting backend with PM2..."
cd backend
sudo pm2 start ../deploy/ecosystem.config.js --env production

# Restart Nginx
log "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify health
log "Verifying deployment health..."
sleep 10

# Check backend health
if curl -f http://localhost:3000/health &> /dev/null; then
    log "✅ Backend health check passed"
else
    log "❌ Backend health check failed"
    exit 1
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx is running"
else
    log "❌ Nginx is not running"
    exit 1
fi

# Save PM2 process list
sudo pm2 save

log "🎉 Deployment completed successfully!"
log "Frontend is served at: https://gmaths.edu.vn"
log "Backend API available at: https://gmaths.edu.vn/api"
log "Health check: https://gmaths.edu.vn/health"

echo ""
echo "🎉 GMATHS deployment completed!"
echo "📝 Check logs at: $LOG_FILE"
echo "🔧 PM2 status: sudo pm2 status"
echo "🌐 Site: https://gmaths.edu.vn" 