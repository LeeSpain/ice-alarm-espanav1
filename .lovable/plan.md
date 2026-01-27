

## Generate Shift Note Report Feature

### Overview
Add a professional "Generate Shift Note" button opposite the welcome message on the Staff Dashboard that opens a modal with a comprehensive summary of the last 12 hours of activity and tasks due/overdue today.

---

### Design Summary

| Element | Description |
|---------|-------------|
| **Trigger** | "Generate Shift Note" link/button with FileText icon opposite the welcome header |
| **Modal** | Professional dialog with two sections: Recent Activity + Pending Tasks |
| **Data Scope** | Last 12 hours for events, today's date for due/overdue tasks |
| **Styling** | Consistent with dashboard card styling (shadows, backdrop blur) |

---

### Report Content

The shift summary modal will display:

**Section 1: Last 12 Hours Activity**
- Alerts received and resolved (with member names, types, status)
- Shift notes logged by any staff member
- Messages received from members

**Section 2: Tasks Due/Overdue Today**
- All tasks due on or before today that are not completed
- Grouped by priority with member names
- Overdue items highlighted in red/orange

---

### Implementation Details

#### 1. New Modal Component

Create `src/components/call-centre/ShiftReportModal.tsx`:

```tsx
// ShiftReportModal component with:
// - Dialog for the popup
// - Two tabs/sections: "Last 12 Hours" and "Tasks Due Today"
// - Data fetching for:
//   1. Alerts from last 12 hours
//   2. Shift notes from last 12 hours  
//   3. Messages from last 12 hours
//   4. Tasks due today (not completed)
//   5. Overdue tasks (past due_date, not completed)
```

**Data Queries:**

```typescript
// Last 12 hours timestamp
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

// Today start/end for tasks
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999);

// 1. Alerts (last 12 hours)
supabase.from('alerts')
  .select('*, member:members(first_name, last_name)')
  .gte('received_at', twelveHoursAgo)
  .order('received_at', { ascending: false });

// 2. Shift notes (last 12 hours)
supabase.from('shift_notes')
  .select('*, staff:staff(first_name, last_name), member:member_id(first_name, last_name)')
  .gte('created_at', twelveHoursAgo)
  .order('created_at', { ascending: false });

// 3. Tasks due today or overdue
supabase.from('tasks')
  .select('*, member:members(first_name, last_name)')
  .neq('status', 'completed')
  .lte('due_date', todayEnd.toISOString())
  .order('due_date', { ascending: true });
```

#### 2. UI Structure

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Shift Summary Report                                         [X]     │
│  Generated: Monday, 27 January 2026 at 14:30                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  📊 LAST 12 HOURS                                                     │
│  ─────────────────────────────────────────────────────────────────────│
│                                                                        │
│  🚨 Alerts (3)                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ SOS - María García       │ Resolved │ 2h ago                  │   │
│  │ Fall - John Smith        │ In Progress │ 4h ago               │   │
│  │ Low Battery - Ana López  │ Resolved │ 10h ago                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  📝 Shift Notes (2)                                                   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ "Called María re: device issue" - Staff Name, 3h ago         │   │
│  │ "New member onboarded successfully" - Staff Name, 8h ago     │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────────│
│  📋 TASKS DUE/OVERDUE TODAY (5)                                       │
│  ─────────────────────────────────────────────────────────────────────│
│                                                                        │
│  ⚠️ Overdue (2)                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 Courtesy call - John Smith │ Was due: 25 Jan              │   │
│  │ 🔴 Follow-up payment - Ana   │ Was due: 26 Jan               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  📅 Due Today (3)                                                     │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 Device check - María García │ High priority               │   │
│  │ ⚪ Welcome call - New Member  │ Normal priority               │   │
│  │ ⚪ Update records - System    │ Low priority                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### 3. StaffDashboard Integration

Update the welcome header section in `StaffDashboard.tsx`:

```tsx
{/* Welcome Header */}
<div className="flex items-center justify-between">
  <div className="space-y-1">
    <h1 className="text-2xl font-bold tracking-tight">
      {t('staffDashboard.welcomeBack')}, {staffName || t('common.staff')}
    </h1>
    <p className="text-sm text-muted-foreground capitalize">{currentDate}</p>
  </div>
  
  {/* NEW: Generate Shift Note Button */}
  <ShiftReportModal />
</div>
```

The modal component itself will contain the trigger button:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="gap-2">
      <FileText className="h-4 w-4" />
      {t('staffDashboard.generateShiftNote')}
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    {/* Report content */}
  </DialogContent>
</Dialog>
```

---

### Translation Keys

**Add to `en.json` (staffDashboard namespace):**

```json
{
  "generateShiftNote": "Generate Shift Note",
  "shiftSummaryReport": "Shift Summary Report",
  "generatedAt": "Generated",
  "last12Hours": "Last 12 Hours",
  "tasksDueOverdue": "Tasks Due/Overdue Today",
  "alertsCount": "Alerts",
  "shiftNotesCount": "Shift Notes",
  "overdueCount": "Overdue",
  "dueTodayCount": "Due Today",
  "noAlertsInPeriod": "No alerts in this period",
  "noNotesInPeriod": "No shift notes in this period",
  "noTasksDue": "No tasks due or overdue",
  "hoursAgo": "{{count}}h ago",
  "wasDue": "Was due"
}
```

**Add to `es.json` (staffDashboard namespace):**

```json
{
  "generateShiftNote": "Generar Nota de Turno",
  "shiftSummaryReport": "Informe Resumen de Turno",
  "generatedAt": "Generado",
  "last12Hours": "Últimas 12 Horas",
  "tasksDueOverdue": "Tareas Pendientes/Vencidas Hoy",
  "alertsCount": "Alertas",
  "shiftNotesCount": "Notas de Turno",
  "overdueCount": "Vencidas",
  "dueTodayCount": "Para Hoy",
  "noAlertsInPeriod": "Sin alertas en este período",
  "noNotesInPeriod": "Sin notas de turno en este período",
  "noTasksDue": "Sin tareas pendientes o vencidas",
  "hoursAgo": "hace {{count}}h",
  "wasDue": "Vencía"
}
```

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/call-centre/ShiftReportModal.tsx` | **Create** - New modal component |
| `src/pages/call-centre/StaffDashboard.tsx` | **Modify** - Import and add modal to header |
| `src/i18n/locales/en.json` | **Modify** - Add new translation keys |
| `src/i18n/locales/es.json` | **Modify** - Add Spanish translations |

---

### Technical Notes

- Uses existing `date-fns` for time ago calculations and locale-aware formatting
- Leverages existing Supabase queries patterns from the dashboard
- Modal is lazy-loaded (data fetched on open) to avoid impacting dashboard performance
- Scroll area inside modal for lengthy reports
- Professional styling with cards, badges, and consistent spacing
- Empty states for each section when no data exists

