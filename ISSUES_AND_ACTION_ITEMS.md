# Issues Found & Action Items
## Jewellery CRM - UAT Findings

---

## 🔴 CRITICAL BLOCKERS (Must Fix Before Production)

### Issue #1: Customer Update Validation Gap
**Problem:** Customer updates can remove required fields (name/phone), leaving invalid data in database.

**Location:**
- Backend: `backend/apps/clients/serializers.py` - `update()` method
- Issue: Update operation skips required field validation

**Current Code:**
```python
if instance is None:
    # This is a create operation - validates
else:
    # This is an update operation - SKIPS validation
```

**Action Required:**
- [ ] Add validation to `update()` method to ensure name OR phone is maintained
- [ ] Test: Update customer and try to remove both name and phone - should fail
- [ ] Add unit test for this scenario

**Priority:** 🔴 **BLOCKER**
**Estimated Time:** 2-3 hours
**Files to Modify:**
- `backend/apps/clients/serializers.py`

---

### Issue #2: Dashboard API Parameter Verification
**Problem:** Removed parameters from manager dashboard API call may break backend functionality.

**Location:**
- Frontend: `jewellery-crm/src/app/manager/dashboard/page.tsx` - Line 133-137
- Backend: `backend/apps/users/views.py` - `ManagerDashboardView`

**Removed Parameters:**
```typescript
// REMOVED:
year: currentMonth.year,
month: currentMonth.month,
month_name: formatMonth(),
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
store_id: userScope.filters.store_id || user?.store,
user_id: userScope.filters.user_id || user?.id
```

**Action Required:**
- [ ] Check backend `ManagerDashboardView.get()` method signature
- [ ] Verify backend doesn't require these parameters
- [ ] If backend needs them, restore parameters OR update backend
- [ ] Test dashboard loads correctly with current parameters
- [ ] Test with different user roles and scopes

**Priority:** 🔴 **BLOCKER**
**Estimated Time:** 1-2 hours
**Files to Review:**
- `backend/apps/users/views.py`
- `jewellery-crm/src/app/manager/dashboard/page.tsx`

---

## 🟡 HIGH PRIORITY ISSUES (Fix Soon)

### Issue #3: Network Request Timeout Missing
**Problem:** API requests have no timeout configuration, can hang indefinitely on slow/poor connections.

**Location:**
- `jewellery-crm/src/lib/api-service.ts` - `request()` method

**Current Code:**
```typescript
const response = await fetch(url, config);
// No timeout configured
```

**Action Required:**
- [ ] Add timeout to fetch requests (default 30 seconds)
- [ ] Use `AbortController` for timeout implementation
- [ ] Show user-friendly message when timeout occurs
- [ ] Log timeout events for monitoring
- [ ] Test timeout behavior with slow network simulation

**Priority:** 🟡 **HIGH**
**Estimated Time:** 2-3 hours
**Files to Modify:**
- `jewellery-crm/src/lib/api-service.ts`

---

### Issue #4: No Retry Logic for Failed Requests
**Problem:** Network failures (500/503 errors) fail immediately, no automatic retry mechanism.

**Location:**
- `jewellery-crm/src/lib/api-service.ts` - Error handling section

**Action Required:**
- [ ] Implement retry logic for 500/503/network errors
- [ ] Use exponential backoff (1s, 2s, 4s delays)
- [ ] Maximum 3 retry attempts
- [ ] Skip retry for 400/401 errors (user errors)
- [ ] Add retry configuration option per endpoint
- [ ] Show retry attempt indicator to user

**Priority:** 🟡 **HIGH**
**Estimated Time:** 3-4 hours
**Files to Modify:**
- `jewellery-crm/src/lib/api-service.ts`

---

### Issue #5: Password Reset Functionality Missing
**Problem:** Critical user flow not implemented - users cannot recover forgotten passwords.

**Location:**
- Not found in codebase (needs implementation)

