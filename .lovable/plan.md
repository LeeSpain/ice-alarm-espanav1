

# Fix Facebook Connection - Deploy Missing Edge Function

## Problem

The Facebook Page ID and Access Token are both correctly saved in the database and working (posts have been published successfully in the past). However, the `facebook-metrics` edge function is **not deployed**, which causes:

- The "Test Connection" button in Media Manager to fail silently (returns 404)
- All metrics refresh operations to fail
- The connection status to remain "unknown" instead of showing "Connected"

The Settings page shows "Configured" correctly since it checks database values directly.

## Root Cause

The `facebook-metrics` function code exists at `supabase/functions/facebook-metrics/index.ts` and is registered in `supabase/config.toml`, but it was never deployed (or was lost during a previous deployment cycle).

## Fix

**Deploy the `facebook-metrics` edge function.** No code changes are needed -- just deployment.

This single action will restore:
- "Test Connection" functionality in Media Manager
- Per-post and bulk metrics refresh
- Connection status badge (should show green "Connected")
- Facebook engagement analytics (reactions, comments, shares, impressions)

## Verification Steps

After deployment:
1. Navigate to Admin > Media Manager > Published posts
2. Click "Test Connection" -- should show green "Connected" badge
3. Click "Refresh All" -- should fetch live engagement data from Facebook

## Technical Note

All edge functions in the chain are consistent in their key usage (`settings_facebook_page_id` and `settings_facebook_page_access_token`):
- `facebook-publish` -- reads correctly
- `facebook-unpublish` -- reads correctly
- `facebook-metrics` -- reads correctly (just needs deploying)
- `save-api-keys` -- writes correctly with `settings_` prefix

No code changes required.

