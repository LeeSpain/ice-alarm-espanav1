

## Fix: Shift Report "Generated At" Timestamp Not Updating

### Problem Identified
The "Generated at" timestamp in the Shift Report modal never updates because it's calculated once when the component first mounts, not when the modal is opened.

**Current Code (Line 62-63):**
```typescript
const dateLocale = i18n.language === 'es' ? es : enGB;
const generatedAt = format(new Date(), "EEEE, d MMMM yyyy 'at' HH:mm", { locale: dateLocale });
```

This runs only once at component initialization, so reopening the modal shows the same stale timestamp.

---

### Solution
Move the `generatedAt` calculation inside the component state and update it when the modal opens (alongside the data fetch).

---

### Changes Required

| File | Change |
|------|--------|
| `src/components/call-centre/ShiftReportModal.tsx` | Move timestamp to state, update on modal open |

---

### Implementation Details

1. **Add state for the generated timestamp:**
```typescript
const [generatedAt, setGeneratedAt] = useState<string>("");
```

2. **Update timestamp when modal opens (inside fetchReportData or useEffect):**
```typescript
const fetchReportData = async () => {
  setLoading(true);
  
  // Update the generated timestamp
  const dateLocale = i18n.language === 'es' ? es : enGB;
  setGeneratedAt(format(new Date(), "EEEE, d MMMM yyyy 'at' HH:mm", { locale: dateLocale }));
  
  // ... rest of the data fetching logic
};
```

3. **Keep dateLocale calculation for other uses (formatDistanceToNow):**
```typescript
const dateLocale = i18n.language === 'es' ? es : enGB;
```

---

### Result
Each time the user clicks "Generate Shift Note", the report will show the current timestamp and fetch fresh data from the database.

