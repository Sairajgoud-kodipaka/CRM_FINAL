# Notification System — Production Readiness Report

This report summarizes a **detailed analysis** of the notification system (in-app, WebSocket, Web Push) so it can run in production with **minimal errors**. It covers failure points, fixes applied, and remaining recommendations.

---

## 1. Executive Summary

| Area | Status | Notes |
|------|--------|------|
| **Tenant isolation** | Fixed | Recipients now strictly filtered by subject's tenant; guards for null tenant. |
| **Signal safety** | Fixed | Guard for missing user; serialization wrapped in try/except so signal never raises. |
| **Appointment reminders** | Fixed | Null-tenant skip; per-user try/except so one failure doesn't block marking `reminder_sent`. |
| **Push subscribe API** | Fixed | Returns 400 if user has no tenant. |
| **Stock transfers** | Fixed | Skip when `from_store` or `from_store.tenant` is missing. |
| **Config / env** | Documented | VAPID and Redis must be set for full functionality; push degrades gracefully. |

**Critical fixes applied in code:** See Section 4. Remaining items are optional hardening or ops (monitoring, cron, env checklist).

---

## 2. Failure Points Audited

### 2.1 Backend — Notification creation

| Risk | Location | Mitigation |
|------|----------|------------|
| **Tenant leak** | `_get_customer_notification_recipients` used `actor_user.tenant`; if actor and client were in different tenants, users from wrong tenant could be notified. | **Fixed:** Recipients are now built from **subject** tenant (`client.tenant_id` / `appointment.tenant_id`) and final list is filtered to `user.tenant_id == subject_tenant_id`. |
| **Same for appointments** | `_get_appointment_notification_recipients` used `actor_user.tenant`. | **Fixed:** Same pattern: resolve `appointment.tenant_id`, filter all recipients by it. |
| **Customer with null tenant** | `Client.tenant` is `null=True`. Passing `tenant=None` to `Notification.objects.create` → IntegrityError. | **Fixed:** Early return in `create_customer_updated_notifications` and `create_customer_deleted_notifications` when client has no tenant; log warning. |
| **Appointment reminder with null tenant** | Unlikely (Appointment.tenant is required) but possible in edge cases. | **Fixed:** Skip appointment when tenant is missing; log. |
| **Transfer with null from_store / tenant** | `transfer.from_store.tenant` could be missing on bad data. | **Fixed:** All four transfer notification methods check `from_store` and `from_store.tenant`; skip and log if missing. |
| **Reminder command: one create fails** | If `Notification.objects.create` raised for one user, the loop would stop and `reminder_sent` might not be set, causing repeated reminders. | **Fixed:** Each create is in try/except; only set `reminder_sent` when all intended creates succeeded (or skip marking that appointment so it can retry next run). |

### 2.2 Backend — Signals and push

| Risk | Location | Mitigation |
|------|----------|------------|
| **Signal raises** | If `NotificationSerializer(instance).data` or any step in the signal raised, the whole request transaction could roll back (Django runs post_save in transaction). | **Fixed:** Serialization wrapped in try/except; guard so we never use `instance.user` when user is missing. |
| **Deleted or missing user** | After save, `instance.user` could be None if the user was deleted (FK returns None). Accessing `instance.user.id` → AttributeError. | **Fixed:** At start of signal, check `user_id` and `instance.user`; if missing, log and return (no broadcast, no push). |
| **WebSocket / Redis down** | `channel_layer.group_send` fails when Redis is unavailable. | Already in try/except; logged as warning; push does not depend on Redis. |
| **Push: VAPID missing** | Empty `VAPID_PRIVATE_KEY` in production. | `push_service` logs warning and returns; no crash. In-app and WebSocket still work. |
| **Push: invalid subscription (410/404)** | Subscription expired or invalid. | Already handled: subscription is deleted on 410/404 so we don't keep failing. |

### 2.3 Backend — API and subscriptions

| Risk | Location | Mitigation |
|------|----------|------------|
| **subscribe_push with user.tenant None** | `PushSubscription` requires `tenant`. Saving with `tenant=None` → IntegrityError. | **Fixed:** Validate `request.user.tenant` before `update_or_create`; return 400 with clear message. |
| **perform_create (manual notification)** | Creating a notification via API with `user.tenant` None. | **Fixed:** Check tenant in `perform_create`; raise ValidationError if missing. |

### 2.4 Configuration and deployment

