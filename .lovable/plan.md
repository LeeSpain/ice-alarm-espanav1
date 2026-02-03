
# Blog System Implementation Plan

This plan implements a complete blog system integrated with Facebook publishing, including database schema, public pages, SEO optimization, and sitemap generation across 6 stages.

---

## Overview

| Stage | Feature | Description |
|-------|---------|-------------|
| 1 | Database | Create `blog_posts` table with all required fields |
| 2 | Public Pages | `/blog` list page and `/blog/:slug` detail page |
| 3 | SEO Metadata | Dynamic title, description, Open Graph, canonical URLs |
| 4 | Facebook Integration | Auto-create blog post when publishing to Facebook |
| 5 | Navigation | Add Blog to nav and homepage "Latest from ICE Alarm" section |
| 6 | Sitemap | Generate sitemap.xml including all blog posts |

---

## Stage 1: Database Schema

### New Table: `blog_posts`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Primary key |
| `title` | text | NOT NULL | Post title |
| `slug` | text | UNIQUE, NOT NULL | URL-safe slug |
| `excerpt` | text | nullable | Short summary for lists |
| `content` | text | NOT NULL | Full post content |
| `language` | text | default 'en' | en, es, or both |
| `published` | boolean | default true | Visibility flag |
| `published_at` | timestamptz | default now() | Publication date |
| `facebook_post_id` | text | nullable | Link to Facebook post |
| `social_post_id` | uuid | nullable | Link to social_posts table |
| `image_url` | text | nullable | Featured image |
| `seo_title` | text | nullable | Custom SEO title |
| `seo_description` | text | nullable | Custom meta description |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `updated_at` | timestamptz | default now() | Last update |

### Indexes

- `blog_posts_slug_idx` on `slug` (unique)
- `blog_posts_published_at_idx` on `published_at DESC` for list queries

### RLS Policies

- **Public read**: Anyone can SELECT where `published = true`
- **Staff write**: Only authenticated staff can INSERT/UPDATE/DELETE

---

## Stage 2: Public Blog Pages

### File Structure

```text
src/pages/blog/
  BlogListPage.tsx      -- /blog route
  BlogPostPage.tsx      -- /blog/:slug route
src/hooks/
  useBlogPosts.ts       -- Query hooks for blog data
```

### `/blog` - Blog List Page

- Fetches published posts ordered by `published_at DESC`
- Displays: title, excerpt, published date, optional image thumbnail
- Click-through links to `/blog/:slug`
- Uses existing design patterns (Card components, responsive grid)
- Includes header/footer from public pages

### `/blog/:slug` - Blog Post Page

- Fetches single post by slug
- Renders:
  - H1 title
  - Published date with formatting
  - Featured image (if present)
  - Content with preserved line breaks and formatting
  - Language indicator
- 404 handling for invalid slugs

### Route Registration

Add to `App.tsx`:
```typescript
const BlogListPage = lazy(() => import("./pages/blog/BlogListPage"));
const BlogPostPage = lazy(() => import("./pages/blog/BlogPostPage"));

// In Routes
<Route path="/blog" element={<BlogListPage />} />
<Route path="/blog/:slug" element={<BlogPostPage />} />
```

---

## Stage 3: SEO Metadata

### New Component: `SEOHead`

Creates a reusable component to dynamically update document head:

```typescript
// src/components/seo/SEOHead.tsx
interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  publishedTime?: string;
}
```

Uses `useEffect` to manipulate DOM directly (no additional dependencies needed):

```typescript
useEffect(() => {
  document.title = title;
  
  // Update or create meta tags
  updateMetaTag('description', description);
  updateMetaTag('og:title', title, 'property');
  updateMetaTag('og:description', description, 'property');
  // ... etc
}, [title, description]);
```

### Blog List Page SEO

- Title: "ICE Alarm Blog - Safety, Care & Updates"
- Description: "Read the latest articles about personal safety, elderly care, and emergency response from ICE Alarm Espana."
- og:type: website

### Blog Post Page SEO

- Title: `post.seo_title || post.title`
- Description: `post.seo_description || post.excerpt || post.content.substring(0, 150)`
- og:type: article
- Canonical URL: `https://shelter-span.lovable.app/blog/${post.slug}`
- Published time for article schema

---

## Stage 4: Facebook + Blog Integration

### Modify `facebook-publish` Edge Function

When a social post is successfully published to Facebook:

1. Generate blog post data from the social post
2. Create a new row in `blog_posts`
3. Store the `facebook_post_id` on both records
4. Link via `social_post_id` foreign key

### Slug Generation

```typescript
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}
```

If slug exists, append timestamp: `my-post-1706969400000`

### Title Extraction

```typescript
function extractTitle(postText: string): string {
  // First sentence or first 60 characters
  const firstSentence = postText.split(/[.!?]/)[0];
  return firstSentence.length > 60 
    ? firstSentence.substring(0, 57) + '...' 
    : firstSentence;
}
```

### Error Handling

- Blog creation is wrapped in try/catch
- Blog post creation failure does NOT fail the Facebook publish
- Error is logged but success is still returned
- Can always create blog post manually later

