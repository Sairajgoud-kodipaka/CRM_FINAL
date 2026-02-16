# Notification Templates — End User Communication Guide

This document lists **every place** notifications are created in the CRM and defines **user-centric templates** for each. The goal: **how does the end user want to be communicated with?** — clear, actionable, and respectful of their attention.

---

## Tenant isolation (mandatory — no crossover)

**Rule: Notifications must never cross tenant boundaries.**

- Every notification is about an entity that belongs to **one tenant** (e.g. a customer, appointment, store, transfer, ticket, lead).
- **Recipients** of that notification may **only** be users who belong to **that same tenant**.
- There must be **no crossover** between any two tenants and their users.

**Example:** Tenant A has a sales rep, a manager, and a business admin. Tenant B has its own sales rep, manager, and business admin. A notification about a customer in Tenant A must **only** go to Tenant A’s sales rep / manager / business admin (or other Tenant A users as defined by the template). A user in Tenant B must **never** receive it.

**Enforcement (implementation):**

1. **Resolve tenant first** — From the subject (customer, appointment, store, transfer, ticket, lead), resolve the tenant (directly or via `customer.tenant`, `store.tenant`, `ticket.tenant`, etc.).
2. **Filter all recipients by tenant** — Every recipient list (creator, business admins, store managers, in-house sales, telecalling, assignees, etc.) must be filtered so that **only users with `user.tenant_id == subject_tenant_id`** (or equivalent) are included.
3. **No global or cross-tenant queries** — Do not fetch “all business admins” or “all store managers” without a tenant filter. Always scope by the subject’s tenant.
4. **New notification code** — When adding a new notification creation point, the implementation **must** pass a tenant check (e.g. all recipient querysets filtered by tenant); code review must verify this.

**Recipient roles (all scoped to same tenant):** “Business admin”, “store manager”, “in-house sales”, “telecalling”, “creator”, “assignee”, etc., always mean “**within the same tenant as the subject**”.

---

## Within-tenant recipient rules (who gets push)

**Strict rule:** All recipients must be in the **same tenant** as the subject. No crossover. Below defines **who within that tenant** receives the notification.

**Example:** Tenant A = Business Admin A, Manager A, Sales Rep A. Tenant B = Business Admin B, Manager B, Sales Rep B. Notifications about Tenant A data go **only** to Tenant A users; **never** to any user of Tenant B.

### Customer addition (new customer registered)

| Who did the action | Who must receive push (same tenant only) |
|--------------------|------------------------------------------|
| **Sales Rep** creates new customer | 1. **Creator** (the sales rep) — receives push. 2. **Manager of this sales rep** — receives push. 3. **Business admin** of this tenant — can receive push. |
| **Never** | Send to business admin or any user of **another tenant**. Only same-tenant users. |

- **Creator** = user who created the entry (e.g. sales rep). They receive push (e.g. confirmation).
- **Manager of creator** = manager of that sales rep (same tenant). Must receive push for team visibility.
- **Business admin** = business admin(s) of the **same tenant only**. Never notify another tenant's business admin.

### When manager performs operations

When a **manager** performs an action (e.g. approves transfer, updates customer, assigns appointment):

- **Business admin of that tenant** must also receive push so they are kept in the loop.
- Recipients: relevant users within same tenant (assignee, creator) **plus** business admin(s) of that tenant. Never send to another tenant.

### Appointments, stock transfers, telecalling, support

- **Resolve tenant** from the subject (customer, store, appointment, transfer, ticket, lead).
- **Recipients** = only users in that tenant: creator, assigned user, **manager of creator/assignee** (if applicable), store manager (that store, same tenant), **business admin** (same tenant). No cross-tenant recipients.
- For **manager-initiated actions** (e.g. manager approves transfer), include **business admin (same tenant)** in the recipient list.

---

## Summary: Where Notifications Are Created

| System | Location | Count | Delivery (main app) |
|--------|----------|-------|---------------------|
| **Main CRM** (`apps.notifications.Notification`) | `backend/apps/clients/views.py` | 12+ | In-app + WebSocket + Web Push |
| **Main CRM** | `backend/apps/products/services.py` | 4 | In-app + WebSocket + Web Push |
| **Main CRM** (reminders) | `backend/apps/notifications/management/commands/send_appointment_reminders.py` | 1 | In-app + WebSocket + Web Push |
| **Telecalling** (own `Notification` model) | `backend/telecalling/views.py` | 6 | In-app + Web Push (via create_push_notification) |
| **Telecalling** | `backend/management/commands/setup_automated_sheets_sync.py` | 2 | In-app (telecalling) |
| **Support** (`SupportNotification`) | `backend/apps/support/services.py` | 9 | In-app + Web Push (via _push_for_recipient) |

