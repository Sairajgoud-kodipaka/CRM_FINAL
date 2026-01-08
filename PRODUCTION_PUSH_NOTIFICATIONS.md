# Push Notifications - Production Setup Guide

## 🚀 Production Deployment Steps

### Step 1: Generate Production VAPID Keys

**Important:** Use different keys for production than development!

```bash
cd backend
python generate_vapid_keys.py
```

Save the output keys securely - you'll need them for production.

---

## Step 2: Set Environment Variables in Production

### Option A: Render.com

1. **Go to your Render Dashboard**
2. **Select your backend service**
3. **Go to "Environment" tab**
4. **Add these environment variables:**

```
VAPID_PRIVATE_KEY=your-production-private-key-here
VAPID_PUBLIC_KEY=your-production-public-key-here
VAPID_CLAIMS_EMAIL=mailto:admin@yourdomain.com
```

5. **Save and redeploy** your service

### Option B: Vercel (Frontend)

1. **Go to your Vercel project**
2. **Go to Settings → Environment Variables**
3. **Add environment variables** (if needed for frontend)

### Option C: Docker/VM Production

1. **SSH into your production server**
2. **Edit your `.env` file** or environment configuration:

```bash
# In production server
nano /path/to/your/app/.env
```

Add:
```env
VAPID_PRIVATE_KEY=your-production-private-key-here
VAPID_PUBLIC_KEY=your-production-public-key-here
VAPID_CLAIMS_EMAIL=mailto:admin@yourdomain.com
```

3. **Restart your application:**
```bash
# For Docker
docker-compose restart backend

# For systemd
sudo systemctl restart your-app

# For PM2
pm2 restart your-app
```

---

## Step 3: Verify HTTPS

**Push notifications require HTTPS in production!**

- ✅ Your domain must have SSL certificate
- ✅ URLs must start with `https://`
- ✅ Service worker must be served over HTTPS

**Check:**
- Visit your site: `https://yourdomain.com`
- Check browser console for service worker registration
- Look for: `[Service Worker] registered`

---

## Step 4: Update Frontend Configuration

### Check `jewellery-crm/src/lib/config.ts`:

Make sure your API URL is set correctly:

```typescript
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-domain.com',
  // ... other config
}
```

### For Vercel Deployment:

1. **Go to Vercel Dashboard → Your Project → Settings → Environment Variables**
2. **Add:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```
3. **Redeploy**

---

## Step 5: Test Production Setup

### 1. Test VAPID Endpoint

Visit in browser:
```
https://your-backend-domain.com/api/notifications/vapid_public_key/
```

Should return:
```json
{
  "public_key": "your-public-key-here"
}
```

### 2. Test Service Worker

1. **Open your production site**
2. **Open browser DevTools (F12)**
3. **Go to Application tab → Service Workers**
4. **Should see:** `sw.js` registered and active

### 3. Test Push Subscription

1. **Log in to your production app**
2. **Grant notification permission when prompted**
3. **Check browser console for:**
   ```
   [Push] Push notifications initialized successfully
   ```

### 4. Send Test Notification

**From Django Admin or API:**

```python
from apps.notifications.push_service import send_web_push
from apps.users.models import User

user = User.objects.get(username='your-username')
send_web_push(
    user_id=user.id,
    title="Production Test",
    message="Push notifications are working in production!",
    action_url="/customers"
)
```

---

## Step 6: Production Checklist

### Backend:
- [ ] VAPID keys set in environment variables
- [ ] `pywebpush` package installed
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Database migrations run
- [ ] `/api/notifications/vapid_public_key/` endpoint working

### Frontend:
- [ ] Service worker (`sw.js`) deployed
- [ ] HTTPS enabled
- [ ] API URL configured correctly
- [ ] Push notification service initialized
- [ ] Test notification received

### Security:
- [ ] VAPID private key NOT in code
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] CORS properly configured

---

## Common Production Issues

### Issue 1: "Service Worker registration failed"

**Solution:**
- Ensure HTTPS is enabled
- Check `sw.js` is accessible at `https://yourdomain.com/sw.js`
- Clear browser cache

### Issue 2: "VAPID public key not configured"

**Solution:**
- Verify environment variables are set in production
- Restart backend service
- Check backend logs for errors

### Issue 3: "Notifications not received"

**Solution:**
- Check user has granted permission
- Verify subscription exists in database
- Check backend logs for push errors
- Ensure user is logged in

### Issue 4: "CORS errors"

**Solution:**
- Add production frontend URL to `CORS_ALLOWED_ORIGINS` in Django settings
- Restart backend

---

## Production Environment Variables Template

### Backend (.env or Render Environment Variables):

```env
# VAPID Keys (Production)
VAPID_PRIVATE_KEY=your-production-private-key
VAPID_PUBLIC_KEY=your-production-public-key
VAPID_CLAIMS_EMAIL=mailto:admin@yourdomain.com

# Other required variables
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=your-production-database-url
```

### Frontend (Vercel Environment Variables):

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## Monitoring Production

### Check Backend Logs:

```bash
# Render
# Go to Dashboard → Your Service → Logs

# Docker
docker logs your-backend-container

# Systemd
journalctl -u your-app -f
```

### Check Push Subscription Status:

```python
# Django shell
from apps.notifications.models import PushSubscription

# Count subscriptions
PushSubscription.objects.count()

# List all subscriptions
for sub in PushSubscription.objects.all():
    print(f"User: {sub.user.username}, Endpoint: {sub.endpoint[:50]}...")
```

---

## Security Best Practices

1. **Use different VAPID keys for production**
2. **Never commit keys to git**
3. **Use environment variables only**
4. **Rotate keys periodically (every 6-12 months)**
5. **Monitor for unauthorized notifications**
6. **Use HTTPS everywhere**

---

## Quick Production Setup Commands

### Render.com:
1. Dashboard → Your Service → Environment
2. Add VAPID keys
3. Save → Auto-redeploys

### Docker:
```bash
# Edit .env file
nano .env

# Add VAPID keys
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_CLAIMS_EMAIL=...

# Restart
docker-compose restart backend
```

### Manual Server:
```bash
# Export environment variables
export VAPID_PRIVATE_KEY="your-key"
export VAPID_PUBLIC_KEY="your-key"
export VAPID_CLAIMS_EMAIL="mailto:admin@domain.com"

# Restart application
sudo systemctl restart your-app
```

---

## Testing Production

1. **Visit production site**
2. **Log in**
3. **Grant notification permission**
4. **Send test notification from backend**
5. **Verify notification appears**

---

## Support

If issues persist:
1. Check backend logs
2. Check browser console
3. Verify environment variables are set
4. Test VAPID endpoint
5. Check service worker registration

**You're all set for production!** 🚀

