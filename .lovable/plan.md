

# Fix Phone Calls -- Deploy twilio-voice + Fix twilio-call-me

## Root Cause

Two issues are preventing calls from connecting:

1. **`twilio-voice` is NOT deployed** (returns 404). The code was fixed in the last edit but the deployment either failed silently or was skipped. It needs to be explicitly deployed.

2. **`twilio-call-me` still uses the broken old import** on line 1:
   ```
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   ```
   This is the same legacy pattern that broke all the Facebook functions. It managed to deploy but is unreliable.

## Fix

### Step 1: Fix twilio-call-me (line 1 + line ~56)
- Remove the old `serve` import on line 1
- Change `serve(async (req) => {` to `Deno.serve(async (req) => {`

### Step 2: Deploy both functions
- Deploy `twilio-voice` and `twilio-call-me` together

## What This Restores
- Incoming calls answered by Isabel (AI voice assistant)
- "Call and Speak" callback from the website
- Speech recognition and AI conversation
- Member identification and personalized greetings

