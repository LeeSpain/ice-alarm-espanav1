

# Fix Facebook Page Access Token "Not Saving" Issue

## Problem Analysis

After thorough investigation, I found that the **data IS being saved correctly to the database**:

```sql
-- Database shows these records exist with the correct values:
settings_facebook_page_id = "107949497473966"
settings_facebook_page_access_token = "EAA5U5iMwv1IBQ..." (full token stored)
```

**The actual problem is a UX issue:**

When you click "Save Facebook Configuration":
1. The token is sent to the edge function ✅
2. It's saved to `system_settings` table ✅
3. A success toast appears ✅
4. `queryClient.invalidateQueries({ queryKey: ["system-settings"] })` runs
5. This triggers the `useEffect` that fetches settings from the database
6. The `useEffect` immediately **resets the input field** to `"••••••••••••"` (masked value)

This makes it **appear** as if the token wasn't saved, when in reality:
- It WAS saved to the database
- The UI just reset to show the masked dots again

## Root Cause

The `useEffect` (lines 110-164) runs every time the `settings` query data changes. After saving and invalidating, it overwrites the form state with freshly fetched data, which masks the token again.

## Solution

Add a flag to track when we're actively saving, and prevent the `useEffect` from overwriting form fields during that time. This gives the user clear feedback that their save was successful.

### Changes Required

**File: `src/pages/admin/SettingsPage.tsx`**

1. **Add a "just saved" tracking state** to prevent immediate form reset:

```typescript
const [recentlySavedSection, setRecentlySavedSection] = useState<string | null>(null);
```

2. **Update `handleSaveFacebook` to track the save**:

```typescript
const handleSaveFacebook = () => {
  const updates: Record<string, string> = {};
  if (facebookSettings.page_id) {
    updates.facebook_page_id = facebookSettings.page_id;
  }
  if (facebookSettings.page_access_token && !facebookSettings.page_access_token.includes("•")) {
    updates.facebook_page_access_token = facebookSettings.page_access_token;
  }

  if (Object.keys(updates).length === 0) {
    toast({
      title: "No changes to save",
      description: "Enter new values to update the settings."
    });
    return;
  }

  setRecentlySavedSection("facebook");
  saveMutation.mutate(updates);
};
```

3. **Update the `useEffect` to skip resetting recently saved sections**:

In the Facebook settings portion of the `useEffect`:
```typescript
// Only update Facebook settings if we haven't just saved them
if (recentlySavedSection !== "facebook") {
  setFacebookSettings({
    page_id: settingsMap.settings_facebook_page_id || "",
    page_access_token: settingsMap.settings_facebook_page_access_token ? "••••••••••••" : ""
  });
}
```

4. **Clear the flag after a delay** (in the mutation's onSuccess):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["system-settings"] });
  queryClient.invalidateQueries({ queryKey: ["company-settings"] });
  queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
  toast({
    title: "Settings saved",
    description: "Your changes have been saved successfully."
  });
  // Clear the recently saved flag after a delay to allow the toast to show
  setTimeout(() => setRecentlySavedSection(null), 2000);
},
```

5. **Alternative simpler fix** - Just show the masked value immediately after save to confirm it's saved:

Instead of the above, we can update the success handler to explicitly set the masked value with a "Saved!" indicator:

```typescript
// In handleSaveFacebook success path
if (facebookSettings.page_access_token && !facebookSettings.page_access_token.includes("•")) {
  // After successful save, show the masked value to confirm it's stored
  setFacebookSettings(prev => ({
    ...prev,
    page_access_token: "••••••••••••"  // Show masked after save
  }));
}
```

## Recommended Approach

The **simplest fix** is option 5 above - when a token is successfully saved, immediately update the local state to show the masked value. This:
- Confirms to the user the token was saved
- Prevents confusion from the form "resetting"
- Requires minimal code changes

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/admin/SettingsPage.tsx` | Add recently-saved tracking OR update local state after successful save to show masked value |

## Testing After Fix

1. Go to Settings → Communications
2. Scroll to Facebook Page Configuration
3. Enter a Page Access Token
4. Click "Save Facebook Configuration"
5. Observe: Token field shows `••••••••••••` (confirms saved)
6. Toast shows "Settings saved"
7. Refresh page - token field still shows `••••••••••••` (confirms persistence)

