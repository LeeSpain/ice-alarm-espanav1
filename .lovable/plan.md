
# Comprehensive Translation Audit & Fix Plan

## Executive Summary

The ICE Alarm platform has approximately **95% translation coverage**, with excellent i18n implementation across most public pages and core functionality. However, a thorough code-by-code review has identified **~150 hardcoded English strings** that need to be externalized to locale files for full bilingual (EN/ES) support.

---

## Areas Requiring Translation

### 1. Admin Management Pages (~45 strings)

| File | Issue | Examples |
|------|-------|----------|
| `MembersPage.tsx` | Status badges hardcoded | "Active", "Inactive", "Suspended", "No Plan" |
| `MembersPage.tsx` | Table headers hardcoded | "Name", "Email", "Phone", "Plan", "Status", "Device", "Actions" |
| `MembersPage.tsx` | Page titles/descriptions | "Members", "Manage all ICE Alarm members..." |
| `MembersPage.tsx` | Buttons/states | "CRM Import", "CRM Contacts", "Export CSV", "Add Member", "Loading members...", "No members found" |
| `MembersPage.tsx` | Pagination | "Showing X to Y of Z members", "Page X of Y", "Previous", "Next" |
| `OrdersPage.tsx` | Status badges | "Pending", "Processing", "Shipped", "Delivered", "Cancelled" |
| `OrdersPage.tsx` | Actions | "View Details", "Mark Processing", "Mark Shipped", "Mark Delivered" |
| `OrdersPage.tsx` | Table headers | "Order #", "Member", "Date", "Total", "Status", "Tracking", "Actions" |
| `DevicesPage.tsx` | Status badges | "In Stock", "Reserved", "Allocated", "With Staff", "Live", "Faulty", "Returned", "Active (Legacy)" |
| `DevicesPage.tsx` | Table headers | "IMEI", "SIM Number", "Member", "Status", "Online", "Battery", "Last Check-in", "Actions" |
| `DevicesPage.tsx` | States | "Online", "Offline", "Unassigned", "Loading devices...", "No devices found", "Never", "N/A" |
| `DevicesPage.tsx` | Actions | "Add Device", "View Details", "Configure", "View Location" |

### 2. Call Centre Dashboard (~15 strings)

| File | Issue | Examples |
|------|-------|----------|
| `CallCentreDashboard.tsx` | Tab labels | "Alerts", "Messages" |
| `CallCentreDashboard.tsx` | Status badges | "X Incoming", "X In Progress", "X Escalated" |
| `CallCentreDashboard.tsx` | Search placeholder | "Search by name or location..." |
| `CallCentreDashboard.tsx` | Tab triggers | "All", "Incoming", "In Progress", "Escalated" |
| `CallCentreDashboard.tsx` | Quick actions | "Quick Actions", "Call Emergency Services (112)" |
| `CallCentreDashboard.tsx` | Empty state | "All clear", "No active alerts at the moment", "Loading alerts..." |

### 3. Join Wizard (~25 strings)

| File | Issue | Examples |
|------|-------|----------|
| `JoinWizard.tsx` | Payment toasts | "Payment successful! Welcome to ICE Alarm.", "Payment was cancelled. You can try again when ready." |
| `JoinWizard.tsx` | Validation messages | "Please enter your full name", "Please enter your email address", "Please enter your phone number", "Please enter your date of birth" |
| `JoinWizard.tsx` | Partner validation | "Please enter your partner's full name", "Please enter your partner's email address", etc. |
| `JoinWizard.tsx` | Address validation | "Please enter your street address", "Please enter your city", "Please select your province", "Please enter your postal code" |
| `JoinWizard.tsx` | Contact validation | "Please add at least one emergency contact" |
| `JoinWizard.tsx` | Terms validation | "Please accept the Terms of Service", "Please consent to share medical information..." |

### 4. Client Dashboard (~12 strings)