### Updated Edge Function Flow

```text
1. Validate staff authentication
2. Fetch social post from database
3. Verify status is "approved"
4. Publish to Facebook API
5. If Facebook succeeds:
   a. Create blog post with generated content
   b. Update social_post with facebook_post_id
   c. Return success with both IDs
6. If Facebook fails:
   a. Update social_post status to "failed"
   b. Return error
```

---

## Stage 5: Navigation & Homepage

### Main Navigation Update

Modify `LandingPage.tsx` header nav:

```tsx
<nav className="hidden md:flex items-center gap-6">
  <a href="#features">Features</a>
  <Link to="/pendant">Pendant</Link>
  <Link to="/blog">Blog</Link>  {/* NEW */}
  <a href="#pricing">Pricing</a>
  <Link to="/contact">Contact</Link>
</nav>
```

### Homepage Section: "Latest from ICE Alarm"

Add new section between Pricing and Footer:

```tsx
<section className="py-20 px-4 bg-muted/30">
  <div className="container mx-auto">
    <h2>Latest from ICE Alarm</h2>
    <p>Stay informed with our latest updates</p>
    
    <div className="grid md:grid-cols-3 gap-6">
      {latestPosts.slice(0, 3).map(post => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
    
    <Button asChild>
      <Link to="/blog">View All Articles</Link>
    </Button>
  </div>
</section>
```

### Translation Keys

Add to `en.json` and `es.json`:

```json
{
  "blog": {
    "title": "Blog",
    "latestFrom": "Latest from ICE Alarm",
    "viewAll": "View All Articles",
    "readMore": "Read More",
    "postedOn": "Posted on",
    "noPostsYet": "No articles yet. Check back soon!"
  }
}
```

---

## Stage 6: Sitemap Generation

### New Edge Function: `generate-sitemap`

Creates a Deno edge function that generates XML sitemap:

```typescript
// supabase/functions/generate-sitemap/index.ts

const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/pendant', priority: 0.9, changefreq: 'monthly' },
  { path: '/blog', priority: 0.8, changefreq: 'daily' },
  { path: '/contact', priority: 0.6, changefreq: 'monthly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
];

// Fetch published blog posts
const { data: posts } = await adminClient
  .from('blog_posts')
  .select('slug, updated_at')
  .eq('published', true);

// Generate XML
const xml = generateSitemapXml([
  ...staticPages,
  ...posts.map(p => ({
    path: `/blog/${p.slug}`,
    priority: 0.7,
    changefreq: 'monthly',
    lastmod: p.updated_at
  }))
]);

return new Response(xml, {
  headers: { 'Content-Type': 'application/xml' }
});
```

### Vercel Rewrite for Sitemap

Update `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "https://pduhccavshrhfkfbjgmj.supabase.co/functions/v1/generate-sitemap"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Update robots.txt

```text
Sitemap: https://shelter-span.lovable.app/sitemap.xml

User-agent: *
Allow: /
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/blog/BlogListPage.tsx` | Public blog listing page |
| `src/pages/blog/BlogPostPage.tsx` | Individual blog post page |
| `src/hooks/useBlogPosts.ts` | Blog data query hooks |
| `src/components/seo/SEOHead.tsx` | Dynamic meta tag management |
| `src/components/blog/BlogCard.tsx` | Reusable blog post card |
| `supabase/functions/generate-sitemap/index.ts` | Sitemap XML generator |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add blog routes |
| `src/pages/LandingPage.tsx` | Add nav link + latest posts section |
| `src/i18n/locales/en.json` | Add blog translations |
| `src/i18n/locales/es.json` | Add blog translations (Spanish) |
| `supabase/functions/facebook-publish/index.ts` | Add blog post creation |
| `vercel.json` | Add sitemap rewrite |
| `public/robots.txt` | Add sitemap reference |

---

## Technical Details

### Database Migration SQL

```sql
-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  language text DEFAULT 'en',
  published boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  facebook_post_id text,
  social_post_id uuid REFERENCES social_posts(id) ON DELETE SET NULL,
  image_url text,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);
CREATE INDEX blog_posts_published_at_idx ON public.blog_posts (published_at DESC);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can read published posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true);

-- Staff write policy
CREATE POLICY "Staff can manage blog posts"
  ON public.blog_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.user_id = auth.uid() 
      AND staff.is_active = true
    )
  );
```

### SEO Component Implementation

```typescript
// Core pattern for SEOHead component
const updateMetaTag = (name: string, content: string, attr = 'name') => {
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};
```

---

## Implementation Order

1. **Stage 1**: Run database migration to create `blog_posts` table
2. **Stage 2**: Create blog pages and hooks (can test with manual DB inserts)
3. **Stage 3**: Add SEO component and integrate with blog pages
4. **Stage 4**: Update `facebook-publish` edge function for dual-publish
5. **Stage 5**: Add navigation and homepage section
6. **Stage 6**: Create sitemap function and update vercel.json

This order ensures each stage can be tested independently before moving to the next.
