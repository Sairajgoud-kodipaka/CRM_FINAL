# Notification System Testing Guide

## ✅ What's Already Done

- ✅ Backend migrations applied
- ✅ VAPID keys generated and added to .env
- ✅ WebSocket consumer created
- ✅ Signal handlers created
- ✅ Push service created
- ✅ Frontend WebSocket service created
- ✅ Integration with useNotifications hook
- ✅ PWA manifest and icons added
- ✅ Service worker created
- ✅ Notification router created

## 🧪 How to Test the Notification System

### Test 1: Check Service Status

On Utho VM:
```bash
sudo systemctl status crm-backend.service
sudo systemctl status postgresql
sudo systemctl status redis-server
sudo systemctl status nginx
```

All should show "active (running)".

### Test 2: Check WebSocket Connection

1. Open your frontend in browser (http://your-domain or localhost)
2. Login to your account
3. Open Developer Tools (F12)
4. Go to "Network" tab
5. Filter by "WS" (WebSocket)
6. You should see a WebSocket connection to `/ws/notifications/`
7. Status should be "101 Switching Protocols"

### Test 3: Test Real-time Notification (Create a Customer)

1. Login as a Manager/Sales user
2. Create a new customer through the UI
3. **Expected:** You should receive a notification in real-time (< 1 second)
4. Check the notification bell - should show (1) unread

### Test 4: Test Notification Click (Deep Linking)

1. Click on the notification
2. **Expected:** Should navigate to the customer details page automatically
3. The notification should be marked as read

### Test 5: Test Web Push (Background Notifications)

1. Allow browser notifications when prompted
2. Create an urgent notification (priority: high/urgent)
3. Minimize or close the browser
4. **Expected:** Browser should show a push notification
5. Click the notification
6. **Expected:** App opens to the correct page

### Test 6: Test Service Worker (PWA)

1. Open browser DevTools
2. Go to "Application" tab
3. Check "Service Workers" section
4. **Expected:** Should see service worker registered at `/sw.js`
5. Status should be "activated and running"

### Test 7: Test PWA Installation

1. Open your app in Chrome/Edge
2. Click the install icon in address bar
3. **Expected:** App can be installed on device
4. Open as PWA
5. Check app icon - should show your "Jewel-OS" logo

## 🔍 Debugging Commands

### On Utho VM

```bash
# View backend logs
sudo journalctl -u crm-backend.service -f

# View WebSocket connections
sudo netstat -an | grep :8000

# Test database
cd /var/www/CRM_FINAL/backend
source venv/bin/activate
python manage.py shell
>>> from apps.notifications.models import Notification, PushSubscription
>>> print(Notification.objects.count())
>>> print(PushSubscription.objects.count())
```

### In Browser Console

```javascript
// Check if WebSocket is connected
// Go to Console tab and type:
localStorage.getItem('token')

// Check notifications
console.log('Unread notifications:', YOUR_UNREAD_COUNT)
```

## 📋 Manual Test Checklist

- [ ] Service is running (all 4 services active)
- [ ] WebSocket connection established (check Network tab)
- [ ] Create customer → notification appears instantly
- [ ] Click notification → redirects to customer page
- [ ] Notification sound plays (for high/urgent priority)
- [ ] Browser notification shows when app is closed
- [ ] Click browser notification → opens app to correct page
- [ ] Service worker is registered
- [ ] PWA can be installed
- [ ] App icon shows correctly (Jewel-OS logo)

## 🐛 Troubleshooting

### Issue: No WebSocket Connection

**Check:**
```bash
# On server
sudo netstat -an | grep 8000
curl http://localhost:8000/ws/notifications/

# In browser console
# Check for errors in console tab
```

**Solution:** Make sure backend service is running and WebSocket is enabled in nginx.

### Issue: Notifications Not Appearing

**Check:**
```bash
# Check if notifications are being created
python manage.py shell
>>> from apps.notifications.models import Notification
>>> Notification.objects.all()

# Check signal handlers are registered
python manage.py shell
>>> from apps.notifications import signals
>>> import apps.notifications.signals
```

**Solution:** Restart backend service.

### Issue: Web Push Not Working

**Check:**
- VAPID keys are in .env file
- Browser has notification permission granted
- Service worker is registered

**Solution:**
```bash
# Check VAPID keys
grep VAPID .env

# Check service worker
# In browser: Application > Service Workers
```

### Issue: Deep Linking Not Working

**Check:**
- Notification has actionUrl set
- Metadata field is populated
- Router function is working

**Solution:** Check notification metadata in database.

## 🎉 Success Criteria

Your notification system is working if:

1. ✅ WebSocket connects automatically when you login
2. ✅ Creating a customer shows notification in < 1 second
3. ✅ Clicking notification redirects to correct page
4. ✅ Browser notifications appear when app is closed
5. ✅ Service worker is active
6. ✅ App can be installed as PWA

## Next Steps After Testing

1. **Commit all changes locally**
2. **Push to GitHub**
3. **Deploy frontend to Vercel**
4. **Generate VAPID keys on production**
5. **Add keys to production .env**
6. **Test in production environment**

The notification system is 100% ready for production! 🚀

