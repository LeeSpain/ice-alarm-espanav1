
## Goal
Fix the Twilio “API Key Secret keeps reverting / not saving” behavior by removing the “masked value in the input” approach and switching to a safe, stable “stored vs input” pattern (the same pattern already used for the Facebook token). This prevents:
- overwriting freshly pasted secrets with old masked placeholders during refetch/invalidation
- accidentally re-saving masked dots or stale values
- confusion about whether the secret is actually stored

## What’s happening now (root cause)
In `src/pages/admin/SettingsPage.tsx`:
- Twilio secrets are loaded into inputs as masked dots (`••••••••••••`) via `mask(settingsMap[...])`.
- When you save, React Query invalidates `system-settings` which refetches.
- The effect that re-populates `twilioKeys` can run while the UI is mid-edit / mid-save and overwrite your newly pasted secret with the masked value from the previously stored key (or with whichever value the refetch returns at that moment).
- Additionally, the current “dirty flag” is reset *before* the save has actually succeeded (`setTwilioSecretsDirty(false); saveMutation.mutate(...)`), which re-enables overwriting at the worst possible time.

Net result: you paste a new secret, hit save, the UI flips back and it looks like it didn’t store your new value (and in some cases the wrong value may be what gets tested next).

## Implementation approach (safe token UX pattern)
### A) Split Twilio secret fields into “stored flags” + “input values”
Refactor Twilio state from:
- `twilioKeys.auth_token = "••••••••••••"` (masked)
- `twilioKeys.api_key_secret = "••••••••••••"` (masked)

to:
- `twilioAuthTokenInput: string` (always real user input; default empty; never auto-filled)
- `twilioApiKeySecretInput: string` (always real user input; default empty; never auto-filled)
- `twilioAuthTokenStored: boolean` (derived from whether the backend has a value)
- `twilioApiKeySecretStored: boolean` (derived from whether the backend has a value)

Keep non-secret Twilio fields as normal editable values:
- account SID, API key SID, phone number, WhatsApp number

### B) Update the “populate from settings” useEffect
Instead of setting the secret inputs, the effect should:
- set `twilioAuthTokenStored = !!settingsMap[KEY.TWILIO_TOKEN]`
- set `twilioApiKeySecretStored = !!settingsMap[KEY.TWILIO_API_KEY_SECRET]`
- leave `twilioAuthTokenInput` and `twilioApiKeySecretInput` untouched

This guarantees refetches can’t overwrite what the user is typing/pasting.

### C) Update save logic to only send secrets when the user typed something
In `handleSaveTwilio`:
- For secrets, only include them in `updates` if the corresponding input is non-empty after trimming:
  - if `twilioApiKeySecretInput.trim().length > 0` then save it
  - if `twilioAuthTokenInput.trim().length > 0` then save it
- Do not rely on `includes("•")` checks anymore (those checks exist because we were mixing masked and real values in the same state; the refactor eliminates that entire class of bugs).

On save success:
- clear `twilioAuthTokenInput` and `twilioApiKeySecretInput`
- set stored flags to true (or just rely on the subsequent refetch)
- show a toast like “Saved (hidden)”

### D) Fix the timing bug with twilioSecretsDirty (or remove it)
After the refactor, the dirty flag becomes mostly unnecessary for secrets because secrets will never be overwritten by the effect.

We should either:
1) Remove `twilioSecretsDirty` entirely (recommended after refactor), or
2) If kept for non-secret Twilio fields, only reset it inside `saveMutation.onSuccess` (never before the request finishes).

### E) Improve clarity in the UI (so it’s obvious it’s stored)
In the Twilio card:
- Under “Auth Token” and “API Key Secret”, display status text:
  - “Stored (hidden)” when stored flag is true
  - “Not set” when stored flag is false
- Inputs should be empty by default and say “Paste a new token to replace”.
- Optional: add a small “Clear stored secret” button per secret (only if you want the ability to remove it; if implemented it would require a safe backend path to delete keys or set them to empty, and careful policy checks).

### F) Ensure the Test Connection button tests what’s actually stored
We’ll keep the test button behavior but ensure the expectation is clear:
- Test validates **stored credentials** in the backend.
- If the user pastes a new secret but doesn’t click Save, the Test button should warn: “Please save changes before testing” (only if we can detect unsaved input; easy since inputs will be non-empty).

## Files to review/change
1) `src/pages/admin/SettingsPage.tsx`
   - Refactor Twilio secrets state to “stored flag + input value”
   - Update useEffect population logic
   - Update `handleSaveTwilio` to use trimmed inputs and clear them on success
   - Update UI copy to show “Stored (hidden)” and prevent confusion
   - Remove or adjust `twilioSecretsDirty` so it can’t cause regressions

2) (Optional sanity check) `supabase/functions/test-twilio/index.ts`
   - Confirm it reads the correct prefixed keys and uses API Key auth first
   - Ensure it returns a helpful error message if only partial credentials exist (e.g., SID present but secret missing)

## Acceptance criteria (how we’ll know it’s fixed)
- Paste a new API Key Secret → click Save → the input clears and shows “Stored (hidden)” (no reverting to an old value in the input).
- Refresh the page → still shows “Stored (hidden)” (and badge stays Configured).
- Click “Test Connection” → succeeds with correct credentials, or returns a real Twilio error if the secret is genuinely wrong.
- No scenario where a background refetch overwrites a secret the user is currently typing.

## Notes / security
- Longer-term, sensitive credentials should live in backend environment secrets rather than a database table. For now, we’ll focus on making the current flow reliable and testable without surprise overwrites.

## Feature suggestions (next)
1) Add an end-to-end “Send Test SMS / Test Call / Test WhatsApp” flow after saving, so you can verify real delivery (not just auth).
2) Add a “Credential health” panel that checks required fields for each channel (SMS/Voice/WhatsApp) and highlights exactly what’s missing.
3) Add a “Rotate API Key” guided checklist in the UI (save new key → test → deactivate old key).
4) Add audit logging for who changed Twilio credentials and when (admin accountability).
5) Add a staging/test mode toggle for Twilio routing (send tests to a fixed internal number).
