

# Ideas & Notes -- Brand Styling Upgrade + Admin Visibility

## Overview

Two changes: (1) restyle the notepad dialog with the ICE Alarm coral brand colors instead of plain white, and (2) ensure that when staff submit ideas, admins can always see them -- which already works at the data level since the query fetches all rows without a staff_id filter, but we will add a visible staff name indicator so admins know who submitted each item.

## Visual Changes

### Brand Color Upgrade (`IdeasNotepad.tsx`)

**Header area:**
- Replace `bg-gradient-to-b from-muted/40` with a coral gradient: `bg-gradient-to-b from-primary/10 via-accent to-transparent`
- Lightbulb icon container: change from `bg-yellow-500/15` to `bg-primary/15` with `text-primary` icon
- Stats strip icons get `text-primary` accent

**Add button:**
- The "Add new idea" outline button gets a coral left border accent: `border-l-4 border-l-primary/50`

**Filter tabs:**
- Active tab gets brand styling: `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`
- Tab bar background uses `bg-accent`

**Item cards:**
- Non-completed items get a subtle left border accent: `border-l-4 border-l-primary/20`
- Hover state uses brand shadow: `hover:shadow-md hover:border-l-primary/60`
- Expanded content border changes from `border-muted` to `border-primary/30`

**Empty state:**
- Icon container uses `bg-accent` with `text-primary` icon

**Add Item button:**
- Already uses primary color by default -- no change needed

### Staff Name on Each Item

- Add a small "by [Staff Name]" label next to the timestamp on each idea card
- This requires fetching staff info alongside ideas. Update the query to join `staff(first_name, last_name)` via `staff_id`
- Admins will see which staff member submitted each item

## Data Visibility (Admin sees all staff ideas)

The current `useAdminIdeas` hook already queries ALL rows from `admin_ideas` without filtering by `staff_id`. The existing RLS policy allows staff to see their own items and admins to see all. This means admins already see staff-submitted ideas -- no database changes needed.

## Technical Details

### Files Changed

| File | Action |
|------|--------|
| `src/components/admin/IdeasNotepad.tsx` | Brand color styling, add staff name display |
| `src/hooks/useAdminIdeas.ts` | Update query to join staff name via `staff_id` foreign key |

### Query Change in `useAdminIdeas.ts`

Change the select from `"*"` to `"*, staff:staff(first_name, last_name)"` so each idea includes the submitter's name. Update the `AdminIdea` type to include an optional `staff` field.

### No Database Changes

- No new tables or migrations required
- RLS policies already grant admin full visibility
- The `admin_ideas.staff_id` already references the `staff` table

