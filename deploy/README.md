# Deployment Setup Guide

This guide explains how to properly deploy the GMATHS Education Website to avoid permission issues.

## Prerequisites

- Ubuntu 22.04 LTS server (EC2 instance recommended)
- SSH access to the server
- Non-root user with sudo privileges (typically `ubuntu` on EC2)

## Deployment Steps

### Step 1: Initial Server Setup

**Run this FIRST** on your fresh server:

```bash
# SSH into your server
ssh -i your-key.pem ubuntu@your-server-ip

# Download and run the EC2 setup script
wget https://raw.githubusercontent.com/your-repo/gmaths-education-website/main/deploy/ec2-setup-script.sh
chmod +x ec2-setup-script.sh
./ec2-setup-script.sh
```

This script will:
- Install Node.js, pnpm, PM2, PostgreSQL, Nginx, Redis
- Create `/var/www/gmaths` directory with proper permissions
- Configure basic services

### Step 2: Application Deployment

**After the setup script completes**, run the deployment script:

```bash
# Clone the repository temporarily
git clone https://github.com/your-repo/gmaths-education-website.git /tmp/gmaths-setup
cd /tmp/gmaths-setup

# Make deployment script executable
chmod +x deploy/deploy.sh

# Run deployment script (as ubuntu user, NOT root)
./deploy/deploy.sh
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp deploy/env.production.example /var/www/gmaths/backend/.env

# Edit with your actual values
nano /var/www/gmaths/backend/.env
```

## Why This Order Matters

The permission issues occur because:

1. **`/var/www/` is owned by root** - Regular users can't write to it
2. **The deployment script refuses to run as root** - For security reasons
3. **Directory must be created and ownership changed first** - This is what the EC2 setup script does

## Alternative: User Home Directory Deployment

If you prefer to avoid `/var/www/`, you can deploy to your home directory instead:

```bash
# Edit deploy.sh and change:
APP_DIR="/home/ubuntu/gmaths"
# instead of:
APP_DIR="/var/www/gmaths"
```

This avoids permission issues entirely but requires updating Nginx configuration paths.

## Troubleshooting

### Permission Denied Errors
- Ensure you ran `ec2-setup-script.sh` first
- Check directory ownership: `ls -la /var/www/`
- Verify you're running as `ubuntu` user: `whoami`

### Directory Not Found
- Run the EC2 setup script first
- Manually create directory: `sudo mkdir -p /var/www/gmaths && sudo chown -R $USER:$USER /var/www/gmaths`

### Command Not Found (pnpm, pm2, etc.)
- The EC2 setup script installs these dependencies
- Check if they're installed: `which pnpm`, `which pm2`
- Reload shell: `source ~/.bashrc`

## Security Notes

- Never run deployment scripts as root
- Always use a non-root user with sudo privileges
- The scripts use `sudo` only when necessary for system-level operations

# GMATHS Education Website - AWS EC2 Deployment Guide

This guide provides step-by-step instructions for deploying the GMATHS Education Website to AWS EC2.

## Prerequisites

1. **AWS Account** with EC2 access
2. **Domain name** (recommended for production)
3. **SSH Key Pair** for EC2 access
4. **Basic knowledge** of Linux command line

## Architecture Overview

- **Frontend**: React + TypeScript + Vite (served by Nginx)
- **Backend**: Node.js + Fastify + TypeScript (managed by PM2)
- **Database**: PostgreSQL 14
- **Cache**: Redis (optional)
- **Web Server**: Nginx (reverse proxy + static file serving)
- **SSL**: Let's Encrypt certificates
- **Process Manager**: PM2

## Step 1: Launch EC2 Instance

### 1.1 Instance Configuration
1. **Login** to AWS Console
2. **Navigate** to EC2 Dashboard
3. **Click** "Launch Instance"
4. **Configure** instance:
   - **Name**: `gmaths-education-server`
   - **AMI**: Ubuntu Server 22.04 LTS (64-bit x86)
   - **Instance Type**: `t3.medium` (minimum) or `t3.large` (recommended)
   - **Key Pair**: Create new or use existing
   - **Storage**: 20GB GP3 SSD (minimum)

### 1.2 Security Group Settings
Create security group with these inbound rules:

| Type  | Protocol | Port Range | Source    | Description |
|-------|----------|------------|-----------|-------------|
| SSH   | TCP      | 22         | Your IP   | SSH access  |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Secure web  |

### 1.3 Launch Instance
1. **Review** configuration
2. **Launch** instance
3. **Note** the public IP address
4. **Wait** for instance to be running

## Step 2: Connect to Your Instance

```bash
# Update the path to your key file and IP address
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 3: Initial Server Setup

### 3.1 Run Setup Script
```bash
# Download and run the setup script
wget https://raw.githubusercontent.com/your-repo/gmaths-education-website/main/deploy/ec2-setup-script.sh
chmod +x ec2-setup-script.sh
./ec2-setup-script.sh
```

**Or manually install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other dependencies
sudo apt install -y postgresql nginx redis-server git
sudo npm install -g pnpm@10.11.0 pm2
```

## Step 4: Deploy Application

