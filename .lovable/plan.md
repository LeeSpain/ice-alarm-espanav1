

## Problem

When you click the password reset link in your email, it redirects through the authentication verification endpoint (`/verify`), which **automatically signs you in** with a recovery session. Because you're now signed in, the app's routing logic sees an authenticated user and redirects you to the homepage/dashboard instead of keeping you on `/reset-password`.

The root cause is in the **Login page and general auth flow**: once Supabase processes the recovery token (via the `/verify` redirect), the `onAuthStateChange` listener fires a `SIGNED_IN` event. The app then treats you as a logged-in user and routes you to your default dashboard — never giving the `/reset-password` page a chance to load.

## Fix (2 changes)

### 1. Intercept recovery redirects in `App.tsx`

Add a top-level component that checks for `type=recovery` in the URL hash on initial load. If detected, immediately navigate to `/reset-password` before any other routing takes effect. This ensures the recovery flow always lands on the correct page.

### 2. Exempt `/reset-password` from auth redirects

In the `AuthContext` or a wrapper, when the current path is `/reset-password`, skip the automatic role-based redirect that sends authenticated users to their dashboard. The `ResetPassword` page should be allowed to render even when a session exists (which is expected — the recovery link creates one).

### Implementation details

- **New `RecoveryRedirect` component** wrapping routes in `App.tsx`: checks `window.location.hash` for `type=recovery` on mount and calls `navigate('/reset-password', { replace: true })` if found.
- **Login page (`Login.tsx`)**: add a check — if user is already authenticated AND the URL hash contains `type=recovery`, redirect to `/reset-password` instead of the dashboard.
- No database or edge function changes needed.

