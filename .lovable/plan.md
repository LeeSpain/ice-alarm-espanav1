
# Complete Platform Translation Review

## Current State

After a thorough audit of every page and component across the platform, here is the translation coverage status.

## Pages WITH Translation Support (47 pages -- working correctly)

These pages already import `useTranslation` and use `t()` calls:

| Area | Pages |
|------|-------|
| **Public** | LandingPage, PendantPage, ContactPage, PrivacyPage, TermsPage, BlogListPage, BlogPostPage, NotFound |
| **Auth** | Login, Register, StaffLogin, CompleteRegistration, Unauthorized |
| **Join Wizard** | JoinWizard + all 8 step components |
| **Admin** | AdminDashboard, MembersPage, DevicesPage, OrdersPage, MediaManagerPage, AICommandCentre, AIAgentDetail, AIOutreachPage, AddMemberWizard, VideoHubPage, AnalyticsPage, CommunicationsDashboardPage, TasksPage |
| **Call Centre** | CallCentreDashboard, StaffDashboard, DocumentsPage, TicketsPage, MembersPage |
| **Client** | ClientDashboard, ProfilePage, DevicePage, AlertHistoryPage, EmergencyContactsPage, MedicalInfoPage, MessagesPage, SubscriptionPage, SupportPage |
| **Partner** | PartnerDashboard, PartnerMembersPage, PartnerCommissionsPage, PartnerAlertsPage, PartnerInvitesPage, PartnerMarketingPage, PartnerSettingsPage, PartnerAgreementPage |

## Pages WITHOUT Translation Support (27 pages -- fully hardcoded English)

These pages have zero `useTranslation` usage and contain all hardcoded English strings:

### Admin Dashboard Pages (15 pages)
1. **PaymentsPage** -- "Payments", "Search payments...", table headers, status badges
2. **SettingsPage** -- "Company Settings", all tab labels, form labels, API key sections
3. **PartnersPage** -- "Partners", table headers, status filters, action menus
4. **PartnerDetailPage** -- All partner detail tabs, labels, actions
5. **PartnerPricingSettingsPage** -- "Partner Pricing Settings", all form labels
6. **AddPartnerPage** -- "Add New Partner", all form fields, partner type options
7. **StaffPage** -- "Staff Management", table headers, role badges
8. **MemberDetailPage** -- Tab labels, member info sections
9. **AlertsPage** -- "Alerts", filter labels, alert type badges
10. **MessagesPage** -- "Messages", conversation headers, compose dialog
11. **DeviceDetailPage** -- Device info labels, status sections
12. **EV07BPage** -- Device management labels
13. **FinanceDashboard** -- All financial metric labels, chart titles
14. **ReportsPage** -- Report titles, filter labels
15. **LeadsPage** -- "Leads", table headers, status filters
16. **CRMContactsPage** -- "CRM Contacts", all table and filter labels
17. **CRMContactDetailPage** -- Contact detail labels
18. **CRMImportPage** -- Import wizard labels
19. **ImportBatchesPage** -- Batch import labels
20. **CommissionsPage** -- Commission table headers
21. **SubscriptionsPage** -- Subscription management labels
22. **TicketsPage (admin)** -- Ticket management labels

### Call Centre Pages (4 pages)
23. **MessagesPage** -- "Messages", conversation tabs, compose dialog
24. **ShiftNotesPage** -- "Shift Notes", note categories, dialog labels
25. **ShiftHistoryPage** -- Shift report labels
26. **LeadsPage** -- Lead management labels

### Partner Pages (3 pages)
27. **PartnerOnboarding** -- Onboarding step labels, benefit descriptions
28. **PartnerLogin** -- Login form labels (partially -- some strings hardcoded)
29. **PartnerJoin** -- Registration form labels
30. **PartnerVerify** -- Verification page labels

## Components WITHOUT Translation Support (15+ components)

Key components with hardcoded strings include:

| Component | Hardcoded Examples |
|-----------|-------------------|
| `admin/wizard/ConfirmationStep` | "What Happens Next", step descriptions |
| `admin/wizard/PendantOptionStep` | "Phone Only", "No additional cost" |
| `admin/wizard/OrderSummaryStep` | "Shipping", "Delivery to address", "Total Due Today" |
| `admin/member-detail/ProfileTab` | "Date of Birth", form labels |
| `admin/member-detail/DeviceTab` | "Device Workflow Status", status labels |
| `admin/settings/EmailSettingsTab` | "Daily Send Limit", "Hourly Send Limit" |
| `admin/settings/SocialMediaSection` | "Page Access Token" |
| `admin/products/DeviceStockSection` | "No devices found" |
| `partner/CareDashboard` | "Estimated Monthly Referrals", "Bulk Referral Form", "Monthly Summary Report" |
| `call-centre/DeviceOfflineAlertsCard` | "No offline alerts" |
| `admin/staff/StaffForm` | Form field labels |

## Zod Validation Schemas with Hardcoded Messages

Several files use Zod schemas with English-only validation:

- `src/pages/admin/AddPartnerPage.tsx` -- "Contact name is required", "Valid email is required"
- `src/pages/partner/PartnerLogin.tsx` -- Login validation messages
- `src/pages/partner/PartnerJoin.tsx` -- Registration validation messages

## Implementation Plan

Due to the massive scope (~30 pages + ~15 components + ~500 hardcoded strings), this should be done in **phases** to avoid overwhelming any single change:

### Phase 1: Admin Dashboard Core Pages (highest impact)
Externalize strings in: PaymentsPage, SettingsPage, PartnersPage, StaffPage, AlertsPage, MessagesPage, MemberDetailPage, DeviceDetailPage
- Estimated: ~200 new translation keys per locale file

### Phase 2: Admin Secondary Pages
LeadsPage, FinanceDashboard, ReportsPage, CommissionsPage, SubscriptionsPage, CRMContactsPage, CRMContactDetailPage, CRMImportPage, ImportBatchesPage, EV07BPage, PartnerDetailPage, PartnerPricingSettingsPage, AddPartnerPage
- Estimated: ~150 new translation keys

### Phase 3: Call Centre Pages
MessagesPage, ShiftNotesPage, ShiftHistoryPage, LeadsPage
- Estimated: ~80 new translation keys

### Phase 4: Partner Pages + Auth
PartnerOnboarding, PartnerLogin, PartnerJoin, PartnerVerify
- Estimated: ~60 new translation keys

### Phase 5: Remaining Components
Admin wizard steps, member detail tabs, settings components, partner dashboard components
- Estimated: ~100 new translation keys

### Phase 6: Zod Validation Messages
Convert all hardcoded Zod `.min()`, `.email()`, etc. messages to use translation keys with fallbacks
- Estimated: ~30 new translation keys

### For Each File, the Process Is:
1. Add `import { useTranslation } from "react-i18next"` 
2. Add `const { t } = useTranslation()` in the component
3. Replace every hardcoded English string with `t("section.key", "English Fallback")`
4. Add the corresponding keys to both `en.json` and `es.json`

### Total Estimated New Keys: ~620 across both locale files

This is a significant but necessary effort to achieve 100% bilingual coverage. I recommend starting with Phase 1 (the most-used admin pages) and iterating through each phase in separate requests to keep changes manageable and reviewable.

Which phase would you like me to start with?
