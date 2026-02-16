# Push Notifications Guide – Jewel CRM

This document explains **all ways** to get push notifications in your Next.js + Django stack (Docker / Utho), what’s **free**, **limitations**, and how **paid services** work. It aligns with the [Web Push API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) and your existing self-hosted VAPID setup.

---

## 1. Free options (how many ways)

You have **two main free approaches**; your project already uses **Option A**.

### Option A: Self-hosted Web Push (VAPID) – **what you use today**

- **Stack:** Native browser **Push API** + **VAPID** keys + **pywebpush** (Django) + service worker (Next.js).
- **No Firebase**, no third-party SDK, no account with Google/Mozilla. You only depend on the browser’s built-in push service (Google for Chrome, Mozilla for Firefox, etc.) to deliver the message; you talk to it via standard HTTPS + VAPID.
- **Flow:**
  1. Generate VAPID keys locally (`python manage.py generate_vapid_keys`), put private key in Django `.env`, public key is served by your API.
  2. Next.js: register `/public/sw.js`, call `pushManager.subscribe({ applicationServerKey: vapidPublicKey })`, send the `PushSubscription` (endpoint + keys) to Django.
  3. Django: store subscription in `PushSubscription`, when you want to notify call `send_web_push(user_id, title, message, action_url)`; pywebpush signs with the private key and POSTs to the subscription endpoint.
- **Pros:** Free, no vendor lock-in, no Firebase console, everything in your repo and on your VM (Utho).
- **Cons:** You still rely on the browser’s push service (e.g. FCM for Chrome) for delivery; you don’t host that part.

### Option B: Firebase Cloud Messaging (FCM) – free tier

- **Stack:** Firebase project + **Firebase Admin SDK** in Django + **Firebase JS SDK** (or FCM HTTP v1) in Next.js + service worker.
- **Flow:** Frontend gets an FCM token (instead of a raw `PushSubscription`), sends token to Django; Django uses a **service account** and Firebase Admin (or FCM HTTP API) to send to that token.
- **Pros:** Same free messaging; optional Firebase Console for testing; good docs.
- **Cons:** Requires Firebase project, service account JSON in your backend, and (if you use the JS SDK) a dependency on Firebase in the frontend. For “no third-party” and “only in codebase,” Option A is simpler.

**Summary:** You can do push for free in **two main ways**: (1) **Self-hosted VAPID** (your current setup), (2) **FCM free tier**. Other free options (e.g. OneSignal free tier) are just wrappers around FCM/Web Push.

---

## 2. Your current implementation (Option A)

| Layer        | What you have |
|-------------|----------------|
| **Django** | `VAPID_*` in `core/settings.py`, `apps.notifications.push_service.send_web_push()`, `PushSubscription` model, endpoints: subscribe, unsubscribe, `vapid_public_key`. |
| **Next.js** | `pushNotificationService.ts` (Push API + VAPID), `PushNotificationInitializer`, `usePushNotifications`, `public/sw.js` (push + notification click). |
| **Keys**   | `python manage.py generate_vapid_keys` → set `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIMS_EMAIL` in `.env`. |

### What to do now (Option A checklist)

1. **Generate VAPID keys (one-time)**  
   In the backend directory:
   ```bash
   cd backend
   python manage.py generate_vapid_keys
   ```
   Copy the three lines it prints.

2. **Add keys to your environment**  
   - **Local (Docker):** Add to `backend/.env.dev` (or the `.env` file your Docker Compose uses):
     ```env
     VAPID_PRIVATE_KEY=<paste-private-key>
     VAPID_PUBLIC_KEY=<paste-public-key>
     VAPID_CLAIMS_EMAIL=mailto:admin@jewellerycrm.com
     ```
   - **Production (Utho):** Add the same three variables to your production env (e.g. in your deployment config or server `.env`).

3. **Restart backend**  
   Restart Django (or Docker services that run the backend) so it picks up the new env vars.

