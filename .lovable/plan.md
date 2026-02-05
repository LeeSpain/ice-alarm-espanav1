

# Video Hub Implementation Plan

## Overview

This plan adds a new "Video Hub" feature under the Communications section of the admin dashboard. Video Hub will be a dedicated area for creating, managing, and exporting short-form videos for ICE Alarm Espana marketing - separate from Media Manager.

The implementation follows a staged approach across 6 phases, with full bilingual support (EN/ES) from day one.

---

## Stage 1: Navigation + Routes

### 1.1 Update Admin Sidebar

**File:** `src/components/layout/AdminSidebar.tsx`

Add Video Hub as the 4th item in the Communications group (index 4 in menuGroups array):

```typescript
{
  id: "communications",
  icon: MessageSquare,
  labelKey: "sidebar.communications",
  items: [
    { icon: MessageSquare, labelKey: "sidebar.messages", path: "/admin/messages" },
    { icon: Share2, labelKey: "sidebar.mediaManager", path: "/admin/media-manager" },
    { icon: Megaphone, labelKey: "sidebar.aiOutreach", path: "/admin/ai-outreach" },
    { icon: Video, labelKey: "sidebar.videoHub", path: "/admin/video-hub" }  // NEW
  ]
}
```

- Import `Video` icon from lucide-react

### 1.2 Add Route

**File:** `src/App.tsx`

Add lazy import and route:
```typescript
const VideoHubPage = lazy(() => import("./pages/admin/VideoHubPage"));

// Inside admin routes (after ai-outreach)
<Route path="video-hub" element={<VideoHubPage />} />
```

### 1.3 Add Translation Keys

**Files:** `src/i18n/locales/en.json` and `src/i18n/locales/es.json`

Add to sidebar section:
```json
// en.json
"videoHub": "Video Hub"

// es.json  
"videoHub": "Centro de Video"
```

---

## Stage 2: Video Hub Page UI Skeleton

### 2.1 Create Main Page Component

**File:** `src/pages/admin/VideoHubPage.tsx`

Structure:
- Header with Video icon, title, "New Video" button, search input, filters
- Tabs component with 5 tabs: Projects, Create Video, Templates, Exports, Settings
- Each tab renders a dedicated component

```typescript
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, Plus, Search, HelpCircle, FolderOpen, Wand2, Layout, Download, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VideoProjectsTab } from "@/components/admin/video-hub/VideoProjectsTab";
import { VideoCreateTab } from "@/components/admin/video-hub/VideoCreateTab";
import { VideoTemplatesTab } from "@/components/admin/video-hub/VideoTemplatesTab";
import { VideoExportsTab } from "@/components/admin/video-hub/VideoExportsTab";
import { VideoSettingsTab } from "@/components/admin/video-hub/VideoSettingsTab";
```

### 2.2 Create Tab Components

**Directory:** `src/components/admin/video-hub/`

Create the following components:

| Component | Purpose |
|-----------|---------|
| `VideoProjectsTab.tsx` | Table/grid of video projects with Name, Template, Language, Format, Duration, Status, Last edited, Actions |
| `VideoCreateTab.tsx` | 5-step wizard: Template → Format → Content → Assets → Preview |
| `VideoTemplatesTab.tsx` | Display locked ICE templates with variants |
| `VideoExportsTab.tsx` | List of generated exports with download buttons |
| `VideoSettingsTab.tsx` | Brand settings (logo, colors, disclaimers) |

### 2.3 Projects Tab Details

Display columns:
- Name
- Template (from video_templates)
- Language (EN/ES badge)
- Format (9:16 / 16:9 / 1:1)
- Duration (10s / 15s / 30s / 60s)
- Status (Draft / Approved / Archived)
- Last Edited (date)
- Actions: Open, Duplicate, Approve, Archive

### 2.4 Create Video Wizard Steps

**Step 1 - Choose Template:**
- Card grid showing available templates
- Each card shows template name, description, preview thumbnail

**Step 2 - Format & Duration:**
- Radio group: 9:16 (Portrait/Stories), 16:9 (Landscape), 1:1 (Square)
- Duration selector: 10s, 15s, 30s, 60s

