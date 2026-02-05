

# B2B Partner System Upgrade - Implementation Plan

## Overview

This plan adds B2B capabilities to the existing partner system, enabling three partner types: **Referral** (individual affiliates), **Care** (agencies/charities), and **Residential** (care homes, urbanizations). The upgrade introduces partner-specific pricing, ongoing member relationships, and alert visibility features for residential partners.

---

## Current System Analysis

### What Already Exists (Will Not Duplicate)

| Component | Status |
|-----------|--------|
| `partners` table with basic fields | ✅ Exists |
| `company_name` column | ✅ Exists |
| `cif` column (Spanish tax ID) | ✅ Exists |
| `partner_commissions` table | ✅ Exists |
| `partner_invites` table | ✅ Exists |
| `partner_attributions` table | ✅ Exists |
| `partner_clicks` table | ✅ Exists |
| `partner_post_links` table | ✅ Exists |
| `partner_presentations` table | ✅ Exists |
| `partner_agreements` table | ✅ Exists |
| `members.ref_partner_id` column | ✅ Exists |
| All partner pages (Join, Login, Dashboard, etc.) | ✅ Exist |
| Admin partner management pages | ✅ Exist |

---

## Database Schema Changes

### 1. New Columns for `partners` Table

```sql
-- Partner type categorization
ALTER TABLE partners ADD COLUMN partner_type text NOT NULL DEFAULT 'referral'
  CHECK (partner_type IN ('referral', 'care', 'residential'));

-- Organization classification
ALTER TABLE partners ADD COLUMN organization_type text DEFAULT 'individual'
  CHECK (organization_type IN (
    'individual', 'charity', 'care_agency', 'home_care',
    'care_home', 'urbanization', 'retirement_community', 'other'
  ));

-- Organization details
ALTER TABLE partners ADD COLUMN organization_registration text;
ALTER TABLE partners ADD COLUMN organization_website text;

-- Care partner specific
ALTER TABLE partners ADD COLUMN estimated_monthly_referrals text
  CHECK (estimated_monthly_referrals IN ('1-5', '5-10', '10-20', '20+'));

-- Residential partner specific
ALTER TABLE partners ADD COLUMN facility_address text;
ALTER TABLE partners ADD COLUMN facility_resident_count integer;
ALTER TABLE partners ADD COLUMN alert_visibility_enabled boolean DEFAULT false;
ALTER TABLE partners ADD COLUMN billing_model text DEFAULT 'commission'
  CHECK (billing_model IN ('commission', 'per_resident', 'custom'));
ALTER TABLE partners ADD COLUMN custom_rate_monthly numeric(10,2);
```

### 2. New Table: `partner_members`

Links residential/care partners to members for ongoing relationships (beyond initial referral attribution).

```sql
CREATE TABLE partner_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'resident'
    CHECK (relationship_type IN ('resident', 'client', 'beneficiary')),
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  removed_at timestamptz,
  notes text,
  UNIQUE(partner_id, member_id)
);

-- RLS policies
ALTER TABLE partner_members ENABLE ROW LEVEL SECURITY;

-- Partners can view their own member relationships
CREATE POLICY "Partners view own member relationships"
  ON partner_members FOR SELECT
  USING (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

-- Staff can manage all partner member relationships
CREATE POLICY "Staff manage partner members"
  ON partner_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### 3. New Table: `partner_pricing_tiers`

Custom pricing for B2B partners.

```sql
CREATE TABLE partner_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  membership_type text NOT NULL CHECK (membership_type IN ('single', 'couple')),
  billing_frequency text NOT NULL CHECK (billing_frequency IN ('monthly', 'annual')),
  subscription_net_price numeric(10,2) NOT NULL,
  registration_fee numeric(10,2) DEFAULT 0,
  registration_fee_discount_percent integer DEFAULT 0,
  pendant_net_price numeric(10,2),
  commission_amount numeric(10,2) DEFAULT 50,
  effective_from timestamptz DEFAULT now(),
  effective_to timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, membership_type, billing_frequency, effective_from)
);

