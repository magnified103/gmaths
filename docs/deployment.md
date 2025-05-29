# GMATHS Platform Deployment Guide

This document provides complete instructions for deploying the GMATHS online testing platform to AWS.

## Overview

The GMATHS platform is deployed on AWS using a simple but scalable architecture:
- **Frontend**: React SPA served by Nginx
- **Backend**: Fastify API server managed by PM2 
- **Database**: PostgreSQL on AWS RDS
- **Cache**: Redis on AWS ElastiCache
- **Web Server**: Nginx with SSL termination

## Quick Deployment Summary

For immediate deployment, follow these key steps:

1. **Infrastructure Setup**: Launch AWS resources (EC2, RDS, ElastiCache)
2. **Domain Configuration**: Point `gmaths.edu.vn` to EC2 instance
3. **Run Deployment Script**: Execute `deploy/deploy.sh` on the server
4. **Configure Environment**: Set production environment variables
5. **Verify Health**: Check all services are running correctly

## Detailed Deployment Process

### Phase 1: AWS Infrastructure Setup

#### 1.1 EC2 Instance Setup

Launch an EC2 instance with the following specifications:

```bash
# Instance Details
Instance Type: t2.small (2 vCPU, 2 GiB RAM)
AMI: Ubuntu 22.04 LTS (ami-0c02fb55956c7d316)
Storage: 20 GiB gp3 SSD
Key Pair: Create or use existing SSH key

# Security Group Configuration
SSH (22): Your IP address only
HTTP (80): 0.0.0.0/0 
HTTPS (443): 0.0.0.0/0
Custom TCP (3000): 127.0.0.1/32 (Backend internal access)
```

**Allocate Elastic IP:**
```bash
# Allocate and associate Elastic IP for consistent public IP
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id i-1234567890abcdef0 --allocation-id eipalloc-12345678
```

#### 1.2 RDS PostgreSQL Database

Create a PostgreSQL database instance:

```bash
# Database Configuration
Engine: PostgreSQL 15.4
Instance Class: db.t3.micro (1 vCPU, 1 GiB RAM)
Storage: 20 GiB gp2 with autoscaling to 100 GiB
Multi-AZ: No (enable for production)
Publicly Accessible: No
VPC Security Group: Allow PostgreSQL (5432) from EC2 security group
```

**Database Setup Commands:**
```sql
-- Connect to database and run:
CREATE DATABASE gmaths_production;
CREATE USER gmaths_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE gmaths_production TO gmaths_user;
ALTER USER gmaths_user CREATEDB; -- For running migrations
```

#### 1.3 ElastiCache Redis

Set up Redis for session management and WebSocket scaling:

```bash
# Redis Configuration
Engine: Redis 7.0
Node Type: cache.t3.micro (2 vCPU, 0.5 GiB RAM)
Number of Replicas: 0 (for cost optimization)
Subnet Group: Same VPC as EC2 and RDS
Security Group: Allow Redis (6379) from EC2 security group
```

#### 1.4 DNS Configuration

Configure Route 53 or your DNS provider:

```bash
# DNS Records
A Record: gmaths.edu.vn -> EC2 Elastic IP (e.g., 54.123.45.67)
CNAME: www.gmaths.edu.vn -> gmaths.edu.vn
```

### Phase 2: Application Deployment

#### 2.1 Connect to Server

```bash
# SSH into the EC2 instance
ssh -i your-key.pem ubuntu@gmaths.edu.vn
```

#### 2.2 Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clone repository to temporary location
git clone https://github.com/gmaths-education/gmaths-education-website.git /tmp/gmaths-setup
cd /tmp/gmaths-setup

# Make deployment script executable
chmod +x deploy/deploy.sh

# Run the deployment script
sudo ./deploy/deploy.sh
```

The deployment script will:
- Install Node.js 20, pnpm, PM2, Nginx, and system dependencies
- Create necessary directories and set permissions
- Build both frontend and backend applications
- Configure Nginx with the provided configuration
- Start the backend with PM2 process manager
- Setup logging and monitoring

#### 2.3 Environment Configuration

After the deployment script completes, configure the environment variables:

```bash
# Copy environment template
sudo cp /tmp/gmaths-setup/deploy/env.production.example /var/www/gmaths/backend/.env

# Edit with actual values
sudo nano /var/www/gmaths/backend/.env
```

**Critical Environment Variables:**
```bash
# Database (replace with your RDS endpoint)
DATABASE_URL="postgresql://gmaths_user:password@gmaths-db.abcdef.ap-southeast-1.rds.amazonaws.com:5432/gmaths_production"

# Redis (replace with your ElastiCache endpoint)  
REDIS_URL="redis://gmaths-redis.abcdef.cache.amazonaws.com:6379"

# JWT Secret (generate a secure 32+ character secret)
JWT_SECRET="your-super-secure-jwt-secret-key-here-at-least-32-characters"

# Application
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="https://gmaths.edu.vn"

# Security
SECURE_COOKIES="true"
COOKIE_DOMAIN="gmaths.edu.vn"
SESSION_SECRET="your-session-secret-key-here"
```

#### 2.4 Database Migration

Initialize the database schema:

```bash
cd /var/www/gmaths/backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Verify database connection
npx prisma db seed # If seed file exists
```

#### 2.5 SSL Certificate Setup

**Option A: Let's Encrypt (Recommended for development)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d gmaths.edu.vn -d www.gmaths.edu.vn

# Verify auto-renewal
sudo certbot renew --dry-run
```

