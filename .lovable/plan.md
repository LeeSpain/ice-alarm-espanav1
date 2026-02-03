

# Dual Email Provider Implementation Plan (Resend + Gmail SMTP)

## Current State Analysis

| Component | Status | Details |
|-----------|--------|---------|
| `email_settings` table | Exists | Has `provider` column (default 'gmail') but no SMTP fields |
| Edge functions | Resend-only | `send-email` and `send-test-email` only support Resend |
| UI | Resend-only | Shows "Resend Connected" with no provider toggle |
| Secrets | Resend only | `RESEND_API_KEY` is configured, no Gmail SMTP secret |

---

## Stage 1: Database Schema Update

### Add Gmail SMTP Fields to `email_settings`

| New Column | Type | Default | Purpose |
|------------|------|---------|---------|
| `gmail_mode` | text | 'smtp' | Mode selector: 'smtp' or 'oauth' |
| `gmail_smtp_host` | text | 'smtp.gmail.com' | SMTP server |
| `gmail_smtp_port` | integer | 587 | SMTP port (587 for TLS) |
| `gmail_smtp_user` | text | null | Gmail username/email |
| `gmail_smtp_password_secret_name` | text | null | Reference to secret storing App Password |

### Migration SQL

```sql
ALTER TABLE public.email_settings
ADD COLUMN IF NOT EXISTS gmail_mode text DEFAULT 'smtp',
ADD COLUMN IF NOT EXISTS gmail_smtp_host text DEFAULT 'smtp.gmail.com',
ADD COLUMN IF NOT EXISTS gmail_smtp_port integer DEFAULT 587,
ADD COLUMN IF NOT EXISTS gmail_smtp_user text,
ADD COLUMN IF NOT EXISTS gmail_smtp_password_secret_name text;

COMMENT ON COLUMN email_settings.gmail_mode IS 'Gmail mode: smtp or oauth';
COMMENT ON COLUMN email_settings.gmail_smtp_password_secret_name IS 'Name of the secret storing Gmail App Password';
```

---

## Stage 2: Update UI - Provider Selection

### EmailSettingsTab.tsx Changes

**Add Provider Selector UI:**
- Radio group or dropdown to switch between "Resend" and "Gmail"
- When "Resend" is selected: Show current Resend configuration
- When "Gmail" is selected: Show Gmail SMTP fields

**Gmail SMTP Configuration Fields:**
- SMTP Host (default: smtp.gmail.com)
- SMTP Port (default: 587)
- Gmail User (email address)
- App Password input (stored as secret, masked after save)

**UI Flow:**

```text
┌─────────────────────────────────────────────┐
│ Email Provider                              │
│                                             │
│  ○ Resend (API-based)                       │
│    └── Status: Connected ✓                  │
│                                             │
│  ● Gmail SMTP                               │
│    ├── SMTP Host: smtp.gmail.com            │
│    ├── SMTP Port: 587                       │
│    ├── Gmail User: your@gmail.com           │
│    └── App Password: ••••••••••             │
│                                             │
│  💡 Use Gmail temporarily until DNS          │
│     verification for Resend is complete.    │
└─────────────────────────────────────────────┘
```

### Update useEmailSettings.ts

**Add to EmailSettings interface:**
```typescript
gmail_mode: 'smtp' | 'oauth';
gmail_smtp_host: string | null;
gmail_smtp_port: number;
gmail_smtp_user: string | null;
gmail_smtp_password_secret_name: string | null;
```

**Add to EmailSettingsUpdate interface:**
```typescript
provider?: 'resend' | 'gmail';
gmail_mode?: 'smtp' | 'oauth';
gmail_smtp_host?: string;
gmail_smtp_port?: number;
gmail_smtp_user?: string;
```

**Add new mutation for saving Gmail App Password:**
- Invoke edge function to securely store password as a secret
- Update `gmail_smtp_password_secret_name` in email_settings

---

## Stage 3: Update Edge Functions for Dual Provider

### send-email/index.ts Changes

**Add Gmail SMTP Sending Logic:**

```typescript
// Pseudocode for provider branching
if (settings.provider === 'gmail') {
  // Fetch App Password from secrets
  const appPassword = Deno.env.get(settings.gmail_smtp_password_secret_name);
  
  // Use Deno SMTP client or nodemailer-style library
  await sendViaGmailSMTP({
    host: settings.gmail_smtp_host,
    port: settings.gmail_smtp_port,
    user: settings.gmail_smtp_user,
    password: appPassword,
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html: html_body,
    headers: customHeaders,
  });
} else {
  // Existing Resend logic
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  await resend.emails.send({ ... });
}
```

**SMTP Library for Deno:**
- Use `https://deno.land/x/smtp` or `https://deno.land/x/denomailer`
- Both support TLS/STARTTLS on port 587

### send-test-email/index.ts Changes

Apply same dual-provider logic:
1. Check `settings.provider`
2. Route to appropriate sending method
3. Update test email content to show active provider

### Maintain Consistent Behavior Across Providers

| Feature | Resend | Gmail SMTP |
|---------|--------|------------|
| Logging to `email_log` | ✓ | ✓ |
| Apply templates + signature | ✓ | ✓ |
| X-ICE-Module headers | ✓ | ✓ |
| Rate limiting | ✓ | ✓ |
| Error handling | ✓ | ✓ |