| File | Issue | Examples |
|------|-------|----------|
| `ClientDashboard.tsx` | Admin preview banners | "Template Preview Mode", "This shows the member dashboard layout...", "Demo Data" |
| `ClientDashboard.tsx` | Admin viewing banner | "Back to Members", "Viewing as Admin: X's dashboard" |
| `ClientDashboard.tsx` | Fallback strings | Uses pattern `t("key") || "Fallback"` - fallbacks should be in locale files |

### 5. Partner Dashboard (~10 strings)

| File | Issue | Examples |
|------|-------|----------|
| `PartnerDashboard.tsx` | Preview banner | "Template Preview Mode", "This shows the dashboard layout with demo data...", "Demo Data" |
| `PartnerDashboard.tsx` | Admin banner | "Back to Partners", "Viewing as Admin: X's dashboard" |
| `PartnerDashboard.tsx` | Empty states | "Partner Not Found", "Your account is not linked...", "Referral Pipeline", "Pipeline data will appear..." |
| `PartnerDashboard.tsx` | UI labels | "Dashboard", "Welcome back", "Your Referral Link", "Copy", "Referral Code:" |
| `PartnerDashboard.tsx` | Toast messages | "This is a template preview - referral link is for demo only", "Referral link copied to clipboard!" |

### 6. Legal Pages (~4 strings per page + full content)

| File | Issue | Examples |
|------|-------|----------|
| `PrivacyPage.tsx` | Page title | "Privacy Policy", "ICE Alarm España S.L.", "Last updated: January 2025" |
| `PrivacyPage.tsx` | Footer links | "Terms of Service", "Privacy Policy" |
| `TermsPage.tsx` | Page title | "Terms and Conditions", "ICE Alarm España S.L.", "Last updated: January 2025" |
| `TermsPage.tsx` | Footer links | "Terms of Service", "Privacy Policy" |

**Note**: The full legal document content (Privacy Policy sections 1-14, Terms sections 1-10) would need professional legal translation. These should be marked as requiring external translation services.

---

## Implementation Plan

### Phase 1: Add New Translation Keys (~100 new keys)

**Add to `en.json`:**

