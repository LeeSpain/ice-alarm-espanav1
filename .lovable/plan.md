

# Replace Legal Pages with Professional Content

## Overview

Replace the existing placeholder Terms of Service and Privacy Policy page content with the comprehensive, professionally written legal documents you've uploaded. The page layout (header, footer, back button, styling) stays the same -- only the body content changes.

## Changes

### 1. `src/pages/TermsPage.tsx`
Replace all hardcoded section content with the full 20-section Terms of Service document, including:
- Agreement to Terms, Who We Are, Description of Services
- Important Limitations & Disclaimers (technology, response time, AI assistant)
- Eligibility, Account, Devices & Equipment
- Subscription & Payment (Stripe, refunds, non-payment)
- Cancellation & Termination (cooling-off period)
- Limitation of Liability (with bold caps formatting preserved)
- Indemnification, Intellectual Property, Privacy, Communications
- Modifications, Dispute Resolution, General Provisions
- Contact Us, Acknowledgment

Special formatting will be preserved: bold/caps warnings, nested lists, sub-sections (e.g. 3.1, 3.2).

### 2. `src/pages/PrivacyPage.tsx`
Replace all hardcoded section content with the full 16-section Privacy Policy document, including:
- Who We Are, What This Policy Covers
- Data We Collect (with sub-categories: account, health, emergency contacts, payment, device, usage, communications, third parties)
- Legal Basis table (GDPR Article 6 references)
- How We Use Your Data (emergency response, AI-assisted, administration)
- Who We Share Data With (provider table with locations and safeguards)
- International Data Transfers
- Data Retention table (with specific periods per data type)
- Your Rights (access, rectification, erasure, restriction, portability, object, withdraw consent)
- Data Security, Children's Privacy, Automated Decision-Making
- Cookies, Changes, Complaints (AEPD details), Contact

Tables will be rendered as styled HTML tables for the provider list and data retention schedules.

## What Stays the Same
- Page layout structure (header with logo, language selector, sign-in button)
- Back button navigation
- Document header icon and title area
- Prose styling classes
- Footer with copyright and links
- Last updated date reference via translation key

## Files Changed

| File | Action |
|------|--------|
| `src/pages/TermsPage.tsx` | Rewrite body content with full Terms document |
| `src/pages/PrivacyPage.tsx` | Rewrite body content with full Privacy Policy document |

No database changes, no new files, no new dependencies.
