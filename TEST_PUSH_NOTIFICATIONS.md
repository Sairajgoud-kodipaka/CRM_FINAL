# How to Test Push Notifications

## Step 1: Verify Backend Setup

### Check if VAPID keys are configured:

1. **Open Django shell:**
   ```bash
   # If using Docker:
   docker exec -it crm_final-backend-dev-1 python manage.py shell
   
   # Or locally:
   cd backend
   python manage.py shell
   ```

2. **Check VAPID configuration:**
   ```python
   from django.conf import settings
   
   print("VAPID_PRIVATE_KEY:", settings.VAPID_PRIVATE_KEY[:20] + "..." if settings.VAPID_PRIVATE_KEY else "NOT SET")
   print("VAPID_PUBLIC_KEY:", settings.VAPID_PUBLIC_KEY[:20] + "..." if settings.VAPID_PUBLIC_KEY else "NOT SET")
   print("VAPID_CLAIMS_EMAIL:", settings.VAPID_CLAIMS_EMAIL)
   ```

3. **Check if pywebpush is installed:**
   ```python
   try:
       from pywebpush import webpush
       print("✅ pywebpush is installed")
   except ImportError:
       print("❌ pywebpush is NOT installed - run: pip install pywebpush")
   ```

## Step 2: Verify Frontend Setup

### Check Browser Console:

1. **Open your application in browser** (Chrome/Edge/Firefox)
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Look for these messages:**
   - `[Push Service] Service Worker registered`
   - `[Push Service] Subscribed to push notifications`
   - `[Push] Push notifications initialized successfully`

### Check Service Worker:

1. **Open Developer Tools** (F12)
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Click on "Service Workers"** in the left sidebar
4. **You should see:**
   - Service Worker: `sw.js`
   - Status: **activated and running**
   - Scope: `/`

### Check Push Subscription:

1. **In Browser Console, run:**
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => {
     if (reg) {
       reg.pushManager.getSubscription().then(sub => {
         if (sub) {
           console.log("✅ Push subscription active:", sub.endpoint);
         } else {
           console.log("❌ No push subscription found");
         }
       });
     }
   });
   ```

## Step 3: Test Notification Permission

### Check Permission Status:

1. **In Browser Console:**
   ```javascript
   console.log("Notification permission:", Notification.permission);
   ```

   Should show: `"granted"`, `"denied"`, or `"default"`

2. **If permission is "default":**
   - The app should automatically request permission when you log in
   - Or manually trigger: Click on notification bell/icon in the app

## Step 4: Send a Test Notification

### Method 1: Using Django Admin/Shell

1. **Open Django shell:**
   ```bash
   docker exec -it crm_final-backend-dev-1 python manage.py shell
   ```

2. **Send test notification:**
   ```python
   from apps.notifications.push_service import send_web_push
   from apps.users.models import User
   
   # Get your user
   user = User.objects.first()  # Or User.objects.get(username='your_username')
   
   # Send test notification
   send_web_push(
       user_id=user.id,
       title="🧪 Test Notification",
       message="Push notifications are working! This is a test.",
       action_url="/customers",
       notification_id=None
   )
   
   print(f"✅ Test notification sent to user: {user.username}")
   ```

### Method 2: Using API Endpoint

Create a test endpoint or use Django admin to trigger a notification.

### Method 3: Using Browser Console (Manual Test)

1. **Open Browser Console**
2. **Run this code:**
   ```javascript
   // Request permission first
   Notification.requestPermission().then(permission => {
     if (permission === 'granted') {
       new Notification('Test Notification', {
         body: 'This is a manual test notification',
         icon: '/favicon.ico',
         badge: '/favicon.ico'
       });
       console.log('✅ Test notification shown');
     } else {
       console.log('❌ Permission denied');
     }
   });
   ```

## Step 5: Verify Notification Received

After sending a test notification:

1. **Check Browser:**
   - You should see a notification popup (even if app is in background)
   - Click on it - should navigate to the action URL

2. **Check Browser Console:**
   - Look for: `[Service Worker] Push received`
   - Look for: `[Service Worker] Notification clicked`

3. **Check Network Tab:**
   - Look for requests to `/api/notifications/subscribe_push/`
   - Should return `200 OK`

## Step 6: Check Backend Logs

### View Django logs:

```bash
# If using Docker:
docker logs crm_final-backend-dev-1 --tail 50

# Look for:
# - "Sent web push to user X"
# - "Web Push not enabled" (if keys missing)
# - Any error messages
```

## Common Issues & Solutions

### Issue 1: "Web Push not enabled: pywebpush not installed"

**Solution:**
```bash
# Install pywebpush
pip install pywebpush

# Or in Docker:
docker exec -it crm_final-backend-dev-1 pip install pywebpush
docker-compose -f docker-compose.dev.yml restart backend-dev
```

### Issue 2: "VAPID public key not configured"

**Solution:**
- Check `backend/core/settings.py` has VAPID keys
- Restart Django server/Docker container

### Issue 3: "Service Worker registration failed"

**Solution:**
- Check if `public/sw.js` file exists
- Check browser console for errors
- Ensure you're using HTTPS (or localhost for development)
- Clear browser cache and try again

### Issue 4: "Notification permission denied"

**Solution:**
- Go to browser settings
- Find site permissions
- Enable notifications for your domain
- Or reset permissions and try again

### Issue 5: "No push subscription found"

**Solution:**
- Check if user is logged in
- Check browser console for subscription errors
- Try manually subscribing (the app should do this automatically)
- Check if VAPID public key is correct

## Quick Test Checklist

- [ ] Backend: VAPID keys configured in settings
- [ ] Backend: pywebpush package installed
- [ ] Frontend: Service worker registered (check Application tab)
- [ ] Frontend: Push subscription active (check console)
- [ ] Browser: Notification permission granted
- [ ] Test: Can send notification from Django shell
- [ ] Test: Notification appears in browser
- [ ] Test: Clicking notification navigates correctly

## Automated Test Script

See `backend/test_push_notifications.py` for an automated test script.

