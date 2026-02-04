

# Fix Blog Page to Show Published Posts

## Problem Identified

The blog page shows "No articles yet" because:

1. **RLS Policy Conflict**: The `social_posts` table only allows **staff** to SELECT records
2. **Join Failure**: The `!inner` join in `useBlogPosts` requires read access to both `blog_posts` AND `social_posts`
3. **Anonymous Access Blocked**: Public visitors (unauthenticated) cannot read `social_posts`, so the join returns empty

## Solution

Two options to fix this:

### Option A: Add Public Read Policy for Published Social Posts (Recommended)

Add an RLS policy that allows anonymous users to read social posts with `status = 'published'`. This is safe since published posts are already public on Facebook.

```sql
CREATE POLICY "Anyone can read published social posts"
ON social_posts FOR SELECT
USING (status = 'published');
```

This approach:
- Keeps the blog/social post relationship intact
- Allows the `!inner` join to work for public visitors
- Only exposes already-public content (Facebook posts)
- Maintains staff-only access for non-published content

### Option B: Rewrite Query Without Join (Alternative)

Change the hook to:
1. First fetch published social post IDs
2. Then filter blog posts by those IDs

This is more complex and requires extra logic.

---

## Implementation Plan

### Step 1: Add Database Migration

Create a new RLS policy on `social_posts` to allow public read access for published posts:

```sql
-- Allow public read access to published social posts
CREATE POLICY "Anyone can read published social posts"
ON social_posts FOR SELECT
USING (status = 'published');
```

### Step 2: Verify Hook Logic

The current `useBlogPosts` query will work correctly once the RLS policy is added:

```typescript
// This will now return results for anonymous users
let query = supabase
  .from("blog_posts")
  .select(`
    *,
    social_posts!inner(id, status)
  `)
  .eq("published", true)
  .eq("social_posts.status", "published")
  .not("published_at", "is", null)
  .lte("published_at", new Date().toISOString())
  .order("published_at", { ascending: false });
```

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add RLS policy for public read of published social posts |

---

## Expected Result

After implementation:
- Blog page will display **3 blog posts** (matching the published social posts with linked blogs)
- New Facebook publications will automatically appear on the blog
- Unpublishing from Media Manager will remove posts from the blog
- Staff-only social posts (drafts, approved, failed) remain hidden from public

---

## Technical Notes

- The existing `Anyone can read published posts` policy on `blog_posts` remains unchanged
- The new policy on `social_posts` is additive (doesn't affect existing staff policies)
- This follows the principle of least privilege - only exposing what's already public

