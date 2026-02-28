

## Analysis

After reviewing the codebase, the page already has the 10-section structure, all 50 function keys, and both EN/ES translations. However, several specific changes are needed to match the requirements exactly.

## Changes Required

### 1. `src/pages/admin/IsabellaOperationsPage.tsx`

**Icon updates for first 4 sections:**
- Alert Handling: `Bell` → `AlertTriangle`
- Inbound: `PhoneIncoming` → `Activity`
- Outbound: `PhoneOutgoing` → `Zap`
- Sales: `TrendingUp` → `Megaphone`

**Section header UI upgrade:**
- Add 9x9 rounded-lg bg-muted icon container around each section icon
- Rename interface field `color` → `iconColor`

**FUNCTION_KEY_MAP fixes** (3 content keys use wrong translation keys):
- `auto_generate_scheduled_content` descKey: `autoGenerateScheduledContentDesc` (keep as-is, matches translations)
- `auto_publish_approved_content` descKey: `autoPublishApprovedContentDesc` (keep as-is)
- These already match the translations, so no change needed here.

**Always Human section upgrade:**
- Add Lock icon in 9x9 bg-muted container in the header
- Add `alwaysHumanDesc` description below the title
- Add muted color styling

**Remove unused icon imports** (`Bell`, `PhoneIncoming`, `PhoneOutgoing`, `TrendingUp`) since they're being replaced.

### 2. `src/lib/isabella-function-config.ts`

**Interface update:** Add `notify_roles?: ("admin" | "call_centre" | "partner")[]` and `critical?: boolean` to `IsabellaFunctionConfig`.

**Update agent_keys and triggers** for all 31 new functions per the user's table (many currently use `customer_service_expert` but should use `main_brain`).

**Add `getIsabellaFunctionConfig` helper** at the bottom of the file.

### 3. `src/i18n/locales/en.json`

**Update section descriptions** to match user's exact wording (6 sections have slightly different text).

**Add `alwaysHumanDesc`** key.

**Update function descriptions** for all 31 new functions to match user's detailed descriptions (current descriptions are shorter/different).

### 4. `src/i18n/locales/es.json`

**Mirror all EN changes** with Spanish translations:
- Updated section descriptions
- `alwaysHumanDesc` in Spanish
- Updated function descriptions for all 31 new functions

### Implementation Order

1. Update `isabella-function-config.ts` (interface + triggers + helper)
2. Update `IsabellaOperationsPage.tsx` (icons, UI, Always Human)
3. Update `en.json` (section descs, function descs, alwaysHumanDesc)
4. Update `es.json` (same changes in Spanish)

