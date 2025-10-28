# Vercel WebSocket Setup - Simple!

## You Don't Need a Separate WebSocket URL!

Your app automatically creates the WebSocket URL from your API URL.

### Add This to Vercel:

**Variable:** `NEXT_PUBLIC_API_URL`  
**Value:** `https://150.241.246.110`

## How It Works:

1. You set `NEXT_PUBLIC_API_URL=https://150.241.246.110`
2. App converts `https://` → `wss://` automatically
3. App connects to: `wss://150.241.246.110/ws/notifications/`

## That's It!

No separate `NEXT_PUBLIC_WS_URL` needed.

## Quick Setup:

1. Go to Vercel project
2. Settings → Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = `https://150.241.246.110`
4. Redeploy

Done! 🎉

