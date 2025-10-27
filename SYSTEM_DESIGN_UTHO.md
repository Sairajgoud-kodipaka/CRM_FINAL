# 🏗️ Jewellery CRM System Design - Utho Cloud Deployment

## 📊 Overview

This document outlines the complete system architecture, load balancing strategy, and scalability design for the Jewellery CRM application deployed on Utho Cloud VM.

---

## 🎯 System Architecture

### Current Architecture (Single Server)

```
┌─────────────────────────────────────────────────────────────┐
│                     INTERNET / USERS                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/HTTP
                            ▼
                    ┌───────────────┐
                    │   UFW FIREWALL │
                    │   (Port 80,443) │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │     NGINX     │
                    │  (Reverse Proxy) │
                    │  Load Balancer │
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌───────────┐   ┌───────────┐
            │ Gunicorn  │   │ Gunicorn  │
            │ Worker 1  │   │ Worker 2  │
            └─────┬─────┘   └─────┬─────┘
                  │               │
                  └───────┬───────┘
                          │
                  ┌───────┴───────┐
                  │   DJANGO APP   │
                  │   (Python 3.11) │
                  └───────┬───────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
    ┌──────────────┐           ┌──────────────┐
    │  PostgreSQL  │           │    REDIS     │
    │  (Database)  │           │   (Cache)    │
    └──────────────┘           └──────────────┘
```

---

## 🔄 Load Balancing Strategy

### **Option 1: Single Server Load Balancing (Current)**

**Perfect for:** Small to Medium Businesses (1-100 concurrent users)

#### Components:
- **Nginx** as reverse proxy and load balancer
- **Multiple Gunicorn Workers** (3-5 workers recommended)
- **Single PostgreSQL Instance**
- **Redis** for caching and WebSocket support

#### Gunicorn Configuration:
```bash
# Number of workers = (2 × CPU cores) + 1
# For 2 CPU cores: (2 × 2) + 1 = 5 workers
gunicorn core.wsgi:application \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --bind 127.0.0.1:8000 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log
```

#### Nginx Load Balancing Configuration:
```nginx
upstream crm_backend {
    least_conn;  # Use least connections algorithm
    
    # Multiple backend servers
    server 127.0.0.1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8002 weight=1 max_fails=3 fail_timeout=30s;
    
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://crm_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Load balancing settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }
}
```

---

### **Option 2: Multi-Server Load Balancing (Scaled)**

**Perfect for:** Medium to Large Businesses (100-1000 concurrent users)

#### Architecture:
```
                ┌─────────────┐
                │  LOAD      │
                │  BALANCER   │
                │  (HAProxy)  │
                └──────┬──────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
  ┌─────────┐    ┌─────────┐    ┌─────────┐
  │Server 1 │    │Server 2 │    │Server 3 │
  │(App)    │    │(App)    │    │(App)    │
  └────┬────┘    └────┬────┘    └────┬────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
            ┌─────────┴─────────┐
            │                   │
            ▼                   ▼
    ┌─────────────┐     ┌─────────────┐
    │ PostgreSQL  │     │    Redis    │
    │  Primary    │     │  Sentinel   │
    │   (Master)  │     │  (HA Mode)  │
    └──────┬──────┘     └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ PostgreSQL  │
    │  Replica    │
    │ (Standby)   │
    └─────────────┘
```

---

## 📈 Scalability Strategy

### **Vertical Scaling (Scale Up)**

#### Current VM Configuration:
```
CPU: 2-4 cores
RAM: 4-8 GB
Storage: 50-100 GB SSD
Bandwidth: 1-2 TB/month
```

#### Scaling Options:
1. **Upgrade VM Resources** (Instant)
   - Increase CPU: 4 → 8 cores (+₹500-1000/month)
   - Increase RAM: 8 → 16 GB (+₹500-800/month)
   - Add SSD: 100 → 200 GB (+₹200/month)

2. **Database Optimization** (Free)
   - Enable connection pooling
   - Add database indexes
   - Implement query optimization
   - Enable read replicas

3. **Cache Strategy** (Free)
   - Redis caching for hot data
   - Static file CDN
   - Database query caching
   - Session caching

### **Horizontal Scaling (Scale Out)**

#### Multi-Server Setup:
```
VM 1: Application Server (Primary)
VM 2: Application Server (Secondary)
VM 3: Load Balancer (HAProxy or Nginx)
VM 4: Database Server (Primary)
VM 5: Database Server (Replica) [Optional]
VM 6: Redis Cluster [Optional]
```

#### Costs:
- **Total**: ~₹6,000-12,000/month
- **Performance**: 10x capacity
- **Redundancy**: High availability

---

## 🗄️ Database Architecture

