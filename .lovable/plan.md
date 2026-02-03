
# Fix Duplicate `common` Sections in Locale Files

## Problem Identified

Both `en.json` and `es.json` have **duplicate `common` sections**, causing critical translation keys to be lost:

| File | First `common` | Second `common` (Overwrites!) |
|------|----------------|-------------------------------|
| `en.json` | Lines 148-256 | Lines 2523-2546 |
| `es.json` | Lines 148-232 | Lines 2475-2498 |

In JSON, duplicate keys cause the **last occurrence to overwrite** all previous ones. The second `common` sections are missing essential keys like:
- `signIn` / `Iniciar sesión`
- `getStarted` / `Comenzar`
- `goBack` / `Volver`
- And ~50 other keys

This is why `common.signIn` appears as literal text on the blog pages - the key doesn't exist in the effective `common` object.

---

## Solution

**Merge the duplicate `common` sections** into a single section, preserving all keys from both occurrences.

---

## Files to Modify

### 1. `src/i18n/locales/en.json`

**Remove the duplicate `common` section at lines 2523-2546** and merge any unique keys into the main `common` section at lines 148-256.

Keys in the second `common` that need to be added to the first:
- `saveChanges` → Already in first as part of similar keys
- `hours` → Add
- `days` → Add (note: conflicts - first has none, second has this)
- `at` → Add
- `filters` → Add
- `link` → Add  
- `preview` → Add

**Action:** Delete lines 2522-2546 after adding missing keys to the main `common` section.

### 2. `src/i18n/locales/es.json`

**Same approach:** Remove lines 2474-2498 and merge unique keys.

### 3. Update Blog Pages with Workaround

Apply the same workaround used in `LandingPage.tsx` to ensure translations work reliably:

**`src/pages/blog/BlogListPage.tsx`:**
- Line 48: Change `t("common.signIn")` → `t("auth.memberLogin", { defaultValue: "Sign In" })`
- Line 51: Change `t("common.getStarted")` → `t("landing.startProtection", { defaultValue: "Get Started" })`
- Line 66: Change `t("common.goBack")` → `t("auth.backToHome", { defaultValue: "Go Back" })`

**`src/pages/blog/BlogPostPage.tsx`:**
- Line 95: Change `t("common.signIn")` → `t("auth.memberLogin", { defaultValue: "Sign In" })`  
- Line 98: Change `t("common.getStarted")` → `t("landing.startProtection", { defaultValue: "Get Started" })`
- Line 206: Change `t("common.getStarted")` → `t("landing.startProtection", { defaultValue: "Get Started" })`

---

## Merged `common` Section (English)

The final `common` section should contain ALL keys:

```json
"common": {
  "notSpecified": "Not specified",
  "loading": "Loading...",
  "noData": "No data available",
  "viewAll": "View All",
  "reports": "Reports",
  "manage": "Manage",
  "active": "Active",
  "paused": "Paused",
  "cancelled": "Cancelled",
  "pending": "Pending",
  "processing": "Processing",
  "shipped": "Shipped",
  "delivered": "Delivered",
  "completed": "Completed",
  "failed": "Failed",
  "thisMonth": "This month",
  "noActiveAlerts": "No active alerts",
  "noRecentActivity": "No recent activity",
  "requireAttention": "Require attention",
  "noNewMembersThisMonth": "No new members this month",
  "needProcessing": "Need processing",
  "inNext30Days": "In next 30 days",
  "inStockAssigned": "In Stock / Assigned",
  "claim": "Claim",
  "incoming": "Incoming",
  "inProgress": "In Progress",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "add": "Add",
  "update": "Update",
  "submit": "Submit",
  "confirm": "Confirm",
  "close": "Close",
  "back": "Back",
  "next": "Next",
  "search": "Search",
  "filter": "Filter",
  "clear": "Clear",
  "yes": "Yes",
  "no": "No",
  "ok": "OK",
  "error": "Error",
  "success": "Success",
  "warning": "Warning",
  "info": "Info",
  "required": "Required",
  "optional": "Optional",
  "uploading": "Uploading...",
  "or": "or",
  "and": "and",
  "learnMore": "Learn More",
  "getStarted": "Get Started",
  "signIn": "Sign In",
  "signUp": "Sign Up",
  "joinNow": "Join Now",
  "configured": "Configured",
  "notConfigured": "Not Configured",
  "member": "Member",
  "plan": "Plan",
  "amount": "Amount",
  "contacts": "Contacts",
  "primary": "Primary",
  "ordinalSuffix": "nd",
  "inactive": "Inactive",
  "online": "Online",
  "offline": "Offline",
  "refresh": "Refresh",
  "all": "All",
  "new": "New",
  "refunded": "Refunded",
  "name": "Name",
  "email": "Email",
  "phone": "Phone",
  "date": "Date",
  "status": "Status",
  "actions": "Actions",
  "description": "Description",
  "details": "Details",
  "notes": "Notes",
  "today": "Today",
  "yesterday": "Yesterday",
  "noResults": "No results found",
  "free": "FREE",
  "off": "off",
  "saved": "Saved",
  "created": "Created",
  "deleted": "Deleted",
  "goBack": "Go Back",
  "create": "Create",
  "spain": "Spain",
  "phonePlaceholder": "+34 000 000 000",
  "staff": "Staff",
  "saveChanges": "Save Changes",
  "hours": "hours",
  "days": "days",
  "at": "at",
  "filters": "Filters",
  "link": "Link",
  "preview": "Preview",
  "deleteConfirm": "Are you sure you want to delete this item?"
}
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `en.json` | Merge duplicate `common` sections, delete lines 2522-2546 |
| `es.json` | Merge duplicate `common` sections, delete lines 2474-2498 |
| `BlogListPage.tsx` | Use alternative keys with fallbacks for header buttons |
| `BlogPostPage.tsx` | Use alternative keys with fallbacks for header buttons |

This will restore all missing translation keys and ensure the blog pages display properly translated text in both English and Spanish.