-- RLS policies
ALTER TABLE partner_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Partners can view their own pricing
CREATE POLICY "Partners view own pricing"
  ON partner_pricing_tiers FOR SELECT
  USING (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

-- Staff can manage all pricing tiers
CREATE POLICY "Staff manage pricing tiers"
  ON partner_pricing_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### 4. New Table: `partner_alert_subscriptions`

For residential partners to subscribe to member alerts.

```sql
CREATE TABLE partner_alert_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  notify_email boolean DEFAULT true,
  notify_sms boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(partner_id, member_id)
);

-- RLS policies
ALTER TABLE partner_alert_subscriptions ENABLE ROW LEVEL SECURITY;

-- Partners can view/manage their own subscriptions
CREATE POLICY "Partners manage own alert subscriptions"
  ON partner_alert_subscriptions FOR ALL
  USING (partner_id IN (
    SELECT id FROM partners 
    WHERE user_id = auth.uid() AND alert_visibility_enabled = true
  ));

-- Staff can manage all subscriptions
CREATE POLICY "Staff manage alert subscriptions"
  ON partner_alert_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

### 5. New Table: `partner_alert_notifications`

Audit log of alert notifications sent to partners.

```sql
CREATE TABLE partner_alert_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partners(id),
  alert_id uuid NOT NULL REFERENCES alerts(id),
  member_id uuid NOT NULL REFERENCES members(id),
  notification_method text NOT NULL CHECK (notification_method IN ('email', 'sms', 'dashboard')),
  sent_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by text
);

-- RLS policies
ALTER TABLE partner_alert_notifications ENABLE ROW LEVEL SECURITY;

-- Partners can view their own notifications
CREATE POLICY "Partners view own alert notifications"
  ON partner_alert_notifications FOR SELECT
  USING (partner_id IN (
    SELECT id FROM partners WHERE user_id = auth.uid()
  ));

-- Staff can view all notifications
CREATE POLICY "Staff view all alert notifications"
  ON partner_alert_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
