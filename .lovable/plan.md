

# Fix Facebook Configuration Save and Failed Post Retry

## Problem Analysis

After thorough investigation, I found **two separate issues**:

### Issue 1: Save IS Working (No Bug Here)
The Facebook configuration **is saving correctly**. Database evidence:
- `settings_facebook_page_id` = `107949497473966` (saved at 18:19:46)
- `settings_facebook_page_access_token` = valid 280-char token (saved at 18:19:46)

The error you're seeing in the UI (`#210: A page access token is required`) is from a **previous failed publish attempt** at 18:14:32 - which was BEFORE you saved the correct credentials at 18:19:46.

### Issue 2: Failed Posts Cannot Be Re-Published (BUG)
Once a post fails, its status is `failed`. The `facebook-publish` edge function **rejects any post that isn't `approved`**:

```typescript
// Line 86-93 of facebook-publish/index.ts
if (post.status !== "approved") {
  return new Response(JSON.stringify({ 
    error: "Post must be approved before publishing",
    current_status: post.status 
  }), { status: 400 });
}
```

**There's no UI mechanism to re-approve a failed post** - the Approve button only shows for `draft` status posts.

## Solution

### Fix 1: Add "Retry" Functionality for Failed Posts
Allow failed posts to be re-approved so they can be published again with corrected credentials.

**Changes to `useSocialPosts.ts`:**
- Modify `approveMutation` to also accept `failed` status posts (or create a separate `retryMutation`)
- This allows changing `failed` → `approved` so publishing can be attempted again

**Changes to `MediaManagerPage.tsx`:**
- Add a "Retry" button for failed posts in the table
- Show the error message to help users understand why it failed
- Clear the error when re-approving

### Fix 2: Improve Error Visibility
When a post fails, the error message should be more visible:
- Display `error_message` in a tooltip or inline in the table
- Show it in the post preview dialog
- Add a dedicated "Failed Posts" section or highlight them in the Ready to Publish area

## Implementation Steps

### Step 1: Update useSocialPosts Hook
**File:** `src/hooks/useSocialPosts.ts`

Add a `retryPost` mutation that:
1. Clears the `error_message` field
2. Sets status back to `approved`
3. Allows the post to be re-published

```typescript
// Add retryMutation after approveMutation
const retryMutation = useMutation({
  mutationFn: async (id: string) => {
    const { data: post, error } = await supabase
      .from("social_posts")
      .update({
        status: "approved",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return post as SocialPost;
  },
  onSuccess: (post) => {
    queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    queryClient.invalidateQueries({ queryKey: ["approved-posts"] });
    queryClient.invalidateQueries({ queryKey: ["social-post-metrics"] });
    toast({ title: "Post ready for retry", description: "You can now attempt to publish again." });
  },
  // ... error handling
});
```

### Step 2: Add Retry Button to MediaManagerPage
**File:** `src/pages/admin/MediaManagerPage.tsx`

In the existing posts table, add a "Retry" button for failed posts:

```tsx
{post.status === "failed" && (
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => retryPost(post.id)}
    disabled={isRetrying}
  >
    <RefreshCw className="h-4 w-4 mr-1" />
    Retry
  </Button>
)}
```

### Step 3: Show Error Message in Table
**File:** `src/pages/admin/MediaManagerPage.tsx`

Add a column or tooltip showing the error message for failed posts:

```tsx
{post.status === "failed" && post.error_message && (
  <Tooltip>
    <TooltipTrigger>
      <AlertCircle className="h-4 w-4 text-destructive" />
    </TooltipTrigger>
    <TooltipContent>
      <p className="max-w-xs">{post.error_message}</p>
    </TooltipContent>
  </Tooltip>
)}
```

### Step 4: Add Translation Keys
**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/es.json`

Add keys for retry functionality:
- `mediaManager.actions.retry`: "Retry"
- `mediaManager.status.retryReady`: "Post ready for retry"
- `mediaManager.errors.publishFailed`: "Publishing failed"

### Step 5: Update PostPreviewDialog
**File:** `src/components/admin/media/PostPreviewDialog.tsx`

Show error message if the post has one, and change the Publish button to "Retry" for failed posts.

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSocialPosts.ts` | Add `retryPost` mutation with cache invalidation |
| `src/pages/admin/MediaManagerPage.tsx` | Add Retry button, show error messages |
| `src/components/admin/media/PostPreviewDialog.tsx` | Show error, support retry action |
| `src/i18n/locales/en.json` | Add retry translation keys |
| `src/i18n/locales/es.json` | Add retry translation keys (Spanish) |

## Summary

**Your Facebook credentials ARE saved correctly.** The issue is that:
1. The post failed BEFORE you saved the correct credentials
2. Failed posts currently cannot be re-published

The fix adds a "Retry" mechanism that:
- Clears the error message
- Sets the post back to "approved" status
- Allows you to attempt publishing again with the now-correct credentials

