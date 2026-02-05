

# Partner Distribution Upgrade Plan

## Current State

The Partner Distribution section in Media Manager allows admins to:
- Toggle partner distribution on/off with a switch
- Select "All active partners" or "Selected partners only"
- Multi-select specific partners when "selected" is chosen

## What Needs Improvement

Based on your request, the current flow is confusing because:
1. There's a main toggle switch PLUS audience radio buttons - redundant controls
2. Once enabled, you can only pick "all" or "selected" - no way to pick "none" 
3. The selection feels like two-step process instead of one clear choice

## Proposed Solution: Simplified Single-Choice UI

Replace the current toggle + collapsible pattern with a **single, clear radio group** that offers all options in one place:

```
Partner Distribution
┌─────────────────────────────────────────────────────┐
│  ○  No partner sharing (post is not distributed)    │
│  ○  All active partners (23 partners)               │
│  ○  Selected partners only                          │
│     └─ [Partner selection list appears when chosen] │
└─────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Update `PartnerDistributionSection.tsx`

**Remove:**
- The main on/off Switch toggle
- The Collapsible wrapper (no longer needed)

**Change:**
- RadioGroup with 3 options: "none", "all", "selected"
- Partner checkboxes appear inline when "selected" is chosen
- Clean, single-level UI

**Updated Props:**
```typescript
interface PartnerDistributionSectionProps {
  audience: "none" | "all" | "selected";
  selectedPartnerIds: string[];
  onAudienceChange: (audience: "none" | "all" | "selected") => void;
  onSelectedPartnersChange: (ids: string[]) => void;
  disabled?: boolean;
}
// Remove: enabled, onEnabledChange (no longer needed)
```

### 2. Update `MediaManagerPage.tsx`

**Remove:**
- `partnerEnabled` state (no longer needed)
- `setPartnerEnabled` calls

**Change:**
- Derive `partner_enabled` from audience when saving:
  - `partner_enabled: partnerAudience !== "none"`
- Update `handleClearForm` to reset `partnerAudience` to "none"
- Update `handleSelectPost` to set audience correctly

### 3. Add "Select All / Deselect All" Buttons

When "Selected partners only" is chosen, add quick action buttons:
- **Select All** - checks all partners
- **Deselect All** - unchecks all partners
- Shows count: "3 of 23 selected"

### 4. Update Translation Keys

Add new translation strings for:
- `noPartnerSharing` - "No partner sharing"
- `noPartnerSharingDesc` - "This post will not be distributed to partners"
- `selectAll` - "Select All"
- `deselectAll` - "Deselect All"
- `selectedCount` - "{{count}} of {{total}} selected"

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/admin/media/PartnerDistributionSection.tsx` | Simplify to single RadioGroup with 3 options, add select all/deselect all |
| `src/pages/admin/MediaManagerPage.tsx` | Remove `partnerEnabled` state, derive from audience |
| `src/i18n/locales/en.json` | Add new translation keys |
| `src/i18n/locales/es.json` | Add Spanish translations |

## Visual Mockup

**Before (confusing):**
```
Partner Distribution [Toggle Switch]
  └── Configure partner access
      └── [Collapsible content with radio buttons]
```

**After (clear):**
```
Partner Distribution
├── ○ No partner sharing
├── ○ All active partners (23)
└── ○ Selected partners only
    ├── [Select All] [Deselect All] (3 of 23)
    └── ☑ John Smith (REF001)
        ☑ Jane Doe (REF002)
        ☐ Bob Wilson (REF003)
        ...
```

## Technical Notes

- The database schema already supports this - `partner_audience` column can be "none", "all", or "selected"
- No database changes required
- The `partner_enabled` boolean is derived: `true` if audience is "all" or "selected", `false` if "none"
- The `usePartnerPostLinks.ts` hook already handles both "all" and "selected" audiences correctly

