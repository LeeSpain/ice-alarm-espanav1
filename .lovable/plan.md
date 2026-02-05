

# Complete Email System Consolidation Plan

## Current Problem Summary

You confirmed that:
1. Test emails appear in **Gmail Sent folder** (icealarmespana@gmail.com) ✅
2. Test emails are **NOT arriving** at recipient addresses ❌

This indicates the **Gmail SMTP connection works**, but there's a **deliverability issue** - Gmail is silently dropping or delaying emails.

---

## Root Cause Analysis

### Issue 1: Gmail Deliverability Problems
Gmail SMTP has strict anti-spam policies. When sending from a Gmail account to external addresses, emails can be:
- Delayed (greylist)
- Sent to spam
- Silently rejected if account has low reputation

**Evidence**: The email log shows `status: sent` with `provider_message_id: null` - this means the SMTP handshake completed but Gmail didn't provide a tracking ID.

### Issue 2: Inconsistent Email Architecture
Your platform has **7 different functions** sending emails via **2 different methods**:

| Function | Method | From Address | Working? |
|----------|--------|--------------|----------|
| `send-email` | Gmail SMTP | icealarmespana@gmail.com | ❓ Delivery issues |
| `send-test-email` | Gmail SMTP | icealarmespana@gmail.com | ❓ Delivery issues |
| `partner-register` | Resend API | onboarding@resend.dev | ⚠️ Test domain only |
| `partner-admin-create` | Resend API | welcome@icealarm.es | ❌ Domain not verified |
| `submit-registration` | Resend API | welcome@icealarm.es | ❌ Domain not verified |
| `stripe-webhook` | Resend API | welcome@icealarm.es | ❌ Domain not verified |
| `staff-register` | Resend API | noreply@icealarm.es | ❌ Domain not verified |
| `send-member-update-request` | Resend API | noreply@icealarm.es | ❌ Domain not verified |
| `partner-send-invite` | Resend API | partners@icealarm.es | ❌ Domain not verified |

**Result**: Only `send-email` and `send-test-email` even attempt to send. All others fail silently because `icealarm.es` is not verified on Resend.

---

## Solution: Use Resend Test Domain for ALL Emails (Temporary)

Since you can't verify your domain right now, we'll use Resend's test domain (`onboarding@resend.dev`) which works immediately.

**Important Limitation**: With the test domain, emails can ONLY be sent to the email address that registered your Resend account.

---

## Implementation Plan

### Phase 1: Switch to Resend as Primary Provider

**File: Database `email_settings` table**
- Change `provider` from `gmail` to `resend`
- Change `from_email` to `onboarding@resend.dev`

This will make `send-email` and `send-test-email` use Resend instead of Gmail.

### Phase 2: Update All Direct Resend Calls

Update all edge functions that call Resend directly to use the test domain:

**1. partner-register/index.ts** (Line 244)
```typescript
// Already using onboarding@resend.dev ✓ - No change needed
```

**2. partner-admin-create/index.ts** (Line 395)
```typescript
// Change from: "ICE Alarm <welcome@icealarm.es>"
// To: "ICE Alarm <onboarding@resend.dev>"
```

**3. submit-registration/index.ts** (Line 863)
```typescript
// Change from: "ICE Alarm <welcome@icealarm.es>"
// To: "ICE Alarm <onboarding@resend.dev>"
```

**4. stripe-webhook/index.ts** (Line 391)
```typescript
// Change from: "ICE Alarm <welcome@icealarm.es>"
// To: "ICE Alarm <onboarding@resend.dev>"
```

**5. staff-register/index.ts** (Line 232)
```typescript
// Change from: "ICE Alarm <noreply@icealarm.es>"
// To: "ICE Alarm <onboarding@resend.dev>"
```

**6. send-member-update-request/index.ts** (Line 173)
```typescript
// Change from: "ICE Alarm España <noreply@icealarm.es>"
// To: "ICE Alarm España <onboarding@resend.dev>"
```

**7. partner-send-invite/index.ts** (Line ~107)
```typescript
// Change from: "ICE Alarm Partners <partners@icealarm.es>"
// To: "ICE Alarm Partners <onboarding@resend.dev>"
```

**8. send-test-email/index.ts** (Line 102)
```typescript
// Change fallback from: "noreply@icealarm.es"
// To: "onboarding@resend.dev"
```

**9. send-email/index.ts** (Line 114)
```typescript
// Change fallback from: "noreply@icealarm.es"
// To: "onboarding@resend.dev"
```

### Phase 3: Test All Email Flows

After deployment, test each flow:
1. Send test email from Admin Settings → Should arrive
2. Create a partner via admin → Welcome email should arrive
3. Test partner registration flow → Verification email should arrive
4. Test member registration → Confirmation email should arrive

---

## Summary of Changes

| File | Line | Change |
|------|------|--------|
| `email_settings` (DB) | - | provider: gmail → resend, from_email: onboarding@resend.dev |
| `partner-admin-create/index.ts` | 395 | welcome@icealarm.es → onboarding@resend.dev |
| `submit-registration/index.ts` | 863 | welcome@icealarm.es → onboarding@resend.dev |
| `stripe-webhook/index.ts` | 391 | welcome@icealarm.es → onboarding@resend.dev |
| `staff-register/index.ts` | 232 | noreply@icealarm.es → onboarding@resend.dev |
| `send-member-update-request/index.ts` | 173 | noreply@icealarm.es → onboarding@resend.dev |
| `partner-send-invite/index.ts` | 107 | partners@icealarm.es → onboarding@resend.dev |
| `send-test-email/index.ts` | 102 | noreply@icealarm.es → onboarding@resend.dev |
| `send-email/index.ts` | 114 | noreply@icealarm.es → onboarding@resend.dev |

---

## Future Production Setup

When you have DNS access, to enable sending to ANY recipient:

1. Go to https://resend.com/domains
2. Add `icealarm.es`
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Wait for verification
5. Update all from addresses back to `@icealarm.es`

This will give you professional emails that land in inboxes reliably.

---

## Technical Details

### Why Gmail SMTP Isn't Working for External Recipients

Gmail has strict policies:
1. **SPF/DKIM**: Gmail-originated emails may fail SPF checks when received by strict mail servers
2. **Reputation**: Fresh accounts have low sender reputation
3. **Volume limits**: Gmail limits external sends to ~500/day for free accounts
4. **Spam filtering**: Other providers may mark Gmail SMTP as suspicious

### Why Resend is Better

Resend provides:
- Dedicated IP reputation
- Proper DKIM signing
- Delivery tracking and webhooks
- Higher send limits
- Professional sender identity

