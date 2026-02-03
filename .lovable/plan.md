

# Fix: Draft Save Causing Admin Logout

## Problem Identified

When saving a draft in the Media Manager, the user is unexpectedly logged out. The auth logs show:
- Session ID `1248dee7-1d62-4b5d-8eef-bc9a684cc10b` becomes invalid ("session not found")
- A 403 error occurs on the `/user` endpoint
- User has to re-login

## Root Cause

The issue is in `src/lib/auditLog.ts`:

```typescript
export async function logActivity(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: staffData } = await supabase.auth.getUser();  // ← This is the problem
    if (!staffData.user) return;
    ...
```

After a successful draft save, `logSocialPostActivity` is called in the mutation's `onSuccess` callback. This triggers `logActivity` which calls `supabase.auth.getUser()`.

The `getUser()` method makes a **network request** to validate the session. If there's any issue (token near expiry, race condition with refresh, network timing), this call can:
1. Fail with "session_not_found" error
2. Trigger a `SIGNED_OUT` event from Supabase
3. The `AuthContext`'s `onAuthStateChange` listener clears all auth state
4. User appears logged out

## Solution

Replace `supabase.auth.getUser()` with `supabase.auth.getSession()` in the audit log function:

| Method | Behavior |
|--------|----------|
| `getUser()` | Makes network request to validate token - can fail and trigger logout |
| `getSession()` | Reads from local storage first - no network call needed if session exists |

Additionally, add explicit error handling to prevent auth-related errors from affecting the user experience.

---

## Files to Modify

### 1. `src/lib/auditLog.ts`

**Change the `logActivity` function to use `getSession()` instead of `getUser()`:**

```typescript
export async function logActivity(entry: AuditLogEntry): Promise<void> {
  try {
    // Use getSession instead of getUser to avoid network validation
    // that could trigger session invalidation/logout
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Silently exit if no session - don't trigger any auth events
    if (sessionError || !sessionData.session?.user) {
      console.warn("Audit log skipped: no active session");
      return;
    }
    
    const userId = sessionData.session.user.id;

    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    // ... rest of the function
```

**Key changes:**
- Replace `getUser()` with `getSession()` - reads from local cache, no network validation
- Add explicit null checks before proceeding
- Add a warning log instead of failing silently
- Ensure the function never throws or triggers auth state changes

---

## Why This Works

1. **`getSession()` is cache-first**: It reads from `localStorage` without making a network request if a session exists. This eliminates the race condition with token refresh.

2. **No auth event triggering**: If the session happens to be invalid, `getSession()` won't fire a `SIGNED_OUT` event - it just returns null.

3. **Non-blocking audit logging**: The function is already designed to be non-blocking (errors logged but not thrown). This change makes it truly safe.

---

## Technical Details

**Current flow (broken):**
1. Draft saved successfully
2. `onSuccess` → `logSocialPostActivity()`
3. `logActivity()` calls `getUser()` → Network request
4. Network request fails/triggers session validation
5. Supabase fires `SIGNED_OUT` event
6. AuthContext clears all state → User logged out

**Fixed flow:**
1. Draft saved successfully
2. `onSuccess` → `logSocialPostActivity()`
3. `logActivity()` calls `getSession()` → Reads from localStorage
4. If session exists in cache → Continue logging
5. If no session → Warn and return (no auth events)
6. User stays logged in

