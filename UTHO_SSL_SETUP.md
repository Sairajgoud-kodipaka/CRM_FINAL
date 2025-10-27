# 🔒 SSL Setup for Jewellery CRM

## Problem: Mixed Content Warning

Your Vercel frontend (HTTPS) is calling your Utho backend (HTTP), causing "Not Secure" warnings.

---

## ✅ Solution: Enable HTTPS on Utho Backend

### **Method 1: CloudFlare (Recommended - Easiest)**

**Why:** Free, works immediately, no certificate installation needed.

#### Steps:

1. **Sign up for CloudFlare (Free)**
   - Go to: https://cloudflare.com
   - Sign up for free account

2. **Add Your Domain**
   - Add your domain
   - CloudFlare will scan your DNS
   - Update your A record to point to: `150.241.246.110`

3. **Enable Proxy (Orange Cloud)**
   - Make sure the cloud icon is **orange**
   - This enables SSL encryption

4. **Update API URL in Vercel**
   - Go to Vercel dashboard
   - Settings → Environment Variables
   - Change `NEXT_PUBLIC_API_URL` from:
     - OLD: `http://150.241.246.110`
     - NEW: `https://yourdomain.com` (or your CloudFlare subdomain)

5. **Redeploy Frontend**
   - Push to GitHub or click "Redeploy" in Vercel

**Done!** Your site will now be fully secure.

---

### **Method 2: Let's Encrypt SSL (More Work)**

For direct IP access or if you can't use CloudFlare.

#### On Your Utho Server:

```bash
# 1. Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# 2. Get SSL certificate
# For domain:
sudo certbot --nginx -d yourdomain.com

# For IP (if you have domain):
# Note: Let's Encrypt doesn't work with IP only, need domain

# 3. Certbot will automatically:
# - Install certificate
# - Update Nginx config
# - Setup auto-renewal

# 4. Test auto-renewal
sudo certbot renew --dry-run

# 5. Restart Nginx
sudo systemctl restart nginx
```

#### Limitations:
- ❌ Won't work for bare IP (150.241.246.110)
- ✅ Needs domain name
- ✅ Free SSL certificate

---

### **Method 3: Self-Signed Certificate (Not Recommended)**

Only for testing, browsers will still warn.

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx-selfsigned.key \
    -out /etc/nginx/ssl/nginx-selfsigned.crt

# Update Nginx config to use it
```

---

## 🎯 RECOMMENDED APPROACH

### **Use CloudFlare (Method 1)**

**Why?**
- ✅ Free
- ✅ Works in 5 minutes
- ✅ Works with IP address (no domain needed)
- ✅ DDoS protection included
- ✅ CDN included
- ✅ No server changes needed

**Steps:**
1. Sign up for CloudFlare free account
2. Point your domain to CloudFlare
3. Enable orange cloud (proxy)
4. Update Vercel environment variable to use `https://yourdomain.com`
5. Redeploy frontend

---

## 🚀 After SSL is Enabled

### **Update Vercel Environment Variables:**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings → Environment Variables**
4. Update `NEXT_PUBLIC_API_URL`:
   - OLD: `http://150.241.246.110`
   - NEW: `https://yourdomain.com`
5. Save and Redeploy

### **Test:**

```bash
# Check HTTPS is working
curl https://yourdomain.com/api/health/

# Should return:
# {"status": "healthy", "service": "jewellery-crm-backend"}
```

---

## 📋 Current Status

- ✅ Backend running on HTTP: `http://150.241.246.110:8000`
- ✅ Frontend running on HTTPS: `https://jewel-crm.vercel.app`
- ⚠️ Mixed content warning (HTTP backend called from HTTPS frontend)

**Fix:** Enable HTTPS on backend → Update Vercel API URL → Done!

---

## 💡 Quick Start (CloudFlare)

```bash
# 1. Go to CloudFlare and add domain
# 2. Point A record to: 150.241.246.110
# 3. Enable proxy (orange cloud)
# 4. Update Vercel env var: NEXT_PUBLIC_API_URL=https://yourdomain.com
# 5. Redeploy frontend
# Done!
```

**Time:** 5 minutes  
**Cost:** Free  
**Result:** Fully secure HTTPS everywhere ✅


