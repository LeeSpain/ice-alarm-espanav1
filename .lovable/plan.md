

## Goal
Fix the Twilio integration by:
1. Correcting the **key name mismatch** across all Twilio edge functions (critical bug)
2. Adding **Auth Token fallback** support for testing
3. Ensuring consistent credential retrieval across SMS, Voice, and WhatsApp functions

## Issues Found

### Issue 1: Key Name Mismatch (CRITICAL)
The database stores keys with `settings_` prefix, but the operational functions look for keys without the prefix:

| Function | Keys it queries | Keys in database | Status |
|----------|----------------|------------------|--------|
| test-twilio | `settings_twilio_account_sid` | `settings_twilio_account_sid` | Works |
| twilio-sms | `twilio_account_sid` | (doesn't exist) | BROKEN |
| twilio-voice | `twilio_account_sid` | (doesn't exist) | BROKEN |
| twilio-whatsapp | `twilio_account_sid` | (doesn't exist) | BROKEN |

This means the Test Connection may pass, but actual SMS/Voice/WhatsApp calls would fail with "Twilio not configured".

### Issue 2: No Auth Token Stored
Currently no Auth Token is configured in the database. We need to add Auth Token support to the Settings UI and edge functions for fallback testing.

## Implementation Plan

### Step 1: Fix twilio-sms function
Update key names from `twilio_*` to `settings_twilio_*`:
```typescript
.in("key", [
  "settings_twilio_account_sid",
  "settings_twilio_auth_token",
  "settings_twilio_api_key_sid",
  "settings_twilio_api_key_secret",
  "settings_twilio_phone_number"
])
```
And update all references:
```typescript
twilioConfig.settings_twilio_account_sid  // instead of twilio_account_sid
```

### Step 2: Fix twilio-voice function
Same key name corrections as SMS.

### Step 3: Fix twilio-whatsapp function  
Same key name corrections, plus fix `twilio_whatsapp_number` to `settings_twilio_whatsapp_number`.

### Step 4: Add Auth Token field to Settings UI
Add an Auth Token input field in the Twilio Configuration card using the same "stored flag + input value" pattern we implemented for API Key Secret:
- `twilioAuthTokenInput` (string) - for new user input
- `twilioAuthTokenStored` (boolean) - derived from database

### Step 5: Verify test-twilio supports both auth methods
The test function already supports falling back to Auth Token if API Key isn't configured. Once we add the Auth Token to the UI, users can test with either method.

## Files to Modify

1. `supabase/functions/twilio-sms/index.ts` - Fix key prefixes
2. `supabase/functions/twilio-voice/index.ts` - Fix key prefixes  
3. `supabase/functions/twilio-whatsapp/index.ts` - Fix key prefixes
4. `src/pages/admin/SettingsPage.tsx` - Add Auth Token input field (already partially set up)

## Technical Details

### Key Mapping (Before/After)

```text
BEFORE (broken):              AFTER (fixed):
twilio_account_sid      →     settings_twilio_account_sid
twilio_auth_token       →     settings_twilio_auth_token
twilio_api_key_sid      →     settings_twilio_api_key_sid
twilio_api_key_secret   →     settings_twilio_api_key_secret
twilio_phone_number     →     settings_twilio_phone_number
twilio_whatsapp_number  →     settings_twilio_whatsapp_number
```

## Acceptance Criteria

1. Test Connection works with API Key method
2. Test Connection works with Auth Token method (fallback)
3. SMS/Voice/WhatsApp functions correctly retrieve credentials from database
4. No "Twilio not configured" errors when credentials are properly saved

## Next Steps After Fix

1. Save your Twilio Auth Token via the Settings page as a backup
2. Test API Key authentication first
3. If API Key still fails with 20003, clear it and test with Auth Token only
4. This will isolate whether the issue is with your specific API Key or account-level