**Action Required:**
- [ ] Create password reset request endpoint (backend)
- [ ] Create password reset confirmation endpoint (backend)
- [ ] Add "Forgot Password" link on login page
- [ ] Create password reset request page (frontend)
- [ ] Create password reset confirmation page (frontend)
- [ ] Add email template for reset link
- [ ] Add email service integration for sending reset emails
- [ ] Test complete flow: request → email → reset → login

**Priority:** 🟡 **HIGH**
**Estimated Time:** 6-8 hours
**Files to Create:**
- `backend/apps/users/views.py` - Add reset endpoints
- `jewellery-crm/src/app/reset-password/page.tsx`
- `jewellery-crm/src/app/reset-password/confirm/page.tsx`
- `jewellery-crm/src/app/page.tsx` - Add "Forgot Password" link

---

### Issue #6: Pagination Not Verified on All Lists
**Problem:** Customer and other lists may slow down or crash with large datasets (1000+ records).

**Location:**
- `jewellery-crm/src/app/sales/customers/page.tsx`
- Other list pages need verification

**Action Required:**
- [ ] Verify pagination implementation on customer list
- [ ] Verify pagination on all other list pages:
  - [ ] Sales dashboard lists
  - [ ] Manager dashboard lists
  - [ ] Product lists
  - [ ] Order lists
  - [ ] Pipeline lists
- [ ] Test with 100+ records
- [ ] Test with 1000+ records
- [ ] Add pagination controls if missing
- [ ] Add page size selector
- [ ] Show record count information

**Priority:** 🟡 **HIGH**
**Estimated Time:** 4-5 hours
**Files to Review:**
- All list/page components

---

## 🟠 MEDIUM PRIORITY ISSUES

### Issue #7: Duplicate Phone Number Check Missing
**Problem:** Can create customers with duplicate phone numbers, no validation.

**Location:**
- Backend: `backend/apps/clients/serializers.py`
- Frontend: `jewellery-crm/src/components/customers/AddCustomerModal.tsx`

**Action Required:**
- [ ] Add duplicate phone check in backend serializer
- [ ] Add duplicate phone check in frontend before submission
- [ ] Show user-friendly error message
- [ ] Consider "merge" option if duplicate found
- [ ] Test duplicate phone scenarios

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 2-3 hours
**Files to Modify:**
- `backend/apps/clients/serializers.py`
- `jewellery-crm/src/components/customers/AddCustomerModal.tsx`

---

### Issue #8: Empty Filter Results Not Clearly Indicated
**Problem:** When filters return 0 results, just shows empty screen - confusing for users.

**Location:**
- `jewellery-crm/src/app/sales/customers/page.tsx` - Filter logic

**Action Required:**
- [ ] Add "No customers found matching your filters" message
- [ ] Show active filter summary
- [ ] Add "Clear filters" button when no results
- [ ] Apply same pattern to all filtered lists
- [ ] Test with various filter combinations

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 1-2 hours
**Files to Modify:**
- Customer list pages
- Other filtered list components

---

### Issue #9: Mobile Modal Size Issues
**Problem:** Modals may be too large or not scrollable on small mobile screens (< 320px width).

**Location:**
- All modal components

**Action Required:**
- [ ] Test all modals on 320px width
- [ ] Ensure modals are scrollable
- [ ] Test on actual mobile devices
- [ ] Reduce modal width on mobile if needed
- [ ] Ensure header/footer stay visible during scroll
- [ ] Fix: AddCustomerModal, EditCustomerModal, etc.

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 2-3 hours
**Files to Review:**
- `jewellery-crm/src/components/customers/AddCustomerModal.tsx`
- `jewellery-crm/src/components/customers/EditCustomerModal.tsx`
- All modal components

---

### Issue #10: Date Picker Mobile Experience
**Problem:** 2-month calendar view in date picker might be cramped on mobile devices.

**Location:**
- `jewellery-crm/src/components/ui/date-range-filter.tsx`
- Calendar component

**Action Required:**
- [ ] Test date picker on mobile (< 768px)
- [ ] Switch to single-month view on mobile
- [ ] Ensure touch targets are adequate
- [ ] Test date selection on mobile
- [ ] Consider native date picker on mobile

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 2 hours
**Files to Modify:**
- `jewellery-crm/src/components/ui/date-range-filter.tsx`

