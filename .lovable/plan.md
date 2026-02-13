

# AI Command Centre Restructure

## Overview

Restructure the AI Command Centre from 5 agent cards to a clean 3-section layout: Isabella Operations (toggle controls), AI Outreach Pipeline (existing page), and Isabella Content (existing Media Manager). No existing functionality is deleted.

## Phase 1: Database Migration

Create `isabella_settings` table with 19 function rows, RLS policies (staff read, admin/super_admin update), and an `updated_at` trigger.

**Table schema:**
- `id` UUID primary key
- `function_key` TEXT unique, not null
- `enabled` BOOLEAN default false
- `enabled_at` TIMESTAMPTZ nullable
- `enabled_by` UUID references staff(id) nullable
- `config` JSONB default '{}'
- `created_at` / `updated_at` TIMESTAMPTZ

**Seed data:** 19 function keys (all disabled except `chat_widget` which is enabled).

**RLS policies:**
- Authenticated staff can SELECT all rows (using `is_staff(auth.uid())`)
- Only admins can UPDATE (using `is_admin(auth.uid())`)

## Phase 2: New Hook -- `src/hooks/useIsabellaSettings.ts`

Provides:
- `useIsabellaSettings()` -- fetch all settings ordered by function_key
- `useIsabellaSetting(functionKey)` -- fetch single setting
- `useUpdateIsabellaSetting()` -- mutation to toggle enabled, set enabled_at/enabled_by
- `useIsabellaStats()` -- count enabled functions, interactions today (from ai_runs), escalations today (from ai_events)

## Phase 3: New Page -- `src/pages/admin/IsabellaOperationsPage.tsx`

Toggle page with 5 sections (Alert Handling, Inbound Communications, Outbound Communications, Sales and Leads, Always Human). Each toggle row shows function name, description, and Switch component. Always Human section shows Lock icons with informational text (no toggles).

## Phase 4: Rewrite `src/pages/admin/AICommandCentre.tsx`

Replace the 5 agent cards with 3 navigation cards:
1. **Isabella Operations** -- links to `/admin/ai/operations`
2. **AI Outreach Pipeline** -- links to `/admin/ai-outreach`
3. **Isabella Content** -- links to `/admin/media-manager`

Plus a Quick Stats section below.

## Phase 5: Route Update -- `src/App.tsx`

Add lazy import for `IsabellaOperationsPage` and route `ai/operations` inside the admin route group. All existing routes (ai, ai/agents/:agentKey, ai-outreach, media-manager) remain untouched.

## Phase 6: Sidebar Update -- `src/components/layout/AdminSidebar.tsx`

Add `Headphones` icon import and a second item under the "ai" menu group:
```
{ icon: Headphones, labelKey: "sidebar.isabellaOperations", path: "/admin/ai/operations" }
```

## Phase 7: Isabella Status Banner

**New component:** `src/components/admin/dashboard/IsabellaStatusBanner.tsx`
- Shows green Alert when functions are active, muted Alert in human mode
- Displays enabled function count, interactions, escalations
- "Manage" link to `/admin/ai/operations`

**Modify:** `src/pages/admin/AdminDashboard.tsx` -- add `<IsabellaStatusBanner />` after the page header, before SalesCommandStrip.

## Phase 8: Translations

Add `isabella`, `aiCommandCentre`, and `sidebar.isabellaOperations` keys to both `en.json` and `es.json` (~80 new keys per file covering all function names, descriptions, section headers, status messages, and banner text).

## Phase 9: Preservation

These files remain completely untouched:
- `src/pages/admin/AIAgentDetail.tsx`
- `src/components/admin/ai/*` (all 7 components)
- `src/hooks/useAIAgents.ts`
- Route `/admin/ai/agents/:agentKey` stays functional

## Files Summary

| Action | File |
|--------|------|
| **New** | `src/hooks/useIsabellaSettings.ts` |
| **New** | `src/pages/admin/IsabellaOperationsPage.tsx` |
| **New** | `src/components/admin/dashboard/IsabellaStatusBanner.tsx` |
| **Rewrite** | `src/pages/admin/AICommandCentre.tsx` |
| **Edit** | `src/App.tsx` (add lazy import + route) |
| **Edit** | `src/components/layout/AdminSidebar.tsx` (add menu item + icon) |
| **Edit** | `src/pages/admin/AdminDashboard.tsx` (add banner) |
| **Edit** | `src/i18n/locales/en.json` (add ~80 keys) |
| **Edit** | `src/i18n/locales/es.json` (add ~80 keys) |
| **Migration** | Create `isabella_settings` table + RLS + seed data |