**Step 3 - Content Form:**
- Headline input
- 3-6 bullet points (dynamic add/remove)
- CTA button text
- Contact line (phone/WhatsApp/web)
- Disclaimer toggle (ICE-approved blocks)
- Language selector: English / Espanol

**Step 4 - Asset Picker:**
- Logo display (locked, read-only)
- Background image/video upload (optional)
- Product icon selector (SOS/Dosell/Vivago/etc.)

**Step 5 - Preview & Render:**
- Preview placeholder area
- "Render Video" button (wired in Stage 4)
- Save as Draft button

### 2.5 Templates Tab

Display initial ICE templates:
1. Calm Problem → Solution → CTA (15s)
2. How SOS Works (30s)
3. Service Overview (45–60s)
4. Device Focus (15–30s)
5. Reassurance / Trust (20–30s)

Each template shows:
- Name and description
- Supported formats and durations
- Spanish/English availability badge

### 2.6 Exports Tab

Table columns:
- Thumbnail (image)
- Title
- Date created
- Format
- Language
- Actions: Download MP4, Download Captions (SRT/VTT), "Send to AI Outreach"

### 2.7 Settings Tab

Brand configuration (ICE only):
- Logo URL display (locked)
- Brand colors display (locked)
- Watermark toggle
- Default disclaimers for EN and ES (editable textareas)
- Default CTAs for EN and ES (editable inputs)

### 2.8 UI Style: Healthcare Trust

- Clean, calm layout with generous spacing
- Readable typography (larger fonts, high contrast)
- Accessibility-first (proper focus states, ARIA labels)
- Captions-first mentality in all video previews
- Avoid flashy animations - use subtle transitions

---

## Stage 3: Database + Storage

### 3.1 Create Tables (Migration)

**Table: `video_projects`**
```sql
CREATE TABLE video_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES video_templates(id),
  language TEXT NOT NULL CHECK (language IN ('en', 'es', 'both')),
  format TEXT NOT NULL CHECK (format IN ('9:16', '16:9', '1:1')),
  duration INTEGER NOT NULL, -- seconds
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  data_json JSONB NOT NULL DEFAULT '{}', -- stores headline, bullets, cta, etc.
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can CRUD all projects
CREATE POLICY "Staff can manage video projects" ON video_projects
  FOR ALL USING (public.is_staff(auth.uid()));
```

**Table: `video_templates`**
```sql
CREATE TABLE video_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  schema_json JSONB NOT NULL DEFAULT '{}', -- defines form fields, structure
  allowed_formats TEXT[] DEFAULT ARRAY['9:16', '16:9', '1:1'],
  allowed_durations INTEGER[] DEFAULT ARRAY[15, 30, 60],
  thumbnail_url TEXT,
  is_locked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can read templates
CREATE POLICY "Staff can read video templates" ON video_templates
  FOR SELECT USING (public.is_staff(auth.uid()));
```

**Table: `video_renders`**
```sql
CREATE TABLE video_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'failed', 'done')),
  progress INTEGER DEFAULT 0, -- 0-100
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_renders ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can manage renders
CREATE POLICY "Staff can manage video renders" ON video_renders
  FOR ALL USING (public.is_staff(auth.uid()));
```

**Table: `video_exports`**
```sql
CREATE TABLE video_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES video_projects(id) ON DELETE CASCADE,
  render_id UUID REFERENCES video_renders(id),
  mp4_url TEXT,
  srt_url TEXT,
  vtt_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_exports ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can manage exports
CREATE POLICY "Staff can manage video exports" ON video_exports
  FOR ALL USING (public.is_staff(auth.uid()));
```

**Table: `video_brand_settings`**
```sql
CREATE TABLE video_brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#B91C1C',
  secondary_color TEXT DEFAULT '#1E3A8A',
  font_family TEXT DEFAULT 'Inter',
  watermark_enabled BOOLEAN DEFAULT true,
  disclaimers_en TEXT DEFAULT 'ICE Alarm España is a monitoring service...',
  disclaimers_es TEXT DEFAULT 'ICE Alarm España es un servicio de monitoreo...',
  default_cta_en TEXT DEFAULT 'Call Now',
  default_cta_es TEXT DEFAULT 'Llama Ahora',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE video_brand_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can read/update settings
CREATE POLICY "Staff can manage video brand settings" ON video_brand_settings
  FOR ALL USING (public.is_staff(auth.uid()));

-- Insert singleton row
INSERT INTO video_brand_settings (id) VALUES (gen_random_uuid());
```

