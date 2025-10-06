# Test Call Initiation Fix

## Problem Identified
The call initiation was failing with a 500 Internal Server Error because of a role mismatch:

- **Backend code**: Checking for `role == 'telecaller'`
- **Actual user role**: `tele_calling`

## Fix Applied
Updated the following files to use the correct role:

1. **backend/telecalling/call_views.py**:
   - Line 35: `if user.role == 'telecaller':` → `if user.role == 'tele_calling':`
   - Line 56: `if request.user.role == 'telecaller':` → `if request.user.role == 'tele_calling':`

2. **backend/telecalling/routing_service.py**:
   - Line 112: `role='telecaller'` → `role='tele_calling'`

3. **backend/telecalling/utils.py**:
   - Line 96: `if user.role == 'telecaller'` → `if user.role == 'tele_calling'`

## Verification
- ✅ Lead exists: `puneeet (9390681956)`
- ✅ Telecaller exists: `ramesh (tele_calling)`
- ✅ Lead is assigned to telecaller: `ramesh`
- ✅ No existing active calls
- ✅ Exotel configuration is properly set

## Expected Result
The call initiation should now work properly and you should see the call interface instead of the telecaller interface.

## Next Steps
1. Test the call initiation in the frontend
2. Verify the call interface displays correctly
3. Test WebRTC functionality
4. Test call controls (mute, hold, end)

