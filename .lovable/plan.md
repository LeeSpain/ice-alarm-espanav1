

# Pendant Live Status Modal for Staff Dashboard

## Overview

This plan adds a "Pendant Live Status" link button to the Staff Dashboard welcome section that opens a modal popup showing a live, real-time list of all EV-07B pendants assigned to members. Staff can see at-a-glance which devices are online or offline, when they last checked in, and have quick access to contact information for follow-up.

---

## What You'll Get

- A clickable "Pendant Live Status" button in the dashboard welcome header
- A popup modal showing all member-assigned pendants with:
  - Member name and contact details (phone, email)
  - Live/Offline status with visual indicators
  - Last online timestamp
  - Battery level (if available)
  - Device IMEI for reference
- Offline devices grouped at the top for easy follow-up
- Real-time updates as device status changes
- Click-to-call functionality for offline members

---

## Visual Preview

**Welcome Header (After):**
```text
+------------------------------------------------------------------+
| Welcome back, Sarah                    [Pendant Live Status] [Generate Shift Report] |
| Monday, 3 February 2026                                          |
+------------------------------------------------------------------+
```

**Modal Popup:**
```text
+--------------------------------------------------+
| Pendant Live Status                    X Close   |
| Real-time EV-07B fleet status                    |
+--------------------------------------------------+
| Summary: 45 Total | 38 Online | 7 Offline        |
+--------------------------------------------------+
| OFFLINE DEVICES (7) - Require Follow-up          |
| +----------------------------------------------+ |
| | Maria Garcia          OFFLINE                | |
| | +34 600 123 456      Last seen: 2 hours ago  | |
| | [Call] [View Member]                         | |
| +----------------------------------------------+ |
| | Juan Lopez            OFFLINE                | |
| | +34 600 789 012      Last seen: 45 min ago   | |
| | [Call] [View Member]                         | |
| +----------------------------------------------+ |
|                                                  |
| ONLINE DEVICES (38)                              |
| +----------------------------------------------+ |
| | Ana Martinez          ONLINE                 | |
| | +34 600 111 222      Just now - Battery: 85% | |
| +----------------------------------------------+ |
| | Carlos Ruiz           ONLINE                 | |
| | +34 600 333 444      2 min ago - Battery: 72%| |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## Implementation Steps

### Step 1: Create PendantLiveStatusModal Component

Create a new component `src/components/call-centre/PendantLiveStatusModal.tsx`:

- **Dialog Trigger**: Button with smartphone icon and "Pendant Live Status" text
- **Data Fetching**: Query devices with status `allocated`, `with_staff`, or `live` joined with member data
- **Real-time Updates**: Subscribe to `devices` table changes via Supabase Realtime
- **Grouping**: Separate offline devices (shown first) from online devices
- **Member Info Display**: Name, phone (clickable), email, device IMEI
- **Status Display**: Online/Offline badge with color coding
- **Last Check-in**: Human-readable time (e.g., "2 hours ago", "Just now")
- **Battery Level**: Show when available
- **Actions**: "Call" button (tel: link), "View Member" button (navigates to member detail)

### Step 2: Update Staff Dashboard Welcome Section

Modify `src/pages/call-centre/StaffDashboard.tsx`:
- Import the new `PendantLiveStatusModal` component
- Add it to the welcome header row, positioned before the Shift Report button

### Step 3: Add Translations

Update `src/i18n/locales/en.json` and `src/i18n/locales/es.json`:

**New Keys:**
```json
{
  "pendantLiveStatus": "Pendant Live Status",
  "realtimeFleetStatus": "Real-time EV-07B fleet status",
  "offlineDevices": "Offline Devices",
  "onlineDevices": "Online Devices",
  "requireFollowUp": "Require follow-up",
  "lastSeen": "Last seen",
  "justNow": "Just now",
  "battery": "Battery",
  "callMember": "Call",
  "viewMember": "View Member",
  "noDevicesAssigned": "No devices currently assigned to members",
  "totalDevices": "Total",
  "devicesOnline": "Online",
  "devicesOffline": "Offline"
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/call-centre/PendantLiveStatusModal.tsx` | Modal component with live device list |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/call-centre/StaffDashboard.tsx` | Import and add modal to welcome header |
| `src/i18n/locales/en.json` | Add English translations |
| `src/i18n/locales/es.json` | Add Spanish translations |

---

## Technical Details

### Data Query Structure

The modal will fetch devices with this query pattern:

```text
FROM devices
JOIN members ON devices.member_id = members.id
WHERE devices.model = 'EV-07B'
  AND devices.status IN ('allocated', 'with_staff', 'live')
ORDER BY is_online ASC, last_checkin_at DESC
```

**Fields Retrieved:**
- Device: id, imei, is_online, last_checkin_at, battery_level, offline_since
- Member: id, first_name, last_name, phone, email

### Real-time Subscription

Uses the existing Supabase Realtime pattern:

```text
Subscribe to: postgres_changes on "devices" table
On change: Invalidate query and refetch
```

### Offline Duration Calculation

For offline devices, show how long they've been offline:
- If `offline_since` exists: Calculate duration from that timestamp
- Otherwise: Use `last_checkin_at` to show "Last seen X ago"

### Click-to-Call

Phone numbers render as clickable links using `tel:` protocol, allowing staff to quickly call members with offline devices.

---

## Component Structure

```text
PendantLiveStatusModal
 Dialog (open/onOpenChange state)
   DialogTrigger  Button with Smartphone icon
   DialogContent
     DialogHeader
       DialogTitle  "Pendant Live Status"
       DialogDescription  "Real-time EV-07B fleet status"
     Summary Stats Row (Total / Online / Offline counts)
     ScrollArea
       Section: Offline Devices (if any)
         Device rows with warning styling
       Section: Online Devices
         Device rows with success styling
```

