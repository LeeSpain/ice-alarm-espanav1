
# Complete Review: Partner Share Distribution Feature

## Overview
After a thorough review of all the code changes for the Partner Share Distribution feature, I've identified several issues that need to be fixed for the feature to work 100%.

---

## Issues Found

### 1. **CRITICAL: Referral Data Storage Mismatch**
The tracked link redirect and the join wizard use different localStorage keys.

**Problem:**
- `ReferralRedirect.tsx` stores data in: `localStorage.setItem("partner_referral", JSON.stringify({ref_partner_id, ref_post_id, ...}))`
- `crmEvents.ts` reads from: `localStorage.getItem("partner_ref")` (a different key!)

**Impact:** When a user clicks a tracked partner link (`/r/ABC123/post-slug`) and then registers, the `refPostId` is never retrieved and passed to the `submit-registration` function, so post-specific attribution won't work.

**Files to fix:**
- `src/lib/crmEvents.ts` - Update `getStoredReferralData()` to also check `partner_referral` localStorage key
- `src/components/join/steps/JoinPaymentStep.tsx` - Pass `refPostId` to submit-registration

---

### 2. **CRITICAL: refPostId Not Passed to submit-registration**
The payment step calls submit-registration but doesn't include the `refPostId` parameter.

**Current code (line 41):**
```typescript
body: { ..., partnerRef, utmParams }
```

**Should be:**
```typescript
body: { ..., partnerRef, utmParams, refPostId }
```

---

### 3. **UI Issue: PartnerDistributionSection Not Visible in Media Manager**
After verifying the code, the PartnerDistributionSection IS correctly imported and rendered in MediaManagerPage.tsx (lines 582-591). This appears correct.

---

### 4. **Schema and Database - VERIFIED ✓**
- `partner_post_links` table exists with correct columns
- `partner_clicks` table exists with correct columns  
- `social_posts` has partner distribution columns (`partner_enabled`, `partner_audience`, etc.)
- Unique constraint on `(post_id, partner_id)` exists for upsert
- RLS policies are configured for staff and partners

---

### 5. **Edge Functions - VERIFIED ✓**
- `facebook-publish/index.ts` correctly generates partner links on publish
- `track-referral-click/index.ts` correctly increments clicks and records click data
- `submit-registration/index.ts` has logic to increment signups (but needs refPostId to be passed)

---

### 6. **Translations - VERIFIED ✓**
Both `en.json` and `es.json` have complete translations for:
- `mediaManager.partnerDistribution.*`
- `partner.share.*`

---

### 7. **Partner Dashboard Share Tab - VERIFIED ✓**
- `ShareContentSection.tsx` correctly displays shareable posts
- `PartnerDashboard.tsx` has tabs for overview and share content
- `usePartnerShareableContent` hook filters for published posts with active links

---

## Implementation Plan

### Part A: Fix getStoredReferralData() in crmEvents.ts
Update the function to check both storage locations:
1. First check `partner_referral` (set by tracked links)
2. Fall back to `partner_ref` (set by regular referral URLs)
3. Extract `ref_post_id` from the partner_referral data

### Part B: Fix JoinPaymentStep.tsx
Update both payment handlers to pass `refPostId`:
1. In `handlePayWithStripe()` - add refPostId to body
2. In `handleTestModeComplete()` - add refPostId to body

---

## Technical Details

### Updated getStoredReferralData Function
```typescript
export function getStoredReferralData(): {
  referralCode: string | null;
  refPostId: string | null;
  utmParams: Record<string, string>;
} {
  // First, check for tracked link referral (partner_referral)
  const trackedReferral = localStorage.getItem("partner_referral");
  if (trackedReferral) {
    try {
      const data = JSON.parse(trackedReferral);
      // Check if not expired
      if (data.ref_expires && data.ref_expires > Date.now()) {
        return {
          referralCode: data.ref_partner_code || null,
          refPostId: data.ref_post_id || null,
          utmParams: {},
        };
      }
    } catch (e) {
      console.error("Failed to parse tracked referral:", e);
    }
  }
  
  // Fall back to regular referral (partner_ref)
  const referralCode = localStorage.getItem("partner_ref");
  let utmParams: Record<string, string> = {};
  
  const utmJson = localStorage.getItem("partner_utm");
  if (utmJson) {
    try {
      utmParams = JSON.parse(utmJson);
    } catch (e) {
      console.error("Failed to parse UTM data:", e);
    }
  }
  
  return { referralCode, refPostId: null, utmParams };
}
```

### Updated clearReferralData Function
```typescript
export function clearReferralData(): void {
  localStorage.removeItem("partner_ref");
  localStorage.removeItem("partner_utm");
  localStorage.removeItem("partner_referral"); // Also clear tracked link data
}
```

### JoinPaymentStep Changes
Both handlers need to extract and pass refPostId:
```typescript
const { referralCode: partnerRef, refPostId, utmParams } = getStoredReferralData();
// ... in body:
body: { ..., partnerRef, refPostId, utmParams }
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/crmEvents.ts` | Update `getStoredReferralData()` to check both storage keys and return `refPostId`; update `clearReferralData()` to clear both |
| `src/components/join/steps/JoinPaymentStep.tsx` | Extract `refPostId` and pass to submit-registration in both handlers |

---

## Testing Plan

1. **Tracked Link Flow:**
   - Visit `/r/PARTNERCODE/post-slug`
   - Verify redirect to blog/home
   - Check localStorage has `partner_referral` with post ID
   - Complete registration
   - Verify `partner_post_links.signups` increments
   - Verify member has `ref_partner_id` and `ref_post_id`

2. **Regular Referral Flow:**
   - Visit `/?ref=PARTNERCODE`
   - Complete registration
   - Verify partner attribution created

3. **Admin Media Manager:**
   - Create draft with Partner Distribution enabled
   - Approve and publish
   - Verify `partner_post_links` records created

4. **Partner Dashboard:**
   - Log in as partner
   - Go to Share Content tab
   - Verify published posts appear with tracked links
   - Copy link and verify it works

---

## Summary
The feature is 95% complete. The main issues are:
1. localStorage key mismatch between tracked link storage and join wizard retrieval
2. refPostId not being passed to submit-registration

Once these two fixes are applied, the Partner Share Distribution feature will work end-to-end with proper click tracking and signup attribution.
