

# Add Communications Dashboard

## Overview

Create a new dashboard page as the entry point for the Communications section that provides an overview of all four communication channels: Messages, Video Hub, Media Manager, and AI Outreach.

---

## What Will Change

### 1. New Communications Dashboard Page

A dedicated dashboard at `/admin/communications` that displays:
- **Messages Overview**: Unread count, open conversations, recent activity
- **Video Hub Overview**: Projects in progress, renders queued, recent completions
- **Media Manager Overview**: Drafts awaiting approval, scheduled posts, recent publications
- **AI Outreach Overview**: Active campaigns, leads in pipeline, engagement metrics

Each section will be a clickable card that navigates to the respective sub-page.

### 2. Sidebar Navigation Update

The Communications group in the sidebar will have a new "Dashboard" item at the top:
- Dashboard (new) → `/admin/communications`
- Messages → `/admin/messages`
- Media Manager → `/admin/media-manager`
- AI Outreach → `/admin/ai-outreach`
- Video Hub → `/admin/video-hub`

### 3. Translations

New translation keys for the dashboard title and overview cards.

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/admin/CommunicationsDashboardPage.tsx` | **New** - Dashboard page with overview cards for all 4 sub-sections |
| `src/components/layout/AdminSidebar.tsx` | Add "Dashboard" item at top of Communications group |
| `src/App.tsx` | Add route for `/admin/communications` |
| `src/i18n/locales/en.json` | Add translation keys for dashboard |
| `src/i18n/locales/es.json` | Add Spanish translation keys |

---

## Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Communications Dashboard                                            │
│  Central hub for all communication channels                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ 📊 Quick Stats  │  │ 📊 Quick Stats  │  │ 📊 Quick Stats  │     │
│  │ Unread: 5       │  │ Drafts: 3       │  │ Rendering: 2    │     │
│  │ Open: 12        │  │ Approved: 8     │  │ Completed: 15   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │ 💬 Messages               │  │ 📹 Video Hub              │      │
│  │                           │  │                           │      │
│  │ Member & staff inbox      │  │ Video production hub      │      │
│  │ 5 unread · 12 open        │  │ 3 projects · 2 rendering  │      │
│  │                           │  │                           │      │
│  │ [View Messages →]         │  │ [Open Video Hub →]        │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│                                                                     │
│  ┌───────────────────────────┐  ┌───────────────────────────┐      │
│  │ 📰 Media Manager          │  │ 📣 AI Outreach            │      │
│  │                           │  │                           │      │
│  │ Social content creation   │  │ Automated lead campaigns  │      │
│  │ 3 drafts · 8 approved     │  │ 2 active · 45 leads       │      │
│  │                           │  │                           │      │
│  │ [Manage Media →]          │  │ [View Outreach →]         │      │
│  └───────────────────────────┘  └───────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technical Details

### Data Sources

The dashboard will fetch real-time metrics from:
- **Messages**: `conversations` table (count by status, unread messages)
- **Video Hub**: `video_projects` + `video_renders` tables (projects by status, active renders)
- **Media Manager**: `social_posts` table (count by status)
- **AI Outreach**: `crm_contacts` + `outreach_campaigns` tables (leads, active campaigns)

### Component Structure

```text
CommunicationsDashboardPage
├── Header (title + description)
├── QuickStatsRow (3 summary cards)
└── OverviewGrid (4 section cards)
    ├── MessagesCard
    ├── VideoHubCard  
    ├── MediaManagerCard
    └── AIOutreachCard
```

Each card will use existing hooks where available or simple queries for counts.

---

## Sidebar Update

In `AdminSidebar.tsx`, the Communications group items array will change from:

```typescript
items: [
  { icon: MessageSquare, labelKey: "sidebar.messages", path: "/admin/messages" },
  { icon: Share2, labelKey: "sidebar.mediaManager", path: "/admin/media-manager" },
  { icon: Megaphone, labelKey: "sidebar.aiOutreach", path: "/admin/ai-outreach" },
  { icon: Video, labelKey: "sidebar.videoHub", path: "/admin/video-hub" }
]
```

To:

```typescript
items: [
  { icon: LayoutDashboard, labelKey: "sidebar.communicationsDashboard", path: "/admin/communications" },
  { icon: MessageSquare, labelKey: "sidebar.messages", path: "/admin/messages" },
  { icon: Share2, labelKey: "sidebar.mediaManager", path: "/admin/media-manager" },
  { icon: Megaphone, labelKey: "sidebar.aiOutreach", path: "/admin/ai-outreach" },
  { icon: Video, labelKey: "sidebar.videoHub", path: "/admin/video-hub" }
]
```

