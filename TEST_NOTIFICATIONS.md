# Quick Testing Steps

## On Utho VM:

```bash
# 1. Restart backend service
cd /var/www/CRM_FINAL/backend
sudo systemctl restart crm-backend.service

# 2. Check service status
sudo systemctl status crm-backend.service

# 3. View logs in real-time
sudo journalctl -u crm-backend.service -f
```

## In Browser:

1. **Open your app** (http://your-ip or deployed URL)
2. **Login** with your credentials
3. **Open DevTools** (F12)
4. **Go to Network tab** → Filter "WS"
5. **Create a customer** through the UI
6. **Check:** Notification should appear instantly in the bell icon (top right)
7. **Click the notification** → Should navigate to customer details

## Success Indicators:

✅ WebSocket connects (check Network tab, should show `/ws/notifications/`)  
✅ Notification appears in < 1 second  
✅ Clicking notification redirects to correct page  
✅ Notification sound plays (if enabled)  
✅ Service worker registered (Application > Service Workers)

## If Not Working:

```bash
# Check backend logs
sudo journalctl -u crm-backend.service -n 50

# Check database
python manage.py shell
>>> from apps.notifications.models import Notification
>>> Notification.objects.all()
```

---

**Your notification system is ready! Test it now and let me know what you see.** 🚀

