

# Media Manager Full Review & Fix Plan

## Issue Summary

I thoroughly reviewed the entire Media Manager workflow and found **one critical bug** plus several improvements needed to ensure the flow works perfectly from creation to Facebook publishing.

## Root Cause Identified

**CRITICAL BUG in `useSocialPosts.ts`:**

When a post is approved via `approveMutation.onSuccess` (lines 153-158), only the `["social-posts"]` query key is invalidated. The **`["approved-posts"]` and `["social-post-metrics"]` query keys are NOT being invalidated**.

This means the "Ready to Publish" section doesn't refresh when you approve a post!

```text
Current Code (BUG):
onSuccess: (post) => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });  // Only this!
  toast({ title: "Post approved", ... });
}

Should Be:
onSuccess: (post) => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  queryClient.invalidateQueries({ queryKey: ["approved-posts"] });     // Missing!
  queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] }); // Missing!
  toast({ title: "Post approved", ... });
}
```

Compare with `retryMutation.onSuccess` (lines 181-186) which correctly invalidates all three query keys.

## Database Verification

I confirmed the database is working correctly:
- Post ID `21716581-2335-42d3-91c0-5007ad2b24d6` has `status: approved`
- The approval is recorded with `approved_by` and timestamps
- The data exists but the UI cache isn't being refreshed

## Complete Flow Audit

| Step | Component | Status | Issue |
|------|-----------|--------|-------|
| 1. Create Draft | `createMutation` | OK | Invalidates `social-posts` |
| 2. Save Draft | `updateMutation` | OK | Invalidates `social-posts` |
| 3. Approve Post | `approveMutation` | **BUG** | Missing `approved-posts` + `social-post-metrics` invalidation |
| 4. Retry Post | `retryMutation` | OK | All three keys invalidated |
| 5. Publish Post | `publishMutation` | OK | All three keys invalidated |
| 6. Delete Post | `deleteMutation` | **IMPROVEMENT** | Missing `approved-posts` + `social-post-metrics` invalidation |

## Fix Plan

### Fix 1: Add Missing Cache Invalidations in `approveMutation`

**File:** `src/hooks/useSocialPosts.ts`

Update the `approveMutation.onSuccess` handler (around line 153):

```typescript
onSuccess: (post) => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  queryClient.invalidateQueries({ queryKey: ["approved-posts"] });      // ADD
  queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] }); // ADD
  toast({ title: "Post approved", description: "The post is ready to publish." });
  logSocialPostActivity("approved", post.id, { status: "draft" }, { status: "approved" });
},
```

### Fix 2: Add Missing Cache Invalidations in `deleteMutation`

**File:** `src/hooks/useSocialPosts.ts`

Update the `deleteMutation.onSuccess` handler (around line 236):

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  queryClient.invalidateQueries({ queryKey: ["approved-posts"] });      // ADD
  queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] }); // ADD
  toast({ title: "Post deleted", description: "The post has been removed." });
},
```

### Fix 3: Add Missing Cache Invalidations in `updateMutation`

**File:** `src/hooks/useSocialPosts.ts`

Update the `updateMutation.onSuccess` handler (around line 122):

```typescript
onSuccess: (post) => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  queryClient.invalidateQueries({ queryKey: ["approved-posts"] });      // ADD
  queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] }); // ADD
  toast({ title: "Draft updated", description: "Your changes have been saved." });
  logSocialPostActivity("draft_edited", post.id, undefined, {...});
},
```

### Fix 4: Add Missing Cache Invalidations in `createMutation`

**File:** `src/hooks/useSocialPosts.ts`

Update the `createMutation.onSuccess` handler (around line 94):

```typescript
onSuccess: (post) => {
  queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] }); // ADD (updates draft count)
  toast({ title: "Draft created", description: "Your post draft has been saved." });
  logSocialPostActivity("draft_created", post.id, undefined, {...});
},
```

## Other Components Verified (No Issues Found)

| Component | Status | Notes |
|-----------|--------|-------|
| `ReadyToPublishSection.tsx` | OK | Receives `posts` prop correctly, renders cards |
| `PostPreviewDialog.tsx` | OK | Handles preview, publish, retry, edit correctly |
| `usePostMetrics.ts` | OK | Query logic is correct |
| `facebook-publish/index.ts` | OK | Edge function logic is correct |
| `MediaManagerPage.tsx` | OK | Wiring between components is correct |

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSocialPosts.ts` | Add missing cache invalidations for 4 mutations |

## Expected Result After Fix

1. User creates a draft → Metrics update to show new draft
2. User approves a draft → **Ready to Publish section immediately shows the post**
3. User publishes → Post moves to published, removed from Ready to Publish
4. User retries failed post → Post appears in Ready to Publish
5. User deletes any post → All sections update correctly

## Why This Bug Wasn't Caught Earlier

The `retryMutation` was correctly implemented (with all three invalidations), but when `approveMutation` was originally written, the `approved-posts` and `social-post-metrics` queries didn't exist yet. When the Ready to Publish section was added later, the approval mutation wasn't updated to invalidate the new query keys.

