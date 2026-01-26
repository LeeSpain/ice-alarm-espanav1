

## Complete Email System Review and Fix Plan

### Current Email Status

After reviewing all edge functions and registration flows, here's the complete picture:

| User Type | Trigger | Email Sent? |
|-----------|---------|-------------|
| Staff (Admin-Created) | Admin creates via Staff Page | YES - Welcome email with temp password |
| Partner (Self-Registered) | Partner registers at /partner/join | YES - Verification email |
| Partner Invites | Partner sends invitation | YES - Custom invitation email |
| Partner (Admin-Created) | Admin creates at /admin/partners/add | NO - Missing |
| Member (Registration) | Completes /join wizard | NO - Missing |
| Member (Payment Confirmed) | Stripe payment succeeds | NO - Missing |

---

### Phase 1: Add Welcome Email for Admin-Created Partners

**Problem:** When admins create partners via `/admin/partners/add`, the partner is marked as "active" immediately but receives no email with login credentials.

**Solution:** Create a new edge function `partner-admin-create` that:
1. Creates an auth user with a temporary password
2. Creates the partner record linked to the auth user
3. Sends a bilingual welcome email with login credentials

**Files to Modify:**
- Create: `supabase/functions/partner-admin-create/index.ts`
- Modify: `src/pages/admin/AddPartnerPage.tsx` - Use the new edge function instead of direct Supabase insert

**Email Content (Spanish/English):**
```
Subject: Your ICE Alarm Partner Account Has Been Created

Hello [Contact Name],

Welcome to the ICE Alarm Partner Program! Your account has been created by our admin team.

Your login credentials:
- Email: [email]
- Temporary Password: [password]

Your referral code: [REFERRAL_CODE]

Please log in and change your password immediately:
[Login Button → /partner/login]

If you have questions, contact our team.

Best regards,
The ICE Alarm Team
```

---

### Phase 2: Add Member Welcome Email After Payment

**Problem:** When a member completes Stripe payment, they receive no email confirmation that their membership is now active.

**Solution:** Add email sending to the `stripe-webhook` function after `checkout.session.completed`:

**Files to Modify:**
- `supabase/functions/stripe-webhook/index.ts` - Add Resend email sending after payment confirmation

**Email Content (Spanish/English):**
```
Subject: Welcome to ICE Alarm - Your Membership is Active!

Hello [First Name],

Thank you for joining ICE Alarm! Your payment has been processed successfully and your membership is now active.

Order Details:
- Order Number: [ORDER_NUMBER]
- Amount Paid: €[AMOUNT]
- Membership Type: [Individual/Couple] - [Monthly/Annual]

What happens next:
1. If you ordered a GPS pendant, we'll ship it within 2-3 business days
2. You'll receive tracking information once shipped
3. Our team will contact you to complete device setup

Need help? Contact our support team or visit your member dashboard:
[Login to Dashboard Button → /dashboard]

Stay safe,
The ICE Alarm Team
```

---

### Phase 3: Add Registration Confirmation Email (Optional)

**Problem:** Members who complete the registration form but haven't paid yet receive no confirmation.

**Consideration:** Since payment is the next step, sending an email before payment may not be necessary. However, if the user abandons checkout, we have no email trail.

**Recommendation:** Add a simple confirmation email in `submit-registration` after successful registration:

**Email Content:**
```
Subject: Complete Your ICE Alarm Registration

Hello [First Name],

Thank you for starting your ICE Alarm registration!

Your registration is almost complete. Please complete your payment to activate your membership.

If you didn't complete checkout, you can return anytime:
[Complete Payment Button → /join/payment]

Order Summary:
- Membership: [Type]
- Total: €[AMOUNT]

Best regards,
The ICE Alarm Team
```

---

### Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/partner-admin-create/index.ts` | Create | New edge function for admin partner creation with email |
| `src/pages/admin/AddPartnerPage.tsx` | Modify | Call new edge function instead of direct insert |
| `supabase/config.toml` | Modify | Add new function config |
| `supabase/functions/stripe-webhook/index.ts` | Modify | Add member welcome email after payment |
| `supabase/functions/submit-registration/index.ts` | Modify | Add registration confirmation email (optional) |

---

### Technical Implementation Details

**Partner Admin Create Edge Function:**
```typescript
// Key flow:
1. Validate admin caller (JWT check)
2. Generate temp password (12 chars)
3. Create auth user with supabase.auth.admin.createUser()
4. Create partner record linked to auth user
5. Send welcome email via Resend
6. Log activity
```

**Stripe Webhook Email Addition:**
```typescript
// After checkout.session.completed processing:
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
if (RESEND_API_KEY && memberData?.email) {
  // Send welcome email to new member
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "ICE Alarm <welcome@icealarm.es>",
      to: [memberData.email],
      subject: language === "es" ? "¡Bienvenido a ICE Alarm!" : "Welcome to ICE Alarm!",
      html: emailTemplate,
    }),
  });
}
```

---

### Priority Order

1. **High Priority:** Partner Admin Create email - Partners have no way to log in without this
2. **High Priority:** Member welcome email after payment - Critical for customer experience
3. **Medium Priority:** Registration confirmation email - Nice to have for abandoned cart recovery