```json
"admin": {
  "members": {
    "title": "Members",
    "subtitle": "Manage all ICE Alarm members and their information.",
    "addMember": "Add Member",
    "exportCsv": "Export CSV",
    "crmImport": "CRM Import",
    "crmContacts": "CRM Contacts",
    "searchPlaceholder": "Search by name, email, or phone...",
    "loading": "Loading members...",
    "noResults": "No members found",
    "noPlan": "No Plan",
    "assigned": "Assigned",
    "none": "None",
    "viewMemberDashboard": "View Member Dashboard",
    "viewDetails": "View Details",
    "showing": "Showing {{from}} to {{to}} of {{total}} members",
    "pageOf": "Page {{page}} of {{totalPages}}",
    "previous": "Previous",
    "next": "Next"
  },
  "orders": {
    "title": "Orders",
    "subtitle": "Manage member orders and shipments.",
    "searchPlaceholder": "Search by order number...",
    "loading": "Loading orders...",
    "noResults": "No orders found",
    "unknown": "Unknown",
    "viewDetails": "View Details",
    "markProcessing": "Mark Processing",
    "markShipped": "Mark Shipped",
    "markDelivered": "Mark Delivered",
    "showing": "Showing {{from}} to {{to}} of {{total}} orders"
  },
  "devices": {
    "title": "Devices",
    "subtitle": "Manage GPS Personal Pendants and their assignments.",
    "addDevice": "Add Device",
    "searchPlaceholder": "Search by IMEI or SIM number...",
    "totalDevices": "Total Devices",
    "loading": "Loading devices...",
    "noResults": "No devices found",
    "unassigned": "Unassigned",
    "online": "Online",
    "offline": "Offline",
    "never": "Never",
    "na": "N/A",
    "viewDetails": "View Details",
    "configure": "Configure",
    "viewLocation": "View Location",
    "showing": "Showing {{from}} to {{to}} of {{total}} devices",
    "statuses": {
      "in_stock": "In Stock",
      "reserved": "Reserved",
      "allocated": "Allocated",
      "with_staff": "With Staff",
      "live": "Live",
      "faulty": "Faulty",
      "returned": "Returned",
      "inactive": "Inactive",
      "active_legacy": "Active (Legacy)"
    }
  },
  "table": {
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "plan": "Plan",
    "status": "Status",
    "device": "Device",
    "actions": "Actions",
    "orderNumber": "Order #",
    "member": "Member",
    "date": "Date",
    "total": "Total",
    "tracking": "Tracking",
    "imei": "IMEI",
    "simNumber": "SIM Number",
    "battery": "Battery",
    "lastCheckIn": "Last Check-in"
  },
  "preview": {
    "templateMode": "Template Preview Mode",
    "templateModeDesc": "This shows the dashboard layout with demo data. Changes made here will apply to all dashboards.",
    "demoData": "Demo Data",
    "viewingAsAdmin": "Viewing as Admin:",
    "dashboard": "'s dashboard",
    "backToMembers": "Back to Members",
    "backToPartners": "Back to Partners"
  }
},
"callCentre": {
  "tabs": {
    "alerts": "Alerts",
    "messages": "Messages"
  },
  "status": {
    "incoming": "{{count}} Incoming",
    "inProgress": "{{count}} In Progress",
    "escalated": "{{count}} Escalated"
  },
  "search": {
    "placeholder": "Search by name or location..."
  },
  "filters": {
    "all": "All",
    "incoming": "Incoming",
    "inProgress": "In Progress",
    "escalated": "Escalated"
  },
  "empty": {
    "allClear": "All clear",
    "noAlerts": "No active alerts at the moment",
    "loading": "Loading alerts..."
  },
  "quickActions": {
    "title": "Quick Actions",
    "callEmergency": "Call Emergency Services (112)"
  }
},
"joinWizard": {
  "validation": {
    "enterFullName": "Please enter your full name",
    "enterEmail": "Please enter your email address",
    "enterPhone": "Please enter your phone number",
    "enterDob": "Please enter your date of birth",
    "enterPartnerFullName": "Please enter your partner's full name",
    "enterPartnerEmail": "Please enter your partner's email address",
    "enterPartnerPhone": "Please enter your partner's phone number",
    "enterPartnerDob": "Please enter your partner's date of birth",
    "enterStreetAddress": "Please enter your street address",
    "enterCity": "Please enter your city",
    "selectProvince": "Please select your province",
    "enterPostalCode": "Please enter your postal code",
    "enterPartnerStreet": "Please enter your partner's street address",
    "enterPartnerCity": "Please enter your partner's city",
    "selectPartnerProvince": "Please select your partner's province",
    "enterPartnerPostal": "Please enter your partner's postal code",
    "addEmergencyContact": "Please add at least one emergency contact",
    "acceptTerms": "Please accept the Terms of Service",
    "acceptPrivacy": "Please consent to share medical information with emergency services"
  },
  "payment": {
    "success": "Payment successful! Welcome to ICE Alarm.",
    "cancelled": "Payment was cancelled. You can try again when ready."
  }
},
"partner": {
  "dashboard": {
    "title": "Dashboard",
    "welcomeBack": "Welcome back, {{name}}",
    "referralLink": "Your Referral Link",
    "shareToEarn": "Share this link to earn commissions on every signup",
    "copy": "Copy",
    "referralCode": "Referral Code:",
    "notFound": "Partner Not Found",
    "notLinked": "Your account is not linked to a partner profile.",
    "pipeline": {
      "title": "Referral Pipeline",
      "subtitle": "Track your referrals through each stage",
      "emptyPreview": "Pipeline data will appear here for actual partners"
    }
  },
  "toast": {
    "previewOnly": "This is a template preview - referral link is for demo only",
    "linkCopied": "Referral link copied to clipboard!"
  }
},
"legal": {
  "privacy": {
    "title": "Privacy Policy",
    "company": "ICE Alarm España S.L.",
    "lastUpdated": "Last updated: January 2025"
  },
  "terms": {
    "title": "Terms and Conditions",
    "company": "ICE Alarm España S.L.",
    "lastUpdated": "Last updated: January 2025"
  },
  "footer": {
    "termsOfService": "Terms of Service",
    "privacyPolicy": "Privacy Policy"
  }
}
```