```

---

## Frontend Changes

### 1. Partner Registration Updates

**File: `src/pages/partner/PartnerJoin.tsx`**

Add a multi-step flow with partner type selection:
- Step 1: Choose partner type (Referral / Care Partner / Residential Partner)
- Step 2: Basic contact info (existing fields)
- Step 3: Organization details (conditional - for Care/Residential)
- Step 4: Payout information (existing fields)
- Step 5: Account creation

New form fields based on partner type:
- **Care Partners**: Organization type, registration number, website, estimated monthly referrals
- **Residential Partners**: Organization type, facility address, resident count, alert visibility preference

### 2. Partner Settings Updates

**File: `src/pages/partner/PartnerSettingsPage.tsx`**

Add new sections:
- Organization Details card (for Care/Residential partners)
- Facility Information card (for Residential partners)
- Alert Preferences card (for Residential partners with alert visibility enabled)

### 3. New Partner Member Management Page

**New File: `src/pages/partner/PartnerMembersPage.tsx`**

For Care/Residential partners to view and manage their associated members:
- List of members with relationship type
- Add member (staff feature) / view member details
- For Residential: alert subscription toggle per member
- Export functionality

### 4. Partner Alerts Dashboard

**New File: `src/pages/partner/PartnerAlertsPage.tsx`**

For Residential partners with alert visibility:
- Real-time alert feed for subscribed members
- Alert history with filters
- Acknowledge alert button
- Member status overview

### 5. Admin Partner Detail Updates

**File: `src/pages/admin/PartnerDetailPage.tsx`**

Add new tabs:
- **Organization Tab**: View/edit organization details, partner type
- **Members Tab**: Manage partner_members relationships
- **Pricing Tab**: Configure custom pricing tiers
- **Alerts Tab**: View alert notification history (for Residential partners)

### 6. Admin Add Partner Updates

**File: `src/pages/admin/AddPartnerPage.tsx`**

Add fields for:
- Partner type selection
- Organization type and details
- Facility information (for Residential)
- Alert visibility toggle
- Initial pricing tier setup

---

## Edge Function Changes

### 1. Update Partner Registration

**File: `supabase/functions/partner-register/index.ts`**

Accept new fields:
- `partner_type`
- `organization_type`
- `organization_registration`
- `organization_website`
- `estimated_monthly_referrals`
- `facility_address`
- `facility_resident_count`

### 2. Update Admin Partner Create

**File: `supabase/functions/partner-admin-create/index.ts`**

Accept same new fields as above, plus:
- `billing_model`
- `custom_rate_monthly`
- Initial pricing tier data

### 3. New Edge Function: Partner Alert Notifications

**New File: `supabase/functions/partner-alert-notify/index.ts`**

Triggered when an alert is created:
1. Find partner_alert_subscriptions for the member
2. For each subscription, check partner's alert_visibility_enabled
3. Send notification via email/SMS based on preferences
4. Log to partner_alert_notifications

---

## Hooks and API

### New Hooks

| Hook | Purpose |
|------|---------|
| `usePartnerMembers.ts` | CRUD for partner_members table |
| `usePartnerPricing.ts` | CRUD for partner_pricing_tiers table |
| `usePartnerAlertSubscriptions.ts` | Manage alert subscriptions |
| `usePartnerAlertNotifications.ts` | View alert notification history |

### Updated Hooks

| Hook | Changes |
|------|---------|
| `usePartnerData.ts` | Include new fields in queries |
| `usePartnerStats.ts` | Add member count for Care/Residential partners |

---

## Navigation Updates

### Partner Sidebar

Add new items for Care/Residential partners:
- "My Members" link (visible for Care/Residential partners)
- "Alerts" link (visible for Residential partners with alert_visibility_enabled)

**File: `src/components/layout/PartnerSidebar.tsx` or `PartnerLayout.tsx`**

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/partner/PartnerMembersPage.tsx` | Member management for Care/Residential |
| `src/pages/partner/PartnerAlertsPage.tsx` | Alert visibility for Residential |
| `src/hooks/usePartnerMembers.ts` | Hook for partner_members operations |
| `src/hooks/usePartnerPricing.ts` | Hook for pricing tier operations |
| `src/hooks/usePartnerAlertSubscriptions.ts` | Hook for alert subscriptions |
| `src/hooks/usePartnerAlertNotifications.ts` | Hook for alert notifications |
| `src/components/partner/PartnerTypeSelector.tsx` | Partner type selection component |
| `src/components/partner/OrganizationDetailsForm.tsx` | Organization details form |
| `src/components/partner/FacilityDetailsForm.tsx` | Facility details form (Residential) |
| `src/components/partner/MemberList.tsx` | Member list component |
| `src/components/partner/AlertFeed.tsx` | Alert feed component |
| `src/components/admin/partner/PartnerOrganizationTab.tsx` | Admin org details tab |
| `src/components/admin/partner/PartnerMembersTab.tsx` | Admin members tab |
| `src/components/admin/partner/PartnerPricingTab.tsx` | Admin pricing tab |
| `supabase/functions/partner-alert-notify/index.ts` | Alert notification edge function |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/partner/PartnerJoin.tsx` | Add partner type selection, multi-step flow |
| `src/pages/partner/PartnerSettingsPage.tsx` | Add organization & facility sections |
| `src/pages/admin/AddPartnerPage.tsx` | Add new B2B fields |
| `src/pages/admin/PartnerDetailPage.tsx` | Add new tabs |
| `src/pages/admin/PartnersPage.tsx` | Add partner type filter |
| `src/hooks/usePartnerData.ts` | Include new fields |
| `supabase/functions/partner-register/index.ts` | Accept new fields |
| `supabase/functions/partner-admin-create/index.ts` | Accept new fields |
| `src/components/layout/PartnerLayout.tsx` | Add new sidebar items |
| `src/App.tsx` | Add new routes |
| `src/i18n/locales/en.json` | Add translations |
| `src/i18n/locales/es.json` | Add translations |

---

## Implementation Phases

### Phase 1: Database Schema (Migration)
1. Add new columns to partners table
2. Create partner_members table
3. Create partner_pricing_tiers table
4. Create partner_alert_subscriptions table
5. Create partner_alert_notifications table
6. Set up RLS policies

### Phase 2: Backend (Edge Functions)
1. Update partner-register to accept new fields
2. Update partner-admin-create to accept new fields
3. Create partner-alert-notify edge function

### Phase 3: Hooks & Types
1. Create new hooks for new tables
2. Update existing hooks for new fields
3. TypeScript types will auto-update from migration

### Phase 4: Admin UI
1. Update AddPartnerPage with B2B fields
2. Update PartnerDetailPage with new tabs
3. Update PartnersPage with type filter

### Phase 5: Partner UI
1. Update PartnerJoin with type selection
2. Update PartnerSettingsPage with org details
3. Create PartnerMembersPage
4. Create PartnerAlertsPage
5. Update navigation/layout

### Phase 6: Integration
1. Wire up alert notifications trigger
2. Test pricing tier application on registration
3. End-to-end testing

---

## Summary

This upgrade transforms the partner system from a simple referral program into a comprehensive B2B platform supporting:

- **Referral Partners**: Individual affiliates (existing functionality preserved)
- **Care Partners**: Agencies and charities with organization details and volume tracking
- **Residential Partners**: Care homes and urbanizations with member management, custom pricing, and alert visibility

All changes are additive - existing partner functionality is preserved with new fields defaulting to maintain backward compatibility.

