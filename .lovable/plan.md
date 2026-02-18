

# Build Stock Sync Endpoint + Admin UI Stats

## Overview

Create a new backend function (`ev07b-stock-sync`) that MonitorLinq calls to automatically add/remove devices from ICE Alarm Espana's stock. Also enhance the Devices page with stock-level stats cards.

## What Gets Built

### 1. New Edge Function: `ev07b-stock-sync`

**File:** `supabase/functions/ev07b-stock-sync/index.ts`

- Authenticates via `x-api-key` header using existing `EV07B_CHECKIN_KEY` secret (no new secrets needed)
- Uses `npm:@supabase/supabase-js@2` import per project standards
- Uses `Deno.serve()` API

**Two actions:**

| Action | Purpose | Behavior |
|--------|---------|----------|
| `add` | MonitorLinq allocates devices to Spain | Creates devices with `in_stock` status. Idempotent -- if IMEI exists, returns existing device_id |
| `remove` | Device returned to Holland | Sets status to `returned` with reason in notes. Blocked (409) if device has a `member_id` |

**Validation:**
- 401 for invalid/missing API key
- 400 for missing required fields (imei, sim_phone_number on add; imei on remove)
- 404 if device not found on remove
- 409 if trying to remove an allocated device
- Per-device error reporting in batch add (partial success supported)

**Implementation** follows the sample code from the command, with minor adjustments:
- Uses `npm:` specifier instead of `esm.sh`
- CORS headers include all required Lovable headers
- Parameterized queries only (no string interpolation in filters)

### 2. Config Update: `supabase/config.toml`

Add JWT bypass entry:
```toml
[functions.ev07b-stock-sync]
verify_jwt = false
```

### 3. Admin Devices Page Stats Cards

**File:** `src/pages/admin/DevicesPage.tsx`

Replace the single "Total Devices" card with 4 stats cards using data from `useDeviceStockStats()` (already exists in `useDeviceStock.ts`):

| Card | Icon | Color | Source |
|------|------|-------|--------|
| In Stock | Package | gray | `stats.in_stock` |
| Allocated | Users | blue | `stats.allocated` |
| Live | Wifi | green | `stats.live` |
| Total | Smartphone | primary | `stats.total` |

### 4. i18n Keys

Add translation keys for the new stats card labels in both `en.json` and `es.json`:
- `admin.devices.stats.inStock` / "En Stock"
- `admin.devices.stats.allocated` / "Asignados"
- `admin.devices.stats.live` / "Activos"

---

## Files Changed

| File | Action |
|------|--------|
| `supabase/functions/ev07b-stock-sync/index.ts` | New -- edge function |
| `supabase/config.toml` | Add `verify_jwt = false` entry |
| `src/pages/admin/DevicesPage.tsx` | Add 4 stats cards using existing hook |
| `src/i18n/locales/en.json` | Add 3 stats label keys |
| `src/i18n/locales/es.json` | Add 3 stats label keys |

No database changes needed -- `returned` status already exists in the `device_status` enum, and the `devices` table already has all required columns (`notes`, `model`, `serial_number`, `sim_iccid`, `is_online`).

No new secrets needed -- reuses `EV07B_CHECKIN_KEY`.
