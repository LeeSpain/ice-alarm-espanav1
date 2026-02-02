

## Complete Review: Recent Changes Analysis

### Files Reviewed
1. `src/pages/admin/SettingsPage.tsx` - Facebook token handling UI
2. `supabase/functions/facebook-publish/index.ts` - Facebook publishing edge function
3. `supabase/functions/save-api-keys/index.ts` - Settings save edge function
4. `src/components/admin/settings/ImagesSettingsTab.tsx` - Images settings tab
5. `src/components/admin/settings/ImageUploadCard.tsx` - Image upload component

---

## Issues Found

### Issue 1: Critical Key Prefix Bug in `save-api-keys` Edge Function

**Problem**: The edge function prepends `${service}_` to all keys, but the frontend already sends keys with the `settings_` prefix for Facebook (e.g., `settings_facebook_page_id`).

**Current Flow**:
```text
Frontend sends: { service: "settings", keys: { "settings_facebook_page_id": "123" } }
Edge function creates: "settings_settings_facebook_page_id" ← DOUBLE PREFIX!
```

**Database Expectation**: Keys should be `settings_facebook_page_id` (single prefix).

**Evidence**: The database currently has the correct keys because they were likely inserted before this edge function was in use, or via a different method.

**Fix Required**: Modify `save-api-keys/index.ts` to either:
- Option A: Pass keys as-is without prepending service (for keys that already have prefixes)
- Option B: Update frontend KEY constants to remove `settings_` prefix for Facebook keys

**Recommended Solution**: Option A - Make the edge function smarter by not prepending when the key already starts with `${service}_`:

```typescript
// Line 70 in save-api-keys/index.ts
const finalKey = key.startsWith(`${service}_`) ? key : `${service}_${key}`;
```

---

### Issue 2: Minor - Missing CORS Headers

**File**: `supabase/functions/save-api-keys/index.ts` (line 7)

**Problem**: The CORS `Access-Control-Allow-Headers` is missing newer Supabase client headers which can cause issues in some scenarios.

**Fix**: Update to include full header set:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

---

### Issue 3: Twilio Eye Button Missing z-index (Consistency)

**File**: `src/pages/admin/SettingsPage.tsx` (lines 776-785)

**Problem**: The Twilio auth token eye button lacks the `z-10` and `onMouseDown` fix that was applied to the Facebook token button.

**Current**:
```tsx
<Button
  className="absolute right-0 top-0 h-full px-3"
  onClick={() => setShowTwilioToken(!showTwilioToken)}
>
```

**Fix**: Add consistency with Facebook button:
```tsx
<Button
  type="button"
  variant="ghost"
  size="icon"
  className="absolute right-0 top-0 h-full px-3 z-10"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => setShowTwilioToken((prev) => !prev)}
>
```

---

### Issue 4: Stripe Secret Eye Button Missing z-index (Consistency)

**File**: `src/pages/admin/SettingsPage.tsx` (around line 620-640)

**Problem**: Same issue as Twilio - the Stripe secret key eye toggle likely lacks `z-10` and `onMouseDown`.

**Fix**: Apply the same pattern as Facebook.

---

### Issue 5: `facebook-publish` Edge Function - Already Fixed

**Status**: ✅ **GOOD** - The function correctly:
- Reads `settings_facebook_page_id` and `settings_facebook_page_access_token` from `system_settings`
- Uses Facebook Graph API v24.0
- Handles both image and text-only posts
- Clears error_message on successful publish

---

### Issue 6: `ImagesSettingsTab` - Already Fixed

**Status**: ✅ **GOOD** - The component:
- Properly exports `ImagesSettingsTab` as a named export
- Correctly uses `useWebsiteImages` hook
- Maps `WEBSITE_IMAGE_CONFIGS` to `ImageUploadCard` components
- Handles loading state

---

### Issue 7: `ImageUploadCard` - Already Good

**Status**: ✅ **GOOD** - The component:
- Properly handles file selection, upload, and reset
- Invalidates correct query keys on update
- Has proper validation for file type and size

---

## Summary of Required Fixes

| Priority | File | Issue | Status |
|----------|------|-------|--------|
| HIGH | `save-api-keys/index.ts` | Double prefix bug | Needs fix |
| MEDIUM | `save-api-keys/index.ts` | Missing CORS headers | Needs fix |
| LOW | `SettingsPage.tsx` | Twilio eye button z-index | Needs fix |
| LOW | `SettingsPage.tsx` | Stripe eye button z-index | Needs fix |

---

## Technical Implementation

### Step 1: Fix `save-api-keys` Edge Function

Update the key building logic to avoid double prefixes:

```typescript
// Replace line 70
const finalKey = key.startsWith(`${service}_`) ? key : `${service}_${key}`;
// Use finalKey instead of `${service}_${key}`
```

Also update CORS headers to the full set.

### Step 2: Fix Eye Button Consistency in SettingsPage

Apply `z-10`, `onMouseDown={(e) => e.preventDefault()}`, and functional state toggle to:
- Twilio auth token eye button
- Stripe secret key eye button  
- Stripe webhook secret eye button

---

## Verification After Fix

1. Navigate to Settings → Communications → Facebook
2. Paste a long Facebook token
3. Click eye icon → should toggle visibility
4. Click "Save Facebook Configuration" → should show success toast
5. Refresh page → "Token saved (hidden)" message should appear
6. Test publishing a social post → should work with saved credentials

