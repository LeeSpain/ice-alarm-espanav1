
## Goal
Make the **Facebook Page Access Token** field reliably accept and save very long tokens, and fix the **eye icon** so it actually toggles visibility. Also remove the confusing “flick back to a short value” behavior after saving.

## What’s really happening (complete review of likely causes)

### A) The “flick back to a short value” is currently expected masking behavior
- After a successful save, the UI intentionally replaces the token with `"••••••••••••"` to avoid showing secrets on screen.
- That looks like the long token “didn’t save” even when it did.
- Because you confirmed you get a **Success toast**, the backend call is completing.

### B) The token input currently mixes two different meanings in one field
Right now the same `facebookSettings.page_access_token` state is used for:
1) A real, newly pasted token (long string)
2) A masked “token exists” placeholder (`••••••••••••`)

This causes multiple edge-cases:
- Save logic has to guess whether it’s a real token by checking for `"•"`.
- After save, it intentionally masks (which looks like replacement).
- On refresh, it masks again.

### C) The eye button “does nothing” is almost certainly a UI layering / click-target issue
You already have:
```tsx
<Button className="absolute right-0 top-0 h-full px-3" ...>
```
But:
- The input can still “win” the click due to stacking/overlay in some browsers/styles.
- This is common when an absolutely positioned element doesn’t have an explicit `z-index`.
- Result: clicks hit the input instead of the button.

### D) Background state sync can still overwrite the user value at the wrong moment
You already added `facebookDirty` and disabled `refetchOnWindowFocus/refetchOnReconnect` which helps a lot.
But the cleanest fix is to avoid syncing a masked token into the editable field at all.

### E) Backend/truncation is NOT the culprit
- The `system_settings.value` column is `text` (no length limit).
- The saving function upserts the string as-is.
So this is overwhelmingly a frontend UX/state problem, not database length.

## Fix approach (what will change)
### 1) Split the token into “stored” vs “new input” (key change)
Instead of storing masked dots in the input value, we’ll implement:

- `facebookTokenStored: boolean` (derived from backend settings: token exists or not)
- `facebookTokenInput: string` (the actual editable/pasteable field; starts empty)

UI behavior:
- If a token exists in the backend: show a small status line like “Token saved (hidden). Paste a new token to replace.”
- The input remains empty unless you paste a new token.
- After saving, we clear the input (so it doesn’t “flip” to dots).
- The eye toggle now only applies to `facebookTokenInput`.

This eliminates:
- “It changed to a short value”
- “Did my token save?”
- The brittle `includes("•")` logic

### 2) Make the eye button reliably clickable
Add:
- `z-10` (or `z-20`) to the button
- optionally `type="button"` (already present)
- optionally `onMouseDown={(e) => e.preventDefault()}` to prevent focus/blur weirdness while clicking

Example styling change:
- from: `className="absolute right-0 top-0 h-full px-3"`
- to:   `className="absolute right-0 top-0 h-full px-3 z-10"`

### 3) Make “Save” only send a token when you actually pasted one
- Page ID: can save anytime if present
- Token: only saved if `facebookTokenInput.trim().length > 0`
- After success: clear `facebookTokenInput`, set `facebookTokenStored = true`

### 4) Improve feedback so it’s obvious it worked
- After successful save, show:
  - “Token saved (hidden).”
  - Optionally show “Last updated: <timestamp>” using `settingsMap.settings_facebook_page_access_token_updated_at` if available (if not, we can display the `system_settings` row’s `updated_at` by capturing it in the query mapping).

## Files to change
### Frontend
- `src/pages/admin/SettingsPage.tsx`
  - Refactor the Facebook section state:
    - Replace `facebookSettings.page_access_token` usage with `facebookTokenInput` + `facebookTokenStored`
  - Update `useEffect`:
    - Stop writing `"••••••••••••"` into the editable input value
    - Instead set `facebookTokenStored = Boolean(settingsMap.settings_facebook_page_access_token)`
  - Update `handleSaveFacebook`:
    - Use `facebookTokenInput` for updates
    - Clear `facebookTokenInput` on success
  - Fix eye button:
    - Add z-index class (and possibly `onMouseDown` preventDefault)

## Detailed implementation steps (sequenced)
1) Update Facebook-related React state
   - Add `facebookTokenInput` and `facebookTokenStored`
   - Keep `facebookSettings.page_id` as-is (or split similarly for consistency)

2) Update the settings sync `useEffect`
   - When settings load:
     - `setFacebookSettings({ page_id: ... })`
     - `setFacebookTokenStored(!!settingsMap.settings_facebook_page_access_token)`
     - Do NOT set any masked value into the input

3) Update the Facebook token input UI
   - Input `value={facebookTokenInput}`
   - Placeholder:
     - if `facebookTokenStored` true: “Token saved. Paste a new token to replace…”
     - else: “EAA…”
   - Add helper text “Stored tokens are hidden for security.”

4) Fix the eye icon click handling
   - Add `z-10`
   - Use functional state toggle: `setShowFacebookToken((prev) => !prev)`

5) Update save logic
   - Build updates:
     - `facebook_page_id` from `facebookSettings.page_id`
     - `facebook_page_access_token` from `facebookTokenInput.trim()` only if non-empty
   - On success:
     - `setFacebookTokenStored(true)`
     - `setFacebookTokenInput("")`
     - Keep existing query invalidations

6) Manual verification checklist (end-to-end)
   - Paste a very long token → it remains in the field (no unexpected change)
   - Click the eye → it toggles to show/hide the long token
   - Click Save → success toast, input clears, status shows “Token saved (hidden)”
   - Refresh page → status still shows token saved; you can paste a replacement and save again

## Notes / Edge cases handled
- Works even if you only want to update Page ID (token left empty means “don’t change token”).
- Eliminates the entire “dots in the field” pattern that is confusing you right now.
- Removes reliance on checking for `"•"` which is brittle and can mis-detect.

## Success criteria
- You can paste and save a full long-lived token like `EAA...` without it being “blocked”.
- The eye button reliably toggles visibility.
- After saving, UI no longer “flicks back to a short code” in a way that implies failure.
