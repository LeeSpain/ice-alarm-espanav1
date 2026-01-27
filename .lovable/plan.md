

## Enable "Send Invite" for Admin View Mode

### Problem
When viewing a partner's invites page as an admin (URL contains `?partnerId=`), the "Send Invite" button and dialog are hidden. This prevents admins from sending invites on behalf of partners.

### Solution
Remove the `isAdminViewMode` restriction on the Send Invite button and dialog, allowing admins to also send invites when viewing a partner's page.

---

### Changes Required

| File | Changes |
|------|---------|
| `src/pages/partner/PartnerInvitesPage.tsx` | Remove the `!isAdminViewMode &&` condition wrapping the Send Invite dialog (lines 299-495) |
| `src/pages/partner/PartnerInvitesPage.tsx` | Remove the `!isAdminViewMode &&` condition wrapping the quick share buttons (lines 519-530) |
| `src/pages/partner/PartnerInvitesPage.tsx` | Remove the `!isAdminViewMode &&` condition on the empty state message (line 551-553) |

---

### Implementation Details

#### 1. Show Send Invite Button Always

**Before (line 298-299):**
```tsx
{/* Only show send invite button if not in admin view mode */}
{!isAdminViewMode && (
  <Dialog ...>
```

**After:**
```tsx
<Dialog ...>
```

Remove the entire conditional wrapper so the button is always visible.

#### 2. Show Quick Share Buttons Always

**Before (lines 519-530):**
```tsx
{!isAdminViewMode && (
  <div className="flex gap-2">
    <Button variant="outline" onClick={shareViaWhatsApp}>...
```

**After:**
```tsx
<div className="flex gap-2">
  <Button variant="outline" onClick={shareViaWhatsApp}>...
```

#### 3. Show Empty State Help Text Always

**Before (lines 551-553):**
```tsx
{!isAdminViewMode && (
  <p className="text-sm">Start inviting people to earn commissions!</p>
)}
```

**After:**
```tsx
<p className="text-sm">Start inviting people to earn commissions!</p>
```

---

### Result
After these changes:
- The "Send Invite" button will appear in the header next to the page title
- Clicking it opens a popup dialog to add contact details (name, email/phone, message)
- Quick share buttons (WhatsApp, Email) will be visible below the referral link
- Both partners and admins can send invites from this page

