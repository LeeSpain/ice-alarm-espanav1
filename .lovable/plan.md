

## Add Staff Member Feature Plan

### Overview
Create a complete "Add Staff Member" functionality in the admin section that allows super admins and admins to create new staff accounts with different roles. The feature will:
1. Create an auth user in the backend
2. Insert a staff record with the selected role
3. Send login credentials via email

---

### Phase 1: Database Schema Update

**Add new role `call_centre_supervisor` to the `app_role` enum:**

```sql
ALTER TYPE public.app_role ADD VALUE 'call_centre_supervisor';
```

**Updated Role Hierarchy:**
| Role | Access Level | Description |
|------|-------------|-------------|
| `super_admin` | Full system access | Can manage all settings, staff, and system configuration |
| `admin` | Full admin access | Can manage members, partners, staff, and business operations |
| `call_centre_supervisor` | Staff dashboard + supervisor features | Access to call centre dashboard + can manage call centre staff tasks |
| `call_centre` | Staff dashboard only | Access to call centre operations (alerts, members, messages, tasks) |

---

### Phase 2: Create Edge Function for Staff Registration

**File:** `supabase/functions/staff-register/index.ts`

**Purpose:** Securely create staff accounts using Supabase Admin API

**Flow:**
1. Validate caller is admin (check JWT)
2. Validate input data (email, name, role)
3. Generate temporary password
4. Create auth user with `supabase.auth.admin.createUser()`
5. Insert staff record with role
6. Send welcome email with temporary password via Resend
7. Log activity

**Request Body:**
```typescript
interface StaffRegistrationRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "call_centre_supervisor" | "call_centre";
  phone?: string;
  preferred_language: "en" | "es";
}
```

**Response:**
```typescript
{ success: true, staff_id: "uuid", message: "Staff member created" }
```

---

### Phase 3: Create Staff Form Component

**File:** `src/components/admin/staff/StaffForm.tsx`

**Features:**
- Form with Zod validation
- Fields: First Name, Last Name, Email, Phone (optional), Role (dropdown), Language
- Role dropdown shows:
  - Admin
  - Call Centre Supervisor  
  - Call Centre
- Loading state during submission
- Error handling with toast messages

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Add Staff Member                                           │
│  Create a new staff account. They will receive login        │
│  credentials via email.                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  First Name *              Last Name *                      │
│  ┌───────────────────┐    ┌───────────────────┐            │
│  │                   │    │                   │            │
│  └───────────────────┘    └───────────────────┘            │
│                                                             │
│  Email Address *                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Phone (Optional)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ +34                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Role *                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Select a role...                               ▼   │   │
│  │  • Admin                                           │   │
│  │  • Call Centre Supervisor                          │   │
│  │  • Call Centre                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Preferred Language                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ English                                        ▼   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Cancel]  [Create Staff]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 4: Update StaffPage Component

**File:** `src/pages/admin/StaffPage.tsx`

**Changes:**
1. Import and use new `StaffForm` component
2. Add mutation for calling staff-register edge function
3. Update role badge display to include new supervisor role
4. Add success/error handling with toast notifications
5. Invalidate query on successful creation

---

### Phase 5: Update Access Control

**File:** `src/components/auth/ProtectedRoute.tsx`

**Changes:**
Add new prop `requireSupervisor` to allow supervisor-level access to specific routes.

**Updated Route Access Matrix:**
| Route | super_admin | admin | call_centre_supervisor | call_centre |
|-------|-------------|-------|------------------------|-------------|
| `/admin/*` | ✅ | ✅ | ❌ | ❌ |
| `/admin/staff` | ✅ | ❌ | ❌ | ❌ |
| `/call-centre/*` | ✅ | ✅ | ✅ | ✅ |
| Supervisor features | ✅ | ✅ | ✅ | ❌ |

---

### Phase 6: Update UI Components

**File:** `src/pages/admin/StaffPage.tsx`

Update `getRoleBadge()` function:
```typescript
case "call_centre_supervisor":
  return <Badge className="bg-amber-500 text-white">Supervisor</Badge>;
```

**File:** `src/components/layout/CallCentreSidebar.tsx`

No changes needed - supervisors will use same sidebar but may have additional features in the future.

---

### Summary of Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add `call_centre_supervisor` to `app_role` enum |
| `supabase/functions/staff-register/index.ts` | Create | Edge function for secure staff creation |
| `src/components/admin/staff/StaffForm.tsx` | Create | Staff creation form component |
| `src/pages/admin/StaffPage.tsx` | Modify | Integrate form and add new role badge |
| `src/components/auth/ProtectedRoute.tsx` | Modify | Add supervisor access level (optional) |

---

### Technical Details

**Password Generation:**
```typescript
function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

**Welcome Email Template:**
```html
<h1>Welcome to ICE Alarm Staff Portal</h1>
<p>Hello [First Name],</p>
<p>Your staff account has been created with the role: [Role]</p>
<p>Your temporary login credentials:</p>
<ul>
  <li>Email: [Email]</li>
  <li>Temporary Password: [Password]</li>
</ul>
<p>Please log in and change your password immediately.</p>
<a href="[Staff Login URL]">Login to Staff Portal</a>
```

---

### Security Considerations

1. **Edge Function Auth**: Verify caller has admin/super_admin role before creating staff
2. **Password**: Generate secure temporary password, force change on first login
3. **Email Validation**: Check email doesn't already exist in auth.users or staff table
4. **Audit Logging**: Log all staff creation events in activity_logs
5. **RLS**: Existing staff RLS policies will apply to new records

