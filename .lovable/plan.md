

# Switch to Twilio API Keys for Enhanced Security

## Overview

This change replaces the current authentication method (Account SID + Auth Token) with Twilio API Keys (Account SID + API Key SID + API Key Secret). This is a security best practice that allows you to:

- **Restrict permissions** - API Keys can have limited scope
- **Rotate keys safely** - Revoke compromised keys without affecting the main account
- **Better audit trail** - Track which key was used for each request

## Current Implementation

Currently, all 3 Twilio edge functions authenticate using:
```
Authorization: Basic base64(AccountSID:AuthToken)
```

**Files affected:**
- `supabase/functions/twilio-sms/index.ts`
- `supabase/functions/twilio-voice/index.ts`
- `supabase/functions/twilio-whatsapp/index.ts`

**Settings stored in `system_settings`:**
- `twilio_account_sid`
- `twilio_auth_token`
- `twilio_phone_number`
- `twilio_whatsapp_number`

---

## Proposed Changes

### 1. Add New Database Settings Keys

Add two new settings to store the API Key credentials:

| New Key | Description |
|---------|-------------|
| `twilio_api_key_sid` | The API Key SID (starts with `SK...`) |
| `twilio_api_key_secret` | The API Key Secret |

The existing `twilio_account_sid` remains required for API calls.

### 2. Update Admin Settings UI

Modify `src/pages/admin/SettingsPage.tsx` to:

- Add input fields for **API Key SID** and **API Key Secret**
- Keep the Auth Token field for backward compatibility (optional fallback)
- Update the save handler to include new keys
- Add helper text explaining the API Key benefits

```text
Current UI:
+-----------------------+-----------------------+
| Account SID           | Auth Token            |
+-----------------------+-----------------------+
| Phone Number          | WhatsApp Number       |
+-----------------------+-----------------------+

New UI:
+-----------------------+-----------------------+
| Account SID           | Auth Token (optional) |
+-----------------------+-----------------------+
| API Key SID           | API Key Secret        |
+-----------------------+-----------------------+
| Phone Number          | WhatsApp Number       |
+-----------------------+-----------------------+
```

### 3. Update Edge Functions

Modify all 3 Twilio edge functions to:

1. Fetch the new API Key settings alongside existing ones
2. Prefer API Keys for authentication when available
3. Fall back to Auth Token if API Keys not configured

**Authentication logic change:**

```typescript
// BEFORE (current)
const auth = btoa(`${accountSid}:${authToken}`);

// AFTER (with API Keys)
const username = apiKeySid || accountSid;
const password = apiKeySecret || authToken;
const auth = btoa(`${username}:${password}`);
```

---

## Technical Implementation

### Step 1: Update SettingsPage.tsx

**Add new KEY constants:**
```typescript
TWILIO_API_KEY_SID: "twilio_api_key_sid",
TWILIO_API_KEY_SECRET: "twilio_api_key_secret",
```

**Update twilioKeys state:**
```typescript
const [twilioKeys, setTwilioKeys] = useState({
  account_sid: "",
  auth_token: "",
  api_key_sid: "",      // NEW
  api_key_secret: "",   // NEW
  phone_number: "",
  whatsapp_number: "",
});
```

**Add new input fields in the UI** for API Key SID and API Key Secret with masked input and visibility toggle.

### Step 2: Update twilio-sms/index.ts

**Fetch new settings:**
```typescript
const { data: settings } = await supabase
  .from("system_settings")
  .select("key, value")
  .in("key", [
    "twilio_account_sid",
    "twilio_auth_token",
    "twilio_api_key_sid",      // NEW
    "twilio_api_key_secret",   // NEW
    "twilio_phone_number"
  ]);
```

**Updated authentication:**
```typescript
// Prefer API Keys, fall back to Auth Token
const authUsername = twilioConfig.twilio_api_key_sid || twilioConfig.twilio_account_sid;
const authPassword = twilioConfig.twilio_api_key_secret || twilioConfig.twilio_auth_token;

if (!twilioConfig.twilio_account_sid || !authPassword) {
  return new Response(
    JSON.stringify({ error: "Twilio not configured" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

const auth = btoa(`${authUsername}:${authPassword}`);
```

### Step 3: Update twilio-voice/index.ts

Apply the same authentication pattern changes as twilio-sms.

### Step 4: Update twilio-whatsapp/index.ts

Apply the same authentication pattern changes as twilio-sms, also including the WhatsApp number in settings fetch.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/SettingsPage.tsx` | Add API Key SID/Secret fields and state |
| `supabase/functions/twilio-sms/index.ts` | Fetch new keys, prefer API Key auth |
| `supabase/functions/twilio-voice/index.ts` | Fetch new keys, prefer API Key auth |
| `supabase/functions/twilio-whatsapp/index.ts` | Fetch new keys, prefer API Key auth |

---

## Migration Path

1. **No breaking changes** - Auth Token continues to work
2. Generate API Key in Twilio Console (Account > API keys)
3. Enter API Key SID and Secret in admin settings
4. (Optional) Remove Auth Token after confirming API Keys work

---

## How to Create a Twilio API Key

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Account** > **API keys & tokens**
3. Click **Create API Key**
4. Choose **Standard** or **Restricted** key type
5. Copy the **SID** (starts with `SK`) and **Secret**
6. Enter these values in the admin settings panel

---

## Expected Result

After implementation:
- Admin settings will show new API Key fields
- Edge functions will use API Keys when configured
- Backward compatible with Auth Token if API Keys not set
- No changes needed to webhook URLs or call logic

