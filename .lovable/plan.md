
# Performance Optimization and Blank Screen Fix Plan

## Summary

After a thorough review of the codebase, I've identified **two root causes** for the issues you're experiencing:

1. **Blank screens when navigating between pages**: Caused by unhandled promise rejections in async event handlers that crash the React tree
2. **Slow page loading**: Caused by missing `React.forwardRef` on tab components (causing React warnings), and opportunities for better query optimization

---

## Problem 1: Blank Screens During Navigation

### Root Cause
When you click buttons that trigger async operations (like saving settings, generating images, etc.), and those operations fail, the error is not caught. This causes an **unhandled promise rejection** which can crash the React component tree, resulting in a blank screen. Refreshing works because it reloads the entire app from scratch.

### Evidence Found
- `MediaManagerPage.tsx`: Multiple `onClick={async () => {...}}` handlers without try/catch
- `ImportLeadsModal.tsx`: Bulk operations without error handling
- `StaffDashboard.tsx`: `handleClaimAlert` missing error handling
- No global error boundary for unhandled promise rejections

### Solution
1. Add a **global unhandled rejection handler** in `App.tsx` that catches stray promise errors and shows a toast instead of crashing
2. Wrap critical async handlers in try/catch blocks with user-friendly error messages

---

## Problem 2: React Ref Warnings (Console Errors)

### Root Cause
The console shows warnings like:
```
Function components cannot be given refs. Check the render method of `SettingsPage`.
```

This happens because:
- `ImagesSettingsTab` and `EmailSettingsTab` are function components used directly inside `TabsContent`
- Radix UI's `TabsContent` tries to pass a ref to its children
- These components don't use `React.forwardRef`, so the ref is silently dropped

### Evidence
- Line 1068 in `SettingsPage.tsx`: `<EmailSettingsTab />` rendered inside TabsContent
- Line 1072: `<ImagesSettingsTab />` rendered without wrapping in TabsContent
- Both components are regular function components, not forwardRef

### Solution
1. Wrap `EmailSettingsTab` and `ImagesSettingsTab` in `React.forwardRef`
2. Ensure `ImagesSettingsTab` is wrapped in a proper `<TabsContent value="images">` container

---

## Problem 3: Page Loading Speed Optimizations

### Current State (Already Good)
Your app already has several optimizations:
- Lazy loading for all pages via `React.lazy()`
- Prefetching company settings and website images at app startup
- Single RPC call for admin dashboard stats
- Global React Query caching with 2-minute staleTime

### Additional Optimizations
1. **Increase staleTime for static data**: Settings, images, and documentation rarely change - increase their staleTime to 30 minutes
2. **Prefetch common admin routes**: When entering admin area, prefetch members list and alerts data
3. **Add loading boundaries per route**: Instead of one global Suspense, add nested Suspense boundaries for faster perceived loading

---

## Implementation Plan

### Step 1: Add Global Error Handler (App.tsx)
Add a `useEffect` hook that listens for `unhandledrejection` events and shows a toast notification instead of crashing the app.

```text
Location: src/App.tsx
Change: Add error boundary effect before the return statement
```

### Step 2: Fix TabsContent Component Refs (SettingsPage.tsx)
- Wrap `ImagesSettingsTab` in `<TabsContent value="images">`
- Keep component rendering but fix the structure

```text
Location: src/pages/admin/SettingsPage.tsx (line 1071-1072)
Change: Wrap ImagesSettingsTab properly in TabsContent
```

### Step 3: Add forwardRef to Settings Tab Components
- Update `ImagesSettingsTab` to use `React.forwardRef`
- Update `EmailSettingsTab` to use `React.forwardRef`

```text
Locations:
- src/components/admin/settings/ImagesSettingsTab.tsx
- src/components/admin/settings/EmailSettingsTab.tsx
Changes: Wrap component in React.forwardRef
```

### Step 4: Add Error Handling to Critical Async Handlers
Add try/catch blocks to the most common async handlers:
- `MediaManagerPage.tsx` - Image generation and publishing
- `ImportLeadsModal.tsx` - Bulk lead imports

```text
Locations:
- src/pages/admin/MediaManagerPage.tsx
- src/components/admin/outreach/ImportLeadsModal.tsx
Changes: Wrap async operations in try/catch with toast error messages
```

### Step 5: Optimize Query StaleTime for Static Data
Increase staleTime for queries that fetch rarely-changing data:
- Website images: 30 minutes
- System settings: 30 minutes
- Documentation: 10 minutes

```text
Locations: Various hooks
Changes: Update staleTime in useQuery options
```

---

## Technical Details

### Global Error Handler Code
```typescript
// In App.tsx, inside the App component
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    event.preventDefault(); // Prevent crash
    // Toast will be shown via sonner
    import("sonner").then(({ toast }) => {
      toast.error("Something went wrong. Please try again.");
    });
  };
  
  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);
```

### ForwardRef Pattern
```typescript
// Before
export function ImagesSettingsTab() { ... }

// After
export const ImagesSettingsTab = React.forwardRef<HTMLDivElement, object>(
  function ImagesSettingsTab(props, ref) {
    // Component logic
    return <TabsContent value="images" ref={ref}>...</TabsContent>;
  }
);
```

---

## Expected Results

After implementation:
1. **No more blank screens**: Errors will show as toast notifications instead of crashing
2. **No React warnings**: Clean console without forwardRef warnings
3. **Faster perceived loading**: Static data cached longer, reducing unnecessary network requests
4. **Smoother navigation**: Error recovery prevents need to refresh

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add global unhandled rejection handler |
| `src/pages/admin/SettingsPage.tsx` | Fix TabsContent wrapper for ImagesSettingsTab |
| `src/components/admin/settings/ImagesSettingsTab.tsx` | Add React.forwardRef |
| `src/components/admin/settings/EmailSettingsTab.tsx` | Add React.forwardRef |
| `src/pages/admin/MediaManagerPage.tsx` | Add try/catch to async handlers |
| `src/components/admin/outreach/ImportLeadsModal.tsx` | Add try/catch to bulk operations |
| `src/hooks/useWebsiteImage.ts` | Increase staleTime to 30 minutes |
| `src/hooks/useEmailSettings.ts` | Increase staleTime to 30 minutes |
