
# Fix Twilio Configuration Status Detection + Add Test Button

## Problem Identified

Your Twilio settings are actually saved correctly but the UI shows "Not Configured" because:

### Key Prefix Mismatch

| What's Saved (in database) | What UI Checks For |
|---------------------------|-------------------|
| `settings_twilio_account_sid` | `twilio_account_sid` |
| `settings_twilio_api_key_sid` | `twilio_api_key_sid` |
| `settings_twilio_api_key_secret` | `twilio_api_key_secret` |

The `save-api-keys` function adds `settings_` prefix to all keys, but the SettingsPage KEY constants don't include this prefix.

### Affected Areas

1. **Admin Settings UI** - Badge always shows "Not Configured" 
2. **notify-admin function** - Can't send WhatsApp because it looks for wrong keys
3. **Form values don't load** - Values appear empty because they're read from wrong keys

---

## Solution

### Step 1: Fix KEY Constants in SettingsPage.tsx

Update the Twilio key constants to include the `settings_` prefix:

```typescript
// BEFORE (current - broken)
TWILIO_SID: "twilio_account_sid",
TWILIO_TOKEN: "twilio_auth_token",
TWILIO_API_KEY_SID: "twilio_api_key_sid",
TWILIO_API_KEY_SECRET: "twilio_api_key_secret",
TWILIO_PHONE: "twilio_phone_number",
TWILIO_WA: "twilio_whatsapp_number",

// AFTER (fixed)
TWILIO_SID: "settings_twilio_account_sid",
TWILIO_TOKEN: "settings_twilio_auth_token",
TWILIO_API_KEY_SID: "settings_twilio_api_key_sid",
TWILIO_API_KEY_SECRET: "settings_twilio_api_key_secret",
TWILIO_PHONE: "settings_twilio_phone_number",
TWILIO_WA: "settings_twilio_whatsapp_number",
```

### Step 2: Update notify-admin Edge Function

Fix the keys it queries to include the `settings_` prefix:

```typescript
// BEFORE
.in("key", ["twilio_account_sid", "twilio_auth_token", "twilio_whatsapp_number"]);

// AFTER
.in("key", [
  "settings_twilio_account_sid", 
  "settings_twilio_auth_token",
  "settings_twilio_api_key_sid",
  "settings_twilio_api_key_secret", 
  "settings_twilio_whatsapp_number"
]);
```

Also update the auth logic to support API Keys:
```typescript
const authUsername = config.settings_twilio_api_key_sid || config.settings_twilio_account_sid;
const authPassword = config.settings_twilio_api_key_secret || config.settings_twilio_auth_token;
```

### Step 3: Add Test Button with Live Status

Add a "Test Connection" button to the Twilio section that:
1. Attempts to validate credentials with Twilio's API
2. Shows real-time feedback (success/failure)
3. Displays the actual error from Twilio if something is wrong

```text
┌────────────────────────────────────────────────────┐
│  Twilio Configuration              [✓ Configured] │
├────────────────────────────────────────────────────┤
│  Account SID: [AC3b6fa0fa90...]                   │
│  API Key SID: [SKe9e478eb...]                     │
│  API Secret:  [••••••••••]                        │
│  Phone:       [+18143833159]                      │
│  WhatsApp:    [+18143833159]                      │
│                                                    │
│  [Save Configuration]  [Test Connection]          │
│                                                    │
│  ✅ Connection verified - Twilio is working       │
└────────────────────────────────────────────────────┘
```

### Step 4: Create test-twilio Edge Function

New edge function to validate Twilio credentials:

```typescript
// Fetches account info from Twilio API
// If credentials are valid, returns success
// If invalid, returns the specific error
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/SettingsPage.tsx` | Fix KEY constants, add Test button with state |
| `supabase/functions/notify-admin/index.ts` | Fix key names, add API Key support |
| `supabase/functions/test-twilio/index.ts` | New function to validate credentials |

---

## Expected Result

After implementation:
- Badge will show **"Configured"** (green) when credentials exist
- Values will populate correctly in the form fields
- **Test Connection** button verifies credentials are actually working
- WhatsApp notifications via notify-admin will work again
- Clear error messages if something is misconfigured
