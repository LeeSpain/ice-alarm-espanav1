

## Isabella Operations Upgrade — 31 New Functions

### Step 1: Insert 31 rows into `isabella_settings`
Run the user's SQL (7 INSERT statements with ON CONFLICT DO NOTHING) using the insert tool to add all 31 new function keys with their enabled defaults and config JSON.

### Step 2: Update `src/pages/admin/IsabellaOperationsPage.tsx`
- Add 31 new entries to `FUNCTION_KEY_MAP` (name + description keys for each new function)
- Add 6 new sections to `SECTIONS` array:
  - "Boss / Owner Intelligence" → 7 keys
  - "Member Lifecycle Automation" → 6 keys
  - "Device & Infrastructure Monitoring" → 5 keys
  - "Partner Network Management" → 5 keys
  - "Content & Marketing Automation" → 5 keys
  - "Compliance & Legal" → 5 keys
- Import icons: `Crown`, `UserCheck`, `Cpu`, `Handshake`, `Megaphone`, `ShieldCheck`, `Info`
- Add icon + color to each section definition (existing 4 sections get icons too)
- Render section icon + color accent on each `Card` header
- Add "X/Y active" `Badge` per section (count enabled vs total in that section)
- Add `Tooltip` with info icon on each function row showing its `config` JSON
- Add hover background on function rows (`hover:bg-muted/50`)

### Step 3: Update `src/lib/isabella-function-config.ts`
Add 31 new entries to `ISABELLA_FUNCTION_CONFIG` with appropriate `agent_key`, `triggers`, `description`, and `capabilities`.

### Step 4: Update `src/components/admin/dashboard/IsabellaStatusBanner.tsx`
Add 31 new entries to `FUNCTION_LABELS` map for the new function keys.

### Step 5: Update `src/i18n/locales/en.json`
Under `isabella.sections` add 6 new section titles + descriptions. Under `isabella.functions` add 31 pairs (name + desc) for every new function.

### Step 6: Update `src/i18n/locales/es.json`
Mirror all new keys with Spanish translations.

### Files Modified
| File | Change |
|------|--------|
| `isabella_settings` table | +31 rows (data insert) |
| `IsabellaOperationsPage.tsx` | +31 function mappings, +6 sections, icons, badges, tooltips |
| `isabella-function-config.ts` | +31 config entries |
| `IsabellaStatusBanner.tsx` | +31 label entries |
| `en.json` | +68 translation keys |
| `es.json` | +68 translation keys |

