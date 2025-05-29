# AWS Infrastructure Setup for GMATHS

This guide covers setting up the AWS infrastructure required for the GMATHS online testing platform.

## Prerequisites

- AWS Account with appropriate permissions
- Domain `gmaths.edu.vn` (to be configured)
- SSH key pair for EC2 access

## Infrastructure Components

### 1. EC2 Instance (t2.small)

**Launch EC2 Instance:**
```bash
# Instance type: t2.small (2 vCPU, 2 GiB RAM)
# AMI: Ubuntu 22.04 LTS
# Storage: 20 GiB gp3 (expandable)
# Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
```

**Security Group Rules:**
- SSH (22): Your IP address
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom TCP (3000): 127.0.0.1/32 (Backend - internal only)

### 2. RDS PostgreSQL Database

**Database Configuration:**
```bash
# Engine: PostgreSQL 15
# Instance class: db.t3.micro (for cost optimization)
# Storage: 20 GiB gp2 (auto-scaling enabled)
# Multi-AZ: No (for cost, enable for production)
# Public access: No
# Security Group: Allow PostgreSQL (5432) from EC2 security group
```

**Database Setup:**
```sql
CREATE DATABASE gmaths_production;
CREATE USER gmaths_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE gmaths_production TO gmaths_user;
```

### 3. ElastiCache Redis

**Redis Configuration:**
```bash
# Engine: Redis 7.x
# Node type: cache.t3.micro
# Number of replicas: 0 (for cost optimization)
# Subnet group: Same VPC as EC2
# Security Group: Allow Redis (6379) from EC2 security group
```

### 4. Route 53 DNS Configuration

**DNS Records:**
```bash
# A Record: gmaths.edu.vn -> EC2 Elastic IP
# CNAME: www.gmaths.edu.vn -> gmaths.edu.vn
```

### 5. SSL Certificate (AWS Certificate Manager)

**Certificate Setup:**
```bash
# Request certificate for: gmaths.edu.vn, *.gmaths.edu.vn
# Validation method: DNS validation
# Auto-renewal: Enabled
```

## Deployment Steps

### 1. Connect to EC2 Instance

```bash
ssh -i your-key.pem ubuntu@gmaths.edu.vn
```

### 2. Run Initial Setup

```bash
# Clone the repository
git clone https://github.com/gmaths-education/gmaths-education-website.git /tmp/gmaths-setup
cd /tmp/gmaths-setup

# Copy deployment files
sudo mkdir -p /var/www/gmaths
sudo cp -r deploy/* /var/www/gmaths/
sudo chmod +x /var/www/gmaths/deploy.sh

# Run deployment
sudo /var/www/gmaths/deploy.sh
```

### 3. Configure Environment Variables

```bash
# Copy environment template
sudo cp /var/www/gmaths/env.production.example /var/www/gmaths/backend/.env

# Edit with actual values
sudo nano /var/www/gmaths/backend/.env
```

**Required Environment Variables:**
```bash
DATABASE_URL="postgresql://gmaths_user:password@your-rds-endpoint:5432/gmaths_production"
REDIS_URL="redis://your-elasticache-endpoint:6379"
JWT_SECRET="generated-secure-secret"
```

### 4. SSL Certificate Installation

**Using Certbot (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d gmaths.edu.vn -d www.gmaths.edu.vn
```

**Or manually configure AWS Certificate Manager certificate in Application Load Balancer.**

### 5. Database Migration

```bash
cd /var/www/gmaths/backend
npx prisma migrate deploy
npx prisma generate
```

## Monitoring and Maintenance

### Health Checks
```bash
# Backend health
curl https://gmaths.edu.vn/health

# PM2 status
sudo pm2 status

# Nginx status
sudo systemctl status nginx

# Resource usage
htop
free -h
df -h
```

### Log Monitoring
```bash
# Application logs
sudo tail -f /var/log/gmaths/backend-combined.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -fu nginx
sudo journalctl -fu pm2-ubuntu
```

### Performance Optimization for t2.small

**Memory Management:**
```bash
# Monitor memory usage
free -m

# Configure swap (if needed)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**CPU Credits Monitoring:**
```bash
# Monitor CPU credits in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUCreditBalance \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## Backup Strategy

### Automated Database Backups
```bash
# RDS automated backups (enabled by default)
# Backup retention: 7 days
# Backup window: Configure during low-traffic hours
```

### Application Backups
```bash
# Create backup script
sudo crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/gmaths/backup.sh
```

## Scaling Considerations

When approaching resource limits on t2.small:

1. **Upgrade to t3.small** (2 vCPU, 2 GiB RAM, better baseline performance)
2. **Enable Application Load Balancer** for multiple instances
3. **Implement Redis Cluster** for session management
4. **Enable RDS Multi-AZ** for high availability
5. **Configure CloudFront CDN** for static asset delivery

## Security Checklist

- [x] Security groups configured with minimal access
- [x] SSL/TLS encryption enabled
- [x] Database not publicly accessible
- [x] Regular security updates scheduled
- [x] Application secrets stored in environment variables
- [x] Nginx security headers configured
- [x] Rate limiting implemented
- [x] Regular backups configured

## Cost Optimization

**Expected Monthly Costs (USD):**
- EC2 t2.small: ~$17
- RDS db.t3.micro: ~$16
- ElastiCache cache.t3.micro: ~$15
- Data transfer: ~$5
- **Total: ~$53/month**

**Cost Optimization Tips:**
- Use Reserved Instances for predictable workloads
- Enable detailed monitoring only when needed
- Regular cleanup of old backups and logs
- Monitor and optimize data transfer costs 