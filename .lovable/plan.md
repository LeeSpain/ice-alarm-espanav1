
# Ready to Publish Queue - Media Manager Enhancement

## Overview

Add a prominent **"Ready to Publish"** section at the top of the Media Manager page that displays all posts with `approved` status. This provides a dedicated command center for quick publishing actions with real-time metrics that update throughout the page after each publish.

## Current State Analysis

- Posts with `approved` status are only visible via the filtered table at the bottom
- No dedicated quick-action area for publishing workflow
- Metrics (counts by status) are not prominently displayed
- Publishing requires: find approved post → click to edit → click publish

## Proposed Solution

Create an **"Approved & Ready"** section that:
1. Shows summary metrics (total drafts, approved, published, failed counts)
2. Displays approved posts as actionable cards with image preview + quick publish button
3. Updates all metrics in real-time when a post is published
4. Allows expanding post preview before publishing

## Visual Design

```text
+-----------------------------------------------------------------------+
|  Media Manager                                                        |
|  Create and manage social media posts for Facebook                    |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|  📊 POST METRICS                                                       |
|  +------------+  +------------+  +------------+  +------------+       |
|  | 5 Drafts   |  | 2 Approved |  | 12 Published|  | 1 Failed  |       |
|  +------------+  +------------+  +------------+  +------------+       |
+-----------------------------------------------------------------------+

+-----------------------------------------------------------------------+
|  🚀 READY TO PUBLISH (2)                                              |
|  Posts approved and waiting for publication                           |
|  +---------------------------+  +---------------------------+         |
|  | [Image Preview]           |  | [Image Preview]           |         |
|  | Topic: Summer Safety Tips |  | Topic: Fall Wellness      |         |
|  | Goal: Brand Awareness     |  | Goal: Education           |         |
|  | 🇬🇧🇪🇸 Both               |  | 🇬🇧 English               |         |
|  |                           |  |                           |         |
|  | [👁 Preview] [🚀 Publish]  |  | [👁 Preview] [🚀 Publish]  |         |
|  +---------------------------+  +---------------------------+         |
+-----------------------------------------------------------------------+

[... existing Create/Edit panels and Existing Posts table below ...]
```

## Implementation Steps

### 1. Create New Hook for Approved Posts
**File:** `src/hooks/useSocialPosts.ts`

Add a dedicated query for approved posts only (separate from filtered list):
- `useApprovedPosts()` - fetches posts where status = 'approved'
- This allows the Ready to Publish section to always show approved posts regardless of the table filter

### 2. Create Metrics Summary Hook
**File:** `src/hooks/useSocialPosts.ts`

Add a query for post counts by status:
- Returns: `{ drafts: number, approved: number, published: number, failed: number }`
- Query groups by status and counts

### 3. Create PostPreviewDialog Component
**File:** `src/components/admin/media/PostPreviewDialog.tsx`

A dialog to preview full post content before publishing:
- Shows full image (if exists)
- Displays complete post text with scroll
- Shows metadata badges (goal, audience, language)
- Action buttons: Close, Edit (loads into form), Publish

### 4. Create ReadyToPublishSection Component
**File:** `src/components/admin/media/ReadyToPublishSection.tsx`

A dedicated component showing approved posts as cards:
- Horizontal scrollable grid of post cards
- Each card shows: image thumbnail, topic, goal, language flags
- Quick action buttons: Preview (eye icon), Publish (rocket icon)
- Empty state when no approved posts
- Loading skeleton while fetching

### 5. Create PostMetricsBar Component
**File:** `src/components/admin/media/PostMetricsBar.tsx`

A horizontal bar showing status counts:
- Four stat cards: Drafts, Approved, Published, Failed
- Color-coded to match status colors
- Clickable to filter the table below (optional enhancement)
- Updates automatically via React Query invalidation

### 6. Update MediaManagerPage Layout
**File:** `src/pages/admin/MediaManagerPage.tsx`

Integrate new sections at the top:
- Import new components
- Add metrics bar after page title
- Add Ready to Publish section before the Create/Edit panels
- Wire up preview dialog state
- Connect publish action with React Query cache invalidation

### 7. Add Translation Keys
**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/es.json`

New keys under `mediaManager`:
- `metrics.drafts`, `metrics.approved`, `metrics.published`, `metrics.failed`
- `readyToPublish.title`, `readyToPublish.subtitle`, `readyToPublish.empty`
- `readyToPublish.publishNow`, `readyToPublish.preview`
- `preview.title`, `preview.close`, `preview.editPost`, `preview.publishNow`
- `preview.noImage`, `preview.postDetails`

## Technical Details

### Data Flow
1. Page loads → `usePostMetrics()` fetches counts, `useApprovedPosts()` fetches approved posts
2. User clicks Publish on a card → `publishPost(id)` is called
3. On success, React Query invalidates:
   - `["social-posts"]` (all queries)
   - `["social-post-metrics"]`
   - `["approved-posts"]`
4. All components re-render with updated data

### New Hooks Structure

```typescript
// In useSocialPosts.ts

// Fetch only approved posts (for Ready to Publish section)
export function useApprovedPosts() {
  return useQuery({
    queryKey: ["approved-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("status", "approved")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as SocialPost[];
    },
  });
}

// Fetch metrics (counts by status)
export function usePostMetrics() {
  return useQuery({
    queryKey: ["social-post-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("status");
      if (error) throw error;
      
      const counts = { draft: 0, approved: 0, published: 0, failed: 0 };
      data.forEach(post => {
        if (counts[post.status] !== undefined) counts[post.status]++;
      });
      return counts;
    },
  });
}
```

### Cache Invalidation Update

Modify `publishMutation` to invalidate all relevant queries:
```typescript
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  queryClient.invalidateQueries({ queryKey: ["approved-posts"] });
  queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] });
  // ... existing toast
}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useSocialPosts.ts` | Modify | Add `useApprovedPosts()`, `usePostMetrics()`, update cache invalidation |
| `src/components/admin/media/PostMetricsBar.tsx` | Create | Status count cards |
| `src/components/admin/media/ReadyToPublishSection.tsx` | Create | Approved posts queue |
| `src/components/admin/media/PostPreviewDialog.tsx` | Create | Full post preview modal |
| `src/pages/admin/MediaManagerPage.tsx` | Modify | Integrate new sections |
| `src/i18n/locales/en.json` | Modify | Add new translation keys |
| `src/i18n/locales/es.json` | Modify | Add Spanish translations |

## UX Considerations

- **Empty State:** When no approved posts exist, show helpful message encouraging to create and approve drafts
- **Loading States:** Skeleton cards while fetching approved posts
- **Responsive:** Cards stack vertically on mobile, horizontal scroll on desktop
- **Feedback:** Success toast with Facebook post ID after publish, immediate removal from Ready to Publish section
- **Error Handling:** If publish fails, card shows error state with retry option

## Future Enhancements (Out of Scope)

- Scheduled publishing with date/time picker
- Bulk publish all approved posts
- Drag-and-drop reordering of publish queue
- Analytics integration showing engagement metrics for published posts