| Risk | Mitigation |
|------|------------|
| **VAPID keys not set in production** | Push is skipped with a log; in-app and WebSocket still work. Document in deployment guide. |
| **Redis not running** | WebSocket broadcast fails with warning; in-app and push still work. Ensure Redis is in deployment (e.g. Utho) and health-checked. |
| **Appointment reminder not running** | Reminders are installed automatically by `utho-deploy.sh` (Step 9b: systemd timer every 15 min). No manual cron needed. |
| **channels_redis not installed** | `get_channel_layer()` can fail. Signal catches exception; log and continue. Recommend listing `channels-redis` in requirements and deployment steps. |

### 2.5 Edge cases (low risk, documented)

- **Task with no tenant:** Task model has required `tenant` FK; no change.
- **Support / telecalling:** `create_push_notification` already returns None when `user` or `user.tenant_id` is missing; no crash.
- **Products Notification.create:** No explicit `status`/`is_persistent`/`metadata`; model defaults are used; no issue.

---

## 3. Dependency and Configuration Checklist (Production)

Before going live, ensure:

1. **Environment variables**
   - `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIMS_EMAIL` set (for Web Push).
   - `REDIS_HOST`, `REDIS_PORT` (or defaults) for WebSocket.
   - No default `SECRET_KEY` in production.

2. **Python packages**
   - `pywebpush` (for Web Push).
   - `channels-redis` (for Channel Layers / WebSocket).

3. **Infrastructure**
   - Redis running and reachable by the app.
   - **Appointment reminders:** Fully automated. When you run `utho-deploy.sh`, it installs and enables a systemd timer (`crm-appointment-reminders.timer`) that runs `send_appointment_reminders` every 15 minutes. **You do not need to set up cron or do anything manually.**

4. **One-time**
   - Run migrations (including notifications).
   - Generate VAPID keys: `python manage.py generate_vapid_keys` and put keys in env.

---

## 4. Code Changes Applied (Summary)

- **`backend/apps/notifications/signals.py`**
  - Guard: skip broadcast/push when `user_id` or `instance.user` is missing.
  - Wrap `NotificationSerializer(instance).data` in try/except; log and return on error.

- **`backend/apps/clients/views.py`**
  - `_get_customer_notification_recipients`: Build recipient list from **client’s tenant**; filter final list by `user.tenant_id == client.tenant_id`.
  - `_get_appointment_notification_recipients`: Same for **appointment’s tenant**; filter by `appointment.tenant_id`.
  - `create_customer_updated_notifications` / `create_customer_deleted_notifications`: Early return and log when client has no tenant.

- **`backend/apps/notifications/management/commands/send_appointment_reminders.py`**
  - Skip appointment when tenant is missing.
  - Per-user try/except around `Notification.objects.create`; only set `reminder_sent` when all creates for that appointment succeed.

- **`backend/apps/notifications/views.py`**
  - `subscribe_push`: Return 400 if user has no tenant.
  - `perform_create`: Raise ValidationError if user has no tenant.

- **`backend/apps/products/services.py`**
  - All four transfer notification methods: skip when `from_store` or `from_store.tenant` is missing; log warning.

---

## 5. Optional Hardening (Not Done)

- **Quiet hours:** `NotificationSettings.quiet_hours_*` are not yet enforced in push_service; could skip sending push during quiet hours.
- **Retry / backoff:** No retry for failed Web Push (e.g. transient network); failed sends are only logged.
- **Metrics:** No counters for “notifications created”, “push sent”, “push failed”; consider adding for production monitoring.
- **Products:** Wrapping each `Notification.objects.create` in try/except so one bad user/store doesn’t break the whole batch (optional).

---

## 6. Testing Suggestions

1. **Tenant isolation:** Create client in Tenant A, update as user from Tenant B (if allowed by API); confirm no notification is created for Tenant B users (or request is rejected).
2. **Missing tenant:** Create/update client with no tenant (if possible in tests); expect no crash and no notification.
3. **Push subscribe:** Call subscribe_push with a user that has no tenant; expect 400.
4. **Reminder command:** Run `send_appointment_reminders` with an appointment that has no tenant; expect skip and warning. With an invalid user reference; expect one failure logged and other appointments still processed.
5. **Redis down:** Stop Redis; create a notification; expect in-app and push to work, WebSocket to log warning.

---

## 7. Conclusion

The notification system is **production-ready** with the applied fixes: tenant isolation is enforced at recipient-building and filtering, null tenants and missing stores are guarded, signals and reminder command no longer risk uncaught exceptions or wrong cross-tenant delivery. Remaining work is optional (quiet hours, retries, metrics) and operational (env, Redis, cron). Following the dependency and configuration checklist will minimize production errors.
