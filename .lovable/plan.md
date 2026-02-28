

## Problem

The Stripe keys are **never found** because of a key name mismatch:

- **Save path**: Settings page calls `save-api-keys` with `service: "settings"` and key `stripe_secret_key` → edge function stores it as `settings_stripe_secret_key`
- **Read path**: `create-checkout` and `stripe-webhook` query for `stripe_secret_key` (no prefix) → no match → "not configured"

The `system_settings` table has zero rows matching `stripe_secret_key`. If Stripe keys were ever saved through the UI, they'd be under `settings_stripe_secret_key`.

## Fix (2 edge functions)

### 1. `supabase/functions/create-checkout/index.ts`
Change the query from:
```
.eq("key", "stripe_secret_key")
```
to:
```
.eq("key", "settings_stripe_secret_key")
```

### 2. `supabase/functions/stripe-webhook/index.ts`
Same change — update both the secret key and webhook secret lookups:
- `stripe_secret_key` → `settings_stripe_secret_key`
- `stripe_webhook_secret` → `settings_stripe_webhook_secret`

### 3. Verify data exists
After fixing the key names, you'll still need to enter your Stripe keys through the admin Settings page (API Keys section) since no Stripe keys currently exist in the database at all.