**Add corresponding translations to `es.json`:**
(Spanish translations for all keys above)

### Phase 2: Update Components

Update the following files to use i18n `t()` function:

1. **`src/pages/admin/MembersPage.tsx`** - Add `useTranslation()` and replace ~20 hardcoded strings
2. **`src/pages/admin/OrdersPage.tsx`** - Add `useTranslation()` and replace ~15 hardcoded strings
3. **`src/pages/admin/DevicesPage.tsx`** - Add `useTranslation()` and replace ~20 hardcoded strings
4. **`src/pages/call-centre/CallCentreDashboard.tsx`** - Add `useTranslation()` and replace ~15 hardcoded strings
5. **`src/pages/join/JoinWizard.tsx`** - Replace ~25 validation message strings with translation keys
6. **`src/pages/client/ClientDashboard.tsx`** - Replace ~12 admin banner strings with translation keys
7. **`src/pages/partner/PartnerDashboard.tsx`** - Replace ~12 strings and add i18n for toasts
8. **`src/pages/PrivacyPage.tsx`** - Add translation keys for headers/footers
9. **`src/pages/TermsPage.tsx`** - Add translation keys for headers/footers

### Phase 3: Remove Fallback Patterns

Update `ClientDashboard.tsx` to remove the fallback pattern:
```typescript
// FROM:
{t("dashboard.noDeviceAssigned") || "No device assigned"}

// TO:
{t("dashboard.noDeviceAssigned")}
```
Ensure the key exists in both locale files instead of using inline fallbacks.

---

## Files to Modify

| File | Action | Estimated Changes |
|------|--------|-------------------|
| `src/i18n/locales/en.json` | Add ~100 new keys | Major additions |
| `src/i18n/locales/es.json` | Add ~100 Spanish translations | Major additions |
| `src/pages/admin/MembersPage.tsx` | Add i18n + replace strings | ~20 changes |
| `src/pages/admin/OrdersPage.tsx` | Add i18n + replace strings | ~15 changes |
| `src/pages/admin/DevicesPage.tsx` | Add i18n + replace strings | ~20 changes |
| `src/pages/call-centre/CallCentreDashboard.tsx` | Add i18n + replace strings | ~15 changes |
| `src/pages/join/JoinWizard.tsx` | Replace validation strings | ~25 changes |
| `src/pages/client/ClientDashboard.tsx` | Replace admin preview strings | ~12 changes |
| `src/pages/partner/PartnerDashboard.tsx` | Add i18n + replace strings | ~12 changes |
| `src/pages/PrivacyPage.tsx` | Add i18n for headers | ~5 changes |
| `src/pages/TermsPage.tsx` | Add i18n for headers | ~5 changes |

---

## Special Considerations

### Legal Content Translation
The full legal document content (Privacy Policy and Terms of Service) contains legal language that should be professionally translated by a qualified legal translator. For now, only the page headers will be translated programmatically.

### Preservation of Existing Translations
- All existing translation keys will be preserved
- No keys will be removed or renamed
- New keys will be added in organized namespaces

### Quality Assurance
After implementation:
1. Test language switching on all affected pages
2. Verify no literal translation keys appear
3. Confirm all toast messages appear in correct language
4. Check admin, call centre, client, and partner dashboards

---

## Summary

| Category | Strings to Translate |
|----------|---------------------|
| Admin Pages | ~45 |
| Call Centre | ~15 |
| Join Wizard | ~25 |
| Client Dashboard | ~12 |
| Partner Dashboard | ~12 |
| Legal Pages | ~10 (headers only) |
| **Total** | **~120 strings** |

This plan will bring the platform to **100% bilingual coverage** for all user-facing strings, completing the bilingual standard requirement.
