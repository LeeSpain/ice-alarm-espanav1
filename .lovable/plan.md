

## Staff Dashboard Professional Upgrade

### Overview
This plan adds a personalized welcome header with date display and applies subtle background shading to dashboard cards for better visual hierarchy, matching the professional design of the Admin and Client dashboards.

---

### Changes Summary

| Area | Change |
|------|--------|
| Welcome Header | Add personalized greeting with staff name and locale-aware date display |
| Card Styling | Add subtle gradient/shadow backing behind stats cards and content sections |
| Translations | Add new keys for welcome message in both EN and ES |

---

### Implementation Details

#### 1. Welcome Header Section

**Current State:** 
The dashboard starts directly with the stats cards grid at line 380.

**New Design:**
Add a welcome section similar to ClientDashboard with:
- Staff first name greeting: "Welcome back, [Name]"
- Locale-aware date display using `date-fns` (already imported)
- Compact, professional layout

**Code Changes:**

```typescript
// Add to state (extend staff fetch to include first_name)
const [staffName, setStaffName] = useState<string>("");

// Modify fetchStaffId to also get first_name
const { data } = await supabase
  .from('staff')
  .select('id, first_name')
  .eq('user_id', user.id)
  .maybeSingle();
if (data) {
  setStaffId(data.id);
  setStaffName(data.first_name || '');
}

// Add date formatting with locale support
import { es, enGB } from "date-fns/locale";
import i18n from "@/i18n";

const dateLocale = i18n.language === 'es' ? es : enGB;
const currentDate = format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale });
```

**New Welcome Section (before stats cards):**

```tsx
{/* Welcome Header */}
<div className="flex items-center justify-between">
  <div className="space-y-1">
    <h1 className="text-2xl font-bold tracking-tight">
      {t('staffDashboard.welcomeBack')}, {staffName || t('common.staff')}
    </h1>
    <p className="text-sm text-muted-foreground">{currentDate}</p>
  </div>
</div>
```

---

#### 2. Card Background Shading

**Current State:**
Cards use default white backgrounds (`bg-card`) which appear flat.

**New Design:**
Add subtle gradient backing and soft shadows to create visual depth while staying on-brand.

**Approach:**

1. **Stats Cards Container** - Add a subtle gradient background strip:
```tsx
<div className="bg-gradient-to-r from-primary/5 via-background to-accent/5 p-4 rounded-lg border">
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
    {/* Existing stats cards */}
  </div>
</div>
```

2. **Individual Cards** - Add subtle hover and base shadows:
```tsx
<Card className="cursor-pointer hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm shadow-sm">
```

3. **Content Section Cards** - Apply consistent subtle styling:
```tsx
<Card className="shadow-sm bg-background/80">
```

---

#### 3. Translation Keys

**Add to `en.json` (staffDashboard namespace):**

```json
{
  "staffDashboard": {
    "welcomeBack": "Welcome back",
    // ... existing keys ...
  }
}
```

**Add to `es.json` (staffDashboard namespace):**

```json
{
  "staffDashboard": {
    "welcomeBack": "Bienvenido",
    // ... existing keys ...
  }
}
```

Also add `common.staff` fallback:
- EN: `"staff": "Staff"`
- ES: `"staff": "Personal"`

---

### Visual Summary

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Welcome back, María                                                │
│  Monday, 27 January 2026                                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────── Subtle Gradient Background ─────────────────┐ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐             │ │
│  │  │  5   │  │  2   │  │  8   │  │ 12   │  │  3   │  Stats      │ │
│  │  │Alerts│  │In Prg│  │Msgs  │  │Rslvd │  │Tasks │  Cards      │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘             │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐                  │
│  │   Active Alerts     │  │   Courtesy Calls    │  Content         │
│  │   (soft shadow)     │  │   (soft shadow)     │  Cards           │
│  └─────────────────────┘  └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/call-centre/StaffDashboard.tsx` | Add welcome header, staff name fetch, date locale, card styling |
| `src/i18n/locales/en.json` | Add `staffDashboard.welcomeBack`, `common.staff` |
| `src/i18n/locales/es.json` | Add `staffDashboard.welcomeBack`, `common.staff` |

---

### Technical Notes

- Uses existing `date-fns` library (already in project) for locale-aware date formatting
- Gradient uses brand colors (`primary/5`, `accent/5`) for on-brand appearance
- Shadow intensity kept minimal (`shadow-sm`) to avoid heavy appearance
- `backdrop-blur-sm` adds subtle glass effect without being overwhelming
- All new text uses translation keys for full bilingual support

