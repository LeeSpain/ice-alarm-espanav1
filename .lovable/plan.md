
# Media Manager - Published Performance Review

## Summary of Investigation

I've completed a thorough review of the Published Performance feature. The code architecture is **correctly connected and well-structured**, but there's a **critical configuration issue** preventing metrics from updating.

---

## Root Cause Identified

### The Problem: Expired Facebook Access Token

The edge function logs reveal the exact issue:

```
Error validating access token: Session has expired on Tuesday, 03-Feb-26 04:00:00 PST.
The current time is Wednesday, 04-Feb-26 01:19:22 PST.
```

**Your Facebook Page Access Token stored in `system_settings` has expired.** This is why:
1. When you like a post on Facebook, nothing changes in the app
2. The `social_post_metrics` table is empty (no metrics have ever been successfully fetched)
3. All refresh attempts fail silently (returning 0 values)

---

## Architecture Review (All Working Correctly)

### Data Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Published Posts Flow                         │
└─────────────────────────────────────────────────────────────────────┘

  1. User clicks "Refresh" or "Refresh All"
                ↓
  2. usePublishedPosts hook calls facebook-metrics edge function
                ↓
  3. Edge function fetches credentials from system_settings:
     - settings_facebook_page_id: 107949497473966 ✓
     - settings_facebook_page_access_token: [EXPIRED] ✗
                ↓
  4. Edge function calls Facebook Graph API v24.0:
     - /[post_id]?fields=reactions.summary,comments.summary,shares
     - /[post_id]/insights?metric=post_impressions
     - /[post_id]/reactions?summary=total_count
                ↓
  5. Metrics upserted to social_post_metrics table
                ↓
  6. UI refreshes via React Query invalidation
```

### Components Reviewed

| Component | Status | Notes |
|-----------|--------|-------|
| `PublishedPostsSection.tsx` | Working | Correctly uses hook, handles loading/empty states |
| `PublishedPostCard.tsx` | Working | Displays metrics, refresh button, "View on Facebook" link |
| `PublishedOverviewCard.tsx` | Working | Aggregates metrics across all posts |
| `usePublishedPosts.ts` | Working | Correct query structure, proper cache invalidation |
| `facebook-metrics` edge function | Working | Correct API calls, proper upsert logic |
| `social_post_metrics` table | Working | Correct schema with unique constraint on `social_post_id` |

### Database State

- **Published posts**: 3 posts with valid `facebook_post_id` values
- **Metrics table**: Empty (0 records) - because token expired before any successful fetch
- **Token storage**: Token exists in `system_settings` but has expired

---

## Resolution Plan

### Step 1: Generate a New Long-Lived Facebook Page Access Token

Facebook Page Access Tokens expire after ~60 days. You need to:

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your App
3. Add permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `pages_read_user_content`
4. Click "Generate Access Token"
5. Convert to long-lived token using the token debugger or API call
6. Update the token in Admin Settings → Integrations

### Step 2: Code Improvements (Recommended)

Even though the architecture is correct, I'll add these enhancements:

1. **Better error visibility**: Show token expiry errors clearly in the UI instead of silent failures
2. **Token health check**: Add a "Test Connection" button to verify Facebook credentials
3. **Graceful degradation**: Show "Token expired" badge on posts when metrics fetch fails
4. **Auto-retry with backoff**: Don't hammer the API when token is expired

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/facebook-metrics/index.ts` | Return structured error for expired token (code 190) |
| `src/hooks/usePublishedPosts.ts` | Surface token errors, add connection status |
| `src/components/admin/media/PublishedPostsSection.tsx` | Show error banner when token expired |
| `src/components/admin/media/PublishedOverviewCard.tsx` | Add "Test Connection" button |
| `src/components/admin/media/PublishedPostCard.tsx` | Show error badge on failed refresh |

---

## Implementation Details

### 1. Enhanced Edge Function Error Response

Detect OAuth errors (code 190) and return a specific error type so the frontend can display helpful guidance:

```typescript
// In facebook-metrics/index.ts
if (engagementData.error?.code === 190) {
  return {
    error: "token_expired",
    message: "Facebook access token has expired. Please generate a new token in Settings.",
    details: engagementData.error.message
  };
}
```

### 2. Connection Status in Hook

Add a `connectionStatus` field to track whether Facebook is properly connected:

```typescript
// In usePublishedPosts.ts
connectionStatus: "connected" | "token_expired" | "not_configured" | "unknown"
```

### 3. Error Banner in Published Section

When token is expired, show a prominent banner with instructions:

```text
⚠️ Facebook Token Expired
Your Facebook access token has expired. Metrics cannot be refreshed until you generate a new token.
[Go to Settings →]
```

### 4. Test Connection Button

Add a button in the overview card that calls the edge function with a simple test request to verify the token is valid before showing all metrics.

---

## Expected Results After Fix

1. **Token Renewal**: Once you update the token, clicking "Refresh All" will fetch real metrics
2. **Visible Errors**: If the token expires again, users will see a clear error message
3. **Better UX**: Test connection before publishing to avoid failed posts
4. **Metrics Display**: All engagement data (reactions, comments, shares, reach) will populate

---

## Technical Notes

- The Facebook Graph API v24.0 is correctly used
- The `post_impressions` insight requires `pages_read_engagement` permission
- Reaction breakdown fetching is working but will only show types after token renewal
- The 15-minute cache prevents API rate limiting (this is good)
