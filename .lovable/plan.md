

# Upgrade Image Generation to AI-Powered Professional Images

## Current State Analysis

The existing `useBrandedImageGenerator.ts` uses **Canvas API** to programmatically draw images:
- Creates gradient backgrounds with brand colors
- Draws geometric shapes (corner accents)
- Renders text overlay (headline, subheadline, CTA button)
- Adds brand logo representation (simple heart icon)

**Limitations:**
- No photographic elements - purely text and shapes
- Cannot show people, products, or realistic scenarios
- Generic, template-like appearance
- Not competitive with professional social media imagery

## Proposed Solution

Replace the canvas-based generator with **Lovable AI Image Generation** using `google/gemini-3-pro-image-preview` (higher quality) or `google/gemini-2.5-flash-image` (faster). This allows generating:

- **Realistic photos** of seniors using the pendant
- **Professional lifestyle imagery** (people walking, in gardens, with family)
- **Contextual scenes** (Spanish settings, homes, outdoor activities)
- **Brand-consistent visuals** with proper text overlay

## Architecture

```text
+-------------------+     +------------------------+     +------------------+
|  Media Manager    | --> |  generate-ai-image     | --> |  Lovable AI      |
|  (Frontend)       |     |  (Edge Function)       |     |  Gateway         |
+-------------------+     +------------------------+     +------------------+
        |                           |                            |
        |  1. Send prompt +         |  2. Call Gemini            |  3. Return
        |     image_text            |     Image Model            |     base64
        |                           |                            |
        v                           v                            v
+-------------------+     +------------------------+     +------------------+
|  Image displayed  | <-- |  Upload to Storage     | <-- |  Generated Image |
|  in draft         |     |  Return public URL     |     |  (base64)        |
+-------------------+     +------------------------+     +------------------+
```

## Implementation Steps

### Step 1: Create New Edge Function for AI Image Generation
**File:** `supabase/functions/generate-ai-image/index.ts`

This function will:
1. Accept the post context (topic, goal, audience, image_text suggestions)
2. Build a detailed image generation prompt
3. Call Lovable AI with the image model
4. Convert the base64 response to a file
5. Upload to Supabase Storage
6. Return the public URL

**Key prompt engineering:**
- Include ICE Alarm brand context
- Request realistic photography style
- Specify elderly/senior-friendly imagery
- Include Spanish/Mediterranean settings when appropriate
- Request warm, reassuring tones (not clinical)

### Step 2: Create AI Image Generation Hook
**File:** `src/hooks/useAIImageGenerator.ts`

A new React hook that:
- Calls the `generate-ai-image` edge function
- Manages loading/error states
- Returns the generated image URL
- Provides retry capability

### Step 3: Update MediaManagerPage
**File:** `src/pages/admin/MediaManagerPage.tsx`

Add a new "Generate AI Image" button alongside the existing one:
- Keep the current canvas-based generator as "Quick Brand Image" (faster, no AI credits)
- Add new "Generate Realistic Image" button (AI-powered)
- Show image style selector (e.g., "Senior with pendant", "Family scene", "Spanish lifestyle")

### Step 4: Add Image Style Templates
Create predefined prompt templates for common scenarios:

| Style | Prompt Focus |
|-------|-------------|
| `senior_active` | Happy senior actively enjoying life outdoors in Spain |
| `family_peace` | Adult child hugging elderly parent, showing care and connection |
| `pendant_focus` | Close-up of pendant device being worn, modern technology |
| `spanish_lifestyle` | Mediterranean setting, terrace, garden, sunshine |
| `independence` | Senior confidently going about daily activities alone |

### Step 5: Add Translation Keys
**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/es.json`

New keys for:
- Image generation options
- Style selector labels
- Loading/error states

## Technical Details

### Edge Function Implementation

```typescript
// supabase/functions/generate-ai-image/index.ts

