

## Fix: Input Focus Lost After Each Keystroke on /join Personal Details

### Root Cause

`PersonForm` is defined as a **component inside** `JoinPersonalStep`'s function body (lines 44-144). Every keystroke triggers `onUpdate` → parent re-renders → `JoinPersonalStep` re-renders → a **new** `PersonForm` function reference is created → React treats it as a different component and **unmounts/remounts** the entire form, destroying input focus.

Notice that `JoinAddressStep` does **not** have this bug because its `AddressForm` is defined **outside** the parent component (line 34).

### Fix

**File: `src/components/join/steps/JoinPersonalStep.tsx`**

Move `PersonForm` from inside `JoinPersonalStep` (line 44) to a standalone function defined **outside** and above the parent component — exactly matching the pattern in `JoinAddressStep`. It will accept the same props plus `t` (the translation function) so it can still access translations.

This is a single-file, structural-only change. No new dependencies, no logic changes, no translation changes needed.

### Other Steps

Reviewed all other step components — `JoinAddressStep`, `JoinContactsStep`, `JoinPendantStep` — none have this issue. Only `JoinPersonalStep` needs fixing.

