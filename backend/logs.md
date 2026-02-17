# logs.md

## 🎯 Purpose

This document defines the **production logging rules** for our Django backend running on Ubuntu/Utho VM.

Goals:

* Reduce logs from **100 noisy lines → ~10 meaningful lines**
* Keep logs simple for terminal usage
* Avoid VM overload (CPU, disk, I/O)
* Make logs easy for humans AND machines
* Ensure timezone consistency (India IST)

This file is also an instruction prompt for Cursor to refactor existing logs.

---

# 🇮🇳 Time & Date Configuration (MANDATORY)

India uses **IST (UTC +05:30)**.

Backend must follow:

```
TIME_ZONE = "Asia/Kolkata"
USE_TZ = True
```

### Important Rule

* Django stores time internally in UTC (safe)
* Logs and displayed timestamps must follow IST
* India has no daylight saving time

---

# 🧠 Core Logging Mindset

Logs must answer ONLY:

```
WHEN — WHERE — WHO — WHAT
```

Meaning:

* WHEN → timestamp
* WHERE → service (backend / nginx / postgres)
* WHO → user or system
* WHAT → event name

If a log contains more than this, it is probably bloated.

---

# 🧱 Production Log Protocol (Terminal Friendly)

All backend logs must follow a **single protocol**:

```
TIME | LEVEL | LOGGER | MESSAGE
```

Where:

- `TIME`   → `%(asctime)s` (IST)
- `LEVEL`  → `INFO` / `WARNING` / `ERROR`
- `LOGGER` → logger name (`crm`, `django.request`, `api_requests`, etc.)
- `MESSAGE` → **event-style string**:

```text
backend <domain>.<event> key=value ... note=<one-line summary>
```

Examples:

```text
08:21:33 | INFO  | crm | backend auth.login.success user_id=21 note=login ok
08:21:34 | INFO  | crm | backend appointments.fetch count=6 note=list fetched
08:21:35 | WARNING | crm | backend api.request.slow method=GET path=/api/clients/ status=200 duration_ms=1234.50 request_id=abcd1234 note=slow api request
08:21:45 | ERROR | crm | backend db.timeout request_id=abc123 note=database timeout
```
How to read issues from logs
Look at LEVEL first
ERROR: something failed and probably returned 5xx or a hard failure.
WARNING: something worked but is degraded (4xx, slow, retry, missing optional config).
INFO: normal operations; only look here when debugging a specific flow.
Then look at EVENT name
backend api.request.error_5xx → server bug / exception.
backend api.request.error_4xx → client/input problem.
backend telecalling.exotel.api_error / ...sms.api_error / ...tts.api_error → external provider issue.
backend whatsapp.send_text.failed / ...session.create_failed → WAHA/WhatsApp integration issue.
backend notifications.*.error → notification pipeline problem.
Use HTTP status codes to classify
status=4xx in api.request.error_4xx → fix the request (frontend/input/permissions).
status=5xx or event ends with .error / api_error → fix the backend or external service.
Use the extra fields to locate
method + path → which endpoint.
request_id → grep or filter all logs for that ID to see full flow.
client_id, user, phone, etc. → which CRM object / user was involved.
So when you see a problem:
Find the ERROR/WARNING line.
Read event (backend ...) + status=....
Use method, path, request_id, and IDs to know what failed where and whether it’s a client-side, backend, or external‑service issue.

Rules:

* One log = one line
* No multiline logs
* MESSAGE must always start with `backend` and an event name (`<domain>.<event>`)
* Use `key=value` pairs for extra context (`user_id=`, `client_id=`, `status=`, `request_id=`, etc.)
* End with a short **`note=...`** field for human summary where helpful

---

# 🚨 Current Problems (Must Be Fixed)

Current logs are overloaded because they:

* print serialized objects
* dump large payloads
* repeat warnings
* include debugging messages
* mix system + business logs

Examples to REMOVE:

```
=== METHOD START ===
Serialized data: [OrderedDict...]
Request URL:
Global Date Filter Applied:
```

---

# ❌ Forbidden Logs (Delete or Refactor)

Cursor must remove any log containing:

* Serialized data dumps
* OrderedDict output
* Full request metadata
* QuerySets
* Pagination debug logs
* Full customer data
* Notes or image URLs
* Multi-line debug sections

Never log business data payloads.

---

# ✅ Allowed Logging Events (CRM Style)

Logs must be business-action oriented.

## Auth Events

```
auth.login.success
auth.login.failed
auth.logout
```

## CRM Events

```
client.created
client.updated
client.deleted
client.list.view
appointment.created
appointment.completed
appointments.fetch
pipeline.stage.changed
dashboard.view
```

## System Events

```
service.start
service.stop
cpu.high
db.timeout
vm.restart
```

---

# ⚡ Log Reduction Target

### BEFORE (Current)

* 100+ lines per action
* debug noise
* serializer dumps
* repeated warnings

### AFTER (Target)

```
INFO  auth.login.success user=sales@liberty
INFO  dashboard.view
INFO  appointments.fetch count=6
INFO  client.list.view
WARN  cpu.high usage=89%
ERROR db.timeout request_id=abc123
```

Clean. Fast. Clear.

---

# 🧩 Cursor Refactoring Instructions

When editing logging code:

1. Replace sentences with short event names.
2. Remove data dumps and object printing.
3. Keep logs single-line only.
4. Log actions, not explanations.
5. Remove duplicate or repeated warnings.
6. Keep production logs minimal.
7. Reduce output aggressively (100 → 10).

---

# 🧠 Performance Rules (Ubuntu / Utho VM)

To avoid overload:

* No DEBUG logs in production.
* Use INFO / WARN / ERROR only.
* Avoid logging inside loops.
* Do not log large variables.
* Use log rotation to prevent disk growth.

---

# 🪵 Log Rotation Reminder

System should rotate logs to avoid disk exhaustion:

```
app.log
error.log
access.log
```

Rotation prevents VM slowdown.

---

# ⭐ Final Summary (Human Understanding)

Production logs are not stories.

They are a short timeline of events.

A good log tells us quickly:

* who did something
* what happened
* where it happened
* whether it succeeded or failed

If logs are long or descriptive, they slow down the server and confuse developers.

Simple logs = faster debugging, faster systems, and calmer operations.

Keep logs short. Keep them meaningful.
