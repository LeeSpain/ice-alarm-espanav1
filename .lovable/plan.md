
# Media Manager - Unpublish Post Feature

## Summary

You want to completely remove a published post from **both Facebook and the blog**. Currently, the Published Performance section only shows metrics and links to view posts - there's no way to unpublish or delete content once it's live.

---

## Current Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Publishing Flow (Existing)                       │
└─────────────────────────────────────────────────────────────────────┘

  social_posts (status: approved)
         ↓
  facebook-publish edge function
         ↓
  ┌──────────────┬──────────────────┐
  │   Facebook   │    blog_posts    │
  │  (external)  │   (database)     │
  └──────────────┴──────────────────┘
         ↓
  social_posts (status: published, facebook_post_id set)
```

### Data Relationships
- Each `social_post` has a linked `blog_posts` record via `social_post_id`
- The `facebook_post_id` is stored in both tables
- Currently there's no "unpublish" workflow

---

## Proposed Solution

### New Edge Function: `facebook-unpublish`

Create a new backend function that:
1. Accepts a `post_id` (social_posts.id)
2. Calls Facebook Graph API to DELETE the post
3. Unpublishes/deletes the linked blog post
4. Updates the social post status back to "draft" or marks it as "archived"
5. Cleans up metrics from `social_post_metrics`

### UI Changes

Add an "Unpublish" button to each published post card with a confirmation dialog that explains:
- The post will be deleted from Facebook
- The blog article will be removed
- Engagement metrics will be lost

---

## Implementation Plan

### Step 1: Create `facebook-unpublish` Edge Function

**File**: `supabase/functions/facebook-unpublish/index.ts`

The function will:
1. Authenticate the request (staff only)
2. Fetch the post and verify it's published
3. Get Facebook credentials from `system_settings`
4. Call Facebook Graph API: `DELETE /{post_id}?access_token=...`
5. Delete or unpublish the linked blog post
6. Delete metrics from `social_post_metrics`
7. Update social post status to "archived" (new status) or "draft"
8. Return success/failure

```text
POST /facebook-unpublish
Body: { post_id: "uuid" }
Response: { success: true, deleted_from_facebook: true, blog_removed: true }
```

### Step 2: Update Database Schema

Add a new status value "archived" to track unpublished posts:

```sql
-- Option A: Update social_posts to allow "archived" status
-- (The status column is text, so no schema change needed)

-- Delete metrics when post is unpublished
-- (Will be done programmatically in the edge function)
```

### Step 3: Add `unpublishPost` Mutation to Hook

**File**: `src/hooks/usePublishedPosts.ts`

Add a new mutation that calls the edge function:

```typescript
const unpublishMutation = useMutation({
  mutationFn: async (postId: string) => {
    const { data, error } = await supabase.functions.invoke("facebook-unpublish", {
      body: { post_id: postId },
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["published-posts-with-metrics"] });
    toast({ title: "Post unpublished", description: "..." });
  }
});
```

### Step 4: Add Unpublish Button with Confirmation Dialog

**File**: `src/components/admin/media/PublishedPostCard.tsx`

Add a dropdown menu or secondary button with:
- "Unpublish" option
- Confirmation dialog explaining the consequences
- Loading state during unpublish

```text
┌─────────────────────────────────────────────────┐
│  [Image]                                        │
│  Topic: Living in Spain...                      │
│  📅 Published: Feb 4, 2026                      │
│  ❤️ 12 reactions  💬 3 comments  🔄 2 shares   │
│                                                 │
│  [Refresh]  [View on Facebook]  [⋮]            │
│                               ↓                 │
│                          ┌──────────┐           │
│                          │ Unpublish│           │
│                          └──────────┘           │
└─────────────────────────────────────────────────┘
```

### Step 5: Create Confirmation Dialog Component

**File**: `src/components/admin/media/UnpublishPostDialog.tsx`

A dialog that warns the user about permanent deletion from:
- Facebook (cannot be recovered)
- Blog page (will return 404)
- Metrics data (will be deleted)

### Step 6: Add Translations

**Files**: `src/i18n/locales/en.json` and `es.json`

```json
"unpublish": {
  "button": "Unpublish",
  "title": "Unpublish Post",
  "description": "This will permanently remove the post from Facebook and delete the associated blog article. This action cannot be undone.",
  "warning": "All engagement metrics will be lost.",
  "confirm": "Yes, Unpublish",
  "cancel": "Cancel",
  "success": "Post unpublished successfully",
  "error": "Failed to unpublish post"
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/facebook-unpublish/index.ts` | **Create** | New edge function for unpublishing |
| `supabase/config.toml` | **Update** | Add function config with `verify_jwt = false` |
| `src/hooks/usePublishedPosts.ts` | **Update** | Add `unpublishPost` mutation |
| `src/components/admin/media/PublishedPostCard.tsx` | **Update** | Add dropdown menu with Unpublish option |
| `src/components/admin/media/UnpublishPostDialog.tsx` | **Create** | Confirmation dialog component |
| `src/i18n/locales/en.json` | **Update** | Add unpublish translations |
| `src/i18n/locales/es.json` | **Update** | Add Spanish unpublish translations |

---

## Technical Details

### Facebook Graph API Delete Request

```typescript
// DELETE request to remove a post from Facebook
const deleteUrl = `https://graph.facebook.com/v24.0/${facebookPostId}?access_token=${accessToken}`;
const response = await fetch(deleteUrl, { method: "DELETE" });
const result = await response.json();

if (result.success) {
  // Post deleted successfully
}
```

### Blog Post Handling

Two options for the blog post:
1. **Delete completely** - Remove from `blog_posts` table
2. **Soft delete** - Set `published = false` (keeps content for potential republishing)

I recommend Option 1 (complete delete) since the Facebook post is also deleted, and keeping orphaned blog content could cause confusion.

### Audit Logging

The unpublish action will be logged to the audit trail for accountability.

---

## Edge Cases Handled

1. **Facebook API fails**: Blog post still removed locally, error message shown
2. **Token expired**: Show token expired error, prompt to update in Settings
3. **Post already deleted from Facebook**: Gracefully handle 404, still clean up local data
4. **Blog post doesn't exist**: Skip blog deletion step (some older posts may not have linked blogs)
5. **Metrics don't exist**: Skip metrics cleanup if none found

---

## Expected Results

After implementation:
1. Each published post card will have an "Unpublish" option in a dropdown menu
2. Clicking it shows a confirmation dialog with clear warnings
3. Upon confirmation:
   - Post is deleted from Facebook
   - Blog article is removed from the database
   - Metrics are cleaned up
   - Social post status changes to "archived"
4. Toast notification confirms success/failure
5. Post disappears from the Published Performance grid
