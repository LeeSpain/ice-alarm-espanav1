

## Translation Audit: Missing `gdpr` Namespace

### Problem
The entire `gdpr` translation namespace is **missing from both** `en.json` and `es.json`. This means every `t("gdpr....")` call in `CookieConsentBanner.tsx` and `GdprSettingsSection.tsx` renders raw key strings instead of proper text — affecting the cookie banner, cookie settings dialog, GDPR settings panel, and account deletion dialog.

### Keys Needed (extracted from source code)

**Cookie Banner** (`gdpr.cookieBanner.*`):
- `title`, `description`, `customize`, `rejectNonEssential`, `acceptAll`

**Cookie Settings Dialog** (`gdpr.cookieSettings.*`):
- `title`, `description`, `essential`, `essentialDescription`, `analytics`, `analyticsDescription`, `marketing`, `marketingDescription`, `savePreferences`

**GDPR Settings Section** (`gdpr.settings.*`):
- `title`, `description`, `downloadTitle`, `downloadDescription`, `downloading`, `downloadButton`, `cookieTitle`, `cookieDescription`, `cookieButton`, `deleteTitle`, `deleteDescription`, `deleteSubmitted`, `deleteButton`

**Delete Dialog** (`gdpr.deleteDialog.*`):
- `title`, `warning`, `details`, `submitting`, `confirm`

### Implementation Steps

1. **Add `gdpr` namespace to `en.json`** — Insert all ~30 keys above with proper English text for cookie consent, data export, cookie preferences, and account deletion flows.

2. **Add `gdpr` namespace to `es.json`** — Insert the same ~30 keys with proper Spanish translations, maintaining the same structure.

### Technical Detail
Both files currently have 399 top-level namespace entries. The `gdpr` block will be added as a new top-level entry in each file (likely near other user-facing sections). No code changes are needed in the components — they already reference these keys correctly.

