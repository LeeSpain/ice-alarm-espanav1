

## Plan: Member Dashboard Messages & Notifications Upgrade

### Issues Identified

1. **Build error**: `Star` is imported but unused in `TestimonialsPage.tsx` (line 30)
2. **No messages card on member dashboard**: `ClientDashboard.tsx` has no unread messages count or quick link to messages — members have to navigate through the sidebar
3. **No notification bell on member dashboard**: `ClientLayout.tsx` header has no `NotificationBell` — only staff/admin/partner headers have it
4. **No notification created when messages are sent**: There is no code inserting into `notification_log` when a member sends a message (to notify staff) or when staff replies (to notify the member). The `notification_log` table exists and the `useNotifications` hook works, but nothing writes to it for message events
5. **Staff dashboard messages section exists** — the `StaffDashboard.tsx` already has an unread messages count card and recent messages section with realtime updates, so that side is functional for display but lacks push notifications

### Changes

#### 1. Fix build error — Remove unused `Star` import
- **File**: `src/pages/admin/TestimonialsPage.tsx` line 30
- Remove `Star` from the lucide-react import

#### 2. Add Messages card to member dashboard
- **File**: `src/pages/client/ClientDashboard.tsx`
- Add a query to fetch unread message count (messages where `sender_type = 'staff'`, `is_read = false`, in conversations belonging to the member)
- Add a "Messages" card in the Quick Actions grid (alongside Subscription and Emergency Contacts) showing unread count with a badge and a "View Messages" button linking to `/dashboard/messages`
- Add mock data for template preview mode

#### 3. Add NotificationBell to member dashboard header
- **File**: `src/components/layout/ClientLayout.tsx`
- Import and render `NotificationBell` in the desktop header (line ~451) alongside existing buttons
- The bell will use `user.id` as the userId (same pattern as staff headers)
- No staffId needed — the hook filters by `admin_user_id` which maps to the auth user

#### 4. Create notification on message send (both directions)
- **File**: `src/pages/client/MessagesPage.tsx`
  - After a member sends a message (in `createConversation` and `sendReply`), insert a row into `notification_log` with `event_type = 'message'` and `admin_user_id = null` (so all staff see it)
- **File**: Staff messaging code — find where staff sends replies to member conversations and add a `notification_log` insert with `admin_user_id` set to the member's `user_id` so the member's notification bell picks it up

#### 5. Add bilingual translations
- **Files**: `src/i18n/locales/en.json` and `es.json`
- Add keys: `dashboard.unreadMessages`, `dashboard.viewMessages`, `dashboard.noNewMessages`, `dashboard.messagesDesc`

### Technical Notes
- The `notification_log` table uses `admin_user_id` (maps to auth user UUID) for targeting, and `status` for read/unread state
- The `useNotifications` hook already handles realtime via postgres_changes subscription
- The `NotificationBell` component resolves `userId` from `supabase.auth.getUser()`, so it works for any authenticated user (not just staff)
- Staff dashboard messages card already works — no changes needed there for display

