# 🚀 Utho Scalable Services Requirements for Jewellery CRM

## 📋 Overview

This document lists all scalable services required for the Jewellery CRM system deployment on **Utho Cloud infrastructure only**. All services are hosted on Utho VMs with no external dependencies.

---

## 🏗️ Core Infrastructure Services

### 1. **Virtual Machines (VMs)**
**Purpose:** Application hosting and compute resources

**Requirements:**
- **Primary Application Server**
  - CPU: 2-4 cores (scalable to 8+ cores)
  - RAM: 4-8 GB (scalable to 16+ GB)
  - Storage: 50-100 GB SSD (scalable to 200+ GB)
  - Bandwidth: 1-2 TB/month
  - OS: Ubuntu 20.04/22.04 LTS

- **Database Server** (Optional - can be on same VM initially)
  - CPU: 2-4 cores
  - RAM: 4-8 GB
  - Storage: 100-200 GB SSD
  - PostgreSQL 15+

- **Load Balancer Server** (For multi-server setup)
  - CPU: 1-2 cores
  - RAM: 2-4 GB
  - HAProxy or Nginx Load Balancer

**Scaling Strategy:**
- Start with 1 VM (₹2,000-3,000/month)
- Scale to 3-6 VMs for high availability (₹6,000-12,000/month)

---

### 2. **PostgreSQL Database**
**Purpose:** Primary relational database for CRM data

**Requirements:**
- PostgreSQL 15+
- Connection pooling (PgBouncer recommended)
- Max connections: 100+
- Shared buffers: 2GB+
- Automated backups enabled

**Scaling Options:**
- **Single Instance:** On application VM (initial setup)
- **Dedicated Database VM:** For better performance
- **Read Replicas:** For high-traffic scenarios
- **Managed Database Service:** If Utho offers managed PostgreSQL

**Estimated Cost:**
- Included in VM (single instance): ₹0 additional
- Dedicated VM: ₹2,000-3,000/month
- Managed service: ₹1,500-2,500/month

---

### 3. **Redis Cache & Message Broker**
**Purpose:** 
- Caching layer for improved performance
- Session storage
- Celery task queue broker
- WebSocket channel layer (Django Channels)

**Requirements:**
- Redis 6.0+
- Memory: 1-2 GB (scalable to 4+ GB)
- Persistence enabled (AOF or RDB)
- High availability mode (Redis Sentinel) for production

**Scaling Options:**
- **Single Instance:** On application VM (initial setup)
- **Dedicated Redis VM:** For better performance
- **Redis Cluster:** For high availability and scaling

**Estimated Cost:**
- Included in VM (single instance): ₹0 additional
- Dedicated VM: ₹1,500-2,000/month
- Managed Redis: ₹1,000-1,500/month

---

### 4. **Nginx Web Server & Reverse Proxy**
**Purpose:**
- Reverse proxy for Django application
- Load balancing (for multi-server setup)
- SSL/TLS termination
- Static file serving
- CDN integration

