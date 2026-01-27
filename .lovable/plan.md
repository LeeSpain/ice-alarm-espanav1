

## Fix: Duplicate `staffDashboard` Namespace in Translation Files

### Problem Identified
The translation key `staffDashboard.generateShiftNote` shows as raw text because the `staffDashboard` namespace is defined **twice** in both `en.json` and `es.json` files.

When i18next loads the JSON, the second definition overwrites the first one, and the second definition is missing all the shift report keys.

| File | First Definition | Second Definition | Result |
|------|------------------|-------------------|--------|
| `en.json` | Lines ~831-872 (has shift keys) | Lines ~997-1026 (missing shift keys) | Second overwrites first |
| `es.json` | Lines ~799-840 (has shift keys) | Lines ~965-994 (missing shift keys) | Second overwrites first |

---

### Solution
Merge the duplicate `staffDashboard` objects into a single, complete namespace in both locale files.

---

### Changes Required

| File | Action |
|------|--------|
| `src/i18n/locales/en.json` | Merge both `staffDashboard` blocks into one, keeping all keys |
| `src/i18n/locales/es.json` | Merge both `staffDashboard` blocks into one, keeping all keys |

---

### Implementation Details

#### 1. English (`en.json`)
Find the second `staffDashboard` block (~line 997) and merge its keys into the first block (~line 831), then delete the duplicate block.

The merged `staffDashboard` should include:
- `generateShiftNote`, `shiftSummaryReport`, `generatedAt`, `last12Hours`, etc. (from first block)
- Any additional keys from the second block (e.g., `welcomeBack`, `yourShift`, etc.)

#### 2. Spanish (`es.json`)
Same process - merge both `staffDashboard` blocks into one complete namespace.

---

### Technical Notes
- JSON does not allow duplicate keys at the same level
- When parsed, the second occurrence overwrites the first
- This is a common issue when multiple developers add keys to the same namespace
- After merging, all shift report translations will work correctly

