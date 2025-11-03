# 📱 Push Notification Requirements & Edge Cases

## 🚨 **CRITICAL: Push Notifications Required (URGENT Priority)**

### **1. Appointment Reminders** ⏰
**When to send push:**
- ✅ **1 hour before appointment** - User might be away from app
- ✅ **15 minutes before appointment** - Critical reminder
- ✅ **Appointment cancelled/rescheduled** - Immediate action needed
- ✅ **Appointment assigned to user** - User needs to know immediately

**Edge Cases:**
- User is off-duty but has appointment tomorrow → Send push
- Appointment is in different timezone → Account for user's local time
- Multiple appointments in same day → Batch or send separately
- Last-minute appointment changes (< 1 hour) → Urgent push

---

### **2. Escalations** 🔴
**When to send push:**
- ✅ **Customer complaint escalated** - Immediate attention required
- ✅ **Deal at risk** - High-value deal about to be lost
- ✅ **Payment overdue** - Critical financial issue
- ✅ **Service level agreement breach** - SLA violation

**Edge Cases:**
- Escalation during off-hours → Still send push (user can check)
- Multiple escalations → Send each separately (don't batch)
- Escalation resolved → Send confirmation push

---

### **3. Inventory Alerts** 📦
**When to send push:**
- ✅ **Out of stock** (priority: urgent) - Sales can't proceed
- ✅ **Critical low stock** (below threshold) - Restocking needed
- ✅ **Stock transfer request** - Action required
- ✅ **Stock transfer rejected** - Alternative action needed

**Edge Cases:**
- Popular item goes out of stock → Urgent push to all managers
- Stock transfer during non-business hours → Still send push
- Emergency stock situation → Multiple users need notification

---

### **4. Payment & Financial** 💰
**When to send push:**
- ✅ **Large payment received** (above threshold) - Financial milestone
- ✅ **Payment overdue** (urgent) - Collection needed
- ✅ **Payment failed** - Action required
- ✅ **Refund processed** - Customer service might need to know

**Edge Cases:**
- After-hours payment → Still send push (important milestone)
- Payment dispute → Urgent push to business admin
- Multiple payments in short time → Send each separately

---

### **5. Deal Updates** 💼
**When to send push:**
- ✅ **Deal stage changed to "Won"** - Celebration moment, important milestone
- ✅ **Deal stage changed to "Lost"** - Immediate follow-up needed
- ✅ **High-value deal created** (above threshold) - Management needs to know
- ✅ **Deal assigned to user** - Immediate action required

**Edge Cases:**
- Deal won during off-hours → Still send push (good news)
- Deal lost after long negotiation → Push to manager for review
- Deal value changed significantly → Push to business admin

---

### **6. Task Reminders** ✅
**When to send push:**
- ✅ **Task due today** - Action needed
- ✅ **Task overdue** - Urgent action required
- ✅ **Task assigned to user** - Immediate notification
- ✅ **Critical task** (priority: high) - Time-sensitive

**Edge Cases:**
- Task due in different timezone → Use user's local time
- Recurring tasks → Send push each time
- Task dependency completion → Notify next task owner

---

## 🔔 **IMPORTANT: Push Notifications Recommended (HIGH Priority)**

### **7. New Customer Registration** 👤
**When to send push:**
- ✅ **High-value customer** (if metadata indicates potential) - Business opportunity
- ✅ **VIP customer** - Special attention needed
- ✅ **Customer assigned to user** - Immediate notification

**Edge Cases:**
- Customer created during off-hours → Still send push (business opportunity)
- Multiple customers in batch → Send separate push for each
- Customer from important source (exhibition, referral) → Push priority

**NOTE:** Currently sending to all users - should only push to:
- Assigned salesperson
- Store manager
- Business admin (if high-value)

---

### **8. Order Status Updates** 📋
**When to send push:**
- ✅ **Order ready for pickup** - Customer waiting
- ✅ **Order cancelled** - Immediate action needed
- ✅ **Order delayed** - Customer communication needed
- ✅ **Order completed** - Follow-up opportunity

**Edge Cases:**
- Order status changed multiple times → Send push for each critical change
- Order involves multiple stores → Notify all relevant stores
- Order refund processed → Push to customer service

---

### **9. Stock Transfers** 📦
**When to send push:**
- ✅ **Stock transfer request** - Action required
- ✅ **Stock transfer approved** - Can proceed
- ✅ **Stock transfer rejected** - Alternative needed
- ✅ **Stock transfer completed** - Inventory updated

**Edge Cases:**
- Transfer between stores → Notify both store managers
- Transfer during non-business hours → Still send push
- Emergency transfer request → Urgent push

---

### **10. Announcements** 📢
**When to send push:**
- ✅ **Urgent system announcement** - Critical information
- ✅ **Policy changes** - Important updates
- ✅ **Store closure** - Immediate notification
- ✅ **Special promotions** - Business opportunity

**Edge Cases:**
- Announcement during off-hours → Still send push (important info)
- Multi-store announcements → Send to all affected stores
- Time-sensitive announcements → Push priority

---

## 📱 **OPTIONAL: In-App Only (MEDIUM/LOW Priority)**

### **11. Marketing Campaigns** 📈
**When:**
- ❌ **Regular campaign updates** - In-app only
- ✅ **Campaign results exceeded targets** - Push notification
- ✅ **Campaign requires immediate action** - Push notification

---

### **12. Regular Updates** 📊
**When:**
- ❌ **Daily/weekly reports** - In-app only
- ❌ **Routine status updates** - In-app only
- ✅ **Exception reports** (anomalies detected) - Push notification

---

## 🎯 **Edge Cases & Special Situations**

### **1. User Offline/Off-Duty**
**Rule:** Send push for urgent/high priority even if:
- User is off-duty
- Outside business hours
- User hasn't logged in recently

**Reason:** Critical information shouldn't wait

---

### **2. Multiple Notifications**
**Rule:** 
- ✅ **Urgent notifications** → Send each separately (don't batch)
- ✅ **Medium priority** → Can batch if within 5 minutes
- ✅ **Low priority** → Batch in daily digest

---

### **3. Timezone Considerations**
**Rule:**
- ✅ **Appointment reminders** → Use user's local timezone
- ✅ **Business hours** → Respect user's timezone for quiet hours
- ✅ **Global notifications** → Send based on recipient's timezone

---

### **4. User Preferences**
**Rule:**
- ✅ **Respect notification settings** → Check user preferences
- ✅ **Quiet hours** → Don't send non-urgent pushes during quiet hours
- ✅ **Opt-out** → Honor user's push notification preferences

**Exception:** Always send urgent notifications regardless of preferences

---

### **5. Notification Deduplication**
**Rule:**
- ✅ **Prevent duplicate notifications** → Check if notification exists
- ✅ **Same event, different users** → Send to each user separately
- ✅ **Same event, same user** → Don't send duplicate

**Current Issue:** Duplicate notifications exist (e.g., "Akshay" appears twice)
**Fix:** Implemented duplicate prevention in `create_customer_notifications()`

---

### **6. Priority Escalation**
**Rule:**
- ✅ **Low → Medium** → If no response after 24 hours
- ✅ **Medium → High** → If no response after 12 hours
- ✅ **High → Urgent** → If no response after 2 hours

---

### **7. User Role-Based Notifications**
**Rule:**
- ✅ **Urgent** → Send to all relevant roles
- ✅ **High** → Send to assigned user + manager
- ✅ **Medium** → Send to assigned user only
- ✅ **Low** → In-app only

---

### **8. Emergency Situations**
**Rule:**
- ✅ **System down** → Push to all admins
- ✅ **Data breach** → Push to all admins (urgent)
- ✅ **Security alerts** → Push to all admins (urgent)
- ✅ **Critical bug** → Push to developers/admins

---

## 📋 **Current Implementation Status**

### **✅ Implemented:**
- Push notifications for `urgent` priority notifications
- WebSocket real-time updates for `high` and `urgent` priority
- User notification preferences
- Quiet hours support

### **⚠️ Needs Improvement:**
1. **Priority Assignment:**
   - Currently: Most notifications are `medium` priority
   - Should be: Assign appropriate priority based on scenario

2. **Push Notification Logic:**
   - Currently: Only `urgent` priority sends push
   - Should be: `urgent` + `high` priority send push

3. **Duplicate Prevention:**
   - Currently: Duplicates exist (e.g., "Akshay" customer)
   - Fixed: Added duplicate prevention in code

4. **User Targeting:**
   - Currently: New customer notifications sent to all users
   - Should be: Only send to relevant users (assigned, manager, admin)

---

## 🔧 **Recommended Changes**

### **1. Update Priority Assignment:**

```python
# Appointment reminders
priority = 'urgent' if minutes_until_appointment < 60 else 'high'

# New customer
priority = 'high' if customer_is_vip or high_value else 'medium'

# Deal updates
priority = 'urgent' if deal_won or deal_lost else 'high'

# Inventory alerts
priority = 'urgent' if out_of_stock else 'high'

# Payment
priority = 'urgent' if payment_overdue else 'high'
```

### **2. Update Push Notification Logic:**

```python
# In signals.py
if instance.priority in ['urgent', 'high']:  # Changed from just 'urgent'
    send_web_push(...)
```

### **3. Improve User Targeting:**

```python
# Only notify relevant users
users_to_notify = [
    assigned_user,
    store_manager,
    business_admin  # Only if high-value or VIP
]
# Don't notify all users for every customer
```

---

## 📊 **Summary: When to Send Push Notifications**

| Priority | Scenario | Push? | Delivery Method |
|----------|----------|-------|-----------------|
| **Urgent** | All scenarios | ✅ Yes | Push + WebSocket |
| **High** | Critical actions, time-sensitive | ✅ Yes | Push + WebSocket |
| **Medium** | Important updates, assigned items | ⚠️ Maybe | WebSocket only |
| **Low** | Routine updates, reports | ❌ No | In-app only |

---

## ✅ **Action Items**

1. ✅ **Fix duplicate notifications** - Implemented in code
2. ⚠️ **Update priority assignment** - Needs review
3. ⚠️ **Expand push notification logic** - Include 'high' priority
4. ⚠️ **Improve user targeting** - Don't notify all users
5. ⚠️ **Add timezone support** - For appointment reminders
6. ⚠️ **Implement notification batching** - For low priority
7. ⚠️ **Add priority escalation** - Auto-escalate if no response

---

**Last Updated:** Based on current codebase analysis
**Status:** Implementation needed for recommended changes

