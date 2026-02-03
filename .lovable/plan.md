

# Facebook Publishing Fix - Token Regeneration Required

## The Problem

The error `(#200) publish_actions permission deprecated` is coming from Facebook's API, **not from our code**. 

**What's happening:**
1. Your current access token was generated with the old `publish_actions` permission
2. Facebook checks the permissions on the token itself when you make API calls
3. Even though our code uses the correct modern endpoints (`/feed` and `/photos`), Facebook rejects the token because it was created with deprecated permissions

**The code is correct** - it doesn't request any permissions, it simply passes the access token to Facebook's Graph API.

---

## The Fix (Action Required)

You need to regenerate your Facebook Page Access Token with the **modern permissions**. Here's exactly how:

### Step 1: Go to Facebook Developer Tools

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your Facebook App from the dropdown (the app connected to ICE Alarm España)

### Step 2: Select Correct Permissions

Click "Add a Permission" and select **ONLY these**:
- ✅ `pages_manage_posts` (for publishing)
- ✅ `pages_read_engagement` (for metrics)
- ✅ `pages_show_list` (to see your pages)

**DO NOT select:**
- ❌ `publish_actions` (deprecated)
- ❌ `publish_pages` (deprecated)

### Step 3: Generate User Token

1. Click "Generate Access Token"
2. Facebook will prompt you to authorize - approve it
3. You'll get a short-lived User Access Token

### Step 4: Get Page Access Token

In the Graph API Explorer:
1. Make a GET request to: `/me/accounts`
2. This returns your pages with their Page Access Tokens
3. Find "ICE Alarm España" in the response
4. Copy the `access_token` for that page (this is the Page Access Token)

### Step 5: Extend Token (Optional but Recommended)

1. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
2. Paste your Page Access Token
3. Click "Extend Access Token" to get a 60-day or permanent token

### Step 6: Update in Admin Settings

1. Go to **Admin → Settings → Integrations**
2. Find "Facebook Page Access Token"
3. Paste the new token (it should start with `EAA...`)
4. Save

---

## Verification

After updating the token, you can verify it's correct:

1. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
2. Paste your new token
3. Check that it shows:
   - **Type**: Page Access Token
   - **Valid**: True
   - **Scopes**: `pages_manage_posts`, `pages_read_engagement`
   - **Expires**: Far in the future (or "Never")

---

## Current Settings (from database)

| Setting | Current Value |
|---------|---------------|
| Page ID | `107949497473966` ✅ (correct format) |
| Access Token | `EAAT8iZAfQQtoB...` ❌ (has deprecated permissions) |

---

## No Code Changes Required

The edge function code is correctly implemented:
- Uses Graph API v24.0 ✅
- Calls `/photos` endpoint for image posts ✅
- Calls `/feed` endpoint for text posts ✅
- Passes token correctly ✅

The issue is purely with the **access token's associated permissions** that were set when the token was originally generated on Facebook's developer portal.

---

## Summary

| Action | Who | What |
|--------|-----|------|
| Generate new token | You | Facebook Developer Tools |
| Select modern permissions | You | `pages_manage_posts`, `pages_read_engagement` |
| Get Page Access Token | You | From `/me/accounts` response |
| Update in settings | You | Admin → Settings → Integrations |
| Test publishing | You | Media Manager → Publish a post |

Once you've updated the token with the correct permissions, publishing will work immediately - no deployment or code changes needed.