**Main CRM (clients):** New customer, customer updated, customer deleted, new appointment, appointment updated/cancelled/rescheduled/confirmed/completed, appointment reminder (cron), task assigned, task completed. **Total:** 23+ distinct notification creation points across 3 systems.

---

## Design Principles (End User POV)

- **Tenant isolation** — Recipients must always be limited to the same tenant as the subject (customer, store, appointment, transfer, ticket, lead). No crossover between tenants.
- **What happened** — One short line so they know the event.
- **Why it matters to them** — e.g. “You’re assigned”, “Needs your approval”, “Ready for you”.
- **What to do next** — One clear action (button/link) when needed.
- **Priority** — Use urgent only for time-sensitive or blocking items; avoid noise.
- **Tone** — Professional, friendly, no internal jargon in the user-facing text.

---

# Part 1 — Main CRM Notifications (In-app + WebSocket + Web Push)

These use `apps.notifications.models.Notification` and are sent via WebSocket + Web Push.

**Tenant scope:** Subject = customer, appointment, store, or transfer. Resolve tenant from that entity (e.g. `customer.tenant`, `store.tenant`). All recipients (creator, business admins, store managers, in-house sales, telecalling) must be users of **that tenant only**. No cross-tenant recipients.

---

## 1. Customers (CRUD)

### 1.1 New customer registered — **IMPLEMENTED**

| Field | Value |
|-------|--------|
| **Source** | `backend/apps/clients/views.py` (create_customer_notifications, ~line 793) |
| **Type** | `new_customer` |
| **Recipients** | Creator, business admins, store manager(s) of customer’s store |
| **Priority** | medium |

**Within-tenant push (customer addition):** Creator (sales rep) receives push; manager of this sales rep receives push; business admin of this tenant can receive push. **Same tenant only** — never send to another tenant's users.

**Current:**

- Title: `New customer registered`
- Message: `{First name} has been registered as a new customer by {Creator name}`

**Recommended template (end user wording):**

| Field | Template |
|-------|----------|
| **Title** | New customer: {First name} |
| **Message** | {First name} was just added by {Creator name}. Open their profile to add notes or schedule a visit. |
| **Action** | View Customer → `/customers/{id}` |
| **Priority** | medium |

---

### 1.2 Customer updated — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Customer updated: {First name} |
| **Message** | {Who} updated {First name}’s details (e.g. phone, address). Tap to see changes. |
| **Action** | View Customer → `/customers/{id}` |
| **Priority** | low |
| **When** | On client update (ClientViewSet.perform_update); recipients: editor, business admins, store manager (same tenant). |

---

### 1.3 Customer deleted / merged — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Customer record removed |
| **Message** | {First name} was removed from the customer list by {Who}. |
| **Action** | (optional) Customers list → `/customers` |
| **Priority** | low |
| **When** | Before client delete (ClientViewSet.destroy); same-tenant recipients. |

---

## 2. Appointments

### 2.1 New appointment scheduled — **IMPLEMENTED**

| Field | Value |
|-------|--------|
| **Source** | `backend/apps/clients/views.py` (create_appointment_notification, ~line 3626) |
| **Type** | `appointment_reminder` |
| **Recipients** | Creator, assigned user, business admins, store manager + in-house sales + telecalling for client’s store |
| **Priority** | medium |

**Within-tenant push:** Creator, assignee, manager of creator/assignee (if applicable), store manager (that store), business admin (same tenant). **Same tenant only** — no cross-tenant.

**Current:**

- Title: `New appointment scheduled`
- Message: `Appointment scheduled for {First name} on {date} at {time}`

**Recommended template (end user wording):**

| Field | Template |
|-------|----------|
| **Title** | New appointment: {First name} |
| **Message** | {First name} — {date} at {time}. {Purpose if short}. Tap to view or add notes. |
| **Action** | View Appointment → `/appointments/{id}` |
| **Priority** | medium |

---

