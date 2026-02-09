

# Facebook Integration - Full Review and Fix Plan

## Current Status

| Component | Import | Deployed? | Working? |
|-----------|--------|-----------|----------|
| `facebook-metrics` | `npm:` (fixed) | Yes | Yes -- but token is expired |
| `facebook-publish` | `esm.sh` (broken) | No (will fail to deploy) | No |
| `facebook-unpublish` | `esm.sh` (broken) | No (will fail to deploy) | No |
| `publish-scheduled` | `esm.sh` (broken) | No (will fail to deploy) | No |
| Frontend hooks | N/A | N/A | Correct |
| Database keys | `settings_` prefix | N/A | Correct |

## Issues Found

### 1. facebook-publish -- broken import (will not deploy)
**File:** `supabase/functions/facebook-publish/index.ts`
- Line 1: uses `https://deno.land/std@0.168.0/http/server.ts` (old `serve` pattern)
- Line 2: uses `https://esm.sh/@supabase/supabase-js@2` (causes bundle timeout)
- Fix: switch to `npm:@supabase/supabase-js@2` and replace `serve()` with `Deno.serve()`

### 2. facebook-unpublish -- broken import + SQL injection risk (will not deploy)
**File:** `supabase/functions/facebook-unpublish/index.ts`
- Line 1: uses `https://esm.sh/@supabase/supabase-js@2` (causes bundle timeout)
- Lines 133-142: `.or()` filter uses string interpolation with `post_id` and `facebook_post_id` -- SQL injection risk
- Fix: switch import to `npm:`, replace `.or()` with two separate safe queries

### 3. publish-scheduled -- broken import (will not deploy)
**File:** `supabase/functions/publish-scheduled/index.ts`
- Line 1: uses old `serve` import from `deno.land`
- Line 2: uses `esm.sh` import
- Fix: switch to `npm:@supabase/supabase-js@2` and `Deno.serve()`

### 4. Facebook token is expired
The test connection returned:
> "Session has expired on Wednesday, 04-Feb-26 12:00:00 PST"

This is a credentials issue on your end -- you'll need to generate a fresh Page Access Token from Facebook and update it in Settings. No code fix needed for this.

## Fix Plan

### Step 1: Fix facebook-publish (line 1-2)
```
Before:
  import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  ...
  serve(async (req) => {

After:
  import { createClient } from "npm:@supabase/supabase-js@2";
  ...
  Deno.serve(async (req) => {
```

### Step 2: Fix facebook-unpublish (line 1 + lines 133-142)
```
Before:
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

After:
  import { createClient } from "npm:@supabase/supabase-js@2";
```

Replace unsafe `.or()` blog lookup (lines 133-142) with two separate safe queries:
```typescript
// Query by social_post_id
const { data: blogsBySocial } = await supabase
  .from("blog_posts")
  .select("id")
  .eq("social_post_id", post_id);

// Query by facebook_post_id if available
let blogsByFb: { id: string }[] = [];
if (post.facebook_post_id) {
  const { data } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("facebook_post_id", post.facebook_post_id);
  blogsByFb = data || [];
}

// Merge unique IDs
const allBlogIds = [...new Set([
  ...(blogsBySocial || []).map(b => b.id),
  ...blogsByFb.map(b => b.id),
])];
```

### Step 3: Fix publish-scheduled (lines 1-2)
Same import fix pattern as facebook-publish.

### Step 4: Deploy all three functions
Deploy `facebook-publish`, `facebook-unpublish`, and `publish-scheduled` together.

## After Deployment -- Action Required from You

Your Facebook Page Access Token expired on Feb 4, 2026. To restore full functionality:
1. Go to Admin Settings
2. Navigate to the Facebook/Integrations section
3. Generate a new Page Access Token from Meta Business Suite
4. Paste it in and save

Once the token is refreshed, all Facebook features (publish, unpublish, metrics, scheduled publishing) will be fully operational.

