

# Fix Facebook Connection - Deploy Missing Edge Function

## What's Wrong

The Facebook "Test Connection" button fails because the backend function that handles it was never deployed. Additionally, the function uses an outdated import style (`esm.sh`) that causes deployment timeouts.

## Fix (2 changes, 1 file)

**File: `supabase/functions/facebook-metrics/index.ts`**

1. Change line 1 from `esm.sh` to `npm:` import to prevent bundle timeout:
   - Before: `import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`
   - After: `import { createClient } from "npm:@supabase/supabase-js@2";`

2. Deploy the function.

## What This Restores

- "Test Connection" button will work in Media Manager
- Per-post and bulk metrics refresh (reactions, comments, shares, impressions)
- Connection status badge showing "Connected"

## No Other Changes Needed

All database keys, other Facebook functions (`facebook-publish`, `facebook-unpublish`), and frontend code are already correctly configured.

