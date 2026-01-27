

## Partner Invite Enhancement: Link Tracking & "Viewed" Status

### Overview
Enhance the Partner Invites page to add a new intermediate status "viewed" that tracks when a recipient opens/clicks the referral link. This provides partners with real-time visibility into which invites have been actively engaged with.

---

### How It Works

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVITE TRACKING FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. PARTNER SENDS INVITE                                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Partner fills in contact details → Sends via Email/SMS/WhatsApp     │   │
│   │ → Invite created with status: "sent"                                │   │
│   │ → Appears in "Sent Invites" table immediately                       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│   2. RECIPIENT CLICKS REFERRAL LINK                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Link contains: /?ref=PARTNER_CODE                                   │   │
│   │ → Landing page calls tracking edge function                         │   │
│   │ → Edge function updates invite: status = "viewed", viewed_at = now  │   │
│   │ → Partner sees "Viewed" badge in real-time (via query invalidation) │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│   3. RECIPIENT REGISTERS                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ User completes registration with referral code                      │   │
│   │ → Invite status updates to "registered"                             │   │
│   │ → Partner sees conversion progress                                  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Current Status Flow
```
draft → sent → registered → converted → expired
```

### Enhanced Status Flow
```
draft → sent → viewed → registered → converted → expired
```

---

### Technical Implementation

#### 1. Database Changes

**Add new status to enum + viewed_at column:**

```sql
-- Add 'viewed' status to invite_status enum
ALTER TYPE invite_status ADD VALUE 'viewed' AFTER 'sent';

-- Add viewed_at timestamp to track when link was opened
ALTER TABLE partner_invites ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE;

-- Add view_count for multiple views tracking
ALTER TABLE partner_invites ADD COLUMN view_count INTEGER DEFAULT 0;
```

#### 2. New Edge Function: `track-invite-view`

**Purpose:** Public endpoint called when referral link is opened

```typescript
// supabase/functions/track-invite-view/index.ts
// Key functionality:
// 1. Receives referral_code from frontend
// 2. Finds the most recent "sent" invite for this partner
// 3. Updates status to "viewed" and sets viewed_at
// 4. Increments view_count
// 5. No auth required (public tracking pixel approach)
```

**Request:**
```json
{
  "referralCode": "PARTNER123",
  "inviteeEmail": "optional@email.com"  // If available, match specific invite
}
```

#### 3. Frontend: Track Views on Landing Page

**Modify landing page to call tracking function:**

Update the landing page (or Index page) where referral links land to:
1. Extract `ref` parameter from URL
2. Call `track-invite-view` edge function silently
3. Continue with normal page flow

```typescript
// In LandingPage.tsx or Index.tsx
useEffect(() => {
  const ref = searchParams.get("ref");
  if (ref) {
    // Fire and forget - don't block page load
    supabase.functions.invoke("track-invite-view", {
      body: { referralCode: ref }
    }).catch(() => {}); // Silent failure
  }
}, [searchParams]);
```

#### 4. Update Invites Table UI

**Add new "Viewed" column + status color:**

```typescript
// In PartnerInvitesPage.tsx

// Add new status color
const statusColors = {
  ...existing,
  viewed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
};

// Add new column to table
<TableHead>Viewed</TableHead>
...
<TableCell>
  {invite.viewed_at ? (
    <div className="flex items-center gap-1 text-green-600">
      <Eye className="h-4 w-4" />
      {format(new Date(invite.viewed_at), "dd MMM HH:mm")}
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/track-invite-view/index.ts` | Public endpoint to track link opens |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/partner/PartnerInvitesPage.tsx` | Add "Viewed" column, update status colors, show viewed_at |
| `src/pages/Index.tsx` or `src/pages/LandingPage.tsx` | Add tracking call when ref param present |
| `src/components/partner/ReferralPipeline.tsx` | Add "viewed" status color |
| `src/i18n/locales/en.json` | Add translation keys for new status |
| `src/i18n/locales/es.json` | Add Spanish translations |
| `supabase/config.toml` | Add `verify_jwt = false` for track-invite-view function |

---

### Updated Invite Table Display

| Name | Contact | Channel | Status | Viewed | Sent |
|------|---------|---------|--------|--------|------|
| John Smith | john@email.com | Email | **Viewed** | 27 Jan 14:30 | 27 Jan 10:00 |
| Maria Garcia | +34 600... | WhatsApp | Sent | - | 26 Jan 15:00 |
| Bob Wilson | bob@test.com | Email | Registered | 25 Jan 09:00 | 24 Jan 11:00 |

---

### Security Considerations

1. **Rate Limiting:** The tracking endpoint should be idempotent - multiple calls from same IP don't create duplicate views
2. **No PII Exposure:** The tracking endpoint only receives the referral code, no sensitive data
3. **Fire and Forget:** Tracking failures don't block user experience
4. **View Count:** Track total views to detect sharing/forwarding

---

### Translation Keys to Add

**English:**
```json
{
  "partnerInvites": {
    "viewed": "Viewed",
    "viewedAt": "Viewed At",
    "viewCount": "View Count",
    "notViewedYet": "Not viewed yet",
    "linkOpened": "Link Opened"
  }
}
```

**Spanish:**
```json
{
  "partnerInvites": {
    "viewed": "Visto",
    "viewedAt": "Visto el",
    "viewCount": "Veces visto",
    "notViewedYet": "Aún no visto",
    "linkOpened": "Enlace Abierto"
  }
}
```

---

### Summary

This enhancement gives partners valuable insight into their invite funnel:
- See exactly which contacts have clicked their referral link
- Track when the link was opened
- Understand which invites are "warm" leads vs untouched
- All updates appear in real-time in their Sent Invites table