---

## Stage 4: Secure App Password Storage

### New Edge Function: save-gmail-password

**Purpose:** Securely store Gmail App Password as a Supabase secret

**Approach:** 
Since we can't create environment secrets dynamically, we'll use a fixed secret name:
- Secret name: `GMAIL_APP_PASSWORD`
- Admin must manually add this secret via Lovable UI

**Alternative Approach (Database Storage with Encryption):**
Store encrypted password in `email_settings.gmail_smtp_password_encrypted` using Supabase Vault or symmetric encryption.

**Recommended:** Use fixed secret name `GMAIL_APP_PASSWORD` for simplicity.

### UI Flow for Password Setup

1. Admin enters Gmail App Password in settings
2. System validates it's not empty and follows format (16 chars, no spaces)
3. Show instructions: "Add this password as GMAIL_APP_PASSWORD secret in Lovable settings"
4. Once secret is configured, system can verify by attempting SMTP connection

---

## Stage 5: Update UI Copy (Stage 4 from original request)

### Changes to EmailSettingsTab.tsx

**Current Text → Updated Text:**

| Current | Updated |
|---------|---------|
| "Email Service" | "Email Provider" |
| "Resend Connected" | Provider-specific status |
| "Verified domain: icealarm.es" | Dynamic based on provider |

**Add Helper Text:**
```
💡 Use Gmail SMTP temporarily until DNS verification 
   for Resend is complete. Gmail requires an App Password 
   (not your regular password).
```

**Add Gmail Setup Instructions:**
```
To use Gmail:
1. Enable 2-Step Verification on your Google account
2. Generate an App Password at security.google.com
3. Enter the 16-character App Password above
4. Add it as GMAIL_APP_PASSWORD in your project secrets
```

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| - | No new files needed |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/admin/settings/EmailSettingsTab.tsx` | Add provider toggle, Gmail SMTP fields, updated copy |
| `src/hooks/useEmailSettings.ts` | Add Gmail fields to interfaces, add provider update |
| `supabase/functions/send-email/index.ts` | Add Gmail SMTP sending logic with provider branching |
| `supabase/functions/send-test-email/index.ts` | Add Gmail SMTP test email logic |

### Database Migration
| Migration | Changes |
|-----------|---------|
| `add_gmail_smtp_fields.sql` | Add gmail_mode, gmail_smtp_host, gmail_smtp_port, gmail_smtp_user columns |

---

## Implementation Order

1. **Database Migration** - Add Gmail SMTP columns
2. **Update useEmailSettings.ts** - Add new fields to interfaces
3. **Update EmailSettingsTab.tsx** - Add provider toggle and Gmail SMTP form
4. **Update send-email/index.ts** - Add SMTP sending logic
5. **Update send-test-email/index.ts** - Add SMTP test logic
6. **Deploy and Test** - Verify both providers work

---

## Technical Details

### Gmail SMTP Configuration

**Connection Settings:**
```
Host: smtp.gmail.com
Port: 587 (STARTTLS) or 465 (SSL)
Security: STARTTLS
Auth: Username + App Password
```

**App Password Requirements:**
- Google Account must have 2-Step Verification enabled
- Generate at: https://security.google.com/settings/security/apppasswords
- Format: 16 characters, no spaces

### Deno SMTP Library Usage

```typescript
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const client = new SMTPClient({
  connection: {
    hostname: "smtp.gmail.com",
    port: 587,
    tls: true,
    auth: {
      username: "your@gmail.com",
      password: "xxxx xxxx xxxx xxxx", // App Password
    },
  },
});

await client.send({
  from: "Your Name <your@gmail.com>",
  to: "recipient@example.com",
  subject: "Test",
  html: "<p>Hello!</p>",
});

await client.close();
```

---

## Done Criteria Checklist

### Stage 1 - Database & Provider Toggle
- [ ] `email_settings` table has Gmail SMTP columns
- [ ] Provider can be switched between 'resend' and 'gmail'
- [ ] Provider selection persists to database

### Stage 2 - Gmail SMTP Sending
- [ ] `send-email` function supports Gmail SMTP
- [ ] `send-test-email` function supports Gmail SMTP
- [ ] Rate limits still enforced
- [ ] All emails logged to `email_log`
- [ ] Routing headers (X-ICE-*) applied

### Stage 3 - Gmail OAuth (Optional/Future)
- [ ] OAuth flow implemented (defer to later if needed)
- [ ] Token refresh handled
- [ ] Connect/Disconnect buttons work

### Stage 4 - UI Copy Updates
- [ ] Neutral language: "Email Provider" not "Gmail"
- [ ] Helper text about temporary Gmail usage
- [ ] Connection status reflects active provider
- [ ] Gmail setup instructions included

---

## Security Considerations

1. **App Password Storage**: Use Supabase secrets (GMAIL_APP_PASSWORD), never store in database
2. **TLS/STARTTLS**: Always use encrypted SMTP connection
3. **Rate Limiting**: Apply same limits regardless of provider
4. **Logging**: Log all attempts with error details (never log passwords)

