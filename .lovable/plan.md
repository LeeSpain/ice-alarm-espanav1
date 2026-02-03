

# Published Posts Tab with Facebook Engagement Metrics

## Overview

Add a dedicated "Published" section to the Media Manager that displays all posts successfully published to Facebook, along with their real-time engagement metrics (reactions, comments, shares, reach). This includes an overview dashboard with aggregated statistics and individual post performance cards.

---

## Current State

The Media Manager currently has:
- A metrics bar showing counts (Drafts, Approved, Published, Failed)
- Ready to Publish queue for approved posts
- A table with tabs filtering by status (All, Drafts, Approved, Published, Failed)
- Post preview dialog for viewing post content

The "Published" tab in the existing table only shows basic info - no engagement metrics.

---

## What We Will Add

| Component | Description |
|-----------|-------------|
| Published Overview Card | Aggregated metrics: total posts, total reactions, total reach |
| Published Posts Grid | Cards showing each published post with engagement metrics |
| Facebook Metrics Edge Function | Backend function to fetch metrics from Facebook Graph API |
| Metrics Cache Table | Database table to store fetched metrics (avoid rate limits) |
| Refresh Metrics Button | Manual refresh to fetch latest metrics from Facebook |

---

## Architecture

```text
User clicks "Published" tab
         │
         ▼
┌─────────────────────────────────────┐
│  Published Overview (Aggregated)    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Posts│ │React│ │Reach│ │Share│   │
│  │  5  │ │ 234 │ │1.2K │ │ 45  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Published Posts Grid               │
│  ┌─────────────┐ ┌─────────────┐   │
│  │ Post Card   │ │ Post Card   │   │
│  │ [Image]     │ │ [Image]     │   │
│  │ Topic       │ │ Topic       │   │
│  │ 👍 50 💬 12 │ │ 👍 30 💬 8  │   │
│  │ 📊 View FB  │ │ 📊 View FB  │   │
│  └─────────────┘ └─────────────┘   │
└─────────────────────────────────────┘
```

---

## Implementation Stages

### Stage 1: Database - Metrics Cache Table

Create a table to cache Facebook metrics (avoid hitting API rate limits):

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `social_post_id` | uuid | FK to social_posts |
| `facebook_post_id` | text | Facebook's post ID |
| `reactions_total` | integer | Total reactions count |
| `reactions_breakdown` | jsonb | {like: 10, love: 5, ...} |
| `comments_count` | integer | Number of comments |
| `shares_count` | integer | Number of shares |
| `impressions` | integer | Post views/reach |
| `fetched_at` | timestamptz | When metrics were last fetched |

RLS: Staff can read/write.

---

### Stage 2: Edge Function - Fetch Facebook Metrics

Create `facebook-metrics` edge function that:

1. Accepts a `post_id` (social_posts.id)
2. Looks up the `facebook_post_id`
3. Calls Facebook Graph API:
   - `GET /{facebook_post_id}?fields=reactions.summary(true),comments.summary(true),shares`
   - `GET /{facebook_post_id}/insights?metric=post_impressions`
4. Stores results in `social_post_metrics` table
5. Returns the metrics

**Permissions needed**: The existing Page Access Token should work if it includes `pages_read_engagement`.

---

### Stage 3: Data Hook - usePublishedPosts

Create a new hook that:
- Fetches all published social posts with their cached metrics
- Provides a `refreshMetrics(postId)` function
- Provides a `refreshAllMetrics()` function
- Calculates aggregated totals for the overview

---

### Stage 4: UI Components

#### A. PublishedOverviewCard

Displays aggregated metrics at the top:
- Total published posts count
- Total reactions across all posts
- Total reach/impressions
- Total shares

#### B. PublishedPostCard

Individual post card showing:
- Post image thumbnail
- Topic name
- Published date
- Engagement metrics (reactions, comments, shares)
- Link to view on Facebook (opens in new tab)
- Refresh metrics button

#### C. PublishedPostsSection

Container component that:
- Shows the overview card
- Displays grid of published post cards
- Includes "Refresh All Metrics" button

---

### Stage 5: Media Manager Integration

Update `MediaManagerPage.tsx`:
- Replace current basic "published" tab behavior with the new Published section
- Add the PublishedPostsSection component
- Keep all existing functionality intact

---

### Stage 6: Translations

Add new translation keys for:
- Published overview labels
- Engagement metric labels (reactions, comments, shares, reach)
- Refresh metrics button
- View on Facebook link
- Last updated timestamp

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/facebook-metrics/index.ts` | Edge function to fetch Facebook metrics |
| `src/hooks/usePublishedPosts.ts` | Data hook for published posts with metrics |
| `src/components/admin/media/PublishedOverviewCard.tsx` | Aggregated metrics display |
| `src/components/admin/media/PublishedPostCard.tsx` | Individual post with metrics |
| `src/components/admin/media/PublishedPostsSection.tsx` | Container component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/MediaManagerPage.tsx` | Integrate PublishedPostsSection |
| `src/i18n/locales/en.json` | Add translation keys |
| `src/i18n/locales/es.json` | Add Spanish translations |

---

## Technical Details

### Facebook Graph API Calls

**Get reactions, comments, shares:**
```
GET https://graph.facebook.com/v24.0/{facebook_post_id}
  ?fields=reactions.summary(true),comments.summary(true),shares
  &access_token={page_access_token}
```

Response:
```json
{
  "reactions": { "summary": { "total_count": 50 } },
  "comments": { "summary": { "total_count": 12 } },
  "shares": { "count": 5 }
}
```

**Get impressions/reach:**
```
GET https://graph.facebook.com/v24.0/{facebook_post_id}/insights
  ?metric=post_impressions
  &access_token={page_access_token}
```

### Metrics Cache Strategy

- Cache metrics for 15 minutes minimum
- Show "Last updated X ago" timestamp
- Manual refresh button for immediate update
- Auto-refresh when viewing published tab (if cache older than 15 min)

---

## User Experience

1. User navigates to Media Manager
2. Existing "Ready to Publish" section and draft editor remain unchanged
3. In the bottom posts table, clicking "Published" tab now shows:
   - An overview card with total engagement stats
   - A grid of published posts with individual metrics
   - Each post card has View on Facebook link
4. User can click "Refresh Metrics" to fetch latest data
5. Metrics show reactions, comments, shares, and reach for each post

---

## Important Notes

- **No changes to existing features** - All current functionality preserved
- **Graceful degradation** - If Facebook API fails, show cached data with error message
- **Rate limit protection** - Metrics are cached, manual refresh only
- **Permissions** - May need to add `read_insights` permission to Facebook token for full metrics

