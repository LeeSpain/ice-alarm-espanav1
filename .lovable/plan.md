
# Complete Gmail SMTP Consolidation Plan

## Current State

After the previous changes, your system is configured for Resend (`provider: resend`), but you need **Gmail SMTP for ALL emails** since you don't have DNS access to verify a domain on Resend.

**Database status**: `provider: resend` → needs to change to `provider: gmail`

---

## Overview

This plan will consolidate ALL email sending to use Gmail SMTP through a single approach:
- Switch database provider to Gmail
- Update all 7 edge functions that currently call Resend API directly to use Gmail SMTP instead

---

## Phase 1: Update Database Settings

**Change `email_settings` table**:
- `provider`: `resend` → `gmail`
- `from_email`: `onboarding@resend.dev` → `icealarmespana@gmail.com`

This ensures `send-email` and `send-test-email` functions use Gmail SMTP.

---

## Phase 2: Add Gmail SMTP to All Direct-Calling Functions

These 7 functions currently call Resend API directly. Each needs to be updated to use Gmail SMTP instead:

### Functions to Update

| # | Function | Current Method | Change Required |
|---|----------|----------------|-----------------|
| 1 | `partner-register/index.ts` | Resend fetch API | Add Gmail SMTP |
| 2 | `partner-admin-create/index.ts` | Resend SDK | Add Gmail SMTP |
| 3 | `submit-registration/index.ts` | Resend SDK | Add Gmail SMTP |
| 4 | `stripe-webhook/index.ts` | Resend SDK | Add Gmail SMTP |
| 5 | `staff-register/index.ts` | Resend SDK | Add Gmail SMTP |
| 6 | `send-member-update-request/index.ts` | Resend SDK | Add Gmail SMTP |
| 7 | `partner-send-invite/index.ts` | Resend fetch API | Add Gmail SMTP |

### Implementation Approach

For each function:

1. **Import the SMTP client** at the top:
```typescript
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
```

2. **Add a Gmail SMTP send helper** (consistent across all functions):
```typescript
async function sendViaGmailSMTP(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const appPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!appPassword) {
    return { success: false, error: "GMAIL_APP_PASSWORD not configured" };
  }

  try {
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: "icealarmespana@gmail.com",
          password: appPassword,
        },
      },
    });

    await client.send({
      from: "ICE Alarm España <icealarmespana@gmail.com>",
      to: to,
      subject: subject,
      html: html,
    });

    await client.close();
    return { success: true };
  } catch (error: any) {
    console.error("Gmail SMTP error:", error);
    return { success: false, error: error.message };
  }
}
```

3. **Replace Resend calls** with `sendViaGmailSMTP()` calls

---

## Phase 3: Specific File Changes

### 1. `partner-register/index.ts` (Lines 237-259)
- Remove Resend fetch call
- Add Gmail SMTP helper
- Call `sendViaGmailSMTP()` for verification email

### 2. `partner-admin-create/index.ts` (Lines 392-403)
- Remove Resend SDK import
- Add SMTP client import
- Add Gmail SMTP helper
- Replace `resend.emails.send()` with Gmail call

### 3. `submit-registration/index.ts` (Lines 851-879)
- Remove Resend SDK call
- Add Gmail SMTP helper
- Replace with Gmail send

### 4. `stripe-webhook/index.ts` (Lines 390-403)
- Remove Resend SDK import
- Add SMTP client import
- Add Gmail SMTP helper
- Replace with Gmail send

### 5. `staff-register/index.ts` (Lines 231-238)
- Remove Resend SDK import
- Add SMTP client import
- Add Gmail SMTP helper
- Replace `resend.emails.send()` with Gmail call

### 6. `send-member-update-request/index.ts` (Lines 170-180)
- Remove Resend SDK import
- Add SMTP client import
- Add Gmail SMTP helper
- Replace with Gmail call

### 7. `partner-send-invite/index.ts` (Lines 142-169)
- Remove Resend fetch call
- Add Gmail SMTP helper
- Replace with Gmail call

---

## Technical Requirements

### Prerequisite: Valid Gmail App Password

The `GMAIL_APP_PASSWORD` secret must contain a valid 16-character App Password from Google.

**To verify/regenerate**:
1. Log in to `icealarmespana@gmail.com`
2. Go to https://myaccount.google.com/security
3. Ensure 2-Step Verification is ON
4. Go to App passwords → Generate new → Copy the 16-character code
5. Update the secret if needed

### Gmail SMTP Configuration
- **Host**: smtp.gmail.com
- **Port**: 465 (implicit TLS)
- **Username**: icealarmespana@gmail.com
- **Password**: `GMAIL_APP_PASSWORD` secret
- **From**: ICE Alarm España `<icealarmespana@gmail.com>`

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Database `provider` | `resend` | `gmail` |
| Database `from_email` | `onboarding@resend.dev` | `icealarmespana@gmail.com` |
| 7 Edge Functions | Resend API calls | Gmail SMTP calls |
| Email sender | Various (`@resend.dev`, `@icealarm.es`) | `icealarmespana@gmail.com` |

---

## Testing Checklist

After implementation:
- [ ] Send test email from Admin → Settings → Email
- [ ] Create a test partner (admin-created) → Check for welcome email
- [ ] Register as partner → Check for verification email
- [ ] Complete member signup → Check for confirmation email
- [ ] All emails should arrive from `icealarmespana@gmail.com`

---

## Notes

- All emails will show as coming from `icealarmespana@gmail.com`
- Gmail SMTP has a limit of ~500 emails/day for free accounts
- Emails may land in spam for external recipients if Gmail account has low sender reputation
- When DNS access is available, you can switch to Resend with a verified domain for better deliverability
