
# Video Hub Rendering Investigation & Enhancement Plan

## Current State Analysis

### What's Working
- Render queue edge function successfully creates render records
- Progress updates work (0% → 10% → 30% → 50% → 70% → 90% → 100%)
- Realtime subscriptions are set up to show progress updates
- Export records are created when render completes

### Root Issues Identified

| Issue | Description | Impact |
|-------|-------------|--------|
| **Simulation Only** | The `video-render-queue` edge function only simulates rendering - no actual video files are generated | `mp4_url`, `thumbnail_url`, etc. are all `null` |
| **Project Status Stays "Draft"** | When clicking "Render", the project is saved with `status: "draft"` and never changes | Users expect status to change to "approved" or "rendering" |
| **No Project Detail View** | No way to click on a project to watch the rendering progress in real-time | Users can't monitor the process |
| **No Visual Preview** | No actual video preview since files aren't generated | Empty exports with no playable content |

---

## Proposed Solution

### Part 1: Project Render Detail Dialog

Create a new component `VideoRenderDetailDialog.tsx` that opens when clicking on a project row:

```text
┌──────────────────────────────────────────────────────────────┐
│ ✕                           Project Details                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Project: Welcome to ICE Alarms                              │
│  Format: 16:9 (Landscape) | Language: EN | Duration: 15s    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │               [Video Preview Placeholder]              │  │
│  │                     or Thumbnail                        │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Render Status                                               │
│  ──────────────────────────────────────────────────────────  │
│  Status: Running                                             │
│  [████████████████████░░░░░░░░░░░░] 65%                     │
│                                                               │
│  Timeline:                                                   │
│  ✓ 4:01 PM - Render queued                                  │
│  ✓ 4:01 PM - Processing started                             │
│  ✓ 4:01 PM - Generating scenes (30%)                        │
│  ⟳ 4:02 PM - Compositing video (65%)                        │
│  ○ Pending - Final encoding                                 │
│  ○ Pending - Creating export                                │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [Edit Project]  [Re-render]  [View Export]  [Close]    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time progress bar with percentage
- Live status updates via Realtime subscription
- Timeline of render stages (queued → running → encoding → done)
- Quick actions: Edit, Re-render, View Export

### Part 2: Fix Project Status After Render

Update the edge function to set project status to "approved" after successful render:

```typescript
// In video-render-queue edge function, after marking render as done:
await supabase
  .from("video_projects")
  .update({ status: "approved" })
  .eq("id", projectId);
```

Also update `VideoCreateTab.tsx` to set status to "rendering" when queue is triggered:

```typescript
// In handleRender, after queueing:
await updateProject({
  id: projectId,
  status: "rendering", // Instead of "draft"
});
```

### Part 3: Enhanced Render Progress Stages

Update the edge function to provide more granular progress stages for better UX:

| Progress | Stage Description |
|----------|-------------------|
| 0-10% | Initializing render |
| 10-30% | Generating scenes |
| 30-50% | Processing audio |
| 50-70% | Compositing video |
| 70-90% | Encoding final output |
| 90-100% | Creating export record |

Store stage info in render metadata for UI display.

### Part 4: Make Project Rows Clickable

Update `VideoProjectsTab.tsx` to open the detail dialog when clicking on a project row (in addition to the dropdown menu).

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/video-hub/VideoRenderDetailDialog.tsx` | CREATE | New dialog for real-time render monitoring |
| `src/components/admin/video-hub/VideoProjectsTab.tsx` | EDIT | Add row click handler to open detail dialog |
| `src/components/admin/video-hub/VideoCreateTab.tsx` | EDIT | Set project status to "rendering" after queue |
| `src/hooks/useVideoRenders.ts` | EDIT | Add stage info to render interface |
| `supabase/functions/video-render-queue/index.ts` | EDIT | Update project status, add stage metadata |
| `src/components/admin/video-hub/VideoBadges.tsx` | EDIT | Add "rendering" status badge |
| `src/i18n/locales/en.json` | EDIT | Add render stage translations |
| `src/i18n/locales/es.json` | EDIT | Add render stage translations |

---

## Database Update

Add a `stage` column to track render progress stages:

```sql
ALTER TABLE video_renders 
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'queued';
```

---

## Important Note: Actual Video Generation

The current implementation is a **simulation only**. To actually generate videos, you would need to integrate with:

- **Remotion** - React-based video generation
- **FFmpeg Cloud** (Transloadit, CloudConvert)
- **Shotstack** - Video API
- **Creatomate** - Template-based video API

The placeholder URLs in `video_exports` are intentionally null because no actual rendering service is connected yet.

---

## Technical Details

### Realtime Subscription Enhancement

The `useVideoRenders` hook already has Realtime subscriptions. We'll leverage this for the detail dialog:

```typescript
// Live updates will automatically trigger re-renders
const { renders } = useVideoRenders(projectId);
const currentRender = renders?.[0]; // Latest render
```

### Status Flow

```text
Project Creation:
  [Create] → status: "draft"

Render Queue:  
  [Render] → status: "rendering" (NEW)
             → video_renders: status: "queued"

During Render:
  → video_renders: status: "running", progress: 0-99%

Render Complete:
  → video_renders: status: "done", progress: 100%
  → project: status: "approved" (auto-update)
  → video_exports: created

Render Failed:
  → video_renders: status: "failed"
  → project: status: "draft" (unchanged)
```

---

## Summary

1. **Create Project Render Detail Dialog** - Real-time progress monitoring with timeline
2. **Fix status management** - Project status updates through render lifecycle  
3. **Make projects clickable** - Click row to open detail view
4. **Enhanced progress stages** - More granular progress feedback
5. **Document simulation limitation** - Current system doesn't actually generate videos

This enhancement gives users visibility into the render process and fixes the confusing "draft" status issue, while acknowledging that actual video generation requires a rendering service integration.