### 2.2 Appointment updated (time/date/assignee) — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Appointment changed: {First name} |
| **Message** | The appointment with {First name} was updated (e.g. new time or assignee). Tap to see details. |
| **Action** | View Appointment → `/appointments/{id}` |
| **Priority** | medium |
| **Recipients** | Assigned user, creator, business admin, store manager (same tenant). |

---

### 2.3 Appointment cancelled — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Appointment cancelled: {First name} |
| **Message** | The appointment with {First name} on {date} at {time} was cancelled. {Reason if short}. |
| **Action** | (optional) Appointments → `/appointments` |
| **Priority** | medium |

---

### 2.4 Appointment rescheduled — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Appointment rescheduled: {First name} |
| **Message** | Moved to {new_date} at {new_time}. Tap to confirm and add notes. |
| **Action** | View Appointment → `/appointments/{new_id}` |
| **Priority** | medium |

---

### 2.5 Appointment reminder (e.g. 1 hour before) — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Reminder: {First name} in 1 hour |
| **Message** | Appointment at {time} — {location or “Store name”}. Tap to open. |
| **Action** | View Appointment → `/appointments/{id}` |
| **Priority** | high |
| **When** | Management command `send_appointment_reminders` (cron every 15–20 min); optional `--window-min`/`--window-max`. |

---

### 2.6 Appointment confirmed / completed — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Appointment confirmed / completed |
| **Message** | {First name} — marked as {confirmed|completed}. Tap to add outcome notes. |
| **Action** | View Appointment → `/appointments/{id}` |
| **Priority** | low |

---

## 3. Stock Transfers — **IMPLEMENTED**

All in `backend/apps/products/services.py`. Recipients vary by method (requested_by, approvers, store users, business admins). **Tenant:** Resolve from transfer/store; all recipients must be same tenant. When a **manager** approves a transfer, **business admin (same tenant)** must also receive push. Never notify another tenant.

### 3.1 New stock transfer request

| Field | Value |
|-------|--------|
| **Source** | `StockTransferNotificationService.notify_transfer_request` |
| **Type** | `stock_transfer_request` |

**Recommended template:**

| Field | Template |
|-------|----------|
| **Title** | Stock transfer requested |
| **Message** | {quantity} × {product name}: {from_store} → {to_store}. Review and approve or reject. |
| **Action** | Review Transfer → `/products/transfers/{id}` |
| **Priority** | medium |

---

### 3.2 Stock transfer approved

| Field | Template |
|-------|----------|
| **Title** | Stock transfer approved |
| **Message** | {quantity} × {product name} from {from_store} to {to_store} is approved. Complete the handover when ready. |
| **Action** | Complete Transfer → `/products/transfers/{id}` |
| **Priority** | medium |

---

### 3.3 Stock transfer completed

| Field | Template |
|-------|----------|
| **Title** | Stock transfer completed |
| **Message** | {quantity} × {product name} reached {to_store}. No action needed. |
| **Action** | View Details → `/products/transfers/{id}` |
| **Priority** | low |

---

### 3.4 Stock transfer cancelled

| Field | Template |
|-------|----------|
| **Title** | Stock transfer cancelled |
| **Message** | Transfer of {product name} from {from_store} to {to_store} was cancelled. |
| **Action** | View Details → `/products/transfers/{id}` |
| **Priority** | medium |

---

## 4. Tasks (CRUD) — **IMPLEMENTED**

TaskViewSet in `apps/clients/views.py`: on assign → notify assignee; on status completed/done/closed → notify creator. Same-tenant only.

### 4.1 Task assigned to me — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | New task: {task title} |
| **Message** | {Who} assigned you a task. Due {date}. Tap to open. |
| **Action** | Open Task → `/customers/{client_id}` or dashboard |
| **Priority** | medium |

### 4.2 Task due soon / overdue — **NOT IMPLEMENTED (recommended)**

| Field | Template |
|-------|----------|
| **Title** | Task due: {task title} |
| **Message** | Due {date/time}. Tap to complete or reschedule. |
| **Action** | Open Task → `/tasks/{id}` |
| **Priority** | high / urgent if overdue |

### 4.3 Task completed (for assigner) — **IMPLEMENTED**

| Field | Template |
|-------|----------|
| **Title** | Task completed: {task title} |
| **Message** | {Who} marked “{task title}” as done. |
| **Action** | View → `/customers/{client_id}` or dashboard |
| **Priority** | low |