const IMAGE_STYLES = {
  senior_active: "A happy, healthy senior (65-75 years old) enjoying outdoor activities in a sunny Spanish setting. Warm and inviting atmosphere. Professional photography style.",
  family_peace: "A caring adult child (40-50 years) with their elderly parent (70-80 years) sharing a warm moment. Mediterranean home setting. Emotional and reassuring.",
  pendant_focus: "A modern, sleek emergency pendant device worn around the neck of an active senior. Focus on the device with lifestyle context. Clean, professional product photography.",
  spanish_lifestyle: "Seniors enjoying the Spanish Mediterranean lifestyle - terrace, garden, coastal views. Warm golden light, relaxed and happy atmosphere.",
  independence: "A confident senior (70s) going about daily activities independently - shopping, walking, gardening. Empowering and positive imagery.",
};

// Image generation prompt builder
function buildImagePrompt(style: string, imageText: ImageText, topic: string): string {
  const baseContext = `Create a professional, high-quality social media image for ICE Alarm España, a 24/7 emergency response service for seniors in Spain.`;
  
  const stylePrompt = IMAGE_STYLES[style] || IMAGE_STYLES.senior_active;
  
  const requirements = `
    Requirements:
    - Professional photography quality
    - Warm, caring, and reassuring tone
    - NO text overlays (text will be added separately)
    - Suitable for Facebook marketing
    - Aspect ratio: 1200x630 (landscape)
    - Include diverse representation when showing people
    - Avoid clinical or medical settings
    - Focus on independence, peace of mind, and active living
  `;
  
  return `${baseContext}\n\nTopic: ${topic}\nStyle: ${stylePrompt}\n${requirements}`;
}
```

### Frontend Integration

```typescript
// In MediaManagerPage.tsx - new button group
<div className="grid grid-cols-3 gap-2">
  <Button onClick={generateQuickBrandImage}>
    <ImageIcon /> Quick Brand Image
  </Button>
  <Select value={imageStyle} onValueChange={setImageStyle}>
    <SelectItem value="senior_active">Active Senior</SelectItem>
    <SelectItem value="family_peace">Family Moment</SelectItem>
    <SelectItem value="spanish_lifestyle">Spanish Lifestyle</SelectItem>
  </Select>
  <Button onClick={generateAIImage} disabled={isGeneratingAI}>
    <Sparkles /> Generate AI Image
  </Button>
</div>
```

### Text Overlay Option

After generating the AI image, offer an optional text overlay:
- Use the existing canvas logic to add brand elements
- Overlay headline/subheadline on top of the AI-generated photo
- This combines realistic imagery with branded messaging

## Files to Create

| File | Description |
|------|-------------|
| `supabase/functions/generate-ai-image/index.ts` | Edge function for AI image generation |
| `src/hooks/useAIImageGenerator.ts` | React hook for calling the edge function |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/MediaManagerPage.tsx` | Add AI image generation UI, style selector |
| `src/hooks/useBrandedImageGenerator.ts` | Add optional text overlay on existing images |
| `src/i18n/locales/en.json` | New translation keys |
| `src/i18n/locales/es.json` | Spanish translations |
| `supabase/config.toml` | Register new edge function |

## UX Flow

1. User creates a post with topic, goal, and audience
2. User runs AI workflow to generate text suggestions (existing)
3. User selects an image style from the dropdown
4. User clicks "Generate AI Image" button
5. Edge function generates a realistic image using Lovable AI
6. Image is uploaded to storage and displayed in preview
7. (Optional) User can click "Add Brand Overlay" to add text on top

## Cost Considerations

- AI image generation uses Lovable AI credits
- Suggest using `google/gemini-3-pro-image-preview` for higher quality (slower, more expensive)
- Alternatively, `google/gemini-2.5-flash-image` for faster generation (lower cost)
- Keep the canvas-based generator as a free/fast fallback option

## Quality Assurance

The AI image generation prompt includes:
- Compliance with brand guidelines
- Avoidance of medical/clinical imagery
- Focus on positive, empowering visuals
- Diversity requirements
- Professional photography standards