---

### Issue #11: Token Storage Security
**Problem:** JWT tokens stored in localStorage are vulnerable to XSS attacks.

**Location:**
- `jewellery-crm/src/lib/api-service.ts` - `getAuthToken()`
- `jewellery-crm/src/hooks/useAuth.ts`

**Action Required:**
- [ ] Research httpOnly cookie implementation
- [ ] Consider moving tokens to httpOnly cookies
- [ ] Evaluate XSS protection measures
- [ ] Add CSP headers if not present
- [ ] Document security considerations

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 3-4 hours (including research)
**Files to Review:**
- `jewellery-crm/src/lib/api-service.ts`
- `jewellery-crm/src/hooks/useAuth.ts`
- Backend CORS/cookie settings

---

### Issue #12: Offline Functionality Incomplete
**Problem:** PWA service worker exists but offline functionality not verified/complete.

**Location:**
- `jewellery-crm/public/sw.js`
- `jewellery-crm/src/components/providers/AppProviders.tsx`

**Action Required:**
- [ ] Verify service worker caching strategy
- [ ] Test offline page loading
- [ ] Add request queue for offline-to-online sync
- [ ] Add offline indicator to UI
- [ ] Test offline mode thoroughly
- [ ] Document offline capabilities

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 4-5 hours
**Files to Review:**
- `jewellery-crm/public/sw.js`
- Service worker implementation

---

### Issue #13: No Optimistic Locking for Updates
**Problem:** Concurrent updates can cause last-write-wins, potential data loss.

**Location:**
- All update operations (customer, product, etc.)

**Action Required:**
- [ ] Add version/updated_at checking
- [ ] Show conflict message if data changed
- [ ] Implement merge strategy or show diff
- [ ] Test concurrent update scenarios
- [ ] Start with critical entities (customers, orders)

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 4-6 hours
**Files to Modify:**
- Update handlers in components
- Backend serializers

---

### Issue #14: Timezone Handling Not Verified
**Problem:** Date filtering and display might have issues with users in different timezones.

**Location:**
- All date filtering and display logic
- Dashboard date ranges

**Action Required:**
- [ ] Test date filtering with different timezones
- [ ] Verify backend stores dates in UTC
- [ ] Verify frontend converts properly
- [ ] Test with users in different timezones
- [ ] Add timezone indicator if needed

**Priority:** 🟠 **MEDIUM**
**Estimated Time:** 2-3 hours
**Files to Review:**
- Date filtering components
- Dashboard date logic
- Backend date handling

---

## 🟢 LOW PRIORITY ISSUES

### Issue #15: Login Page Missing "Remember Me"
**Problem:** Users cannot stay logged in across browser sessions.

**Action Required:**
- [ ] Add "Remember Me" checkbox to login
- [ ] Extend token expiration if checked
- [ ] Update auth persistence logic

**Priority:** 🟢 **LOW**
**Estimated Time:** 1-2 hours

---

### Issue #16: Session Expiration Not Notified
**Problem:** When token expires, user redirected but no clear message shown.

**Action Required:**
- [ ] Show "Session expired" message before redirect
- [ ] Give option to stay on page if needed
- [ ] Update error handling in api-service

**Priority:** 🟢 **LOW**
**Estimated Time:** 1 hour

---

### Issue #17: No Bulk Operations
**Problem:** Cannot perform bulk delete/update on customers or products.

**Action Required:**
- [ ] Add checkbox selection to list views
- [ ] Add bulk action toolbar
- [ ] Implement bulk delete
- [ ] Implement bulk update (status, tags, etc.)
- [ ] Start with customer bulk operations

**Priority:** 🟢 **LOW**
**Estimated Time:** 6-8 hours

---

### Issue #18: Export Functionality Missing
**Problem:** Cannot export customer/product data to CSV/Excel.

**Action Required:**
- [ ] Add export button to list views
- [ ] Backend endpoint for data export
- [ ] CSV export functionality
- [ ] Excel export functionality (optional)
- [ ] Respect current filters for export

