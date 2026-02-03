
# Documentation Management System

## Overview

This plan creates a comprehensive Documentation Center in the Admin Settings area where you can manage company procedures, instructions, and guides. The system will support visibility controls to share content with different dashboards (Admin, Staff, Members) and provide access to AI Agents.

---

## Features

### 1. Documentation Categories
Organize documentation by topic:
- **General Procedures** - Company-wide policies and processes
- **Member Guides** - Help articles visible to members
- **Staff Instructions** - Internal procedures for call centre staff
- **Device Guides** - EV-07B setup, troubleshooting, FAQs
- **Emergency Protocols** - SOS handling, escalation procedures
- **Partner Information** - Referral program, commission rules

### 2. Visibility Controls
Each document can be shared with multiple audiences:
- **Admin Only** - Super admin internal docs
- **Staff** - Call centre operators can view
- **Members** - Appears in member Help Center
- **AI Agents** - Automatically added to AI knowledge base

### 3. Document Properties
- **Title** - Clear, searchable name
- **Category** - Dropdown selection
- **Content** - Rich text (Markdown supported)
- **Visibility** - Multi-select: Admin, Staff, Members, AI
- **Priority/Importance** - 1-10 scale (for AI weighting)
- **Tags** - For search and filtering
- **Language** - EN/ES support
- **Status** - Draft / Published
- **Version** - Track changes

---

## Technical Architecture

### Database Table: `documentation`

```text
+---------------------+---------------------------------------------+
| Column              | Description                                 |
+---------------------+---------------------------------------------+
| id                  | UUID primary key                            |
| title               | Document title (required)                   |
| slug                | URL-friendly identifier                     |
| category            | Enum: general, member_guide, staff, device, |
|                     | emergency, partner                          |
| content             | Markdown/HTML content                       |
| visibility          | Array: ['admin', 'staff', 'member', 'ai']   |
| importance          | Integer 1-10 (for AI priority)              |
| tags                | Text array for filtering                    |
| language            | 'en' or 'es'                                |
| status              | 'draft' or 'published'                      |
| version             | Integer, auto-incremented on edit           |
| created_by          | Staff ID who created                        |
| updated_by          | Staff ID who last edited                    |
| created_at          | Timestamp                                   |
| updated_at          | Timestamp                                   |
+---------------------+---------------------------------------------+
```

### RLS Policies
- **Admins**: Full CRUD access
- **Staff**: Read access to docs with `staff` in visibility
- **Members**: Read access to docs with `member` in visibility
- **AI**: Accessed server-side through edge functions

### AI Integration
The `ai-run` edge function will be updated to:
1. Query `documentation` table for docs with `'ai'` in visibility
2. Include relevant docs in the AI's knowledge base context
3. Weight by importance score

---

## UI Components

### Admin Settings - Documentation Tab

Add a new tab to `/admin/settings`:

```text
+------------------------------------------------------------------+
| Settings                                                          |
|------------------------------------------------------------------|
| [Company] [Pricing] [Payments] [Communications] [Images] [Docs]  |
|------------------------------------------------------------------|
|                                                                   |
|  Documentation Center                                             |
|  Manage company procedures and knowledge base                     |
|                                                                   |
|  [+ Add Document]                          [Search...] [Filter v] |
|                                                                   |
|  +------------------------------------------------------------+  |
|  | Title           | Category      | Visibility | Status     |  |
|  |------------------------------------------------------------|  |
|  | SOS Protocol    | Emergency     | Staff, AI  | Published  |  |
|  | Device Setup    | Device Guide  | All        | Published  |  |
|  | Billing FAQ     | Member Guide  | Members    | Draft      |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### Document Editor Dialog

```text
+------------------------------------------+
|  Add/Edit Document                       |
|------------------------------------------|
|  Title: [_______________________]        |
|                                          |
|  Category: [General Procedures    v]     |
|                                          |
|  Content:                                |
|  +------------------------------------+  |
|  | ## Procedure Title                 |  |
|  |                                    |  |
|  | 1. Step one...                     |  |
|  | 2. Step two...                     |  |
|  +------------------------------------+  |
|                                          |
|  Visibility: [x] Admin  [x] Staff        |
|              [ ] Members [x] AI          |
|                                          |
|  Importance: [====|====] 7               |
|                                          |
|  Tags: [sos] [emergency] [protocol] [+]  |
|                                          |
|  Language: [EN v]   Status: [Published v]|
|                                          |
|  [Cancel]                    [Save]      |
+------------------------------------------+
```

---

## Integration Points

### 1. Member Help Center (`/client/support`)
- Query docs where `visibility` contains `'member'`
- Display as expandable FAQ/help articles
- Filter by category and language

### 2. Staff Dashboard
- Quick access panel to relevant procedures
- Search documentation by keyword
- Filter by category

### 3. AI Agents
- Automatic sync to AI knowledge base
- Documents with `ai` visibility are included in agent context
- Weighted by importance score

---

## Files to Create/Modify

### New Files
1. `src/components/admin/settings/DocumentationSettingsTab.tsx` - Main documentation management UI
2. `src/components/admin/settings/DocumentEditor.tsx` - Add/Edit document dialog
3. `src/hooks/useDocumentation.ts` - React Query hooks for CRUD operations

### Modified Files
1. `src/pages/admin/SettingsPage.tsx` - Add Documentation tab
2. `supabase/functions/ai-run/index.ts` - Include documentation in AI context
3. `src/pages/client/SupportPage.tsx` - Display member-visible docs in Help Center
4. `src/i18n/locales/en.json` - Add translations
5. `src/i18n/locales/es.json` - Add Spanish translations

### Database Migration
- Create `documentation` table with all columns
- Add RLS policies for role-based access
- Enable realtime for live updates

---

## User Flow

### Admin Creating Documentation
1. Navigate to Settings → Documentation
2. Click "Add Document"
3. Fill in title, category, content
4. Select visibility (Admin, Staff, Members, AI)
5. Set importance for AI weighting
6. Add tags for searchability
7. Choose language and status
8. Save document

### Member Viewing Help
1. Navigate to Support → Help Center
2. See list of published member-visible documents
3. Click to expand and read
4. Search by keyword

### AI Using Documentation
1. AI agent receives query
2. System fetches docs with `ai` visibility
3. Docs included in knowledge base context
4. AI references procedures in responses

---

## Benefits

- **Centralized Knowledge** - All procedures in one place
- **Role-Based Access** - Right content to right audience
- **AI Training** - Agents stay updated with latest procedures
- **Multi-Language** - EN/ES support built-in
- **Version Control** - Track changes over time
- **Searchable** - Tags and categories for easy discovery

