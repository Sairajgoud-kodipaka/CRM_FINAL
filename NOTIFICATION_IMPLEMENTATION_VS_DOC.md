# Notification Implementation vs NOTIFICATION_TEMPLATES.md

This document compares **NOTIFICATION_TEMPLATES.md** with the **actual codebase**. Use it to see what is implemented as documented and what differs or is missing.

---

## ✅ Implemented as documented

### Tenant isolation
- **Rule:** Notifications must never cross tenant boundaries; recipients filtered by subject's tenant.
- **Code:** 
  - `apps/notifications/services.py`: `get_role_based_recipients()` enforces `user.tenant_id == tenant.id` and uses `User.objects.filter(tenant=tenant, ...)`.
  - Customers, appointments, stock transfers: tenant resolved from `client.tenant`, `appointment.tenant`, `transfer.from_store.tenant`; all recipient logic is tenant-scoped.
- **Verdict:** Implemented.

### Within-tenant recipient rules
- **Customer addition:** Creator, manager of creator, business admin (same tenant). **Code:** `create_customer_notifications` uses `get_role_based_recipients(tenant, creator=..., include_manager_of_creator=True, include_business_admin=True, ...)`. ✅
- **New appointment:** Creator, assignee, manager of creator/assignee, business admin, store manager, store sales/telecalling. **Code:** `create_appointment_notification` uses `get_role_based_recipients` with all flags. ✅
- **Stock transfers:** Creator, manager of creator, business admin, store manager; when manager approves, approver and business admin included. **Code:** `StockTransferNotificationService` uses `get_role_based_recipients` and adds `approved_by` when same tenant. ✅

### Main CRM notification creation points

| Doc section | Doc status | Actual status | Notes |
|-------------|------------|---------------|--------|
| **1.1 New customer** | IMPLEMENTED | ✅ | Title "New customer: {First name}", message and action match recommended template. Uses `get_role_based_recipients`. |
| **1.2 Customer updated** | NOT IMPLEMENTED | ✅ Implemented | `create_customer_updated_notifications` in ClientViewSet.perform_update; title/message/action match doc. |
| **1.3 Customer deleted** | NOT IMPLEMENTED | ✅ Implemented | `create_customer_deleted_notifications` before delete; title "Customer record removed", message/action match. |
| **2.1 New appointment** | IMPLEMENTED | ✅ | "New appointment: {First name}", action `/appointments/{id}`. Uses `get_role_based_recipients`. |
| **2.2 Appointment updated** | NOT IMPLEMENTED | ✅ Implemented | `create_appointment_updated_notification`; "Appointment changed: {First name}". |
| **2.3 Appointment cancelled** | NOT IMPLEMENTED | ✅ Implemented | `create_appointment_cancelled_notification`; title/message match. |
| **2.4 Appointment rescheduled** | NOT IMPLEMENTED | ✅ Implemented | `create_appointment_rescheduled_notification`; "Moved to {date} at {time}...". |
| **2.5 Appointment reminder (1 hr)** | NOT IMPLEMENTED | ✅ Implemented | `send_appointment_reminders` command; "Reminder: {First name} in 1 hour", high priority. |
| **2.6 Appointment confirmed/completed** | NOT IMPLEMENTED (optional) | ✅ Implemented | `create_appointment_confirmed_notification`, `create_appointment_completed_notification`. |
| **3. Stock transfers (3.1–3.4)** | IMPLEMENTED | ✅ | All four: request, approved, completed, cancelled. Tenant from store; titles/messages align (wording slightly different). |
| **4. Tasks** | NOT IMPLEMENTED | ✅ Implemented | TaskViewSet: assign → notify assignee; status completed/done/closed → notify creator. Templates match doc. |

### Delivery (in-app + WebSocket + Web Push)
- Every main CRM `Notification` triggers signal → WebSocket (medium/high/urgent) and **Web Push for all**. Telecalling and support call `create_push_notification` so the same user gets push. ✅

### Copy and templates
- New customer: "New customer: {First name}", "… was just added by … Open their profile…", action "View Customer" → `/customers/{id}`. ✅
- Customer updated/deleted: titles and messages match doc. ✅
- Appointments: new/updated/cancelled/rescheduled/confirmed/completed and reminder text match or are very close. ✅
- Tasks: "New task: {title}", "… assigned you a task. Due …"; "Task completed: {title}", "… marked … as done." ✅

---

## ⚠️ Minor gaps (doc vs code)

1. **Appointment lifecycle recipients (2.2–2.6)**  
   - **Doc:** Recipients include "manager of creator/assignee (if applicable)".  
   - **Code:** `_get_appointment_notification_recipients()` includes actor, assignee, business_admin, store manager, inhouse_sales, telecalling (all same-tenant) but does **not** add manager of creator or manager of assignee.  
   - **Impact:** New appointment does include them (via `get_role_based_recipients`); updated/cancelled/rescheduled/confirmed/completed do not. Low impact if store manager / business admin cover visibility.

2. **Customer updated/deleted recipients**  
   - **Doc (1.2):** "notify store manager / assigned sales if different from editor".  
   - **Code:** `_get_customer_notification_recipients()` sends to actor (editor), business admins (same tenant), store managers (same tenant). No explicit "assigned sales" for the customer.  
   - **Impact:** Small; store manager and business admin are covered.

3. **Support module – platform admins**  
   - **Doc:** "Recipients must be users of that ticket's tenant only".  
   - **Code:** Support intentionally notifies **platform_admins** (global, cross-tenant) for ticket created, reopened, messages (when no specific_recipient).  
   - **Verdict:** By design for support; doc could clarify that platform admins are an exception for support tickets.

4. **Stock transfer titles in doc**  
   - Doc suggests e.g. "Stock transfer requested" / "Stock transfer approved". Code uses "New Stock Transfer Request" and "Stock Transfer Approved" (slightly different wording). Behavior and tenant isolation match.

---

## 📋 Doc updates needed in NOTIFICATION_TEMPLATES.md

- **Summary table (Where Notifications Are Created):**  
  - "Main CRM (clients/views.py) | 2" is outdated. There are many more: new customer, customer updated, customer deleted, new appointment, appointment updated/cancelled/rescheduled/confirmed/completed, plus tasks. Suggest: list all creation points or use a higher count (e.g. 12+ for main CRM).

- **Part 4 – Quick Reference:**  
  - Lists 6 main CRM creation points. Should be updated to include:  
    - customers: new, updated, deleted  
    - appointments: new, updated, cancelled, rescheduled, confirmed, completed  
    - appointment reminder (cron command)  
    - tasks: assigned, completed  
    - stock transfers: 4 (unchanged)  
  So main CRM has **more than 6** creation points.

- **Section labels:**  
  - 1.2, 1.3, 2.2–2.6, 2.5 (reminder), 2.6, and 4 (Tasks) are marked "NOT IMPLEMENTED" or "optional" in the doc but **are implemented** in code. They should be marked as **IMPLEMENTED**.

---

## Summary

- **Tenant isolation and within-tenant recipient rules** are implemented as documented for main CRM (customers, appointments, stock transfers, tasks).
- **All main CRM notification types** described in the doc for customers, appointments, stock transfers, and tasks exist in code, with titles/messages/actions matching or very close to the templates.
- **Support** is implemented with an intentional cross-tenant aspect (platform admins); the doc could state this exception.
- **NOTIFICATION_TEMPLATES.md** is out of date in places: several items marked "NOT IMPLEMENTED" are implemented, and the summary/Part 4 counts are too low. Updating the doc to match the implementation is recommended.
