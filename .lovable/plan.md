
# Video Hub Complete Review & Improvement Plan

## Issues Found

### 🔴 Critical Issue: Edge Function Not Working

The `video-render-queue` edge function is **missing from `supabase/config.toml`**. This means:
- JWT verification is enabled by default
- Calls from the frontend are being rejected (401 Unauthorized)
- The project saves to database but render never queues
- No logs appear because the function never executes

**Evidence:**
- Database shows 1 project created (`e1a40ff5-18e1-4b2a-8a3f-9c4bb09969e6`) with status "draft"
- Database shows 0 render records (should have at least 1 if render was triggered)
- Edge function logs show "No logs found" - function never ran

### 🟡 Missing: Render Progress Visibility

The Projects tab doesn't show:
- Which projects have active renders
- Render progress (0-100%)
- Render status badges (Queued/Running/Failed/Done)

Users can't see the creation process because there's no visual feedback.

### 🟡 Code Issues

1. **Duplicate render record creation**: 
   - Edge function creates render record
   - `handleRender` also calls `queueRender` which creates another record
   - This will cause duplicate entries when fixed

2. **No realtime updates**: 
   - Users need to manually refresh to see render progress
   - No subscription to `video_renders` table changes

3. **Edge function simulation runs too fast**:
   - 1 second between progress updates
   - Total ~5 seconds to complete
   - Too fast for users to observe the process

---

## Implementation Plan

### Phase 1: Fix Edge Function (Critical)

**1.1 Add to config.toml**
```toml
[functions.video-render-queue]
verify_jwt = false
```

**1.2 Remove duplicate render record creation**

In `VideoCreateTab.tsx`, remove the local `queueRender` call since the edge function already creates the render record:

```typescript
// REMOVE this line from handleRender:
await queueRender(projectId);
```

**1.3 Slow down simulation for visibility**

In the edge function, increase delays so users can see progress:
- 2-3 seconds between progress updates
- Total ~15 seconds to complete

### Phase 2: Add Render Progress to Projects Tab

**2.1 Fetch render status per project**

Create a new hook or modify `useVideoRenders` to get the latest render per project:
```typescript
// Fetch latest render for each project
const { data: latestRenders } = useQuery({
  queryKey: ["video-renders-latest"],
  queryFn: async () => {
    const { data } = await supabase
      .from("video_renders")
      .select("*")
      .order("created_at", { ascending: false });
    // Group by project_id, keep only latest
    return groupByProjectId(data);
  }
});
```

**2.2 Add Render Status Column to Projects Table**

New column showing:
- Progress bar (0-100%)
- Status badge (Queued/Running 45%/Complete/Failed)
- Only visible when a render exists for that project

**2.3 Add Realtime Subscription**

Subscribe to `video_renders` changes for live updates:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('video-renders')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'video_renders' },
      () => queryClient.invalidateQueries({ queryKey: ['video-renders'] })
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

### Phase 3: Additional Improvements

**3.1 Performance: Memoize RenderBadge component**
```typescript
const RenderBadge = React.memo(({ render }) => { ... });
```

**3.2 Better error messages**

Show specific error when edge function fails:
```typescript
if (response.error) {
  console.error("Render queue error:", response.error);
  toast.error(response.error.message || t("videoHub.create.renderFailed"));
  return;
}
```

**3.3 Add "Render Status" column to table**

| Name | Template | Language | Format | Duration | Status | Render | Last Edited |
|------|----------|----------|--------|----------|--------|--------|-------------|
| ICE Safety | Calm Problem | EN | 16:9 | 15s | Draft | ⏳ 45% | Feb 5, 2026 |

**3.4 Add refresh button for renders**

Button to manually refresh render status if realtime fails.

---

## File Changes Summary

| File | Change |
|------|--------|
| `supabase/config.toml` | Add `[functions.video-render-queue]` with `verify_jwt = false` |
| `supabase/functions/video-render-queue/index.ts` | Increase delay between progress updates (2-3s) |
| `src/components/admin/video-hub/VideoCreateTab.tsx` | Remove duplicate `queueRender` call |
| `src/components/admin/video-hub/VideoProjectsTab.tsx` | Add render status column, add realtime subscription |
| `src/hooks/useVideoRenders.ts` | Add realtime subscription, add method to get latest render per project |
| `src/components/admin/video-hub/VideoBadges.tsx` | Add `RenderProgressBadge` component |

---

## Technical Implementation Details

### Render Progress Badge Component

```typescript
interface RenderProgressBadgeProps {
  render: VideoRender | null;
}

export function RenderProgressBadge({ render }: RenderProgressBadgeProps) {
  if (!render) return <span className="text-muted-foreground text-sm">-</span>;
  
  const { t } = useTranslation();
  
  if (render.status === "queued") {
    return <Badge variant="secondary">⏳ {t("videoHub.statuses.queued")}</Badge>;
  }
  
  if (render.status === "running") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${render.progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{render.progress}%</span>
      </div>
    );
  }
  
  if (render.status === "done") {
    return <Badge className="bg-status-active text-white">✓ {t("videoHub.statuses.done")}</Badge>;
  }
  
  if (render.status === "failed") {
    return <Badge variant="destructive">✗ {t("videoHub.statuses.failed")}</Badge>;
  }
  
  return null;
}
```

### Realtime Subscription in useVideoRenders

```typescript
export function useVideoRenders(projectId?: string) {
  const queryClient = useQueryClient();

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('video-renders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'video_renders' },
        (payload) => {
          console.log('Video render update:', payload);
          queryClient.invalidateQueries({ queryKey: ['video-renders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ... rest of hook
}
```

---

## Expected Outcome After Fix

1. User clicks "Render Video" → Edge function receives request
2. Render record created with status "queued"
3. Projects tab shows "⏳ Queued" badge
4. Simulation runs, progress updates every 2-3 seconds
5. Projects tab shows progress bar: "▓▓▓░░ 45%"
6. After ~15 seconds, status becomes "✓ Done"
7. Export record appears in Exports tab
8. User can download (placeholder URLs for now)

---

## Summary

The main issue is the **missing config.toml entry** causing the edge function to reject all requests. Once fixed, we need to:
1. Remove duplicate render record creation
2. Add visual progress indicators to Projects tab
3. Add realtime subscriptions for live updates
4. Slow down the simulation so users can observe the process
