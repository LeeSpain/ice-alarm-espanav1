

## Courtesy Calls Feature Completion Plan

### Issue 1: Fix CRMTab - CourtesyCallsCard Not Visible for All Members

**Problem:** The `CourtesyCallsCard` is only rendered when there IS CRM profile or import data. If a member has neither, the component returns an empty state and never shows the courtesy calls toggle.

**Fix in `src/components/admin/member-detail/CRMTab.tsx`:**
- Move the `CourtesyCallsCard` OUTSIDE the conditional check for CRM data
- Always show the courtesy calls card for every member regardless of CRM profile status
- Update the empty state logic to still show the courtesy calls card above it

```tsx
// BEFORE (buggy):
if (!profile && !importRow) {
  return (
    <Card>/* Empty state - CourtesyCallsCard never renders! */</Card>
  );
}

// AFTER (fixed):
return (
  <div className="space-y-6">
    {/* Always show Courtesy Calls Card */}
    <CourtesyCallsCard memberId={memberId} />
    
    {/* Then show CRM data if available, or empty state */}
    {!profile && !importRow ? (
      <Card>/* Empty state for CRM only */</Card>
    ) : (
      /* Existing CRM profile and import cards */
    )}
  </div>
);
```

---

### Issue 2: Replace Quick Member Search with Courtesy Calls Section on Staff Dashboard

**File:** `src/pages/call-centre/StaffDashboard.tsx`

**Current Layout (lines 458-510):**
- "Quick Member Search" card with search input and results

**New Layout:**
Replace with a "Courtesy Calls" section that displays:
- Header: "Today's Courtesy Calls" with badge showing count
- List of all pending courtesy call tasks (task_type = 'courtesy_call', status != 'completed')
- For each call: Member name, phone number (clickable), due date
- Quick action buttons: Call (tel: link), Mark Complete
- Empty state when no calls are due
- "View All" link to Tasks page filtered by courtesy calls

**Implementation Details:**
1. Add new state: `courtesyCalls` array
2. Add new fetch function: `fetchCourtesyCalls()` that queries:
   ```sql
   SELECT tasks.*, members.first_name, members.last_name, members.phone
   FROM tasks
   JOIN members ON tasks.member_id = members.id
   WHERE task_type = 'courtesy_call' 
     AND status != 'completed'
   ORDER BY due_date ASC
   ```
3. Add real-time subscription for tasks table
4. Replace the Quick Member Search card with Courtesy Calls card

---

### Issue 3: Minor Console Warning Fix

**File:** `src/components/admin/member-detail/TasksTab.tsx`

The console shows: "Function components cannot be given refs. Check the render method of TasksTab."

**Fix:** Wrap the Badge component usage with proper ref handling or use span/div instead of trying to pass ref to Badge.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/admin/member-detail/CRMTab.tsx` | Move CourtesyCallsCard outside CRM data conditional so it ALWAYS renders |
| `src/pages/call-centre/StaffDashboard.tsx` | Replace "Quick Member Search" with "Courtesy Calls" section showing all pending calls |
| `src/components/admin/member-detail/TasksTab.tsx` | Fix Badge ref warning (optional) |

---

### Data Flow After Changes

```
┌─────────────────────────────────────────────────────────────┐
│                 Staff Dashboard                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Today's Courtesy Calls                              │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 📞 Maria Garcia          +34 612 345 678      │  │   │
│  │  │    Due: Today            [Call] [Complete]     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 📞 Juan Rodriguez        +34 698 765 432      │  │   │
│  │  │    Due: Today            [Call] [Complete]     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                    [View All Courtesy Calls →]        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          Member CRM Tab (for ALL members)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📞 Courtesy Calls                                   │   │
│  │  ──────────────────────────────────────────────────  │   │
│  │  Enable Monthly Courtesy Calls    [Toggle: ON/OFF]   │   │
│  │  ──────────────────────────────────────────────────  │   │
│  │  📅 Next Scheduled Call: February 15, 2026          │   │
│  │  ──────────────────────────────────────────────────  │   │
│  │  🕐 Recent Completed Calls                          │   │
│  │     • Monthly Courtesy Call - Jan 15, 2026          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

