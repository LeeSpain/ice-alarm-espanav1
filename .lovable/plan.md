

## Problem

When you click the recovery link in the email, here's what happens:

1. The `/verify` endpoint redirects to your app with `#type=recovery` in the URL hash
2. `RecoveryRedirect` in `App.tsx` detects `type=recovery` and calls `navigate('/reset-password', { replace: true })` — this **strips the hash** from the URL
3. `ResetPassword.tsx` loads and checks `window.location.hash` for `type=recovery` — but the hash is gone
4. It falls back to `getSession()` — but there's a race condition; the session may not be established yet
5. Both checks fail → `isValid = false` → you see "Invalid or Expired Link"

The root cause: `RecoveryRedirect` strips the hash when navigating, and the session isn't ready fast enough.

## Fix (2 files)

### 1. `src/App.tsx` — RecoveryRedirect

Set a sessionStorage flag before navigating so `ResetPassword` knows it's a recovery flow even after the hash is stripped:

```tsx
const RecoveryRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      sessionStorage.setItem('isRecoveryFlow', 'true');
      navigate('/reset-password', { replace: true });
    }
  }, [navigate]);
  return null;
};
```

### 2. `src/pages/auth/ResetPassword.tsx` — checkSession

Add the sessionStorage flag as a third validity check and consume it:

```tsx
const checkSession = async () => {
  const hash = window.location.hash;
  if (hash && hash.includes("type=recovery")) {
    setIsValid(true);
  } else if (sessionStorage.getItem('isRecoveryFlow') === 'true') {
    sessionStorage.removeItem('isRecoveryFlow');
    setIsValid(true);
  } else {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setIsValid(true);
    }
  }
  setIsChecking(false);
};
```

This ensures the recovery flow works regardless of hash timing or session race conditions.

