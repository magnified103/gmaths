#!/bin/bash

# GMATHS Education Website - Main Deployment Script
# Run this script after setting up the EC2 instance

set -e

# Configuration
APP_DIR="/var/www/gmaths"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
REPO_URL="https://github.com/pieberrykinnie/gmaths-education-website.git"  # Update this
DOMAIN="ec2-3-27-173-225.ap-southeast-2.compute.amazonaws.com"  # Update this

echo "=== GMATHS Education Website Deployment ==="
echo "Deploying to: $APP_DIR"

# Function to print colored output
print_status() {
    echo -e "\n\033[1;34m=== $1 ===\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then
    print_error "Don't run this script as root! Run as ubuntu user."
    exit 1
fi

# Ensure the application directory exists and has proper ownership
print_status "Setting up application directory"
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory"
    sudo mkdir -p "$APP_DIR"
    sudo chown -R "$USER:$USER" "$APP_DIR"
    print_success "Application directory created and ownership set"
else
    # Ensure proper ownership even if directory exists
    sudo chown -R "$USER:$USER" "$APP_DIR"
    print_success "Application directory ownership verified"
fi

print_status "Cloning Repository"
if [ -d "$APP_DIR/.git" ]; then
    print_status "Updating existing repository"
    cd "$APP_DIR"
    git pull origin main
elif [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
    print_status "Removing existing directory contents"
    rm -rf "$APP_DIR"/*
    print_status "Cloning fresh repository"
    git clone "$REPO_URL" /tmp/gmaths-temp
    cp -r /tmp/gmaths-temp/* "$APP_DIR/"
    rm -rf /tmp/gmaths-temp
    cd "$APP_DIR"
else
    print_status "Cloning fresh repository"
    git clone "$REPO_URL" /tmp/gmaths-temp
    cp -r /tmp/gmaths-temp/* "$APP_DIR/"
    rm -rf /tmp/gmaths-temp
    cd "$APP_DIR"
fi

print_success "Repository ready"

print_status "Setting up Backend"
cd "$BACKEND_DIR"

# Install backend dependencies
print_status "Installing backend dependencies"
pnpm install

# Generate Prisma client
print_status "Generating Prisma client"
pnpm db:generate

# Run database migrations
print_status "Running database migrations"
pnpm db:push

# Seed the database
print_status "Seeding database"
pnpm db:seed

# Build backend
print_status "Building backend"
pnpm build

print_success "Backend setup complete"

print_status "Setting up Frontend"
cd "$FRONTEND_DIR"

# Install frontend dependencies
print_status "Installing frontend dependencies"
pnpm install

# Build frontend
print_status "Building frontend for production"
pnpm build

print_success "Frontend build complete"

print_status "Configuring Nginx"
# Copy Nginx configuration
sudo cp ../deploy/nginx-gmaths.conf /etc/nginx/sites-available/gmaths

# Update domain in Nginx config (no replacement needed as domain is already correct)

# Enable site
sudo ln -sf /etc/nginx/sites-available/gmaths /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration"
sudo nginx -t

if [ $? -eq 0 ]; then
    print_success "Nginx configuration is valid"
    sudo systemctl reload nginx
else
    print_error "Nginx configuration has errors!"
    exit 1
fi

print_status "Setting up PM2 for Backend"
cd "$BACKEND_DIR"

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'gmaths-backend',
    script: 'dist/src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/gmaths-backend-error.log',
    out_file: '/var/log/pm2/gmaths-backend-out.log',
    log_file: '/var/log/pm2/gmaths-backend.log',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R "$USER:$USER" /var/log/pm2

# Start application with PM2
print_status "Starting backend with PM2"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME"

print_success "Backend started with PM2"

print_status "Creating Upload Directory"
sudo mkdir -p /var/www/gmaths/uploads
sudo chown -R www-data:www-data /var/www/gmaths/uploads
sudo chmod 755 /var/www/gmaths/uploads

print_status "Setting Proper Permissions"
# Set ownership for web files (keep user ownership for app files)
sudo chown -R "$USER:www-data" "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

# Set proper permissions for frontend dist (nginx needs to read these)
sudo chown -R www-data:www-data "$FRONTEND_DIR/dist"
sudo chmod -R 755 "$FRONTEND_DIR/dist"

print_success "Deployment Complete!"

echo ""
echo "=== Deployment Summary ==="
echo "✓ Repository cloned/updated"
echo "✓ Backend built and started with PM2"
echo "✓ Frontend built and served by Nginx"
echo "✓ Database configured"
echo "✓ Nginx configured and running"
echo ""
echo "🌐 Your application should be available at: http://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Point your domain to this EC2 instance's IP address"
echo "2. Set up SSL certificates (recommended: Let's Encrypt)"
echo "3. Configure monitoring and backups"
echo ""
echo "Useful commands:"
echo "- Check backend status: pm2 status"
echo "- View backend logs: pm2 logs gmaths-backend"
echo "- Restart backend: pm2 restart gmaths-backend"
echo "- Check nginx status: sudo systemctl status nginx"
echo "- View nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "Important files to configure:"
echo "- Backend environment: $BACKEND_DIR/.env"
echo "- Nginx configuration: /etc/nginx/sites-available/gmaths" 