**Requirements:**
- Nginx 1.18+
- SSL certificates (Let's Encrypt - free)
- Load balancing configuration
- Static file caching

**Scaling:**
- Included in VM setup
- Can be on dedicated load balancer VM for multi-server setup

---

## 🔌 Third-Party Integration Services

### 5. **WhatsApp Business API (WAHA - Self-Hosted on Utho)**
**Purpose:** WhatsApp messaging integration for customer communication

**Requirements:**
- WAHA (WhatsApp HTTP API) server on dedicated Utho VM
- Session management
- Message templates
- Webhook support

**VM Specifications:**
- CPU: 2-4 cores
- RAM: 4-8 GB
- Storage: 50-100 GB SSD
- Bandwidth: 500 GB-1 TB/month

**Configuration:**
- WAHA server installation on Utho VM
- `WAHA_BASE_URL`: Internal Utho VM URL
- `WAHA_SESSION`: Session identifier
- `WAHA_API_KEY`: API authentication key

**Scaling:**
- **Single VM:** ₹2,000-3,000/month (up to 10,000 messages/day)
- **Dedicated VM:** ₹2,500-3,500/month (up to 50,000 messages/day)
- **High Traffic:** 2x VMs with load balancing (₹5,000-7,000/month)

---

### 6. **Runo Telephony Service (Self-Hosted on Utho)**
**Purpose:** Voice calling, SMS, and WebRTC integration

**Requirements:**
- Runo telephony server on dedicated Utho VM
- WebRTC support for browser-to-phone calling
- Call recording capabilities
- Webhook support for call events
- SIP trunk configuration

**VM Specifications:**
- CPU: 2-4 cores
- RAM: 4-8 GB
- Storage: 50-100 GB SSD
- Bandwidth: 500 GB-1 TB/month

**Configuration:**
- Runo server installation on Utho VM
- SIP credentials and trunk setup
- WebRTC configuration
- Call recording storage

**Scaling:**
- **Single VM:** ₹2,000-3,000/month (up to 50 concurrent calls)
- **Dedicated VM:** ₹2,500-3,500/month (up to 100 concurrent calls)
- **High Availability:** 2x VMs with load balancing (₹5,000-7,000/month)

---

### 7. **Email Service (SMTP - Self-Hosted on Utho)**
**Purpose:** Transactional emails, notifications, reports

**Requirements:**
- Postfix/Sendmail SMTP server on Utho VM
- Email templates
- Delivery tracking
- Spam filtering (SpamAssassin)

**VM Specifications:**
- Can be on application VM (included)
- Or dedicated VM: ₹1,500-2,000/month

**Scaling:**
- **On Application VM:** ₹0 additional (up to 1,000 emails/day)
- **Dedicated VM:** ₹1,500-2,000/month (up to 10,000 emails/day)

---

### 8. **Data Export Service (Self-Hosted on Utho)**
**Purpose:** Data export to CSV, Excel, and other formats

**Requirements:**
- Export service on application VM
- CSV/Excel generation
- Scheduled export jobs
- File storage

**Scaling:**
- Included in application VM: ₹0 additional
- Storage: Included in VM storage

---

## 📱 Push Notification Services

### 9. **Web Push Notifications (VAPID)**
**Purpose:** Browser push notifications for real-time alerts

**Requirements:**
- VAPID keys (public/private)
- Service worker support
- Browser notification permissions

**Scaling:**
- Self-hosted (no external service needed)
- Included in application

---

## 🛒 E-commerce Integration Services

### 10. **E-commerce Platform Integrations (API-Based)**
**Purpose:** Sync products, orders, and customers from e-commerce platforms

**Supported Platforms:**
- **Dukaan**
- **QuickSell**
- **Shopify**
- **WooCommerce**

**Requirements:**
- API credentials for each platform (external)
- Webhook endpoints (on Utho VM)
- Sync scheduling (Celery on Utho VM)

**Scaling:**
- Webhook handling: Included in application VM
- API calls: External services (not on Utho)
- Sync processing: Uses application VM resources

---

## 💳 Payment Gateway Integration (API-Based)
**Purpose:** Payment processing for orders and transactions

**Requirements:**
- Payment gateway API credentials (external)
- Webhook endpoints (on Utho VM)
- PCI compliance considerations

**Options:**
- Razorpay
- Stripe
- PayPal
- Other payment gateways

**Scaling:**
- Webhook handling: Included in application VM
- Payment processing: External service (not on Utho)
- Transaction fees: Pay-per-transaction (external)

---

## 📊 Monitoring & Analytics Services

### 11. **Application Monitoring** (Optional but Recommended)
**Purpose:** Performance monitoring, error tracking, uptime monitoring

**Options:**
- **Free Options:**
  - Uptime Robot (free tier)
  - Prometheus + Grafana (self-hosted on Utho VM)
  - System logs (built-in)

- **Paid Options:**
  - Datadog: ₹5,000-10,000/month
  - New Relic: ₹4,000-8,000/month
  - Grafana Cloud: ₹2,000-5,000/month

**Scaling:**
- Can start with free options
- Upgrade to paid for advanced features

---

### 12. **Backup Services (Utho Storage)**
**Purpose:** Automated database and file backups

**Requirements:**
- Automated daily backups
- Utho object storage or additional VM storage
- Backup retention (7-30 days)
- Quick restore capabilities

**Options:**
- **Self-hosted:** Backup scripts on Utho VM (₹0 additional)
- **Utho Object Storage:** ₹500-1,000/month (100-200 GB)
- **Additional VM Storage:** ₹200-500/month (100 GB)

**Scaling:**
- Start with self-hosted backups on VM
- Move to Utho object storage for redundancy

---

## 🌐 CDN & Static Asset Services

### 13. **Content Delivery Network (CDN - Nginx on Utho)**
**Purpose:** Fast static file delivery, DDoS protection

**Options:**
- **Nginx caching:** Free (on Utho VM) - Recommended
- **Dedicated CDN VM:** ₹1,500-2,500/month (for high traffic)

**Scaling:**
- Start with Nginx caching on application VM
- Add dedicated CDN VM for high traffic (10,000+ daily users)

---

## 🔒 Security Services

### 14. **SSL/TLS Certificates**
**Purpose:** HTTPS encryption

**Requirements:**
- Let's Encrypt (free) - recommended
- Auto-renewal setup
- Wildcard certificates (if needed)

**Scaling:**
- Free with Let's Encrypt
- Paid certificates: ₹2,000-5,000/year (if needed)

---

### 15. **Firewall & DDoS Protection (Utho)**
**Purpose:** Network security

**Requirements:**
- UFW firewall (built into Ubuntu)
- Utho DDoS protection (if available)
- Rate limiting (Nginx)
- Fail2ban for intrusion prevention

**Scaling:**
- Included in VM setup
- Utho network-level DDoS protection (if available)

---

## 📈 Scaling Architecture Recommendations

### **Phase 1: Single Server Setup (Current)**
**Services Required:**
1. ✅ 1x Utho VM (Application + Database + Redis + Nginx)
2. ✅ PostgreSQL (on VM)
3. ✅ Redis (on VM)
4. ✅ Nginx (on VM)
5. ✅ SSL Certificate (Let's Encrypt - free)
6. ✅ Email Service (Postfix on VM)
7. ✅ Backup Storage (on VM)

**Monthly Cost:** ₹2,500-3,500/month
**Capacity:** 50-100 concurrent users
**Data Capacity:** Up to 5,000 customers

---

### **Phase 2: Optimized Single Server**
**Additional Services:**
1. ✅ Upgrade VM resources (2x capacity)
2. ✅ Nginx CDN caching (on VM)
3. ✅ Automated backups (self-hosted)
4. ✅ Basic monitoring (Prometheus on VM)
5. ✅ WhatsApp WAHA (on same VM or separate)

**Monthly Cost:** ₹4,000-5,500/month
**Capacity:** 100-200 concurrent users
**Data Capacity:** Up to 10,000 customers

---

### **Phase 3: Multi-Server High Availability**
**Services Required:**
1. ✅ 2x Application VMs
2. ✅ 1x Load Balancer VM (HAProxy/Nginx)
3. ✅ 1x Dedicated Database VM
4. ✅ 1x Redis VM (or cluster)
5. ✅ 1x WhatsApp WAHA VM
6. ✅ 1x Runo Telephony VM
7. ✅ Database read replicas
8. ✅ Utho object storage for backups
9. ✅ Advanced monitoring (Prometheus + Grafana)

**Monthly Cost:** ₹12,000-18,000/month
**Capacity:** 500-1,000 concurrent users
**Data Capacity:** 50,000+ customers

---

## 📋 Service Priority Matrix

### **Critical (Must Have)**
1. ✅ Utho VM(s) - Application hosting
2. ✅ PostgreSQL Database
3. ✅ Redis Cache
4. ✅ Nginx Web Server
5. ✅ SSL Certificate
6. ✅ Email Service (SMTP)

### **Important (Should Have)**
7. ⚠️ WhatsApp Integration (WAHA - Self-hosted on Utho)
8. ⚠️ Runo Telephony (Self-hosted on Utho)
9. ⚠️ Automated Backups (Utho storage)
10. ⚠️ Basic Monitoring (Prometheus on Utho)

### **Optional (Nice to Have)**
11. 💡 Dedicated CDN VM (for high traffic)
12. 💡 Advanced Monitoring (Grafana on Utho)
13. 💡 Utho Object Storage (for backups)
14. 💡 Load Balancer VM (for multi-server)
15. 💡 Database Read Replicas

---

## 🚦 When to Scale Horizontally

### **Horizontal Scaling Triggers**

#### **1. Application Server Scaling**
**Trigger When:**
- CPU usage consistently > 70% for 1+ hour
- Memory usage > 80% for extended periods
- Response time > 500ms (p95)
- Concurrent users > 80% of capacity
- Error rate > 1%

**Action:** Add second application VM + Load Balancer

#### **2. Database Scaling**
**Trigger When:**
- Database CPU > 70%
- Database connections > 80% of max
- Query response time > 200ms (average)
- Database size > 50 GB
- Read queries > 10,000/hour

**Action:** Move to dedicated database VM + Read replicas

#### **3. Redis Scaling**
**Trigger When:**
- Redis memory usage > 80%
- Cache hit rate < 70%
- Redis CPU > 70%
- Session timeouts increasing

**Action:** Move to dedicated Redis VM or cluster

#### **4. Storage Scaling**
**Trigger When:**
- Disk usage > 80%
- Backup size > 50 GB
- Media files > 20 GB

**Action:** Add additional storage or move to object storage

#### **5. Traffic Scaling**
**Trigger When:**
- Daily active users > 1,000
- Requests/second > 100
- Bandwidth usage > 80% of limit
- Peak traffic causing slowdowns

**Action:** Add CDN VM or additional application servers

---

## 💰 Cost Summary - All Utho Services

### **Minimum Setup (Single Server)**
- VM: ₹2,000-3,000/month
- Domain: ₹500-1,000/year
- SSL: Free (Let's Encrypt)
- **Total: ₹2,000-3,000/month**

### **Recommended Setup (Optimized)**
- VM: ₹3,000-4,000/month
- WhatsApp WAHA VM: ₹2,000-3,000/month
- Domain: ₹500-1,000/year
- SSL: Free
- Backups: ₹500/month (object storage)
- **Total: ₹5,500-7,500/month**

### **Enterprise Setup (Multi-Server)**
- 2x Application VMs: ₹6,000-8,000/month
- 1x Load Balancer VM: ₹1,500-2,000/month
- 1x Database VM: ₹2,500-3,500/month
- 1x Redis VM: ₹1,500-2,000/month
- 1x WhatsApp WAHA VM: ₹2,000-3,000/month
- 1x Runo Telephony VM: ₹2,500-3,500/month
- Object Storage: ₹1,000/month
- **Total: ₹17,000-23,000/month**

---

## ✅ Next Steps

1. **Start with Phase 1** (Single Server)
2. **Monitor performance** for 1-2 months
3. **Optimize** based on actual usage
4. **Scale** when reaching 80% capacity
5. **Add services** as needed (CDN, monitoring, etc.)

---

---

## 📊 Detailed Cost Breakdown: 10K Customers, 3 Tenants Scenario

### **Scenario Details:**
- **Total Customers:** 10,000
- **Tenants:** 3 (Mangatrai, Sarkar, Zinzuwadia)
- **Average Customers per Tenant:** ~3,333
- **Estimated Concurrent Users:** 30-50 per tenant (90-150 total)
- **Daily Active Users:** 200-300
- **Data Size:** ~5-10 GB

---

### **Level 1: Single Server Setup (Recommended Start)**

**Infrastructure:**
- 1x Utho VM (4 CPU, 8 GB RAM, 100 GB SSD): ₹3,500/month
  - Application server
  - PostgreSQL database
  - Redis cache
  - Nginx web server
  - Email service (Postfix)
  - Backup storage

**Services Included:**
- PostgreSQL 15+ (on VM)
- Redis 6.0+ (on VM)
- Nginx reverse proxy
- SSL certificate (Let's Encrypt - free)
- Email service (Postfix - free)
- Basic monitoring (Prometheus - free)

**Total Monthly Cost:** ₹3,500/month
**Per Tenant Cost:** ₹1,167/month (₹3,500 ÷ 3)

**Capacity:**
- ✅ Supports 10K customers comfortably
- ✅ 100-150 concurrent users
- ✅ 3 tenants with data isolation
- ✅ Up to 20 GB database size

**When to Scale:** 
- When concurrent users > 120
- When database size > 15 GB
- When CPU > 70% consistently

---

### **Level 2: Optimized Single Server + WhatsApp**

**Infrastructure:**
- 1x Application VM (4 CPU, 8 GB RAM, 100 GB SSD): ₹3,500/month
- 1x WhatsApp WAHA VM (2 CPU, 4 GB RAM, 50 GB SSD): ₹2,000/month

**Services:**
- All Level 1 services
- WhatsApp Business API (self-hosted)

**Total Monthly Cost:** ₹5,500/month
**Per Tenant Cost:** ₹1,833/month (₹5,500 ÷ 3)

**Capacity:**
- ✅ Supports 10K customers
- ✅ 150-200 concurrent users
- ✅ WhatsApp messaging enabled
- ✅ Up to 30 GB database size

**When to Scale:**
- When concurrent users > 180
- When WhatsApp messages > 5,000/day
- When database queries slow down

---

### **Level 3: Separated Services (Database + WhatsApp)**

**Infrastructure:**
- 1x Application VM (4 CPU, 8 GB RAM, 100 GB SSD): ₹3,500/month
- 1x Database VM (4 CPU, 8 GB RAM, 150 GB SSD): ₹3,500/month
- 1x WhatsApp WAHA VM (2 CPU, 4 GB RAM, 50 GB SSD): ₹2,000/month
- 1x Redis VM (2 CPU, 4 GB RAM, 50 GB SSD): ₹2,000/month

**Services:**
- Dedicated database for better performance
- Dedicated Redis for caching
- WhatsApp messaging

**Total Monthly Cost:** ₹11,000/month
**Per Tenant Cost:** ₹3,667/month (₹11,000 ÷ 3)

**Capacity:**
- ✅ Supports 20K+ customers
- ✅ 200-300 concurrent users
- ✅ Better database performance
- ✅ Up to 50 GB database size

**When to Scale:**
- When concurrent users > 250
- When database size > 40 GB
- When need high availability

---

### **Level 4: High Availability (Multi-Server)**

**Infrastructure:**
- 2x Application VMs (4 CPU, 8 GB RAM each): ₹7,000/month
- 1x Load Balancer VM (2 CPU, 4 GB RAM): ₹1,500/month
- 1x Database VM (4 CPU, 8 GB RAM, 200 GB SSD): ₹3,500/month
- 1x Database Read Replica (4 CPU, 8 GB RAM, 200 GB SSD): ₹3,500/month
- 1x Redis VM (2 CPU, 4 GB RAM): ₹2,000/month
- 1x WhatsApp WAHA VM (2 CPU, 4 GB RAM): ₹2,000/month
- 1x Runo Telephony VM (2 CPU, 4 GB RAM): ₹2,500/month
- Utho Object Storage (200 GB): ₹1,000/month

**Services:**
- High availability setup
- Load balancing
- Database read replicas
- Telephony service
- Automated backups

**Total Monthly Cost:** ₹22,000/month
**Per Tenant Cost:** ₹7,333/month (₹22,000 ÷ 3)

**Capacity:**
- ✅ Supports 50K+ customers
- ✅ 500-1,000 concurrent users
- ✅ High availability
- ✅ Up to 200 GB database size
- ✅ Zero downtime deployments

**When to Scale:**
- When concurrent users > 800
- When database size > 150 GB
- When need geographic distribution

---

### **Level 5: Enterprise Scale (Maximum)**

**Infrastructure:**
- 3x Application VMs (4 CPU, 8 GB RAM each): ₹10,500/month
- 1x Load Balancer VM (4 CPU, 8 GB RAM): ₹3,500/month
- 1x Primary Database VM (8 CPU, 16 GB RAM, 500 GB SSD): ₹7,000/month
- 2x Database Read Replicas (4 CPU, 8 GB RAM each): ₹7,000/month
- 1x Redis Cluster (3x VMs, 2 CPU, 4 GB RAM each): ₹6,000/month
- 2x WhatsApp WAHA VMs (2 CPU, 4 GB RAM each): ₹4,000/month
- 2x Runo Telephony VMs (2 CPU, 4 GB RAM each): ₹5,000/month
- 1x CDN VM (2 CPU, 4 GB RAM): ₹2,000/month
- Utho Object Storage (500 GB): ₹2,500/month
- Monitoring VM (Prometheus + Grafana): ₹2,000/month

**Total Monthly Cost:** ₹50,500/month
**Per Tenant Cost:** ₹16,833/month (₹50,500 ÷ 3)

**Capacity:**
- ✅ Supports 100K+ customers
- ✅ 1,000-2,000 concurrent users
- ✅ Maximum high availability
- ✅ Up to 500 GB database size
- ✅ Global CDN distribution

---

## 💰 Cost Summary Table (10K Customers, 3 Tenants)

| Level | Setup | Monthly Cost | Per Tenant | Capacity | When to Use |
|-------|-------|--------------|-------------|----------|-------------|
| **Level 1** | Single Server | ₹3,500 | ₹1,167 | 10K customers, 100-150 users | **START HERE** |
| **Level 2** | + WhatsApp | ₹5,500 | ₹1,833 | 10K customers, 150-200 users | Need WhatsApp |
| **Level 3** | Separated Services | ₹11,000 | ₹3,667 | 20K customers, 200-300 users | Performance issues |
| **Level 4** | High Availability | ₹22,000 | ₹7,333 | 50K customers, 500-1,000 users | Need HA |
| **Level 5** | Enterprise | ₹50,500 | ₹16,833 | 100K+ customers, 1,000-2,000 users | Maximum scale |

---

## 📈 Scaling Decision Tree

```
START: 10K Customers, 3 Tenants
│
├─ Level 1 (₹3,500/month) ✅ RECOMMENDED START
│  └─ Single VM with all services
│  └─ Scale when: Users > 120, DB > 15GB, CPU > 70%
│
├─ Level 2 (₹5,500/month)
│  └─ Add WhatsApp WAHA VM
│  └─ Scale when: WhatsApp messages > 5K/day
│
├─ Level 3 (₹11,000/month)
│  └─ Separate Database + Redis
│  └─ Scale when: DB performance issues, Users > 250
│
├─ Level 4 (₹22,000/month)
│  └─ High Availability + Load Balancer
│  └─ Scale when: Need zero downtime, Users > 500
│
└─ Level 5 (₹50,500/month)
   └─ Enterprise scale with all optimizations
   └─ Scale when: Users > 1,000, Global distribution
```

---

## 🎯 Recommended Path for 10K Customers, 3 Tenants

### **Month 1-3: Level 1 (Single Server)**
- **Cost:** ₹3,500/month total, ₹1,167/tenant
- **Why:** Perfect for 10K customers, 3 tenants
- **Monitor:** CPU, memory, database size, response times

### **Month 4-6: Level 2 (Add WhatsApp)**
- **Cost:** ₹5,500/month total, ₹1,833/tenant
- **Why:** If WhatsApp messaging is needed
- **Monitor:** WhatsApp message volume, VM performance

### **Month 7-12: Level 3 (Separated Services)**
- **Cost:** ₹11,000/month total, ₹3,667/tenant
- **Why:** If growing beyond 15K customers or performance issues
- **Monitor:** Database performance, concurrent users

### **Year 2+: Level 4 (High Availability)**
- **Cost:** ₹22,000/month total, ₹7,333/tenant
- **Why:** If need zero downtime, 20K+ customers, or high traffic
- **Monitor:** Uptime requirements, traffic patterns

---

## 📝 Notes

- All prices are approximate and in Indian Rupees (₹)
- **All services are hosted on Utho VMs** (no external dependencies)
- Costs are shared equally among 3 tenants
- Start with Level 1 and scale based on actual usage
- Monitor metrics for 1-2 months before scaling
- Scale when reaching 80% of capacity
- Database and Redis can be on same VM initially
- WhatsApp and Runo can be added as separate VMs when needed

---

**Last Updated:** January 2025
**Document Version:** 2.0
**Scenario:** 10K Customers, 3 Tenants (Mangatrai, Sarkar, Zinzuwadia)

