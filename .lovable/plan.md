

# Admin Ideas & Notes Pad

## What We're Building

A "Lightbulb" icon button in the admin header bar that opens a professional popup (Dialog) where you can capture app ideas, notes, and checklists. Everything persists in the database so nothing gets lost between sessions.

## Database

Create a new `admin_ideas` table:

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID PK | |
| staff_id | UUID (FK staff) | Who created it |
| title | TEXT | Idea/note title |
| content | TEXT | Rich text body |
| category | TEXT | "idea", "bug", "feature", "note" |
| priority | TEXT | "low", "medium", "high" |
| is_checklist | BOOLEAN | Whether this is a checklist item |
| completed | BOOLEAN | Checklist done state |
| position | INTEGER | Sort order |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

RLS: Staff can CRUD their own rows. Admins/super_admins can see all.

## New Files

### 1. `src/components/admin/IdeasNotepad.tsx`
A Dialog component containing:
- **Header**: Title "Ideas & Notes" with category filter tabs (All / Ideas / Features / Bugs / Notes)
- **Add form**: Title input, category selector, priority badge picker, and a text area for content
- **Toggle**: Switch between "Note" and "Checklist" mode
- **List**: Scrollable list of saved items, each showing:
  - Checkbox (for checklist items)
  - Title + priority badge
  - Category tag
  - Expand/collapse for content
  - Delete button
- **Filters**: Filter by category, priority, or completion status
- **Counter badge**: Shows total uncompleted items on the header icon

### 2. `src/hooks/useAdminIdeas.ts`
- `useQuery` to fetch ideas for the current staff member
- `useMutation` for create, update (toggle complete, edit), delete
- Optimistic updates for instant checkbox toggling

## Changes to Existing Files

### `src/components/layout/AdminHeader.tsx`
- Import `Lightbulb` icon from lucide-react
- Add a button between NotificationBell and User Menu that opens the IdeasNotepad dialog
- Show a small count badge if there are uncompleted checklist items

## UI Design

The dialog will follow the existing app design system:
- Uses shadcn Card, Badge, Checkbox, Tabs, ScrollArea, Dialog components
- Dark-friendly with muted backgrounds
- Compact but readable layout
- Smooth transitions for expanding/collapsing notes

## Technical Details

| File | Action |
|------|--------|
| Migration SQL | Create `admin_ideas` table + RLS policies |
| `src/hooks/useAdminIdeas.ts` | New hook for CRUD operations |
| `src/components/admin/IdeasNotepad.tsx` | New dialog component |
| `src/components/layout/AdminHeader.tsx` | Add lightbulb button |

