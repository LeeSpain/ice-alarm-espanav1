

## Hide Phone Numbers Across All Public Pages

The phone number is currently displayed as visible text in many places. The fix is to replace every visible `{companySettings.emergency_phone}` with a label like "Call Now" or "Call Us", while keeping the `tel:` link functional behind the scenes.

### Files to Change

**1. `src/pages/LandingPage.tsx`** (5 locations)
- **Line 132** — Hero button: `{companySettings.emergency_phone}` → `{t("common.callNow")}`
- **Line 595** — CTA section: `<strong>{companySettings.emergency_phone}</strong>` → a clickable "Call Now" link with `tel:` href
- **Line 613** — Footer contact list: `{companySettings.emergency_phone}` → clickable "Call Now" link
- **Line 649** — Contact dialog: remove the large phone number display `<p className="text-2xl ...">` entirely
- Lines 660-664 stay as-is (the "Phone Call" button already has a label, just links via `tel:`)

**2. `src/pages/PendantPage.tsx`** (4 locations)
- **Line 244** — Hero button: replace phone number text with "Call Now"
- **Line 542** — CTA button: same replacement
- **Line 565** — Footer: replace with clickable "Call Now" link

**3. `src/pages/ContactPage.tsx`** (2 locations)
- **Line 183** — Contact info card: replace visible phone with "Call Now" link
- Lines 109-111 already show "Call Now" label — no change needed

**4. `src/pages/client/DevicePage.tsx`** (1 location)
- **Line 95** — Large emergency number display: replace with "Call Now" text (keep `tel:` link)

**5. `src/pages/join/JoinWizard.tsx`** (1 location)
- **Line 452** — Footer help text: remove `{companySettings.emergency_phone}`, keep just "Call Us" as the link text

**6. `src/components/join/steps/JoinConfirmationStep.tsx`** (1 location)
- **Line 104** — Replace `{companySettings.emergency_phone}` with "Call Us" as link text

All `tel:` href links will continue to use `companySettings.emergency_phone` internally so calls still route correctly — only the visible text changes.

