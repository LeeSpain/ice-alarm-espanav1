

# Fix: Video Projects Status Check Constraint

## Problem Identified

The database has a check constraint on the `video_projects` table that only allows these status values:
- `draft`
- `approved`
- `archived`

However, the recent Video Hub enhancement added `"rendering"` as a status value in the code:
- `VideoCreateTab.tsx` sets `status: "rendering"` when queuing a render
- `video-render-queue` edge function also sets `status: "rendering"`

This causes the error:
```
new row for relation "video_projects" violates check constraint "video_projects_status_check"
```

---

## Solution

Add `"rendering"` to the allowed status values in the check constraint.

### Database Migration

```sql
-- Drop the existing constraint
ALTER TABLE video_projects DROP CONSTRAINT video_projects_status_check;

-- Add updated constraint with "rendering" status
ALTER TABLE video_projects ADD CONSTRAINT video_projects_status_check 
  CHECK (status = ANY (ARRAY['draft', 'rendering', 'approved', 'archived']));
```

---

## Files Changed

| File | Change |
|------|--------|
| Database migration | Add `"rendering"` to `video_projects_status_check` constraint |

---

## Status Flow After Fix

```text
Create Project → status: "draft"
Click Render → status: "rendering" ✅ (now allowed)
Render Complete → status: "approved"
Render Failed → status: "draft"
Archive → status: "archived"
```

---

## Technical Notes

- This is a simple constraint update, no data migration needed
- The `VideoBadges.tsx` already has the "rendering" status badge implemented
- The edge function and frontend code are already correct - only the database constraint is missing the new status

