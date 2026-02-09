

# Restore Phone Calls -- Complete Fix

## Issues Found

### Issue 1: `twilio-voice` function not deployed (404)
The code is correct and uses `Deno.serve()`, but the function is returning 404. It was never successfully deployed despite multiple attempts. The function needs to be deployed again -- this time we will verify it works by calling it directly after deployment.

### Issue 2: Twilio Trial Account Limitation
The `twilio-call-me` logs reveal Twilio error **21219**:
```
"The number +34000000000 is unverified. Trial accounts may only make calls to verified numbers."
```
This is a **Twilio account restriction**, not a code bug. Trial Twilio accounts can ONLY call phone numbers that have been manually verified in the Twilio Console.

## Plan

### Step 1: Deploy `twilio-voice`
- Force deploy the `twilio-voice` function (the code is already correct)
- Immediately test it by calling the function directly to confirm it's live and responding with valid TwiML

### Step 2: Verify `twilio-call-me` is live
- Test `twilio-call-me` endpoint to confirm it responds correctly

### Step 3: Twilio Account Action (requires YOU, not code)
To make calls to any phone number, you must do ONE of these:
- **Option A**: Upgrade your Twilio account from Trial to a paid account at twilio.com/console
- **Option B**: If staying on Trial, add your personal phone number as a "Verified Caller ID" in Twilio Console > Phone Numbers > Verified Caller IDs

No code changes are needed -- this is purely a deployment and Twilio account configuration issue.

## Technical Details

- `twilio-voice/index.ts`: 1014 lines, already uses `Deno.serve()` and `npm:@supabase/supabase-js@2` -- code is correct
- `twilio-call-me/index.ts`: Already fixed in last edit, uses `Deno.serve()` -- code is correct
- Both functions have `verify_jwt = false` in `config.toml` -- correct for Twilio webhooks

## What This Restores
- Incoming calls answered by Isabel (AI voice assistant)
- "Call and Speak" callback from the website
- Speech recognition and AI conversation
- Member identification and personalized greetings