### **Current Setup (Single Server)**
```sql
PostgreSQL 15
├── Connection Pooling (PgBouncer)
├── Max Connections: 100
├── Shared Buffers: 2GB
└── Cache Hit Ratio: >90%
```

### **Optimization Strategies**

#### 1. **Connection Pooling**
```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configuration: /etc/pgbouncer/pgbouncer.ini
[databases]
jewellery_crm = host=localhost port=5432 dbname=jewellery_crm

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

#### 2. **Database Indexing**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_client_name ON clients(first_name, last_name);
CREATE INDEX idx_sale_date ON sales(date);
CREATE INDEX idx_product_category ON products(category);
CREATE INDEX idx_sale_status ON sales(status);
```

#### 3. **Read Replicas (For High Traffic)**
```sql
-- On Replica Server
standby_mode = 'on'
primary_conninfo = 'host=primary_server_ip port=5432 user=replication'
```

---

## 🔧 Caching Strategy

### **Multi-Level Caching**

#### Level 1: Browser Cache
```nginx
# Nginx configuration
location /static/ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location /media/ {
    expires 30d;
    add_header Cache-Control "public";
}
```

#### Level 2: Redis Cache
```python
# Django settings
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'crm',
        'TIMEOUT': 300,  # 5 minutes default
    }
}
```

#### Level 3: Database Query Cache
```python
# Use Django's database query cache
from django.core.cache import cache

def get_cached_data():
    cache_key = 'expensive_query_result'
    data = cache.get(cache_key)
    
    if data is None:
        data = ExpensiveQuery.objects.all()
        cache.set(cache_key, data, 300)  # Cache for 5 minutes
    
    return data
```

---

## 🌐 CDN & Static Assets

### **Current Setup**
- Static files served by Nginx
- Media files stored on server
- No CDN

### **Optimization Strategy**

#### Option 1: CloudFlare CDN (Free)
```nginx
# CloudFlare configuration
- Enable CloudFlare proxy
- Automatic SSL
- CDN caching
- DDoS protection
```

#### Option 2: AWS CloudFront (Paid)
```bash
# S3 + CloudFront setup
- Upload static files to S3
- Configure CloudFront distribution
- Update STATIC_URL in Django
```

---

## 🔒 Security & High Availability

### **Firewall Configuration**
```bash
# UFW Firewall Rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### **SSL/TLS Setup**
```bash
# Let's Encrypt SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### **Auto-Failover Setup**
```bash
# Systemd auto-restart
[Service]
Restart=always
RestartSec=10
```

### **Health Checks**
```bash
# Nginx health check
location /health/ {
    access_log off;
    return 200 "healthy\n";
}
```

---

## 📊 Performance Monitoring

### **Key Metrics to Monitor**

1. **Application Metrics**
   - Response time: <200ms (p95)
   - Error rate: <0.1%
   - Throughput: Requests/second

2. **System Metrics**
   - CPU usage: <70%
   - Memory usage: <80%
   - Disk I/O: <80%
   - Network bandwidth

3. **Database Metrics**
   - Connection pool usage
   - Query execution time
   - Slow query log
   - Cache hit ratio

### **Monitoring Tools**

#### Free Options:
```bash
# Install monitoring tools
sudo apt-get install htop iotop nethogs

# Log monitoring
sudo journalctl -u crm-backend.service -f
```

#### Paid Options:
- **Datadog**: ₹5000-10000/month
- **New Relic**: ₹4000-8000/month
- **Grafana Cloud**: ₹2000-5000/month

---

## 💰 Cost Optimization

### **Current Costs (Single Server)**
```
VM: ₹2000-3000/month
Domain: ₹500-1000/year
SSL: Free (Let's Encrypt)
Monitoring: Free (basic)
Total: ~₹2500/month
```

### **Optimized Costs (With CDN)**
```
VM: ₹2000-3000/month
Domain: ₹500-1000/year
CloudFlare: Free
Database Backup: ₹500/month
Total: ~₹3000/month
```

### **High Availability Setup**
```
3x VMs: ₹6000-9000/month
Load Balancer: ₹500-1000/month
SSL: Free
Total: ~₹7000/month
```

---

## 🚀 Deployment Strategy

### **Single Server Deployment (Recommended Start)**
```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y python3.11 postgresql redis nginx

# 2. Deploy application
cd /var/www/CRM_FINAL/backend
./utho-deploy.sh

# 3. Configure systemd
sudo systemctl enable crm-backend.service
sudo systemctl start crm-backend.service

# 4. Configure Nginx
sudo cp nginx_crm.conf /etc/nginx/sites-available/
sudo systemctl restart nginx
```

### **Multi-Server Deployment (For Scale)**
```bash
# Server 1: Load Balancer
# Server 2: App Server 1
# Server 3: App Server 2
# Server 4: Database Server

# Configure HAProxy on Server 1
# Deploy app on Servers 2 & 3
# Setup database replication on Server 4
```

