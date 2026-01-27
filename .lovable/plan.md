

# Add Pendant Requirement to All AI-Generated Images

## Problem Statement

Currently, the AI image generation prompts only mention the ICE Alarm pendant in the `pendant_focus` style. For effective product marketing, **every generated image should show the pendant** around the person's neck (or a similar visible representation) to reinforce brand recognition and product awareness.

## Solution

Update the edge function prompts to include a **mandatory pendant requirement** in all image styles, ensuring the SOS pendant device is always visible in the generated imagery.

## Implementation

### Update Edge Function Prompts

**File:** `supabase/functions/generate-ai-image/index.ts`

**Changes:**

1. Update each style description to explicitly include the pendant
2. Add a **global pendant requirement** in the `CRITICAL Requirements` section

**Updated `IMAGE_STYLES` (lines 10-17):**

```typescript
const IMAGE_STYLES: Record<string, string> = {
  senior_active: "A happy, healthy senior (65-75 years old) wearing an ICE Alarm SOS pendant around their neck, enjoying outdoor activities in a sunny Spanish Mediterranean setting. The pendant should be clearly visible on a lanyard or chain. The person is active, smiling, and full of life. Warm golden sunlight, terrace or garden background. Professional lifestyle photography, warm and inviting atmosphere.",
  
  family_peace: "A caring adult child (40-50 years) sharing a warm, loving moment with their elderly parent (70-80 years) who is wearing an ICE Alarm SOS pendant visibly around their neck. Mediterranean home setting with soft natural light. The pendant provides a subtle but reassuring presence. Emotional connection, reassuring and heartfelt. Professional family photography style.",
  
  pendant_focus: "A modern, sleek ICE Alarm SOS emergency pendant device worn prominently around the neck of an active, well-dressed senior. The pendant is the focal point - clearly visible on a professional lanyard or elegant chain. Lifestyle context showing independence and confidence. Clean, professional product-lifestyle photography.",
  
  spanish_lifestyle: "Happy seniors enjoying the beautiful Spanish Mediterranean lifestyle, with one or more wearing a visible ICE Alarm SOS pendant around their neck. Terrace with sea views, garden with olive trees, or charming Spanish courtyard. The pendant is naturally integrated into their outfit. Warm golden hour light, relaxed and content atmosphere. Professional travel-lifestyle photography.",
  
  independence: "A confident, independent senior (70s) wearing an ICE Alarm SOS pendant around their neck, going about daily activities with a smile - walking in a park, reading in a café, or gardening. The pendant is clearly visible, symbolizing their freedom and safety. Empowering imagery showing active aging. Natural light, authentic moments. Professional documentary-style photography.",
  
  peace_of_mind: "A serene scene showing a senior couple or individual relaxing safely at home in Spain, with the ICE Alarm SOS pendant visible around their neck. Comfortable living room or sunny balcony. The pendant provides a sense of security and contentment. Soft, warm lighting. Professional interior-lifestyle photography.",
};
```

2. **Update CRITICAL Requirements section (lines 39-50):**

Add a mandatory pendant requirement to the global requirements:

```typescript
const requirements = `

CRITICAL Requirements:
- Professional photography quality, sharp and well-composed
- Warm, caring, and reassuring emotional tone
- THE PERSON MUST BE WEARING A VISIBLE SOS/EMERGENCY PENDANT around their neck on a lanyard or chain - this is MANDATORY
- The pendant should be a small, sleek, modern emergency device (similar to a medical alert pendant)
- DO NOT include any text, logos, or overlays in the image
- Suitable for Facebook marketing (1200x630 landscape)
- Natural, authentic representation of seniors
- Avoid clinical, hospital, or medical settings
- Focus on independence, dignity, peace of mind, and active living
- Use warm Mediterranean color palette (golden light, blue skies, terracotta)
- Include diverse but authentic representation`;
```

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-ai-image/index.ts` | Update all 6 style prompts to mention pendant + add global mandatory pendant requirement |

## Expected Result

After this change:
- **Every AI-generated image** will show a person wearing the ICE Alarm SOS pendant
- The pendant will be naturally integrated into the scene (not forced or awkward)
- Brand/product visibility will be consistent across all marketing materials
- Different styles will still have their unique character, but all include the product

## Prompt Engineering Notes

The prompts use specific language to guide the AI:
- "wearing an ICE Alarm SOS pendant around their neck" - explicit product placement
- "clearly visible" / "visibly" - ensures the pendant isn't hidden
- "lanyard or chain" - gives realistic wearing context
- "naturally integrated" / "subtle but reassuring" - prevents awkward forced placement
- CRITICAL section emphasizes it's MANDATORY with caps for emphasis to the AI model

