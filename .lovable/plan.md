

## Plan: Hero Text Trim + "Why Families Choose" Visual Upgrade

### 1. Hero section — remove the sentence
**Files**: `src/i18n/locales/en.json` (line 644) and `es.json` (line 644)

Remove "She knows your name, your location, and exactly how to get you help." from `heroDescription` in both languages. The description will end at "…responds in seconds — in English or Spanish."

### 2. "Why Families Choose ICE Alarm" — visual upgrade

**File**: `src/pages/LandingPage.tsx` (lines 230-290)

Replace the current 4-column grid of plain Cards with a more visually engaging layout:

- **Layout**: Keep the 4-column grid on desktop but make each card more dynamic
- **Card style**: Replace flat bordered cards with gradient-accented cards — each gets a subtle top-border gradient in the brand coral color, a larger icon area with a soft glowing background circle, and a hover lift effect (`hover:-translate-y-1 transition-transform`)
- **Icon treatment**: Increase icon container to 16×16 with a double-ring effect (outer ring faded, inner solid) to give depth
- **Typography**: Make the feature title slightly larger (`text-xl`) and add a small decorative divider line between title and description
- **Description text**: Keep ALL existing text — no content removed, just styled with slightly more line-height for readability
- **Subtle numbering**: Add a faded large number (01-04) in the background corner of each card for visual interest
- **Section header**: Add a small coral pill/badge above the "Why Families Choose" heading (e.g. "Our Difference") for visual hierarchy, matching the hero badge pattern

All existing translation keys and content remain untouched — this is purely a visual/structural upgrade to the card rendering.

### Files to change
| File | Change |
|------|--------|
| `src/i18n/locales/en.json` | Trim `heroDescription` |
| `src/i18n/locales/es.json` | Trim `heroDescription` |
| `src/pages/LandingPage.tsx` | Redesign features section cards |