---

## 📋 Capacity Planning

### **Current Single Server Capacity**
```
Concurrent Users: 50-100
Requests/Second: 50-100
Database Size: 1-10 GB
Bandwidth: 100-200 GB/month
```

### **Optimized Single Server Capacity**
```
Concurrent Users: 100-200
Requests/Second: 100-200
Database Size: 10-50 GB
Bandwidth: 200-500 GB/month
```

### **Multi-Server Capacity**
```
Concurrent Users: 500-1000
Requests/Second: 500-1000
Database Size: 50-200 GB
Bandwidth: 1-2 TB/month
```

---

## 🎯 Recommendations

### **Phase 1: Start (Current)**
- ✅ Single Utho VM
- ✅ Nginx + Gunicorn
- ✅ PostgreSQL + Redis
- ✅ Let's Encrypt SSL
- **Cost**: ₹2500/month
- **Capacity**: 50-100 users

### **Phase 2: Optimize (Month 2-3)**
- Upgrade VM resources (2x capacity)
- Add CloudFlare CDN (free)
- Optimize database indexes
- Enable connection pooling
- **Cost**: ₹3500/month
- **Capacity**: 100-200 users

### **Phase 3: Scale (Month 4-6)**
- Add second VM
- Setup load balancer
- Database replication
- Redis clustering
- **Cost**: ₹7000/month
- **Capacity**: 500-1000 users

---

## ✅ Conclusion

Your current single-server setup on Utho is **perfectly suitable** for:
- Small to medium jewelry businesses
- 50-100 concurrent users
- 1-10 stores
- Standard CRM operations

**No additional services needed** for now. The architecture can scale horizontally when needed.

**Next Steps:**
1. Deploy on current VM (single server)
2. Monitor performance for 1 month
3. Optimize based on actual usage
4. Scale when you reach 80% capacity

---

## 🔧 UTHO VM COMMANDS - DAILY USE

### **Most Frequently Used Commands**

#### **1. Service Management**
```bash
# Check backend service status
sudo systemctl status crm-backend.service

# Start backend service
sudo systemctl start crm-backend.service

# Stop backend service
sudo systemctl stop crm-backend.service

# Restart backend service
sudo systemctl restart crm-backend.service

# View live logs (most useful!)
sudo journalctl -u crm-backend.service -f

# View last 50 log lines
sudo journalctl -u crm-backend.service -n 50

# Check if service is running
sudo systemctl is-active crm-backend.service
```

#### **2. Application Status Checks**
```bash
# Test if backend is responding
curl http://localhost:8000/api/health/

# Check from public IP
curl http://YOUR_SERVER_IP/api/health/

# Check all running processes
ps aux | grep gunicorn

# Check database connection
cd ~/CRM_FINAL/backend && python manage.py dbshell

# Check Django app
python manage.py check
```

#### **3. Quick Status Overview**
```bash
# One-liner status check (save this!)
echo "=== SERVICE STATUS ===" && \
sudo systemctl is-active crm-backend.service && \
echo "=== NGINX STATUS ===" && \
sudo systemctl is-active nginx && \
echo "=== DATABASE STATUS ===" && \
sudo systemctl is-active postgresql && \
echo "=== REDIS STATUS ===" && \
sudo systemctl is-active redis && \
echo "=== DISK USAGE ===" && \
df -h / && \
echo "=== MEMORY USAGE ===" && \
free -h && \
echo "=== CPU USAGE ===" && \
top -bn1 | grep "Cpu(s)"
```

#### **4. Nginx Commands**
```bash
# Check Nginx status
sudo systemctl status nginx

# Restart Nginx (after config changes)
sudo systemctl restart nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Reload Nginx config (no downtime)
sudo nginx -s reload
```

#### **5. Database Commands**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql jewellery_crm

# List all databases
sudo -u postgres psql -l

# Check database size
sudo -u postgres psql jewellery_crm -c "\l+ jewellery_crm"

# Backup database (run daily!)
sudo -u postgres pg_dump jewellery_crm > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql jewellery_crm < backup_20250120.sql
```

#### **6. Redis Commands**
```bash
# Check Redis status
sudo systemctl status redis

# Connect to Redis
redis-cli

# In Redis CLI:
# Check if running
redis-cli ping  # Should return PONG

# Check memory usage
redis-cli info memory

# Flush cache (be careful!)
redis-cli FLUSHDB

# View all keys
redis-cli KEYS "*"
```

#### **7. System Monitoring**
```bash
# CPU usage
top
htop  # If installed (better interface)

# Disk usage
df -h

# Memory usage
free -h

