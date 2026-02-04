
# Media Manager - Enhanced Content Variety & Image Diversity

## Problem Analysis

Based on my review of your current implementation, I've identified two key issues:

### 1. Repetitive AI-Written Content
The current `media-draft` edge function uses a **static system prompt** with:
- Fixed messaging themes (only 6 approved themes)
- Same tone/style instructions every time
- No randomization or variety mechanisms
- Limited creative direction for different post types

### 2. Similar-Looking Images
The `generate-ai-image` function has:
- Only 6 fixed image style templates
- Very similar prompts with the same camera angles, lighting, and compositions
- No variety modifiers for scene, time of day, subjects, or settings
- All images end up with the same "golden Mediterranean light" look

---

## Solution Overview

I'll implement a **Variety Engine** that introduces controlled randomization while maintaining brand consistency.

### Content Improvements
1. **Writing Style Variations** - Add tone modifiers (heartfelt, informative, celebratory, conversational)
2. **Post Format Templates** - Different structures (story, question, statistic, testimonial-style, tip list)
3. **Hook Library** - Randomized opening lines that grab attention
4. **Seasonal/Contextual Awareness** - Time-appropriate content angles

### Image Improvements
1. **Expanded Style Variations** - Add sub-variations within each style category
2. **Scene Randomization** - Different locations, times of day, weather, activities
3. **Subject Diversity** - Varied ages (65-85), ethnicities, gender combinations
4. **Composition Variety** - Different camera angles, framing, focal points

---

## Implementation Plan

### Step 1: Enhanced `media-draft` Edge Function

**File**: `supabase/functions/media-draft/index.ts`

Add variety mechanisms to the content generation:

```typescript
// NEW: Writing tone variations (randomly selected)
const WRITING_TONES = [
  "heartfelt and emotional - focus on family connections",
  "informative and educational - share valuable tips",
  "conversational and friendly - like chatting with a neighbor",
  "celebratory and positive - highlight independence and joy",
  "reassuring and calm - address common concerns gently",
  "inspiring and motivational - encourage active aging"
];

// NEW: Post format templates
const POST_FORMATS = [
  "story_format: Start with 'Imagine...' or 'Picture this...' and tell a brief scenario",
  "question_hook: Open with a thought-provoking question that resonates with the audience",
  "statistic_lead: Lead with a compelling statistic about seniors/safety in Spain",
  "tip_list: Present 2-3 quick, actionable tips in a numbered format",
  "testimonial_style: Write as if sharing a customer's experience (without naming)",
  "day_in_life: Describe a typical peaceful day with ICE Alarm providing background safety",
  "myth_buster: Address a common misconception about elderly care or emergency pendants"
];

// NEW: Seasonal hooks (based on current date)
const SEASONAL_HOOKS = {
  winter: ["staying safe during cooler months", "holiday family gatherings"],
  spring: ["enjoying outdoor activities", "gardening safely"],
  summer: ["beach safety", "staying active in the heat", "travel with peace of mind"],
  autumn: ["cozy indoor activities", "preparing for winter"]
};
```

The AI prompt will now include:
- A randomly selected **tone modifier**
- A randomly selected **post format**
- Seasonal context based on current date
- Instructions to **avoid** recently used phrases (anti-repetition)

### Step 2: Enhanced System Prompt with Variety Instructions

Update the `MEDIA_MANAGER_PROMPT` to include:

```text
## Creative Variety Instructions

For THIS specific post, use the following creative direction:
- **Writing Tone**: ${selectedTone}
- **Post Format**: ${selectedFormat}
- **Seasonal Context**: ${seasonalHook}

ANTI-REPETITION RULES:
- Do NOT use these overused phrases: "peace of mind", "24/7 support" in every post
- Vary your emoji placement and quantity (sometimes 0-2, sometimes 4-5)
- Use different CTA phrasing each time (examples: "Message us today", "Let's chat", "Get started", "Learn more")
- Vary hashtag count between 3-7
- Mix sentence lengths: combine short punchy lines with longer descriptive ones

CREATIVITY REQUIREMENTS:
- Include at least ONE unexpected or creative element (metaphor, question, mini-story)
- Vary paragraph structure (single block vs. broken into lines)
- Occasionally address the reader directly ("You deserve...", "Have you ever...")
```

### Step 3: Enhanced `generate-ai-image` Edge Function

**File**: `supabase/functions/generate-ai-image/index.ts`

Add image variety modifiers:

