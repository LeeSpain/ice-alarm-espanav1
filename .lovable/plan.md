
# Video Hub Complete Improvement Plan

## Summary of Findings

### Current State
- **Edge function is working**: Successfully tested - renders complete and exports are created
- **1 project exists**: "ICE Personal Safety Pendant" (approved status)
- **1 render complete**: Status "done", progress 100%
- **1 export exists**: Placeholder URLs (null) since this is simulated

### Key Issue: Visibility Gap
When a user creates a project and just clicks "Save as Draft" or "Approve" without clicking "Render Video", no render is queued. The user needs to explicitly trigger rendering to see the video in Exports.

---

## New Feature: Video Gallery Tab

### Why an Album/Gallery?
The Exports tab shows downloadable files but lacks a visual, browsable gallery experience. Users want to:
- Quickly preview completed videos
- See thumbnails at a glance
- Filter by status (published/rendered/pending)
- Share videos directly

### Implementation Plan

**Add new tab: "Gallery"** between Exports and Settings

| Tab | Purpose |
|-----|---------|
| Projects | Work-in-progress, drafts, all projects |
| Create Video | Wizard to create new videos |
| Templates | Browse templates |
| **Gallery** (NEW) | Visual album of completed/published videos |
| Exports | Download files, captions, send to outreach |
| Settings | Brand configuration |

### Gallery Tab Features

1. **Grid View**: Large thumbnail cards (16:9/9:16/1:1 aspect ratios)
2. **Filter by Status**: All / Published / Ready / Pending
3. **Quick Actions**: Play preview, Copy link, Share, Download
4. **Video Details Modal**: Full preview with metadata
5. **Publish Status**: Badge showing if sent to AI Outreach

### Database Changes

Add `published_at` column to `video_exports` to track when a video was marked as "published":

```sql
ALTER TABLE video_exports ADD COLUMN published_at TIMESTAMPTZ;
```

---

## Performance & UX Improvements

### 1. Auto-render on Approve

When user clicks "Approve" on a project, automatically queue a render if one doesn't exist:

**File:** `VideoProjectsTab.tsx`
```typescript
const handleApprove = async (projectId: string) => {
  // Update status to approved
  await updateProjectStatus(projectId, "approved");
  
  // Check if render exists
  const existingRender = latestRenderByProject.get(projectId);
  if (!existingRender) {
    // Auto-queue render
    await supabase.functions.invoke('video-render-queue', {
      body: { project_id: projectId }
    });
    toast.success(t("videoHub.projects.approvedAndQueued"));
  }
};
```

### 2. Better Render Status Visibility

Add a prominent status banner in the Projects tab when renders are in progress:

```tsx
{activeRenders.length > 0 && (
  <Alert className="mb-4">
    <Loader2 className="h-4 w-4 animate-spin" />
    <AlertTitle>{activeRenders.length} video(s) rendering...</AlertTitle>
    <AlertDescription>Check back in a few moments</AlertDescription>
  </Alert>
)}
```

### 3. Realtime Updates for Exports Tab

Add realtime subscription to `video_exports` table so new exports appear immediately:

**File:** `useVideoExports.ts`
```typescript
useEffect(() => {
  const channel = supabase
    .channel('video-exports-changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'video_exports' },
      () => queryClient.invalidateQueries({ queryKey: ['video-exports'] })
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

### 4. Add "Re-render" Action

In Projects dropdown, add ability to re-render a video:

```typescript
<DropdownMenuItem onClick={() => handleRerender(project.id)}>
  <RefreshCw className="mr-2 h-4 w-4" />
  {t("videoHub.projects.rerender")}
