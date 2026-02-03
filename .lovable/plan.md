
# Media Manager Facebook Publishing - Full Diagnosis Report

## Problem Summary

The Facebook publishing is failing with multiple related errors. After reviewing the edge function logs, database, and code, I've identified the root causes.

---

## Error Evidence from Logs

| Timestamp | Error |
|-----------|-------|
| 2026-02-03 10:04:05 | `(#200) publish_actions permission deprecated` |
| 2026-02-03 09:56:04 | `Session has expired on Wednesday, 28-Jan-26 08:00:00 PST` |
| Earlier failures | `(#210) A page access token is required` |

---

## Root Cause Analysis

### Issue 1: Expired Access Token (CURRENT BLOCKER)

Your Facebook Page Access Token expired on **January 28th, 2026**. The current date is February 3rd - the token has been expired for 6 days.

**Current Token Preview:** `EAAT8iZAfQQtoB...` (stored in system_settings)

Standard Facebook tokens expire after 60 days. You need to generate a new long-lived Page Access Token.

### Issue 2: Wrong Permissions on Token

The `publish_actions` permission was deprecated by Facebook in 2018. Your access token was generated requesting this old permission.

**Required Modern Permissions:**
- `pages_manage_posts` - Required to publish content to a Page
- `pages_read_engagement` - Required to read post metrics

### Issue 3: Token Type Confusion

Some earlier failures show `(#210) A page access token is required` - this suggests at one point a User Access Token was used instead of a Page Access Token.

---

## What the Code Does Correctly

The edge function code itself is **correctly implemented**:

```text
Edge Function Flow:
1. Validates staff authentication 
2. Fetches post from database 
3. Checks post is "approved" 
4. Retrieves FB credentials from system_settings 
5. Calls Graph API v24.0 correctly:
   - /PAGE_ID/photos (for posts with images)
   - /PAGE_ID/feed (for text-only posts)
6. Updates post status on success/failure
```

The problem is **not the code** - it's the credentials stored in your settings.

---

## The Fix: Generate New Facebook Credentials

### Step 1: Create/Verify Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select or create your app linked to ICE Alarm España
3. Ensure the app has permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`

### Step 2: Get Your Page ID

1. Go to your Facebook Page
2. Click "About" → Scroll to "Page ID" (numeric ID like `107949497473966`)
3. Or use Graph API Explorer: `GET /me/accounts` with a user token

**Your Current Page ID:** `107949497473966` ✓ (this looks correct)

### Step 3: Generate Long-Lived Page Access Token

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your App from the dropdown
3. Click "Generate Access Token"
4. Select permissions: `pages_manage_posts`, `pages_read_engagement`
5. Authorize when prompted
6. Use the Access Token Debugger to extend it to a long-lived token (60 days)
7. **Important**: Exchange for a Page Access Token (not User token)

The token should look like: `EAA...` and when debugged should show:
- **Type**: Page Access Token
- **Expires**: ~60 days from now (or "Never" for permanent)
- **Scopes**: pages_manage_posts, pages_read_engagement

### Step 4: Update Credentials in Admin Settings

1. Go to Admin → Settings → Integrations
2. Update `Facebook Page Access Token` with the new token
3. Verify `Facebook Page ID` is the numeric ID (not URL)

---

## Prevention: Token Expiry Warning

To prevent future issues, I recommend adding:

1. **Token expiry tracking** in system_settings
2. **Admin notification** when token is expiring within 7 days
3. **Visual indicator** in Media Manager showing token status

---

## Testing After Fix

After updating credentials:

1. Go to Media Manager
2. Create or select an approved post
3. Click "Publish"
4. Should succeed with message: "Published to Facebook! Post ID: xxx"

If it still fails, the error message will indicate what's wrong:
- `Invalid access token` → Token copied incorrectly
- `Permission denied` → App doesn't have required permissions
- `Page not found` → Wrong Page ID

---

## Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Access token expired | ❌ Current blocker | Generate new token |
| Wrong permissions | ❌ Related | Request `pages_manage_posts` |
| Edge function code | ✅ Working correctly | No changes needed |
| Page ID | ✅ Looks correct | Verify it's numeric |

**No code changes required** - this is a credentials/configuration issue. Generate a fresh Page Access Token with the correct permissions and update it in your Admin Settings.