### 3.2 Seed Templates

```sql
INSERT INTO video_templates (name, description, allowed_durations, schema_json) VALUES
('Calm Problem → Solution → CTA', 'A calm, reassuring template that presents a problem and offers ICE Alarm as the solution', ARRAY[15], '{"sections": ["problem", "solution", "cta"]}'),
('How SOS Works', 'Step-by-step walkthrough of the SOS pendant functionality', ARRAY[30], '{"sections": ["intro", "step1", "step2", "step3", "cta"]}'),
('Service Overview', 'Comprehensive overview of all ICE Alarm services', ARRAY[45, 60], '{"sections": ["intro", "services", "benefits", "cta"]}'),
('Device Focus', 'Highlight specific device features and capabilities', ARRAY[15, 30], '{"sections": ["device", "features", "cta"]}'),
('Reassurance / Trust', 'Build trust with testimonials and reassurance messaging', ARRAY[20, 30], '{"sections": ["intro", "trust", "reassurance", "cta"]}');
```

### 3.3 Create Storage Bucket

Create a new public bucket: `video-hub-exports`

This keeps Video Hub assets completely separate from Media Manager storage.

---

## Stage 4: Rendering Integration (Stub)

### 4.1 Create Render Queue Edge Function

**File:** `supabase/functions/video-render-queue/index.ts`

```typescript
// Queue a render job
// Input: { project_id: string }
// Output: { render_id: string, status: "queued" }

// Creates a record in video_renders with status = "queued"
// In production, this would trigger an external worker service
// For now, simulates completion after a short delay
```

### 4.2 Create Hook for Video Projects

**File:** `src/hooks/useVideoProjects.ts`

```typescript
// CRUD operations for video_projects
// - fetchProjects (with filters)
// - createProject
// - updateProject
// - duplicateProject
// - archiveProject
// - approveProject
```

### 4.3 Create Hook for Video Renders

**File:** `src/hooks/useVideoRenders.ts`

```typescript
// - queueRender(projectId)
// - getRenderStatus(renderId)
// - subscribeToRenderUpdates (realtime)
```

### 4.4 UI Status Updates

- Projects tab shows render status badge when render is in progress
- Progress bar shows 0-100% completion
- Exports tab auto-refreshes when render completes

---

## Stage 5: Optional Link to AI Outreach

### 5.1 Add "Send to AI Outreach" Button

In `VideoExportsTab.tsx`, add button for each export:
- Creates a reference record linking the export to AI Outreach campaigns
- Does NOT move or delete the original file
- Shows success toast: "Export linked to AI Outreach"

### 5.2 Create Link Table (Optional)