</DropdownMenuItem>
```

### 5. Quick Render from Exports

Show "Render Missing" button for exports without mp4_url:

```tsx
{!exp.mp4_url && (
  <Button variant="outline" size="sm" onClick={() => handleRerender(exp.project_id)}>
    <RefreshCw className="mr-1 h-4 w-4" />
    Re-render
  </Button>
)}
```

---

## File Changes Summary

| File | Changes |
|------|---------|
| `VideoHubPage.tsx` | Add "Gallery" tab (new 6th tab) |
| `VideoGalleryTab.tsx` (NEW) | Grid view of completed videos with previews |
| `VideoProjectsTab.tsx` | Add auto-render on approve, re-render action |
| `VideoExportsTab.tsx` | Add realtime subscription, re-render for missing files |
| `useVideoExports.ts` | Add realtime subscription for new exports |
| `useVideoRenders.ts` | Already has realtime - just verify it's working |
| `en.json` / `es.json` | Add gallery translations |

### Database Migration

```sql
-- Add published_at column for tracking when videos are "published"
ALTER TABLE video_exports ADD COLUMN published_at TIMESTAMPTZ;

-- Enable realtime for video_exports table
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_exports;
```

---

## VideoGalleryTab Component Structure

```typescript
// New file: VideoGalleryTab.tsx
interface VideoGalleryTabProps {
  searchQuery: string;
}

export function VideoGalleryTab({ searchQuery }: VideoGalleryTabProps) {
  // Filter: all | published | ready | pending
  const [filter, setFilter] = useState("all");
  
  // Grid of video cards
  // Each card shows:
  // - Thumbnail (or placeholder with video icon)
  // - Project name
  // - Format badge (9:16, 16:9, 1:1)
  // - Language badge (EN/ES)
  // - Status: Published ✓ / Ready to Publish / Rendering...
  // - Actions: Preview, Download, Share, Publish
}
```

### Gallery Card Design

```text
┌────────────────────────────────────┐
│                                    │
│         [VIDEO THUMBNAIL]          │
│         or placeholder             │
│                                    │
├────────────────────────────────────┤
│ ICE Safety Pendant                 │
│ ┌──────┐ ┌────┐ ┌──────────┐      │
│ │ 16:9 │ │ EN │ │ ✓ Ready  │      │
│ └──────┘ └────┘ └──────────┘      │
│                                    │
│ [▶ Preview]  [↓ Download]  [Share] │
└────────────────────────────────────┘
```

---

## Translation Keys to Add

```json
{
  "videoHub": {
    "tabs": {
      "gallery": "Gallery"
    },
    "gallery": {
      "title": "Video Gallery",
      "subtitle": "Browse and share your completed videos",
      "noVideos": "No completed videos yet",
      "noVideosDesc": "Render a project to see it here",
      "filter": {
        "all": "All Videos",
        "published": "Published",
        "ready": "Ready to Publish",
        "pending": "Rendering"
      },
      "preview": "Preview",
      "share": "Share",
      "publish": "Mark as Published",
      "unpublish": "Unpublish",
      "copyLink": "Copy Link",
      "linkCopied": "Link copied to clipboard"
    },
    "projects": {
      "rerender": "Re-render Video",
      "approvedAndQueued": "Project approved and render queued"
    }
  }
}
```

---

## Expected User Flow After Changes

1. **Create Video** → Wizard → Save Draft
2. **Projects Tab** → See draft with "Render: -" column
3. **Approve Project** → Auto-queues render → Shows progress bar
4. **Render Completes** → Export created → Appears in Gallery
5. **Gallery Tab** → See thumbnail grid → Preview/Download/Share
6. **Mark as Published** → Video shows "✓ Published" badge
7. **Exports Tab** → Download MP4/SRT/VTT, Send to AI Outreach

---

## Technical Improvements

### Memoization Audit

- `VideoGalleryTab`: Memoize filtered videos
- `RenderProgressBadge`: Already memoized with React.memo
- `projectMap` in Exports: Already using useMemo

### Edge Function Improvements

Consider adding a webhook callback when render completes to push notification to user (future enhancement).

---

## Priority Order

1. **High**: Add Gallery tab with visual grid
2. **High**: Auto-render on approve
3. **Medium**: Add realtime to exports
4. **Medium**: Add re-render action
5. **Low**: Add published_at tracking

