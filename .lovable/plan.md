

# Complete Translation Review for /join Wizard

## Critical Issue Found: Duplicate JSON Keys

Both `en.json` and `es.json` contain **two separate `joinWizard` objects** at the top level. In JSON, duplicate keys mean the **second one silently overwrites the first**, so all the main wizard translations (steps, membership, personal, address, medical, contacts, device, summary, payment, confirmation) are being lost at runtime. Only the `validation` and `payment.success/cancelled` keys from the second block survive.

This is likely why the wizard may show raw translation keys instead of actual text.

## Changes Required

### 1. Merge duplicate `joinWizard` blocks (both files)

**en.json**: Merge the second `joinWizard` block (lines ~2742-2768) containing `validation` and `payment.success/cancelled` into the first `joinWizard` block (lines ~1907-2128). Then delete the second block.

The merged structure should be:
```text
"joinWizard": {
  "steps": { ... },
  "exit": "...",
  "back": "...",
  ...
  "membership": { ... },
  "personal": { ... },
  "address": { ... },
  "medical": { ... },
  "contacts": { ... },
  "device": { ... },
  "summary": { ... },
  "payment": {
    "title": "...",
    "subtitle": "...",
    ...existing payment keys...,
    "success": "Payment successful! Welcome to ICE Alarm.",
    "cancelled": "Payment was cancelled. You can try again when ready."
  },
  "confirmation": { ... },
  "validation": {
    "enterFullName": "...",
    ...all validation keys...
  }
}
```

**es.json**: Same merge -- move the second `joinWizard` block (lines ~2718-2744) into the first block (lines ~1883-2104), then delete the duplicate.

### 2. Add missing translation keys

The following keys are used in `JoinAddressStep.tsx` with inline fallbacks but are missing from both locale files. They should be added inside `joinWizard.address`:

| Key | EN Value | ES Value |
|-----|----------|----------|
| `separateAddresses` | Members live at different addresses | Los miembros viven en direcciones diferentes |
| `separateAddressesDesc` | Enable this if you and your partner have separate home addresses | Active esto si usted y su pareja tienen direcciones diferentes |

### 3. No other missing keys detected

All other translation keys used across the 8 join wizard steps (`JoinMembershipStep`, `JoinPersonalStep`, `JoinAddressStep`, `JoinContactsStep`, `JoinPendantStep`, `JoinSummaryStep`, `JoinPaymentStep`, `JoinConfirmationStep`) and the parent `JoinWizard.tsx` are present in both locale files, including:
- `common.free`, `common.off`, `common.or` -- all present in both files
- Step names, navigation buttons, validation messages -- all covered
- Pricing-related keys with interpolation (`{{percent}}`, `{{amount}}`, `{{name}}`) -- matching in both languages

### Summary of file changes

| File | Action |
|------|--------|
| `src/i18n/locales/en.json` | Merge duplicate `joinWizard` blocks into one; add 2 missing address keys |
| `src/i18n/locales/es.json` | Merge duplicate `joinWizard` blocks into one; add 2 missing address keys |

