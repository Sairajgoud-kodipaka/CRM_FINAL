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

# 🧱 Production Log Format (Terminal Friendly)

All logs must follow this:

```
TIME | LEVEL | SERVICE | EVENT | DETAILS
```

Example:

```
08:21:33 | INFO  | backend | auth.login.success | user=sales@liberty
08:21:34 | INFO  | backend | appointments.fetch | count=6
08:21:35 | INFO  | nginx   | http.request       | GET /api/clients 200
08:21:45 | ERROR | postgres| db.timeout         | req=abc123
```

Rules:

* one log = one line
* no multiline logs
* readable within 2 seconds

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
