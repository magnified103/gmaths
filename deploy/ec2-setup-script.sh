#!/bin/bash

# GMATHS Education Website - EC2 Deployment Script
# Run this script on a fresh Ubuntu 22.04 LTS EC2 instance

set -e

echo "=== GMATHS Education Website Deployment Script ==="
echo "Setting up Ubuntu 22.04 LTS for production deployment..."

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "Installing essential packages..."
sudo apt install -y curl wget unzip git build-essential software-properties-common

# Install Node.js 18 LTS (recommended for production)
echo "Installing Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally
echo "Installing pnpm..."
sudo npm install -g pnpm@10.11.0

# Install PM2 for process management
echo "Installing PM2..."
sudo npm install -g pm2

# Install PostgreSQL 14
echo "Installing PostgreSQL 14..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Redis (optional but recommended for session management)
echo "Installing Redis..."
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE gmaths_production;
CREATE USER gmaths_user WITH ENCRYPTED PASSWORD 'secure_production_password_change_this';
GRANT ALL PRIVILEGES ON DATABASE gmaths_production TO gmaths_user;
ALTER DATABASE gmaths_production OWNER TO gmaths_user;
\q
EOF

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /var/www/gmaths
sudo chown -R $USER:$USER /var/www/gmaths

# Configure firewall
echo "Configuring UFW firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "=== Basic server setup complete! ==="
echo "Next steps:"
echo "1. Clone your repository to /var/www/gmaths"
echo "2. Configure environment variables"
echo "3. Build and deploy applications"
echo "4. Configure Nginx" 