---

## 5. Orders / Deals / Payments — **NOT IMPLEMENTED (recommended)**

Types exist in `Notification.NOTIFICATION_TYPES`: `order_status`, `deal_update`, `payment_received`. Suggested wording:

### 5.1 Order status

| Field | Template |
|-------|----------|
| **Title** | Order {status}: #{order_id} |
| **Message** | Order for {customer} is now {status}. Tap for details. |
| **Action** | View Order → `/orders/{id}` |
| **Priority** | medium for status change, high for “ready for pickup” etc. |

### 5.2 Deal / pipeline update

| Field | Template |
|-------|----------|
| **Title** | Deal updated: {customer / deal name} |
| **Message** | Moved to “{stage}” by {who}. Value: {amount}. Tap to view. |
| **Action** | View Deal → pipeline/deal URL |
| **Priority** | medium |

### 5.3 Payment received

| Field | Template |
|-------|----------|
| **Title** | Payment received |
| **Message** | {amount} received for {customer / order}. Tap to see details. |
| **Action** | View → payments/order URL |
| **Priority** | medium |

---

## 6. Inventory — **NOT IMPLEMENTED (recommended)**

Type: `inventory_alert`.

| Field | Template |
|-------|----------|
| **Title** | Low stock: {product name} |
| **Message** | {product name} at {store} is below threshold ({quantity} left). Reorder or transfer. |
| **Action** | View Product / Transfers → appropriate URL |
| **Priority** | high if critical, medium otherwise |

---

## 7. Announcements / Escalations — **NOT IMPLEMENTED (recommended)**

| Field | Template (announcement) |
|-------|-------------------------|
| **Title** | {Announcement title} |
| **Message** | {Short body}. Tap to read more. |
| **Priority** | low / medium |

| Field | Template (escalation) |
|-------|------------------------|
| **Title** | Escalation: {subject} |
| **Message** | {Brief reason}. Action required. Tap to open. |
| **Priority** | high / urgent |

---

# Part 2 — Telecalling Module Notifications

**Tenant scope:** Subject = lead/assignment (and its tenant). All recipients (assigned telecaller, etc.) must be users of **that tenant only**. No cross-tenant recipients.

Uses **telecalling** app’s own `Notification` model (`telecalling/views.py`, `management/commands/setup_automated_sheets_sync.py`). In-app only (no Web Push from main app).

| # | Type | Source (approx) | Title (current) | Recommended message (end user) |
|---|------|------------------|------------------|----------------------------------|
| 1 | assignment | telecalling/views.py ~88, ~128 | New Assignment | You’re assigned to call **{First name}**. Tap to start. |
| 2 | feedback | telecalling/views.py ~214 | Call Feedback Received | Feedback received for **{First name}**. Tap to view. |
| 3 | follow_up | telecalling/views.py ~302 | Follow-up Scheduled | Follow-up scheduled for **{First name}**. Tap for details. |
| 4 | transfer_accepted | telecalling/views.py ~783 | Transfer Accepted | Your transfer of **{First name}** was accepted. |
| 5 | transfer_rejected | telecalling/views.py ~820 | Transfer Rejected | Your transfer of **{First name}** was rejected. Tap to see reason. |
| 6 | system | setup_automated_sheets_sync ~98 | Google Sheets Integration Active | Google Sheets sync is set up. Leads will sync hourly and auto-assign to telecallers. |
| 7 | system | setup_automated_sheets_sync ~112 | Google Sheets Integration Issue | There was an issue with the Google Sheets connection. Please check configuration. |

---

# Part 3 — Support Module Notifications

**Tenant scope:** Subject = ticket (and its tenant). Recipients (assignee, creator, support admins) must be users of **that ticket's tenant only**. No cross-tenant recipients.

Uses **SupportNotification** in `apps/support/services.py`. In-app (support UI).