# Disk usage by directory
du -sh ~/CRM_FINAL/*

# Network connections
netstat -tulpn | grep python

# Check open ports
sudo lsof -i -P -n | grep LISTEN

# System uptime
uptime
```

#### **8. Log Files**
```bash
# Backend application logs
tail -f ~/CRM_FINAL/backend/logs/error.log

# Gunicorn logs (if configured)
tail -f ~/CRM_FINAL/backend/logs/access.log

# System logs
sudo journalctl -xe

# Recent system errors
sudo journalctl -p err -b

# All logs for your app
sudo journalctl -u crm-backend.service --since "1 hour ago"
```

#### **9. Quick Operations**
```bash
# Navigate to backend
cd ~/CRM_FINAL/backend

# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser

# Open Django shell
python manage.py shell

# Check for errors
python manage.py check --deploy
```

#### **10. Troubleshooting Commands**
```bash
# Find what's using port 8000
sudo lsof -i :8000

# Kill process on port 8000
sudo kill -9 $(lsof -t -i:8000)

# Check firewall
sudo ufw status

# Check network connectivity
ping google.com

# Check DNS
nslookup yourdomain.com

# Test SSL certificate
curl -vI https://yourdomain.com
```

---

## 📊 AUTO-STATUS SCRIPT

### **Create This Helpful Script**

Save this as `~/check-status.sh`:

```bash
#!/bin/bash
echo "=================================="
echo "   CRM STATUS CHECK"
echo "=================================="
echo ""
echo "📍 Service Status:"
sudo systemctl is-active crm-backend.service >/dev/null 2>&1 && echo "✅ Backend: RUNNING" || echo "❌ Backend: STOPPED"
sudo systemctl is-active nginx >/dev/null 2>&1 && echo "✅ Nginx: RUNNING" || echo "❌ Nginx: STOPPED"
sudo systemctl is-active postgresql >/dev/null 2>&1 && echo "✅ Database: RUNNING" || echo "❌ Database: STOPPED"
sudo systemctl is-active redis >/dev/null 2>&1 && echo "✅ Redis: RUNNING" || echo "❌ Redis: STOPPED"
echo ""
echo "📍 Application Health:"
curl -s http://localhost:8000/api/health/ >/dev/null 2>&1 && echo "✅ API: RESPONDING" || echo "❌ API: NOT RESPONDING"
echo ""
echo "📍 System Resources:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2{print $3 "/" $2 " (" $5 " used)"}')"
echo ""
echo "📍 Recent Logs (last 3 lines):"
sudo journalctl -u crm-backend.service -n 3 --no-pager
```

**Make it executable:**
```bash
chmod +x ~/check-status.sh
```

**Run it anytime:**
```bash
~/check-status.sh
```

---

## 🚨 EMERGENCY COMMANDS

### **When Things Go Wrong**

```bash
# Everything crashed - restart all services
sudo systemctl restart crm-backend.service
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart redis

# Check all at once
for service in crm-backend nginx postgresql redis; do 
    echo "Checking $service:"; 
    sudo systemctl status $service | head -3; 
done

# Server not responding?
sudo reboot  # Last resort!

# Database corrupted?
cd ~/CRM_FINAL/backend
source venv/bin/activate
python manage.py migrate --run-syncdb

# Out of disk space?
# Find large files
sudo find / -size +100M -type f -exec ls -lh {} \;
```

---

## 💡 MOST USED COMMAND SUMMARY

```bash
# 1. Check if everything is running (MOST USED!)
sudo systemctl status crm-backend.service nginx postgresql redis

# 2. View live logs (MOST USED!)
sudo journalctl -u crm-backend.service -f

# 3. Restart backend after changes
sudo systemctl restart crm-backend.service

# 4. Test API
curl http://localhost:8000/api/health/

# 5. Quick status overview
~/check-status.sh

# 6. View errors
sudo journalctl -u crm-backend.service -n 50 | grep -i error

# 7. Check disk space
df -h

# 8. Check memory
free -h

# 9. Check CPU
top
```

---

## 📝 DAILY WORKFLOW

**Morning:**
```bash
# 1. SSH into server
ssh ubuntu@your-server-ip

# 2. Check everything is running
~/check-status.sh

# 3. View any errors from last night
sudo journalctl -u crm-backend.service --since "yesterday"
```

**After Making Changes:**
```bash
# 1. Restart service
sudo systemctl restart crm-backend.service

# 2. Check it started
sudo systemctl status crm-backend.service

# 3. Test API
curl http://localhost:8000/api/health/

# 4. Watch logs for errors
sudo journalctl -u crm-backend.service -f
```

**Evening:**
```bash
# 1. Backup database
sudo -u postgres pg_dump jewellery_crm > backup_$(date +%Y%m%d).sql

# 2. Check disk space
df -h

# 3. View access logs
sudo tail -n 100 /var/log/nginx/access.log
```
