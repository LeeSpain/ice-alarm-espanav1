
## Member Dashboard Improvements Plan

### Overview
This plan addresses two key requests for the Member Dashboard:
1. **Dashboard**: Replace the large "Need Help?" card with a compact icon on the same line as the welcome message
2. **My Account (Profile Page)**: Complete review and enable full editing functionality

---

### Part 1: Dashboard "Need Help?" Redesign

**Current State:**
The "Need Help?" section is a large, full-width Card component (lines 242-271 in `ClientDashboard.tsx`) that takes up significant vertical space.

**Proposed Change:**
Replace the card with a compact help icon/button group positioned on the right side of the welcome header row.

**Visual Design:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Welcome back, John                          [📞] [💬]  ← Help icons        │
│  Monday, 27 January 2026                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Modify the Welcome Section (lines 202-212) to use `flex justify-between`
- Add a compact button group with Phone and WhatsApp icons
- Include tooltips showing "Call ICE Alarm" and "WhatsApp Support"
- Remove the large "Need Help?" Card component entirely

---

### Part 2: Profile Page Full Edit Functionality

**Current State Analysis:**
The current `ProfilePage.tsx` displays profile information in **read-only cards** and directs users to "Contact Support" for changes. However:
- The RLS policy on the `members` table **allows members to update their own profile** (`Members can update own profile` policy)
- The form validation schema and `onSubmit` handler already exist but are not connected to the UI
- The UI uses static `<div>` elements instead of form inputs

**Issues Found:**
1. Form is defined but not wrapped around the display cards
2. All fields are displayed as read-only text, not editable inputs
3. The "Contact Support" card suggests users cannot edit, but they actually can
4. No save button is present in the UI

**Proposed Changes:**
Transform the read-only display into an editable form with the following structure:

| Section | Editable Fields | Non-Editable Fields |
|---------|-----------------|---------------------|
| Personal Info | First Name, Last Name | Date of Birth, NIE/DNI |
| Contact Info | Phone | Email (requires verification) |
| Address | All address fields | - |
| Preferences | Language | - |

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  My Account                                              [Save Changes]     │
│  Manage your personal information and preferences                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐  ┌───────────────────────────────────────────┐│
│  │ Profile Photo            │  │ Personal Information              [Edit] ││
│  │    [Avatar]              │  │                                          ││
│  │ Contact support to       │  │ First Name        Last Name              ││
│  │ change photo             │  │ ┌─────────────┐   ┌─────────────┐        ││
│  └──────────────────────────┘  │ │ John        │   │ Smith       │        ││
│                                │ └─────────────┘   └─────────────┘        ││
│  ┌──────────────────────────┐  │                                          ││
│  │ Preferences              │  │ Date of Birth     NIE/DNI                ││
│  │ Preferred Language       │  │ [Read-only]       [Read-only]            ││
│  │ ┌──────────────────────┐ │  └───────────────────────────────────────────┘│
│  │ │ English          ▼   │ │                                              │
│  │ └──────────────────────┘ │  ┌───────────────────────────────────────────┐│
│  └──────────────────────────┘  │ Contact Information                       ││
│                                │ Email (read-only)  Phone                  ││
│                                │ [john@email.com]   ┌─────────────┐        ││
│                                │                    │ +34 612...  │        ││
│                                │                    └─────────────┘        ││
│                                └───────────────────────────────────────────┘│
│                                                                              │
│                                ┌───────────────────────────────────────────┐│
│                                │ Address                                   ││
│                                │ Street Address                            ││
│                                │ ┌─────────────────────────────────────┐   ││
│                                │ │ Calle Example 123                   │   ││
│                                │ └─────────────────────────────────────┘   ││
│                                │ City           Province     Postal Code   ││
│                                │ ┌──────────┐  ┌──────────┐  ┌────────┐   ││
│                                │ │ Madrid   │  │ Madrid   │  │ 28001  │   ││
│                                │ └──────────┘  └──────────┘  └────────┘   ││
│                                └───────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Details:**

1. **Wrap form around cards**
   - Use the existing `form` hook with `Form` component from shadcn
   - Replace static `<div>` displays with `FormField` components containing `Input` elements

2. **Editable fields with validation:**
   - First Name, Last Name (required)
   - Phone (required, with format validation)
   - Address Line 1, Line 2, City, Province, Postal Code
   - Preferred Language (dropdown)

3. **Read-only fields (displayed but not editable):**
   - Email (with note: "Contact support to change email")
   - Date of Birth (sensitive data)
   - NIE/DNI (legal document)
   - Country (fixed to Spain for this service)

4. **Add Save button:**
   - Position in header row, aligned right
   - Show loading state during save
   - Display success/error toast messages

5. **Remove "Contact Support to update" card:**
   - Since editing is now enabled, replace with a subtle note for email/DOB changes only

---

### Technical Implementation

**File: `src/pages/client/ClientDashboard.tsx`**
- Lines 202-212: Modify welcome section to include help icons
- Lines 242-271: Remove the large "Need Help?" Card component

**File: `src/pages/client/ProfilePage.tsx`**
- Lines 113-304: Complete refactor to use Form components
- Add `Form` wrapper around the content
- Replace read-only `<div>` with `FormField` + `Input` for editable fields
- Keep Email, DOB, NIE/DNI as styled read-only displays with lock icons
- Add header Save button connected to existing `onSubmit`
- Add translations for new UI elements

**Translation Keys to Add:**
```json
{
  "profile": {
    "saveChanges": "Save Changes",
    "saving": "Saving...",
    "emailChangeNote": "Contact support to change your email address",
    "dobReadOnly": "Date of birth cannot be changed",
    "nieReadOnly": "NIE/DNI cannot be changed"
  },
  "dashboard": {
    "callUs": "Call Us",
    "whatsappUs": "WhatsApp Us"
  }
}
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/pages/client/ClientDashboard.tsx` | Redesign welcome header with compact help icons, remove large Need Help card |
| `src/pages/client/ProfilePage.tsx` | Enable full form editing with save functionality |
| `src/i18n/locales/en.json` | Add new translation keys |
| `src/i18n/locales/es.json` | Add Spanish translation keys |

---

### Security Considerations

- **RLS Policy Verified**: The existing `Members can update own profile` policy on the `members` table allows this functionality
- **Field Restrictions**: Email and DOB remain read-only client-side as an additional safeguard (though the backend would also accept updates)
- **Input Validation**: Using existing zod schema with proper length limits and format validation