| # | Type | Title pattern (current) | Recommended message (end user) |
|---|------|--------------------------|----------------------------------|
| 1 | TICKET_CREATED | New Support Ticket: {ticket_id} | New **{priority}** ticket from **{tenant}**: {title}. Tap to assign and respond. |
| 2 | TICKET_RESOLVED | Ticket Resolved: {ticket_id} | Issue #{ticket_id} was marked resolved. Please confirm if the problem is solved. |
| 3 | TICKET_CLOSED | Ticket Closed: {ticket_id} | Ticket #{ticket_id} has been closed. |
| 4 | TICKET_CLOSED (assignee) | Ticket Closed: {ticket_id} | Ticket #{ticket_id} was closed by {created_by}. |
| 5 | TICKET_REOPENED | Ticket Reopened: {ticket_id} | Ticket #{ticket_id} was reopened by {created_by}. Issue still persists. |
| 6 | MESSAGE_RECEIVED | New Message: {ticket_id} | New message from {sender}: “{content_preview}…” Tap to reply. |
| 7 | CALLBACK_REQUESTED | Callback Requested: {ticket_id} | {created_by} requested a callback. Phone: {phone}, Preferred: {time}. |
| 8 | TICKET_UPDATED (overdue) | Overdue Ticket: {ticket_id} | Ticket #{ticket_id} is overdue for **{priority}**. Please assign and respond. |

---

# Part 4 — Quick Reference: All Creation Points

**Main CRM (`apps.notifications.Notification`) — 13+ places**

1. `apps/clients/views.py` — New customer registered  
2. `apps/clients/views.py` — Customer updated  
3. `apps/clients/views.py` — Customer deleted  
4. `apps/clients/views.py` — New appointment scheduled  
5. `apps/clients/views.py` — Appointment updated  
6. `apps/clients/views.py` — Appointment cancelled  
7. `apps/clients/views.py` — Appointment rescheduled  
8. `apps/clients/views.py` — Appointment confirmed  
9. `apps/clients/views.py` — Appointment completed  
10. `apps/clients/views.py` — Task assigned  
11. `apps/clients/views.py` — Task completed  
12. `apps/notifications/management/commands/send_appointment_reminders.py` — Appointment reminder (1 hr before)  
13. `apps/products/services.py` — Stock transfer request  
14. `apps/products/services.py` — Stock transfer approved  
15. `apps/products/services.py` — Stock transfer completed  
16. `apps/products/services.py` — Stock transfer cancelled  

**Telecalling (`telecalling.models.Notification`) — 8 places**

7. `telecalling/views.py` — New assignment (create)  
8. `telecalling/views.py` — New assignment (bulk)  
9. `telecalling/views.py` — Call feedback received  
10. `telecalling/views.py` — Follow-up scheduled  
11. `telecalling/views.py` — Transfer accepted  
12. `telecalling/views.py` — Transfer rejected  
13. `management/commands/setup_automated_sheets_sync.py` — Google Sheets active  
14. `management/commands/setup_automated_sheets_sync.py` — Google Sheets issue  

**Support (`SupportNotification`) — 9 places**

15. `apps/support/services.py` — Ticket created  
16. `apps/support/services.py` — Ticket resolved  
17. `apps/support/services.py` — Ticket closed (creator)  
18. `apps/support/services.py` — Ticket closed (assignee)  
19. `apps/support/services.py` — Ticket reopened  
20. `apps/support/services.py` — Message received (specific recipient)  
21. `apps/support/services.py` — Message received (admins)  
22. `apps/support/services.py` — Callback requested  
23. `apps/support/services.py` — Overdue ticket  

---

# Implementation Notes

- **Tenant isolation (mandatory):** For every notification creation point, resolve the subject's tenant and filter all recipient querysets by that tenant. No notification may ever be sent to a user outside the subject's tenant. Audit existing code (clients, products, telecalling, support) to ensure strict tenant scoping.
- **Within-tenant recipients:** For customer addition: creator (sales rep), manager of creator, business admin (same tenant). For manager-initiated actions (e.g. manager approves transfer): also send push to business admin (same tenant). Never send to another tenant's business admin or any cross-tenant user.
- **Main CRM notifications** support `metadata` (e.g. `customer_id`, `appointment_id`) for deep linking; use them in `action_url` or frontend routing.  
- **Priority**: Use `urgent` sparingly (e.g. overdue tasks, critical inventory); default to `medium`, use `low` for FYI (e.g. transfer completed).  
- **Action text**: Short verb phrase (“View Customer”, “Review Transfer”, “Open Task”) so the user knows what one tap does.  
- **Quiet hours**: Respect `NotificationSettings.quiet_hours_*` for push (and email if added); in-app can still show.  
- **Unified experience**: Where possible, keep title/message style consistent across in-app, WebSocket, and Web Push (this doc’s templates can be the single source of copy).
