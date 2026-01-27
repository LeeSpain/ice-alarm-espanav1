
# Fix Email Sending - Domain Verification Issue

## Problem Identified
All emails from the system are failing because **the `icealarm.es` domain is not verified in Resend**. The edge function logs show:

```
Error: The icealarm.es domain is not verified.
Please add and verify your domain on https://resend.com/domains
```

This affects:
- Partner welcome emails (when admin creates partner)
- Staff welcome emails
- Partner invite emails
- Member registration confirmation emails
- Member welcome emails (after payment)
- Member update request emails

---

## Required Action: Verify Domain in Resend

**You need to go to Resend and verify your domain:**

1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `icealarm.es`
4. Add the DNS records shown (typically TXT and MX records) to your domain's DNS settings
5. Wait for verification (usually a few minutes)

---

## Inconsistency Found

There's also an inconsistency - one function uses a different domain:

| Function | Current Domain | Recommended |
|----------|---------------|-------------|
| `send-member-update-request` | `icealarmespana.com` | `icealarm.es` |

---

## Code Changes (After Domain Verification)

Once the domain is verified, I'll update the inconsistent email address:

### Update `send-member-update-request`

**File:** `supabase/functions/send-member-update-request/index.ts`

Change line 173:
```typescript
// Before
from: "ICE Alarm España <noreply@icealarmespana.com>"

// After
from: "ICE Alarm España <noreply@icealarm.es>"
```

---

## Summary

| Step | Action | Owner |
|------|--------|-------|
| 1 | Verify `icealarm.es` domain in Resend | You |
| 2 | Update DNS records as instructed by Resend | You |
| 3 | Update inconsistent email domain in code | Me |

---

## Quick Workaround (If Domain Can't Be Verified)

If you cannot verify `icealarm.es`, you could use Resend's free sandbox domain for testing:
- Use `onboarding@resend.dev` as the sender
- This only works for sending to your own email address

However, for production, you **must verify your own domain**.

---

## Technical Details

### Functions Affected

1. **partner-admin-create** - Welcome email to new partners
2. **staff-register** - Welcome email to new staff members  
3. **partner-send-invite** - Partner invitation emails to leads
4. **stripe-webhook** - Welcome email after payment completion
5. **submit-registration** - Registration confirmation email
6. **send-member-update-request** - Update request emails to members

All these will work automatically once `icealarm.es` is verified in Resend.