**Option B: AWS Certificate Manager (Recommended for production)**
1. Request certificate in AWS Certificate Manager for `gmaths.edu.vn` and `*.gmaths.edu.vn`
2. Validate via DNS (add CNAME records to Route 53)
3. Configure Application Load Balancer to use the certificate
4. Update security groups to allow ALB access to EC2

#### 2.6 Restart Services

After configuration, restart all services:

```bash
# Restart backend with new environment
sudo pm2 restart gmaths-backend

# Restart Nginx to apply SSL changes
sudo systemctl restart nginx

# Save PM2 configuration
sudo pm2 save
```

### Phase 3: Verification and Testing

#### 3.1 Health Checks

Verify all services are running correctly:

```bash
# Check backend health
curl https://gmaths.edu.vn/health
# Expected: {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}

# Check PM2 status
sudo pm2 status
# Expected: gmaths-backend should be "online"

# Check Nginx status
sudo systemctl status nginx
# Expected: Active (running)

# Check SSL certificate
curl -I https://gmaths.edu.vn
# Expected: 200 OK with proper SSL headers
```

#### 3.2 Frontend Verification

Test the frontend application:

```bash
# Check homepage loads
curl -s https://gmaths.edu.vn | grep "Chào mừng"
# Expected: Should contain Vietnamese welcome text

# Check static assets load
curl -I https://gmaths.edu.vn/assets/index-[hash].js
# Expected: 200 OK with cache headers
```

#### 3.3 API Endpoints

Test backend API endpoints:

```bash
# Health endpoint
curl https://gmaths.edu.vn/api/health
# Expected: {"status":"ok"}

# API base endpoint (should return 404 but not error)
curl https://gmaths.edu.vn/api/
# Expected: 404 Not Found (this is correct)
```

#### 3.4 Performance Testing

Basic load testing to ensure the t2.small instance can handle expected traffic:

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test concurrent requests
ab -n 100 -c 10 https://gmaths.edu.vn/
# Monitor: Watch response times and ensure no failures

# Monitor resources during test
htop  # Check CPU and memory usage
```

### Phase 4: Monitoring and Maintenance

#### 4.1 Log Monitoring

Set up log monitoring:

```bash
# Application logs
sudo tail -f /var/log/gmaths/backend-combined.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs  
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -fu nginx
sudo journalctl -fu pm2-ubuntu
```

#### 4.2 Performance Monitoring

Monitor system resources:

```bash
# Real-time resource monitoring
htop

# Disk usage
df -h

# Memory usage
free -h

# Network connections
sudo netstat -tulpn

# PM2 monitoring
sudo pm2 monit
```

#### 4.3 Security Hardening

Additional security measures:

```bash
# Enable firewall (after confirming SSH access works)
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https

# Disable password authentication (key-only)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Regular security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Troubleshooting Common Issues

### Backend Won't Start

```bash
# Check PM2 logs
sudo pm2 logs gmaths-backend

# Common issues:
# 1. Environment variables not set
sudo pm2 env 0  # Check environment for process 0

# 2. Database connection failed
# Verify DATABASE_URL and network connectivity
telnet your-rds-endpoint 5432

# 3. Port already in use
sudo netstat -tulpn | grep :3000
```

### Frontend Not Loading

```bash
# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Verify Nginx configuration
sudo nginx -t

# Check if frontend was built
ls -la /var/www/gmaths/frontend/dist/

# Rebuild frontend if needed
cd /var/www/gmaths/frontend
pnpm build
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### Performance Issues

```bash
# Check CPU credits (for t2.small)
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUCreditBalance \
  --dimensions Name=InstanceId,Value=i-yourinstanceid

# Monitor memory usage
free -m
# If memory usage > 80%, consider adding swap

# Check disk space
df -h
# If disk usage > 80%, clean logs or upgrade storage
```

## Scaling and Optimization

### When to Scale Up

Monitor these metrics and scale when:
- CPU credits consistently < 30% (upgrade to t3.small)
- Memory usage consistently > 80% (upgrade instance or add swap)
- Response times > 2 seconds under normal load
- Concurrent users > 1000 consistently

### Scaling Options

1. **Vertical Scaling**: Upgrade to t3.small or larger
2. **Horizontal Scaling**: Add Application Load Balancer + multiple instances  
3. **Database Scaling**: Enable RDS read replicas
4. **CDN**: Add CloudFront for static assets
5. **Microservices**: Split into separate services (Phase 5)

## Cost Optimization

### Current Costs (Estimated)
- EC2 t2.small: $17/month
- RDS db.t3.micro: $16/month  
- ElastiCache cache.t3.micro: $15/month
- Data transfer: $5/month
- **Total: ~$53/month**

### Cost Reduction Tips
- Use Reserved Instances for 1-year commitment (30% savings)
- Enable detailed monitoring only when debugging
- Regular cleanup of old logs and backups
- Monitor data transfer costs and optimize

## Backup and Recovery

### Automated Backups
- **RDS**: Automated daily backups (7-day retention)
- **Application**: Daily file system backups to S3
- **Configuration**: Version control for all config files

### Recovery Procedures
1. **Database Recovery**: Restore from RDS automated backup
2. **Application Recovery**: Redeploy from Git repository
3. **Configuration Recovery**: Restore from backup files

This deployment guide provides a complete foundation for running the GMATHS platform on AWS. Follow the verification steps carefully and monitor the system closely during the first few days of operation. 