```typescript
// NEW: Scene variations for each location type
const LOCATION_VARIANTS = [
  "sunny terrace overlooking the Mediterranean sea",
  "charming courtyard with potted plants and tile work",
  "olive grove with dappled sunlight",
  "seaside promenade at golden hour",
  "traditional Spanish plaza with café tables",
  "colorful flower garden with stone walls",
  "rustic vineyard in Andalusia",
  "whitewashed village street in Costa Blanca",
  "modern apartment balcony with sea views",
  "peaceful park bench under pine trees"
];

// NEW: Time of day/lighting variations
const LIGHTING_VARIANTS = [
  "warm golden hour morning light, long soft shadows",
  "bright midday Spanish sun, vibrant colors",
  "soft overcast day, even gentle lighting",
  "late afternoon warmth, amber tones",
  "early morning mist with soft diffused light"
];

// NEW: Activity variations
const ACTIVITY_VARIANTS = [
  "enjoying a cup of coffee",
  "reading a book",
  "walking with a small dog",
  "tending to garden flowers",
  "playing cards or dominoes",
  "having lunch with friends",
  "doing gentle stretching exercises",
  "chatting on the phone with family",
  "painting or doing crafts",
  "watching the sunset"
];

// NEW: Subject demographic variations
const SUBJECT_VARIANTS = [
  "a cheerful woman in her early 70s with silver hair",
  "a distinguished gentleman in his late 60s",
  "a couple in their 70s, holding hands",
  "an elegant woman in her 80s, well-dressed",
  "a fit, active-looking man in his early 70s",
  "a grandmother-type figure with warm smile",
  "a stylish retired professional woman",
  "a friendly-looking widower in his 70s"
];

// NEW: Camera/composition variations
const COMPOSITION_VARIANTS = [
  "medium shot, subject centered, environmental context visible",
  "close-up portrait style, shallow depth of field",
  "wide establishing shot showing the beautiful setting",
  "candid moment, slightly off-center composition",
  "three-quarter view, natural interaction with environment"
];
```

The image prompt will now randomly select:
- 1 location variant
- 1 lighting variant
- 1 activity variant
- 1 subject variant
- 1 composition variant

This creates **thousands of unique combinations** instead of 6 fixed templates.

### Step 4: Add More Image Style Options

**File**: `src/hooks/useAIImageGenerator.ts`

Expand the image style options:

```typescript
export type ImageStyle = 
  | "senior_active" 
  | "family_peace" 
  | "pendant_focus" 
  | "spanish_lifestyle" 
  | "independence" 
  | "peace_of_mind"
  | "from_post_text"
  // NEW styles:
  | "social_connection"    // Friends meeting, community
  | "daily_routine"        // Morning coffee, reading, hobbies
  | "outdoor_adventure"    // Walking, beach, nature
  | "home_comfort"         // Cozy interiors, safe at home
  | "technology_simple"    // Easy tech, modern living
  | "surprise_me";         // Fully randomized
```

### Step 5: "Surprise Me" Randomization Mode

Add a special **"Surprise Me"** option that:
- Randomly picks a base style
- Applies random modifiers for location, lighting, activity, subject, and composition
- Guarantees every image is unique

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/media-draft/index.ts` | Add variety engine with tone/format/seasonal randomization |
| `supabase/functions/generate-ai-image/index.ts` | Add location/lighting/activity/subject/composition variants |
| `src/hooks/useAIImageGenerator.ts` | Add new image styles including "surprise_me" |
| `src/i18n/locales/en.json` | Add translations for new image styles |
| `src/i18n/locales/es.json` | Add Spanish translations for new styles |

---

## Technical Details

### Variety Selection Logic (Backend)

```typescript
function selectVariety<T>(array: T[]): T {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

// Build dynamic prompt with variety
const tone = selectVariety(WRITING_TONES);
const format = selectVariety(POST_FORMATS);
const season = getCurrentSeason();
const seasonalHooks = selectVariety(SEASONAL_HOOKS[season]);
```

### Image Prompt Construction (Example Output)

**Before (static):**
> "A happy senior wearing an ICE Alarm SOS pendant, enjoying outdoor activities in a sunny Spanish Mediterranean setting..."

**After (dynamic):**
> "A distinguished gentleman in his late 60s wearing an ICE Alarm SOS pendant around his neck, playing dominoes at a traditional Spanish plaza with café tables. Late afternoon warmth with amber tones. Candid moment, slightly off-center composition. Professional documentary-style photography..."

---

## Expected Results

### Content Variety
- Posts will have different **tones** (heartfelt vs informative vs celebratory)
- Different **formats** (questions vs stories vs tip lists)
- Different **CTAs** and **hashtag counts**
- Seasonal relevance

### Image Variety
- Different **locations** (terrace, plaza, garden, beach, village)
- Different **lighting** (morning, midday, golden hour, overcast)
- Different **activities** (reading, walking, gardening, socializing)
- Different **subjects** (varied ages 65-85, gender mix, couples/individuals)
- Different **compositions** (close-up, wide, candid, centered)

This creates **10,000+ unique combinations** while staying 100% on-brand with the warm, caring, trustworthy ICE Alarm voice.

---

## Preserved Brand Guardrails

All compliance rules remain unchanged:
- No medical guarantees
- Forbidden phrases still blocked
- CTAs always included
- Pendant visibility requirement for images
- Mediterranean warm color palette maintained
- Professional photography quality standard
