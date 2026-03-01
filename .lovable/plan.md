

## Help & Support Page — Complete Upgrade

### Current State

The member dashboard's **SupportPage.tsx** has three tabs:
1. **AI Assistant** — inline AI chat (works well, keep as-is)
2. **Messages** — conversation threading with support team (works well, keep as-is)
3. **Help Center** — only 6 hardcoded FAQ items, plain accordion, no search, no categorization, no links to the documentation articles already in the database

**Additional issues found:**
- Phone number is still visible on lines 509 and 748 (missed in earlier fix)
- FAQ content is shallow — doesn't cover billing, subscription, dashboard usage, privacy, etc.
- No way for members to search FAQs
- No connection to the `documentation` table which has rich `member_guide` and `general` articles already published

---

### Plan

#### 1. Fix remaining visible phone numbers (SupportPage.tsx)

- **Line 509**: Replace `{companySettings.emergency_phone}` with `{t("common.callNow")}`
- **Line 748**: Replace `{companySettings.emergency_phone}` with `{t("support.tapToCall", "Tap to call")}` or similar label

#### 2. Expand hardcoded FAQ from 6 to ~16 items, organized by category

Add new FAQ items covering real member scenarios:

**Device & Pendant** (existing 4 + 2 new):
- "How do I charge my pendant?" 
- "What if my pendant gets wet?"

**My Account** (new category):
- "How do I change my password?"
- "How do I update my address?"
- "How do I view my subscription details?"

**Billing & Payments** (new category):
- "How do I update my payment method?"
- "When am I billed each month?"
- "How do I cancel my subscription?"

**Safety & Privacy** (new category):
- "Who can see my medical information?"
- "How is my location data used?"

All with full bilingual translations in `en.json` and `es.json`.

#### 3. Redesign Help Center tab with categories, search, and knowledge base integration

Replace the current simple accordion with a professional layout:

- **Search bar** at top to filter FAQs instantly
- **Category pills** (All, Device, Account, Billing, Safety) to filter
- **Hardcoded FAQ accordion** grouped by category with icons
- **Knowledge Base section** below the FAQ — pull `member_guide` and `general` articles from the `documentation` table, displayed as expandable cards (reuse the pattern from `KnowledgeBasePage.tsx`)
- **"Still need help?"** card linking to AI chat tab and message creation

#### 4. Visual polish for elderly users

- Larger accordion trigger text (text-base instead of default)
- Category badges with icons for visual scanning
- Subtle colored section headers
- Keep large touch targets (min 48px) per client dashboard standards
- Smooth transitions between filtered views

### Files to Change

| File | Changes |
|------|---------|
| `src/pages/client/SupportPage.tsx` | Fix phone numbers, redesign Help tab with search/categories/KB integration, expand FAQ array |
| `src/i18n/locales/en.json` | Add ~10 new FAQ entries, category labels, search placeholder, "tap to call" |
| `src/i18n/locales/es.json` | Mirror all new translations in Spanish |

### Technical Notes

- The `documentation` table uses category `member_guide` (not `user_guide`) — the query will filter for `member_guide` and `general` categories
- FAQ items remain hardcoded in the component for instant load and offline resilience; DB articles supplement them as a "Learn More" section
- No database or schema changes needed
- The `InlineAIChat` component and Messages tab remain unchanged