4. **Allow notifications in the browser**  
   Open your Next.js app (e.g. http://localhost:3001), log in, and when the browser asks “Allow notifications?”, click **Allow**. The app will then subscribe and send the subscription to Django.

5. **Verify**  
   - Backend: `cd backend` then `python manage.py shell` and run the test script (see `backend/test_push_notifications.py`) or call `send_web_push(user_id=<your_user_id>, title="Test", message="Hello")`.
   - Or in the browser console: `testPushNotifications()` (exposed by your app) to check subscription and permission.

6. **Trigger push from your code**  
   When something important happens (e.g. order ready, new lead), call `send_web_push()` from that view/signal/celery task (see code block below). Your `apps.notifications.signals` already sends a push when a new in-app notification is created; add more calls wherever you need them.

To **send** a notification from Django (e.g. “Jewel order ready”):

```python
from apps.notifications.push_service import send_web_push

send_web_push(
    user_id=request.user.id,
    title="Order ready",
    message="Order #123 is ready for pickup.",
    action_url="/orders/123",
)
```

No paid services or Firebase required.

### How, where, and when you get notifications (push-only)

- **How:** The browser’s **system notification** (OS tray). No bell icon or in-app toast in the CRM; delivery is via Web Push only.
- **Where:** On the **device/browser** where the user allowed notifications (desktop notification area or mobile notification shade). Clicking the notification can open your app (e.g. `action_url`).
- **When:** Every time a **Notification** is created in the DB for that user. The Django `post_save` signal on `Notification` calls `send_web_push()` for **all priorities** (low, medium, high, urgent). So any CRM/DB action that creates a `Notification` triggers a push.

**Scenarios that already send push (via `Notification.objects.create` + signal):**

| Scenario | App / location |
|----------|-----------------|
| New customer created | `apps.clients.views` – `create_customer_notifications()` |
| New appointment scheduled | `apps.clients.views` – `create_appointment_notification()` |
| Stock transfer request / approved / completed / cancelled | `apps.products.services` – transfer notifications |
| (Any other code that creates `apps.notifications.models.Notification`) | Same: push sent automatically |

To add push for a **new** scenario: create an `apps.notifications.models.Notification` for the target user (with `title`, `message`, `action_url`). No need to call `send_web_push()` directly; the signal does it.

### Push not received?

1. **Allow notifications in the browser**  
   When you open the CRM, the browser should prompt “Allow notifications?”. You must click **Allow**. If you previously chose “Block”, reset it: click the lock/info icon in the address bar → Site settings → Notifications → Allow, then reload the app.

2. **Subscribe and reload**  
   After allowing, **reload the page** (F5 or full refresh) so the app can register the service worker and send your push subscription to the backend. One reload is enough per browser/device.

3. **Check backend logs (Docker)**  
   When a notification is created, the backend logs one of:
   - `Sending web push for notification id=... to user_id=...` → push was attempted.
   - `Web Push skipped: no push subscription for user_id=...` → **you have no subscription**. Allow notifications and reload (steps 1–2), then trigger the action again.
   - `Web Push not configured: VAPID keys missing` → set `VAPID_PRIVATE_KEY` and `VAPID_PUBLIC_KEY` in the backend env (e.g. `backend/.env.dev` or Docker env) and restart the backend.
   - `Sent web push to user ...` → push was sent; if you still don’t see it, check OS/browser notification settings and that the tab isn’t in a state that suppresses notifications.

4. **Same user and browser**  
   Push is sent to the **user_id** that the backend associates with the notification (e.g. the creator, business admin, or store manager). The subscription is stored **per browser/device**. Use the same logged-in user and the same browser where you allowed notifications.

---

## 3. Limitations in notification delivery

These apply to **any** web push (VAPID or FCM).

| Limitation | Description |
|-----------|-------------|
| **Permission** | If the user blocks notifications, you cannot send until they re-enable in browser/OS settings. |
| **Browser support** | Works in modern Chrome, Firefox, Edge, Safari (desktop). Safari on **iOS** supports web push from **iOS 16.4** only for **installed PWAs** (Add to Home Screen). In-app Safari or other browsers on iOS may not support or may behave differently. |
| **Delivery infrastructure** | The actual “last mile” is done by the browser’s push service (e.g. Google/Mozilla). You cannot self-host that part. If that service is down, delivery can fail. |
| **Offline / TTL** | If the device is offline, the push service may queue and retry for a limited time (TTL). After that, the message can be dropped. |
| **Foreground vs background** | When the tab is in **background** or closed, the **service worker** receives the push and can show a system notification. When the tab is in **foreground**, your app typically handles the event and shows an in-app toast (your `sw.js` can still show a notification if you want). |
| **Quotas** | Per MDN, some browsers (e.g. Firefox) may apply quotas for push that don’t show a notification; notifications are often exempt. Chrome generally doesn’t enforce such limits. |
| **Endpoint secrecy** | The subscription endpoint is a capability URL: anyone with it could send pushes to that client. Keep endpoints only on your backend and treat them as sensitive (same as tokens). |

---

## 4. How paid services work

Paid offerings (OneSignal, Braze, Airship, etc.) usually sit **on top** of the same channels (FCM, Web Push, APNs):

- **What they add:**  
  - **Segmentation / audiences** (e.g. “users who didn’t log in for 7 days”) without writing all the logic yourself.  
  - **Scheduling, A/B tests, rich content.**  
  - **Analytics:** delivery rates, opens, clicks.  
  - **Dashboard:** non-developers can send campaigns.  
  - **Multi-channel:** push + email + SMS in one product.

- **How they work:**  
  Your app sends device tokens or subscription info to their API; you send campaigns via their API or UI. They call FCM/APNs/Web Push (or their own endpoints) on your behalf. You pay for volume or features, not for the underlying FCM/Web Push delivery itself.

- **For Jewel CRM:**  
  If you want **free and minimal third-party**, your current **self-hosted VAPID (Option A)** is the right choice. Paid services are only needed if you want advanced targeting, analytics, or a no-code campaign UI.

---

## 5. Security notes (from MDN)

- **CSRF/XSRF:** Your subscribe/unsubscribe endpoints should be protected (e.g. auth required, same-site or CORS + credentials). Your Django REST + JWT setup should already enforce auth.
- **Endpoint URL:** Treat the push subscription endpoint as secret; store it only on your backend and never expose it to the client beyond the initial save.
- **VAPID private key:** Only in Django env (e.g. `.env`), never in the frontend or in git.

---

## 6. Quick reference

| Goal | Approach |
|------|----------|
| Free, no Firebase, everything in your codebase | **Self-hosted VAPID (current)** ✅ |
| Free but okay with Firebase account + SDK | FCM free tier |
| Segmentation, analytics, no-code campaigns | Paid (OneSignal, etc.) |
| iOS Safari (non-PWA) | Limited; use PWA + “Add to Home Screen” for best support (iOS 16.4+). |

Your setup (VAPID + pywebpush + Next.js Push API + `sw.js`) is the standard way to do **free, self-hosted** web push without a full Firebase wrapper and fits Docker and Utho.
