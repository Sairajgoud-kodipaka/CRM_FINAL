# Vercel Redeploy Steps - Apply Environment Variable Fix

## ✅ Current Status
- Environment variable is correctly set: `https://api.150.241.246.110.sslip.io`
- Variable shows "Updated 13m ago"
- ⚠️ Warning icon indicates redeploy needed

## 🚀 Action Required: Redeploy

### Method 1: Redeploy from Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `jewel-crm`

2. **Go to Deployments Tab**
   - Click on **"Deployments"** in the top navigation

3. **Redeploy Latest Deployment**
   - Find the latest deployment (should be at the top)
   - Click the **three dots (⋯)** menu on the right
   - Select **"Redeploy"**
   - ✅ Check the box: **"Use existing Build Cache"** (optional, faster)
   - Click **"Redeploy"**

4. **Wait for Build to Complete**
   - Watch the build logs
   - Should take 2-5 minutes
   - Look for: ✅ Build Successful

### Method 2: Trigger via Git Push (Alternative)

If you want to trigger a fresh deployment:

```bash
# Make a small change to trigger redeploy
# For example, update a comment in any file
cd jewellery-crm
git add .
git commit -m "chore: trigger redeploy for environment variable"
git push
```

## 🔍 Verify the Fix

After redeploy completes:

1. **Open Your Vercel Site**
   - Visit: `https://jewel-crm.vercel.app`
   - Open in **Incognito/Private** window (to avoid cache)

2. **Check Browser Console**
   - Press `F12` to open DevTools
   - Go to **Console** tab
   - Look for any `ERR_CERT_COMMON_NAME_INVALID` errors
   - Should be **none** now

3. **Check Network Tab**
   - Press `F12` → **Network** tab
   - Try to login
   - Check the `/api/login/` request:
     - ✅ URL should be: `https://api.150.241.246.110.sslip.io/api/login/`
     - ✅ Status should be 200 or 201
     - ❌ Should NOT be: `150.241.246.110/api/login/`

4. **Verify API URL in Code**
   - In browser console, type:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_API_URL)
   ```
   - Should output: `https://api.150.241.246.110.sslip.io`

## ⚠️ Why the Warning Icon?

The warning icon appears because:
- Environment variables are **baked into the build** at build time
- Current live deployment still has the **old value** (probably the IP address)
- New value only applies to **new deployments**
- This is a reminder that redeploy is required

## 🔄 If Still Not Working After Redeploy

1. **Check Deployment Logs**
   - In Vercel Dashboard → Deployments → Click on your deployment
   - Check **Build Logs** tab
   - Look for: `NEXT_PUBLIC_API_URL=...`
   - Verify it shows the correct domain

2. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear site data in DevTools

3. **Check for Multiple Environment Variables**
   - In Vercel Settings → Environment Variables
   - Make sure there's only ONE `NEXT_PUBLIC_API_URL`
   - Check all environments: Production, Preview, Development
   - They should all have the same value

4. **Verify Build-time Injection**
   - The variable MUST be set before the build starts
   - If you set it after build started, it won't be included
   - Wait for previous build to complete, then redeploy

## 📝 Quick Checklist

- [ ] Environment variable set correctly: `https://api.150.241.246.110.sslip.io`
- [ ] Variable is set for **All Environments** (Production, Preview, Development)
- [ ] Redeployed from Vercel Dashboard
- [ ] Build completed successfully
- [ ] Tested in Incognito window
- [ ] No more `ERR_CERT_COMMON_NAME_INVALID` errors
- [ ] Network tab shows correct domain in API calls

---

**Note**: After redeploy, wait 1-2 minutes for DNS/CDN propagation, then test again if issues persist.


