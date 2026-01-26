

## Enhanced Courtesy Calls Settings Plan

### Overview
Currently, the Courtesy Calls feature only has an on/off toggle with monthly frequency hardcoded. This plan adds frequency options (daily, weekly, bi-weekly, monthly, quarterly) so staff can customize how often each member receives courtesy calls.

---

### Phase 1: Database Schema Update

**Add `courtesy_call_frequency` column to members table:**

```sql
ALTER TABLE public.members 
ADD COLUMN courtesy_call_frequency text DEFAULT 'monthly';
```

Supported values:
- `daily` - Every day
- `weekly` - Every 7 days
- `bi-weekly` - Every 14 days
- `monthly` - Same day each month (current behavior)
- `quarterly` - Every 3 months

---

### Phase 2: Update CourtesyCallsCard Component

**File:** `src/components/admin/member-detail/CourtesyCallsCard.tsx`

**Changes:**
1. Add a **Select dropdown** for frequency selection below the toggle
2. Fetch and display current frequency setting
3. Save frequency changes to database
4. Update labels dynamically based on selected frequency

**New UI Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  📞 Courtesy Calls                                      │
│  Monthly check-in calls scheduled automatically         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Enable Courtesy Calls          [Toggle: ON/OFF]        │
│  Automatically generate call tasks                      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Call Frequency                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Monthly ▼                                       │   │
│  │  • Daily                                         │   │
│  │  • Weekly                                        │   │
│  │  • Bi-weekly                                     │   │
│  │  • Monthly ✓                                     │   │
│  │  • Quarterly                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📅 Next Scheduled Call                                │
│  February 15, 2026                                      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  🕐 Recent Completed Calls                             │
│     • Monthly Courtesy Call - Jan 15, 2026             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Phase 3: Update Edge Function Logic

**File:** `supabase/functions/generate-courtesy-calls/index.ts`

**Changes:**
1. Fetch `courtesy_call_frequency` along with other member fields
2. Add logic to determine if a task should be generated based on frequency:
   - **Daily**: Create task every day
   - **Weekly**: Create task if 7+ days since last task
   - **Bi-weekly**: Create task if 14+ days since last task
   - **Monthly**: Current logic (same day each month)
   - **Quarterly**: Create task if 3+ months since last task

3. Update next call date calculation based on frequency
4. Update task title to reflect frequency ("Daily Courtesy Call", "Weekly Courtesy Call", etc.)

---

### Phase 4: Update Next Call Date Calculation

The `next_courtesy_call_date` calculation needs to account for different frequencies:

| Frequency | Next Call Date Logic |
|-----------|---------------------|
| Daily | Tomorrow |
| Weekly | 7 days from today |
| Bi-weekly | 14 days from today |
| Monthly | Same day next month |
| Quarterly | Same day in 3 months |

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Add `courtesy_call_frequency` column |
| `src/components/admin/member-detail/CourtesyCallsCard.tsx` | Add frequency selector dropdown, update labels |
| `supabase/functions/generate-courtesy-calls/index.ts` | Handle multiple frequencies in task generation |

---

### Technical Details

**New State in CourtesyCallsCard:**
```typescript
const [frequency, setFrequency] = useState<string>("monthly");
```

**Frequency Options:**
```typescript
const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly (Every 2 weeks)" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly (Every 3 months)" },
];
```

**Updated Fetch Query:**
```typescript
.select("courtesy_calls_enabled, courtesy_call_frequency, next_courtesy_call_date, created_at")
```

**Save Frequency Handler:**
```typescript
const handleFrequencyChange = async (newFrequency: string) => {
  const { error } = await supabase
    .from("members")
    .update({ courtesy_call_frequency: newFrequency })
    .eq("id", memberId);
  
  if (error) toast.error("Failed to update frequency");
  else {
    setFrequency(newFrequency);
    toast.success(`Courtesy call frequency set to ${newFrequency}`);
  }
};
```

