
# Fix Blog Post Count Discrepancy

## Problem Summary

You're seeing **6 blog posts** on the public blog page but only **4 published posts** in the Media Manager. This is caused by:

1. **Orphan blog posts** - Blog entries that have no linked published social post
2. **Duplicate blog posts** - The same social post created multiple blog entries
3. **Manual blog entries** - A "Welcome" post was created manually without a social post
4. **Missing linkage** - The scheduled publishing flow doesn't properly link blog posts to social posts

---

## Data Cleanup (Immediate Fix)

I'll create a cleanup migration that:

1. **Deletes orphan blog posts** - Blogs where:
   - `social_post_id` is NULL (except the welcome post if you want to keep it)
   - `social_post_id` references a non-existent or non-published social post

2. **Removes duplicates** - Keeps only the most recent blog for each `social_post_id`

---

## Code Fixes

### Fix 1: Update `publish-scheduled` Edge Function

The scheduled publisher creates blog posts but doesn't link them to `social_posts`. I'll update it to:

- Create a `social_posts` record when publishing scheduled content
- Link the blog post to this social post via `social_post_id`
- This ensures the unpublish flow works correctly

**File:** `supabase/functions/publish-scheduled/index.ts`

```text
┌──────────────────────────────────────────────────────────────┐
│  CURRENT FLOW (broken)                                       │
│                                                              │
│  media_content_calendar → blog_posts (no social_post link)  │
│                                                              │
│  FIXED FLOW                                                  │
│                                                              │
│  media_content_calendar → social_posts → blog_posts          │
│                           (linked via social_post_id)        │
└──────────────────────────────────────────────────────────────┘
```

### Fix 2: Update `facebook-unpublish` Edge Function

Improve the unpublish logic to:

- Also check for blog posts linked via `calendar_item_id` or by matching `facebook_post_id`
- Delete **all** matching blog posts, not just one

**File:** `supabase/functions/facebook-unpublish/index.ts`

### Fix 3: Add Database Constraint

Add a unique partial index on `blog_posts.social_post_id` to prevent duplicates:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_social_post_unique 
ON blog_posts (social_post_id) 
WHERE social_post_id IS NOT NULL;
```

---

## Technical Implementation

### Step 1: Database Cleanup Migration

```sql
-- Delete orphan blog posts (no linked published social post)
DELETE FROM blog_posts
WHERE social_post_id IS NOT NULL 
AND social_post_id NOT IN (
  SELECT id FROM social_posts WHERE status = 'published'
);

-- Delete duplicates, keeping only the newest per social_post_id
DELETE FROM blog_posts a
USING blog_posts b
WHERE a.social_post_id = b.social_post_id
AND a.social_post_id IS NOT NULL
AND a.created_at < b.created_at;

-- Add constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_social_post_unique 
ON blog_posts (social_post_id) 
WHERE social_post_id IS NOT NULL;
```

### Step 2: Update `publish-scheduled` Function

Before creating a blog post, also create a `social_posts` record:

```typescript
// Create social_posts record first
const { data: socialPost } = await adminClient
  .from("social_posts")
  .insert({
    post_text: postText,
    image_url: imageUrl,
    language: "en",
    status: "published",
    published_at: new Date().toISOString(),
  })
  .select("id")
  .single();

// Then create blog post with social_post_id
const { data: blogPost } = await adminClient
  .from("blog_posts")
  .insert({
    // ... existing fields
    social_post_id: socialPost?.id,  // ← Add this link
  });
```

### Step 3: Update `facebook-unpublish` Function

Expand the blog deletion query to find all matching posts:

```typescript
// Delete ALL linked blog posts (by social_post_id OR facebook_post_id)
const { error: blogDeleteError } = await supabase
  .from("blog_posts")
  .delete()
  .or(`social_post_id.eq.${post_id},facebook_post_id.eq.${post.facebook_post_id}`);
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Cleanup orphans + add unique constraint |
| `supabase/functions/publish-scheduled/index.ts` | Create social_posts record, link to blog |
| `supabase/functions/facebook-unpublish/index.ts` | Delete all matching blogs |

---

## Expected Result

After implementation:
- Blog page will show exactly **4 posts** (matching Media Manager)
- Future publishes will always create proper linkage
- Unpublishing will clean up **all** related blog entries
- Duplicates will be prevented by database constraint
