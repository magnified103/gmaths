#!/bin/bash

# GMATHS Education Website - SSL Certificate Setup
# Run this script after domain is pointing to your EC2 instance

set -e

DOMAIN="yourdomain.com"  # Update this
EMAIL="your-email@example.com"  # Update this

echo "=== Setting up SSL Certificate for GMATHS Education Website ==="

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

# Check if domain is provided
if [ "$DOMAIN" = "yourdomain.com" ] || [ "$EMAIL" = "your-email@example.com" ]; then
    print_error "Please update DOMAIN and EMAIL variables in this script"
    exit 1
fi

print_status "Installing Certbot"
sudo apt update
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symbolic link
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

print_success "Certbot installed"

print_status "Obtaining SSL Certificate"
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

print_success "SSL Certificate obtained"

print_status "Updating Nginx Configuration"
# Update nginx configuration to enable SSL
sudo sed -i 's|# ssl_certificate|ssl_certificate|g' /etc/nginx/sites-available/gmaths
sudo sed -i 's|# ssl_certificate_key|ssl_certificate_key|g' /etc/nginx/sites-available/gmaths
sudo sed -i "s|yourdomain.com|$DOMAIN|g" /etc/nginx/sites-available/gmaths

# Update certificate paths
sudo sed -i "s|/etc/letsencrypt/live/yourdomain.com/|/etc/letsencrypt/live/$DOMAIN/|g" /etc/nginx/sites-available/gmaths

# Enable the HTTP to HTTPS redirect server block
sudo sed -i '/# For initial setup without SSL/,/# and remove the HTTP redirect server block above/d' /etc/nginx/sites-available/gmaths

print_status "Testing Nginx Configuration"
sudo nginx -t

if [ $? -eq 0 ]; then
    print_success "Nginx configuration is valid"
    sudo systemctl start nginx
    sudo systemctl reload nginx
else
    print_error "Nginx configuration has errors!"
    exit 1
fi

print_status "Setting up Certificate Auto-Renewal"
# Create renewal hook
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh > /dev/null << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

# Test automatic renewal
sudo certbot renew --dry-run

print_success "SSL Certificate setup complete!"

echo ""
echo "=== SSL Setup Summary ==="
echo "✓ SSL Certificate obtained for $DOMAIN and www.$DOMAIN"
echo "✓ Nginx configured with SSL"
echo "✓ Auto-renewal configured"
echo ""
echo "🌐 Your secure website is now available at: https://$DOMAIN"
echo ""
echo "Certificate details:"
echo "- Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "- Expires: $(sudo certbot certificates | grep -A 1 $DOMAIN | grep 'Expiry Date')"
echo ""
echo "Useful commands:"
echo "- Check certificate status: sudo certbot certificates"
echo "- Test renewal: sudo certbot renew --dry-run"
echo "- Manual renewal: sudo certbot renew" 