

## Unified Header + Footer Links for Terms, Privacy, Knowledge Base

### Current State
- The landing page has a full header (logo, nav links, language selector, chat button, login, CTA) and a footer with a "Legal" section linking to Terms and Privacy.
- Terms, Privacy, and Knowledge Base pages each have their own different, simpler headers.
- Knowledge Base link is not in the footer.

### Plan

**1. Create shared `PublicHeader` component**
**New file**: `src/components/layout/PublicHeader.tsx`

Extract the landing page header (lines 65-109) into a reusable component. It will contain:
- Logo, desktop nav (How It Works, Pendant, Pricing, Partners, Contact), language selector, mobile nav, chat button, Member Login, Start Your Protection
- Anchor links use `/#how-it-works` and `/#pricing` format so they work from any page

**2. Replace inline headers in 5 pages**

| Page | Current header | Change |
|------|---------------|--------|
| `LandingPage.tsx` | Full nav (lines 65-109) | Replace with `<PublicHeader />` |
| `PendantPage.tsx` | Different nav links | Replace with `<PublicHeader />` |
| `ContactPage.tsx` | Different nav links | Replace with `<PublicHeader />` |
| `TermsPage.tsx` | Minimal (logo + sign in) | Replace with `<PublicHeader />` |
| `PrivacyPage.tsx` | Minimal (logo + sign in) | Replace with `<PublicHeader />` |
| `KnowledgeBasePage.tsx` | Different sticky style | Replace with `<PublicHeader />` |

**3. Add Knowledge Base to the landing page footer**

In the footer's "Legal" column (line 747-753), add a Knowledge Base / Help Center link (`/help`) alongside Terms and Privacy.

### Files changed
| File | Action |
|------|--------|
| `src/components/layout/PublicHeader.tsx` | **Create** |
| `src/pages/LandingPage.tsx` | Replace header, add help link to footer |
| `src/pages/PendantPage.tsx` | Replace header |
| `src/pages/ContactPage.tsx` | Replace header |
| `src/pages/TermsPage.tsx` | Replace header |
| `src/pages/PrivacyPage.tsx` | Replace header |
| `src/pages/KnowledgeBasePage.tsx` | Replace header |

