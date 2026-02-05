

# Enable Logo Upload & Create ICE Alarm España Logo

## Overview

Currently the Brand Rules section shows the logo as locked/read-only. We'll make it editable so you can upload or change the logo, then use AI to generate a professional ICE Alarm España logo.

---

## What Will Change

### 1. Make Logo Editable in Settings

The Settings tab will get a logo upload area where you can:
- Click to upload a new logo image
- See a preview of the current logo
- Remove the logo if needed

### 2. Create ICE Alarm España Logo

Using Lovable AI image generation, we'll create a professional logo featuring:
- The ICE Alarm España brand name
- Healthcare/safety theme (red cross, shield, or similar)
- Clean, modern design suitable for video overlays
- Saved as JPEG for universal compatibility

### 3. Store Logo in Cloud Storage

The logo will be stored in the `website-images` storage bucket (already exists) and the URL saved to `video_brand_settings.logo_url`.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/admin/video-hub/VideoSettingsTab.tsx` | Add logo upload functionality with preview and remove button |
| `src/hooks/useVideoBrandSettings.ts` | Add `logo_url` to the `UpdateSettingsData` interface |
| Database | Update `video_brand_settings.logo_url` with the generated logo URL |

---

## Technical Details

### Logo Upload Flow

```text
User clicks upload → File picker opens → 
Image uploaded to storage bucket → 
URL saved to video_brand_settings.logo_url → 
Logo displays in Settings and on videos
```

### AI Logo Generation

Using `google/gemini-2.5-flash-image` model:
- Prompt: Professional logo for "ICE Alarm España" emergency medical alert service
- Style: Clean, minimal, healthcare-themed
- Output: JPEG image uploaded to storage

### Storage Bucket

Using existing `website-images` bucket which already has public access configured.

---

## UI Changes

The Brand Rules card will change from:
- **Before**: Read-only display with lock icon, just shows placeholder text
- **After**: Editable with upload button, current logo preview, and remove option

The lock icon and "locked" messaging will be removed from the logo section while keeping colors and fonts read-only (as those are true brand standards).