```sql
CREATE TABLE video_outreach_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES video_exports(id),
  campaign_id UUID, -- optional link to outreach campaign
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Stage 6: Polish & QA

### 6.1 Bilingual Completeness

All new translation keys added to both `en.json` and `es.json`:
- `videoHub.*` namespace for all Video Hub strings
- Form labels, button texts, status badges, error messages
- Help dialog content

### 6.2 Healthcare Trust Visual Consistency

- Use existing color palette (red-700 primary, blue-900 secondary)
- Generous padding and spacing
- Large, readable fonts
- Clear visual hierarchy
- Subtle hover/focus states

### 6.3 Permissions

- Video Hub visible only to staff (admin/super_admin)
- Uses existing `is_staff()` RLS function
- ProtectedRoute wrapper already in place via AdminLayout

### 6.4 No Regressions

- Media Manager code untouched
- Separate tables, hooks, components
- No shared state or side effects

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/admin/VideoHubPage.tsx` | Main Video Hub page |
| `src/components/admin/video-hub/VideoProjectsTab.tsx` | Projects listing |
| `src/components/admin/video-hub/VideoCreateTab.tsx` | Create video wizard |
| `src/components/admin/video-hub/VideoTemplatesTab.tsx` | Templates gallery |
| `src/components/admin/video-hub/VideoExportsTab.tsx` | Exports list |
| `src/components/admin/video-hub/VideoSettingsTab.tsx` | Brand settings |
| `src/components/admin/video-hub/VideoHelpDialog.tsx` | Help/guide dialog |
| `src/hooks/useVideoProjects.ts` | Projects CRUD hook |
| `src/hooks/useVideoTemplates.ts` | Templates read hook |
| `src/hooks/useVideoRenders.ts` | Render queue hook |
| `src/hooks/useVideoExports.ts` | Exports CRUD hook |
| `src/hooks/useVideoBrandSettings.ts` | Brand settings hook |
| `supabase/functions/video-render-queue/index.ts` | Render queue function |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/AdminSidebar.tsx` | Add Video Hub menu item |
| `src/App.tsx` | Add Video Hub route |
| `src/i18n/locales/en.json` | Add videoHub translations |
| `src/i18n/locales/es.json` | Add videoHub translations |

### Database Migrations

1. Create `video_templates` table + seed data
2. Create `video_projects` table with RLS
3. Create `video_renders` table with RLS
4. Create `video_exports` table with RLS
5. Create `video_brand_settings` table with RLS + singleton row
6. Create `video_outreach_links` table (optional)
7. Create storage bucket `video-hub-exports`

---

## Translation Keys Preview

```json
{
  "videoHub": {
    "title": "Video Hub",
    "subtitle": "Create and manage marketing videos",
    "newVideo": "New Video",
    "search": "Search videos...",
    "tabs": {
      "projects": "Projects",
      "create": "Create Video",
      "templates": "Templates",
      "exports": "Exports",
      "settings": "Settings"
    },
    "projects": {
      "name": "Name",
      "template": "Template",
      "language": "Language",
      "format": "Format",
      "duration": "Duration",
      "status": "Status",
      "lastEdited": "Last Edited",
      "actions": "Actions",
      "open": "Open",
      "duplicate": "Duplicate",
      "approve": "Approve",
      "archive": "Archive",
      "noProjects": "No video projects yet",
      "createFirst": "Create your first video"
    },
    "create": {
      "step1": "Choose Template",
      "step2": "Format & Duration",
      "step3": "Content",
      "step4": "Assets",
      "step5": "Preview",
      "headline": "Headline",
      "bulletPoints": "Bullet Points",
      "addBullet": "Add Bullet",
      "ctaText": "CTA Button Text",
      "contactLine": "Contact Line",
      "disclaimer": "Include Disclaimer",
      "selectLanguage": "Select Language",
      "render": "Render Video",
      "saveDraft": "Save as Draft"
    },
    "templates": {
      "calmProblemSolution": "Calm Problem → Solution → CTA",
      "howSosWorks": "How SOS Works",
      "serviceOverview": "Service Overview",
      "deviceFocus": "Device Focus",
      "reassuranceTrust": "Reassurance / Trust",
      "locked": "ICE Template"
    },
    "exports": {
      "thumbnail": "Thumbnail",
      "dateCreated": "Date Created",
      "downloadMp4": "Download MP4",
      "downloadSrt": "Download SRT",
      "downloadVtt": "Download VTT",
      "sendToOutreach": "Send to AI Outreach",
      "noExports": "No exports yet"
    },
    "settings": {
      "brandRules": "Brand Rules",
      "logo": "Logo",
      "colors": "Colors",
      "watermark": "Watermark",
      "watermarkEnabled": "Show watermark on videos",
      "disclaimers": "Default Disclaimers",
      "disclaimersEn": "English Disclaimer",
      "disclaimersEs": "Spanish Disclaimer",
      "defaultCtas": "Default CTAs",
      "ctaEn": "English CTA",
      "ctaEs": "Spanish CTA"
    },
    "formats": {
      "portrait": "Portrait (9:16)",
      "landscape": "Landscape (16:9)",
      "square": "Square (1:1)"
    },
    "durations": {
      "10s": "10 seconds",
      "15s": "15 seconds",
      "30s": "30 seconds",
      "60s": "60 seconds"
    },
    "statuses": {
      "draft": "Draft",
      "approved": "Approved",
      "archived": "Archived",
      "queued": "Queued",
      "running": "Rendering",
      "failed": "Failed",
      "done": "Complete"
    },
    "help": {
      "title": "Video Hub Guide",
      "howToUse": "How to Use"
    }
  }
}
```

