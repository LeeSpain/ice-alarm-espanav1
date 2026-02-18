

# Complete i18n Translation Review

## Problem Found

Three components from recent changes contain hardcoded English strings with no Spanish translations:

### 1. Ideas & Notes Pad (`IdeasNotepad.tsx`) -- HIGH PRIORITY
Currently has **zero** translation support. Every single string is hardcoded English:
- Dialog title: "Ideas & Notes"
- Description: "Capture ideas, track bugs..."
- Stats: "total items", "completed"
- Button: "Add new idea, note, or checklist item..."
- Form placeholders: "Title -- What's on your mind?", "Add details, context, or steps..."
- Category labels: "Idea", "Feature", "Bug", "Note"
- Priority labels: "Low", "Medium", "High"
- Toggle label: "Checklist"
- Buttons: "Cancel", "Add Item"
- Empty state: "No items yet", "Click the button above..."
- Loading: "Loading your items..."
- Toast messages: "Item added successfully", "Item removed"
- Tab label: "All"

### 2. Admin Header (`AdminHeader.tsx`) -- MEDIUM PRIORITY
A few hardcoded strings:
- Search placeholder: "Search members, devices..."
- Role labels: "Super Admin", "Admin", "Staff"

### 3. Legal Pages (`TermsContent.tsx` + `PrivacyContent.tsx`) -- HIGH PRIORITY
~860 lines of professional legal content entirely in English. This is a bilingual platform serving Spain -- the legal documents must be available in Spanish.

---

## Implementation Plan

### Step 1: Add i18n keys to `en.json`

Add new translation blocks:

- `ideasNotepad.*` -- ~25 keys for the notepad UI (title, description, labels, placeholders, empty states, toasts)
- `adminHeader.*` -- 4 keys (search placeholder, role labels)
- `legal.termsContent.*` -- Structured keys for all 20 sections of the Terms of Service (section headings, paragraphs, list items, warnings)
- `legal.privacyContent.*` -- Structured keys for all 16 sections of the Privacy Policy (section headings, paragraphs, table cells, list items)

### Step 2: Add Spanish translations to `es.json`

Mirror all new keys with professional Spanish translations:

- `ideasNotepad.*` -- Spanish UI labels
- `adminHeader.*` -- Spanish labels
- `legal.termsContent.*` -- Full professional Spanish translation of the Terms of Service
- `legal.privacyContent.*` -- Full professional Spanish translation of the Privacy Policy

### Step 3: Update `IdeasNotepad.tsx`

- Import `useTranslation`
- Replace all hardcoded strings with `t()` calls using English fallbacks
- Update category/priority label arrays to use translation keys

### Step 4: Update `AdminHeader.tsx`

- Replace "Search members, devices..." placeholder with `t("adminHeader.searchPlaceholder", "Search members, devices...")`
- Replace role labels with `t()` calls

### Step 5: Update `TermsContent.tsx` and `PrivacyContent.tsx`

- Import `useTranslation`
- Replace every hardcoded heading, paragraph, list item, table cell, and warning with `t()` calls
- Maintain all formatting (bold, caps, tables, nested lists)

---

## Files Changed

| File | Action |
|------|--------|
| `src/i18n/locales/en.json` | Add ~300+ new keys for notepad, header, terms, privacy |
| `src/i18n/locales/es.json` | Add matching Spanish translations for all new keys |
| `src/components/admin/IdeasNotepad.tsx` | Add `useTranslation`, replace all hardcoded strings |
| `src/components/layout/AdminHeader.tsx` | Replace 4 hardcoded strings with `t()` calls |
| `src/components/legal/TermsContent.tsx` | Add `useTranslation`, replace all content with `t()` calls |
| `src/components/legal/PrivacyContent.tsx` | Add `useTranslation`, replace all content with `t()` calls |

No database changes. No new dependencies.

