
# Video Hub Comprehensive Review & Fix Plan

## Issues Found

### 1. **Missing Database Column: `worker_job_id` in `video_renders`**
- **Issue**: The `useVideoRenders.ts` hook references `worker_job_id` in the `VideoRender` interface, but this column doesn't exist in the database schema.
- **Impact**: The hook interface is misaligned with the database, and the render worker queue function tries to update a non-existent column.
- **Fix**: Add the `worker_job_id` column to `video_renders` table via migration.

### 2. **Missing Storage Bucket: `video-hub-captions`**
- **Issue**: The render worker and Stage 2 documentation reference a `video-hub-captions` bucket for VTT/SRT files, but only `video-hub-exports` and `video-hub-thumbnails` buckets were created.
- **Impact**: Caption file uploads would fail in a real render scenario.
- **Fix**: Create the `video-hub-captions` public storage bucket.

### 3. **Webhook Function Missing Format Support**
- **Issue**: The `video-render-webhook` function doesn't accept or save the `format` field when creating export records. Variant exports (9:16, 16:9, 1:1) need this to be stored correctly.
- **Impact**: All exports would have null format, breaking the variant tracking.
- **Fix**: Update webhook to accept and insert `format` in the `video_exports` table.

### 4. **FormatBadge Not Handling Null Format**
- **Issue**: `FormatBadge` in `VideoExportsTab` receives export format which could be `null` for older records. The badge doesn't handle null gracefully.
- **Impact**: Could display "null" or crash in edge cases.
- **Fix**: Add null/undefined fallback handling to `FormatBadge`.

### 5. **Missing Translation Keys**
Several translation keys are referenced but may be incomplete or missing:
- `videoHub.renderDetail.stages.*` (queued, initializing, generating, processing, compositing, encoding, finalizing)
- `videoHub.templates.useTemplate`
- `videoHub.templates.description`
- `videoHub.templates.locked`
- `videoHub.gallery.*` (multiple keys)
- `videoHub.durations.*` (10s, 15s, 30s, 60s)
- `videoHub.assets.*` (logoLocked, defaultLogo, backgroundUrl, backgroundHint, productIcons, noIcons)
- `common.yes`, `common.no`, `common.on`, `common.off`

**Fix**: Add missing translation keys to en.json and es.json.

### 6. **Gallery Tab Not Included in VideoHubPage**
- **Issue**: `VideoGalleryTab.tsx` exists but is not rendered in any tab of `VideoHubPage.tsx`. The page has: Projects, Create, Templates, Exports, Settings - no Gallery.
- **Impact**: Gallery component is orphaned/unused code.
- **Fix**: Either remove the unused component or add a Gallery tab. Based on STAGE 1 requirements (Projects/Create/Templates/Exports/Settings), Gallery appears to be redundant with Exports. Recommend removing it to reduce maintenance burden.

### 7. **RenderVariantButtons onRenderQueued Callback Not Connected**
- **Issue**: `RenderVariantButtons` has an optional `onRenderQueued` prop but it's never passed from `VideoProjectsTab`.
- **Impact**: Projects table doesn't refresh after variant render is queued.
- **Fix**: Connect the callback to trigger a refetch.

### 8. **useVideoBrandSettings Query Error Handling**
- **Issue**: The hook uses `.single()` which throws if no brand settings record exists.
- **Impact**: New installations without seeded brand settings would crash.
- **Fix**: Use `.maybeSingle()` instead, or ensure migration seeds a default record.

### 9. **CORS Headers Missing Extended Headers**
- **Issue**: Edge functions have basic CORS headers but are missing some headers needed for Supabase client (e.g., `x-supabase-client-platform`).
- **Impact**: Minor - may cause warnings but shouldn't break functionality.
- **Fix**: Update CORS headers to include full Supabase header list.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/new.sql` | Add `worker_job_id` column to `video_renders` |
| `supabase/functions/video-render-webhook/index.ts` | Accept and insert `format` field |
| `src/components/admin/video-hub/VideoBadges.tsx` | Handle null format in FormatBadge |
| `src/components/admin/video-hub/VideoProjectsTab.tsx` | Pass `onRenderQueued` callback |
| `src/hooks/useVideoBrandSettings.ts` | Change `.single()` to `.maybeSingle()` |
| `src/i18n/locales/en.json` | Add missing translation keys |
| `src/i18n/locales/es.json` | Add missing Spanish translation keys |
| Delete `src/components/admin/video-hub/VideoGalleryTab.tsx` | Remove unused component |
| `supabase/functions/video-render-queue/index.ts` | Extend CORS headers |

---

## Database Migration

```sql
-- Add missing worker_job_id column
ALTER TABLE video_renders 
ADD COLUMN IF NOT EXISTS worker_job_id text;

-- Create captions storage bucket (if not exists, handled by storage API)
```

---

## Priority Order

1. **High**: Database column + webhook format fix (breaks core functionality)
2. **High**: useVideoBrandSettings error handling (could crash page)
3. **Medium**: Missing translations (UI shows raw keys)
4. **Medium**: FormatBadge null handling (edge case crashes)
5. **Low**: Remove unused Gallery component (cleanup)
6. **Low**: CORS header updates (minor warnings)

---

## Summary

The Video Hub implementation is functionally complete but has 9 issues ranging from missing database columns to orphaned components. The most critical fixes are:
1. Adding the `worker_job_id` column
2. Fixing the webhook to include format
3. Fixing the brand settings query to not crash on empty database
4. Adding missing translation keys

After these fixes, the Video Hub will be production-ready.
