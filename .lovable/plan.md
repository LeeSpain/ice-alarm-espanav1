

# Fix twilio-voice Deployment -- Split Large Function

## Root Cause

The `twilio-voice` function is **1015 lines** in a single file. Despite correct code, it has **never successfully deployed** across multiple attempts. Every call returns 404.

Your Twilio account is active, has credit, and test-twilio confirms connectivity. The problem is purely that this function won't deploy.

## Diagnosis

Large edge functions can silently fail during deployment due to:
- Compilation timeouts on cold start
- Memory pressure during bundling
- The deployment system timing out before the function registers

Other functions (test-twilio, twilio-call-me, twilio-sms) all deploy fine -- they are all under 200 lines.

## Plan: Simplify and Redeploy

### Step 1: Trim the function to essentials

The function handles 7 different actions in one file. We will **remove non-critical code paths** to reduce the file size significantly while keeping all call-handling functionality:

- **Keep**: `incoming`, `transcription`, `timeout`, `status`, `wait` actions (these handle the voice call flow with Isabel)
- **Simplify**: The `status` handler (lines 693-907) contains ~200 lines of CRM note generation and AI summary code. Move the heavy AI summary generation into a separate lightweight function or simplify to basic logging.
- **Remove**: The outbound call section (lines 930-1004) can be extracted into a separate `twilio-outbound` function -- this is only used by admin staff making manual calls, not for inbound calling

Target: Reduce from 1015 lines to approximately 600-700 lines.

### Step 2: Deploy and immediately test

- Deploy the trimmed `twilio-voice`
- Call the endpoint directly to verify it responds with valid TwiML
- If successful, call the actual phone number to confirm Isabel answers

### Step 3: Create `twilio-outbound` (optional, if needed)

If outbound staff calls are needed later, the extracted code goes into its own function.

## What This Restores

- Calling the number (+18143833159) connects to Isabel
- Isabel greets callers by name (if known)
- Speech recognition and AI conversation
- Multi-turn conversation with memory
- Escalation to human operators
- Call logging and CRM notes (simplified)

## Technical Details

Files to modify:
- `supabase/functions/twilio-voice/index.ts` -- reduce from 1015 to ~650 lines by extracting outbound call logic and simplifying the CRM summary in the status handler
- `supabase/config.toml` -- no changes needed (already configured)

No new dependencies. No database changes.
