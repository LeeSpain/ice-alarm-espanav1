

# Fix: Edge Function Stage Updates Not Persisting

## Problem Identified

The `stage` column in `video_renders` is staying at `"queued"` throughout the entire render process, even though:
- `progress` updates correctly (0% → 100%)
- `status` transitions correctly (`queued` → `running` → `done`)

**Root Cause**: The deployed edge function is running an **older version** that doesn't include the stage tracking updates from the recent enhancement.

### Evidence from Database:
```
id: f62c35d3...  progress: 100  stage: "queued"  status: "done"
id: d4970522...  progress: 100  stage: "queued"  status: "done"
```

The `stage` should progress through: `queued` → `initializing` → `generating` → `processing` → `compositing` → `encoding` → `finalizing`

---

## Solution

Force redeploy the `video-render-queue` edge function to ensure the latest code (with stage updates) is active.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/video-render-queue/index.ts` | No code change needed - just redeploy |

---

## Technical Notes

The edge function code is correct. The issue is that the deployment may have timed out or failed silently in a previous attempt. Forcing a redeploy will ensure the latest version with stage tracking is running.

After redeployment, renders will show:
- Stage updates in real-time through the timeline
- Progress bar moving in sync with stage transitions
- Each stage lasting ~2.5 seconds as designed