### 4.1 Clone Repository
```bash
cd /var/www
sudo mkdir gmaths
sudo chown $USER:$USER gmaths
git clone https://github.com/your-username/gmaths-education-website.git gmaths
cd gmaths
```

### 4.2 Run Deployment Script
```bash
# Make deployment script executable
chmod +x deploy/deploy.sh

# Update configuration in the script
nano deploy/deploy.sh
# Update REPO_URL and DOMAIN variables

# Run deployment
./deploy/deploy.sh
```

## Step 5: Configure Environment Variables

### 5.1 Backend Environment
```bash
# Edit backend environment file
nano backend/.env
```

**Required variables:**
```env
DATABASE_URL="postgresql://gmaths_user:your_secure_password@localhost:5432/gmaths_production"
JWT_SECRET="your_very_secure_jwt_secret_minimum_32_characters"
NODE_ENV="production"
PORT=3000
CORS_ORIGIN="https://yourdomain.com"
```

### 5.2 Frontend Environment
```bash
# Edit frontend environment file
nano frontend/.env.production
```

**Required variables:**
```env
VITE_API_URL="https://yourdomain.com/api"
VITE_WS_URL="wss://yourdomain.com"
```

## Step 6: Domain Configuration

### 6.1 Point Domain to EC2
1. **Login** to your domain registrar
2. **Update** DNS records:
   - **A Record**: `@` → Your EC2 Public IP
   - **A Record**: `www` → Your EC2 Public IP
3. **Wait** for DNS propagation (up to 24 hours)

### 6.2 Verify Domain
```bash
# Test domain resolution
dig yourdomain.com
nslookup yourdomain.com
```

## Step 7: SSL Certificate Setup

### 7.1 Install SSL Certificate
```bash
# Update domain and email in script
nano deploy/setup-ssl.sh

# Run SSL setup
chmod +x deploy/setup-ssl.sh
./deploy/setup-ssl.sh
```

### 7.2 Verify SSL
- Visit `https://yourdomain.com`
- Check certificate is valid
- Ensure HTTP redirects to HTTPS

## Step 8: Verification and Testing

### 8.1 Check Services Status
```bash
# Check PM2 processes
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Check Redis status
sudo systemctl status redis-server
```

### 8.2 Test Application
1. **Visit** your domain: `https://yourdomain.com`
2. **Register** a new account
3. **Login** to verify authentication
4. **Create** a test question
5. **Create** a test exam

### 8.3 Check Logs
```bash
# Backend logs
pm2 logs gmaths-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

## Step 9: Post-Deployment Security

### 9.1 Update Security Group
- **Restrict** SSH access to your IP only
- **Remove** any unnecessary ports

### 9.2 Configure Automated Backups
```bash
# Create backup script
sudo nano /etc/cron.daily/gmaths-backup

#!/bin/bash
# Database backup
sudo -u postgres pg_dump gmaths_production > /var/backups/gmaths-db-$(date +%Y%m%d).sql

# Compress old backups
find /var/backups -name "gmaths-db-*.sql" -mtime +7 -exec gzip {} \;

# Remove old compressed backups
find /var/backups -name "gmaths-db-*.sql.gz" -mtime +30 -delete
```

```bash
# Make backup script executable
sudo chmod +x /etc/cron.daily/gmaths-backup
```

## Monitoring and Maintenance

### Regular Maintenance Tasks

1. **Monitor** disk space: `df -h`
2. **Check** application logs: `pm2 logs`
3. **Update** system packages: `sudo apt update && sudo apt upgrade`
4. **Monitor** SSL expiration: `sudo certbot certificates`
5. **Check** PM2 processes: `pm2 status`

### Performance Monitoring

```bash
# Check CPU and memory usage
htop

# Check disk I/O
iotop

# Check network connections
netstat -tulpn

# Monitor Nginx status
curl http://localhost/nginx_status
```

### Scaling Considerations

For production load, consider:

1. **Database**: Amazon RDS PostgreSQL
2. **File Storage**: Amazon S3
3. **CDN**: Amazon CloudFront
4. **Load Balancer**: Application Load Balancer
5. **Auto Scaling**: EC2 Auto Scaling Groups
6. **Monitoring**: CloudWatch + custom metrics

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check backend is running: `pm2 status`
   - Check backend logs: `pm2 logs gmaths-backend`
   - Restart backend: `pm2 restart gmaths-backend`

2. **Database Connection Issues**
   - Check PostgreSQL status: `sudo systemctl status postgresql`
   - Verify database credentials in `.env`
   - Test connection: `psql -h localhost -U gmaths_user -d gmaths_production`

3. **SSL Certificate Issues**
   - Check certificate status: `sudo certbot certificates`
   - Renew manually: `sudo certbot renew`
   - Check Nginx SSL config: `sudo nginx -t`

4. **File Upload Issues**
   - Check uploads directory permissions: `ls -la /var/www/gmaths/uploads`
   - Fix permissions: `sudo chown -R www-data:www-data /var/www/gmaths/uploads`

### Log Locations

- **Application Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`
- **PostgreSQL Logs**: `/var/log/postgresql/`

## Contact and Support

For deployment issues or questions:
- **Check** this documentation first
- **Review** application logs
- **Contact** the development team

---

**🎉 Congratulations! Your GMATHS Education Website is now live on AWS EC2!** 