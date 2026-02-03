

## Add Documents to Staff Dashboard Sidebar

### Overview

This plan connects the Staff Dashboard sidebar to the Documentation system we just created. Staff will be able to view all published documents that have been marked with "staff" visibility by administrators.

---

### Implementation Steps

#### Step 1: Create Staff Documents Page

Create a new page component at `src/pages/call-centre/DocumentsPage.tsx` that:
- Displays a searchable, filterable list of staff-visible documentation
- Shows documents organized by category with expandable content
- Uses the existing `useDocumentation` hook with `visibility: 'staff'` filter
- Follows the same card-based layout as other staff pages

#### Step 2: Add Sidebar Menu Item

Update `src/components/layout/CallCentreSidebar.tsx`:
- Add `BookOpen` icon import from lucide-react (distinct from `FileText` already used for Shift Notes)
- Add new menu item to the `menuItems` array:
  ```
  { icon: BookOpen, labelKey: "sidebar.documents", path: "/call-centre/documents" }
  ```

#### Step 3: Register Route

Update `src/App.tsx`:
- Import the new `DocumentsPage` component
- Add route within the `/call-centre` nested routes:
  ```
  <Route path="documents" element={<DocumentsPage />} />
  ```

#### Step 4: Add Translations

Update both locale files with the new sidebar key:

**en.json:**
```json
"documents": "Documents"
```

**es.json:**
```json
"documents": "Documentos"
```

---

### Staff Documents Page Features

The page will include:
- **Header:** "Staff Documents" with subtitle explaining purpose
- **Search Bar:** Filter by title/content
- **Category Tabs:** Filter by document categories (Emergency Protocols, Device Guides, Staff Instructions, etc.)
- **Document Cards:** Each showing:
  - Title
  - Category badge
  - Language badge (EN/ES)
  - Importance indicator
  - Expandable content preview
  - Last updated date
- **Empty State:** Friendly message when no documents are available

---

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/call-centre/DocumentsPage.tsx` | Staff documents viewing page |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/CallCentreSidebar.tsx` | Add Documents menu item |
| `src/App.tsx` | Register `/call-centre/documents` route |
| `src/i18n/locales/en.json` | Add `sidebar.documents` translation |
| `src/i18n/locales/es.json` | Add Spanish translation |

---

### Technical Notes

- The RLS policy already exists for staff to read documents where `'staff' = ANY(visibility)` and `status = 'published'`
- The `useDocumentation` hook supports filtering by visibility, so we can use `useDocumentation({ visibility: 'staff', status: 'published' })`
- No database changes required - we're connecting to the existing documentation table

