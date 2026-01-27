

# Fix Email Sending - Domain Verification Required

## The Problem

All emails in your system are **failing with a 403 error** because the `icealarm.es` domain is **not verified in Resend**.

The edge function logs clearly show:
```
Error sending welcome email: {
  statusCode: 403,
  message: "The icealarm.es domain is not verified. 
            Please, add and verify your domain on https://resend.com/domains"
}
```

The partner account IS being created successfully - only the email delivery fails.

---

## Root Cause

Resend requires you to verify domain ownership before you can send emails from that domain. This is an anti-spam measure.

**Current Status:**
- Partner creation: Working
- Staff creation: Working
- Email sending: BLOCKED (domain not verified)

---

## Required Action (You Must Do This)

### Step 1: Go to Resend Dashboard
Visit: https://resend.com/domains

### Step 2: Add Your Domain
1. Click "Add Domain"
2. Enter: `icealarm.es`
3. Click "Add"

### Step 3: Add DNS Records
Resend will show you DNS records to add. Typically:

| Type | Name | Value |
|------|------|-------|
| TXT | `_resend` | `resend-verify=xxxxx` |
| MX | `send` | `feedback-smtp.region.amazonses.com` |
| TXT | `send._domainkey` | `p=xxxxx` (DKIM key) |

Add these to your domain's DNS settings (where you manage icealarm.es)

### Step 4: Verify
Click "Verify" in Resend. This usually takes a few minutes.

---

## Affected Email Functions

All 6 email-sending functions use `@icealarm.es` and are blocked:

1. **partner-admin-create** - Partner welcome emails
2. **staff-register** - Staff welcome emails  
3. **partner-send-invite** - Partner invitation emails
4. **submit-registration** - Member registration confirmation
5. **stripe-webhook** - Member welcome after payment
6. **send-member-update-request** - Member update request emails

Once you verify the domain, **all these will work automatically** - no code changes needed.

---

## Temporary Workaround (For Testing Only)

If you cannot verify the domain immediately, you can temporarily use Resend's sandbox domain:

**Change in code:**
```typescript
// FROM (blocked):
from: "ICE Alarm <welcome@icealarm.es>"

// TO (testing only - only sends to YOUR email):
from: "ICE Alarm <onboarding@resend.dev>"
```

**Limitation**: Sandbox emails only work when sending to the email address you used to sign up for Resend.

---

## Summary

| Step | Action | Who |
|------|--------|-----|
| 1 | Verify `icealarm.es` in Resend | You |
| 2 | Add DNS records to your domain | You |
| 3 | Wait for verification (few minutes) | Automatic |
| 4 | Test partner creation again | You |

**No code changes are required** - the email functions are correctly implemented. They just need the domain to be verified in Resend.

---

## Quick Test After Verification

Once verified, create a new test partner and check the logs. You should see:
```
Welcome email sent to: icesoslite@gmail.com
```

Instead of the current error.