**Priority:** 🟢 **LOW**
**Estimated Time:** 4-5 hours

---

### Issue #19: Cache TTL Too Short/Long
**Problem:** 2-minute cache might be too short for some data, too long for others.

**Action Required:**
- [ ] Implement different cache TTLs per data type
- [ ] Static data: 10 minutes
- [ ] Dynamic data: 1 minute
- [ ] Real-time data: no cache
- [ ] Make TTL configurable

**Priority:** 🟢 **LOW**
**Estimated Time:** 2-3 hours

---

### Issue #20: No Loading Indicators for Month Navigation
**Problem:** Month navigation in dashboard doesn't show loading state.

**Action Required:**
- [ ] Add loading indicator when changing months
- [ ] Disable navigation during load
- [ ] Show progress if data is large

**Priority:** 🟢 **LOW**
**Estimated Time:** 1 hour

---

### Issue #21: Error Messages Too Technical
**Problem:** Some error messages contain technical details users don't understand.

**Action Required:**
- [ ] Review all error messages
- [ ] Create user-friendly message mapping
- [ ] Translate technical errors
- [ ] Add error code reference (optional)

**Priority:** 🟢 **LOW**
**Estimated Time:** 2-3 hours

---

### Issue #22: Rate Limiting on Login Not Verified
**Problem:** No rate limiting mentioned, vulnerable to brute force attacks.

**Action Required:**
- [ ] Verify rate limiting on login endpoint
- [ ] Implement if missing
- [ ] Add CAPTCHA after N failed attempts
- [ ] Log suspicious activity

**Priority:** 🟢 **LOW** (Security)
**Estimated Time:** 2-3 hours

---

## 📋 Summary Statistics

- **Critical Blockers:** 2 issues
- **High Priority:** 4 issues
- **Medium Priority:** 10 issues
- **Low Priority:** 8 issues
- **Total Issues:** 24 issues

**Estimated Total Time to Fix All:** 60-75 hours (~2 weeks)

---

## 🎯 Recommended Fix Order

### Week 1 - Critical & High Priority
1. Issue #1: Customer Update Validation (2-3 hrs)
2. Issue #2: Dashboard API Verification (1-2 hrs)
3. Issue #3: Network Timeout (2-3 hrs)
4. Issue #4: Retry Logic (3-4 hrs)
5. Issue #5: Password Reset (6-8 hrs)
6. Issue #6: Pagination Verification (4-5 hrs)

**Week 1 Total:** ~18-25 hours

### Week 2 - Medium Priority
7. Issue #7: Duplicate Phone Check (2-3 hrs)
8. Issue #8: Empty Filter Results (1-2 hrs)
9. Issue #9: Mobile Modals (2-3 hrs)
10. Issue #10: Date Picker Mobile (2 hrs)
11. Issue #11: Token Security (3-4 hrs)
12. Issue #12: Offline Functionality (4-5 hrs)
13. Issue #13: Optimistic Locking (4-6 hrs)
14. Issue #14: Timezone Handling (2-3 hrs)

**Week 2 Total:** ~20-26 hours

### Week 3 - Low Priority & Polish
15-24: Low priority issues as time permits

---

## ✅ Testing Checklist (After Fixes)

After fixing critical and high priority issues:

- [ ] Test customer create/update/delete with edge cases
- [ ] Test login with wrong credentials (rate limiting)
- [ ] Test network failure scenarios
- [ ] Test on actual mobile devices (not just browser dev tools)
- [ ] Test with 100+ customers (performance)
- [ ] Test with 1000+ customers (pagination)
- [ ] Test concurrent user modifications
- [ ] Test timezone issues (users in different timezones)
- [ ] Test offline functionality
- [ ] Test password reset flow end-to-end
- [ ] Load testing for dashboard endpoints
- [ ] Security audit

---

## 📝 Notes

- All time estimates are for implementation only
- Add 20-30% buffer for testing and debugging
- Prioritize based on production readiness needs
- Some issues can be fixed in parallel by different developers
- Start with blockers, then move to high priority
- Document fixes as you go

