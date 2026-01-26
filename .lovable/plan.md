

## Start New Conversation - Staff & Member Messaging

### Overview
Extend the messaging system to allow staff to create conversations with **both members AND other staff members**. Currently, the `conversations` table requires a `member_id` (NOT NULL), which prevents staff-to-staff messaging.

---

### Phase 1: Database Schema Update

**Modify `conversations` table to support staff-only conversations:**

```sql
-- Make member_id nullable to allow staff-only conversations
ALTER TABLE public.conversations 
ALTER COLUMN member_id DROP NOT NULL;

-- Add staff_participants column for staff-to-staff and group conversations
ALTER TABLE public.conversations 
ADD COLUMN staff_participants UUID[] DEFAULT '{}';

-- Add conversation_type to distinguish between types
ALTER TABLE public.conversations 
ADD COLUMN conversation_type TEXT DEFAULT 'member' 
CHECK (conversation_type IN ('member', 'staff', 'internal'));
```

| Conversation Type | Description |
|-------------------|-------------|
| `member` | Staff-to-member conversation (current behavior) |
| `staff` | Staff-to-staff direct messaging |
| `internal` | Internal team thread (no member) |

**Update RLS Policies:**
```sql
-- Staff can view conversations they're part of (as participants or assigned)
CREATE POLICY "Staff can view own staff conversations"
ON public.conversations FOR SELECT
USING (
  is_staff(auth.uid()) AND (
    conversation_type = 'member' 
    OR (SELECT id FROM staff WHERE user_id = auth.uid()) = ANY(staff_participants)
    OR assigned_to = (SELECT id FROM staff WHERE user_id = auth.uid())
  )
);
```

---

### Phase 2: Update "Start New Conversation" Dialog

**File:** `src/pages/admin/MessagesPage.tsx`

**Changes:**
1. Add conversation type selector (tabs or radio): "Message Member" | "Message Staff"
2. Conditionally show Member dropdown OR Staff dropdown based on selection
3. Update `createConversation()` to handle both types

**Updated Dialog UI:**
```
┌─────────────────────────────────────────────────────────────┐
│  Start New Conversation                                     │
│  Create a new conversation                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐ ┌──────────────────┐                 │
│  │  💬 Member       │ │  👥 Staff        │  ← Tab selection │
│  └──────────────────┘ └──────────────────┘                 │
│                                                             │
│  [If Member Tab]                                            │
│  Select Member *                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Search or select a member...                    ▼   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [If Staff Tab]                                             │
│  Select Staff Member(s) *                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ John Smith (Admin)                              ▼   │   │
│  │ ☑ Sarah Jones (Call Centre)                         │   │
│  │ ☑ Mike Wilson (Supervisor)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Subject *                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ e.g., Shift handover, Device escalation...          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Priority                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Normal                                          ▼   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Message *                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Cancel]  [Start Conversation] │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Update Conversation Creation Logic

**Current State Object:**
```typescript
const [newConversation, setNewConversation] = useState({
  memberId: "",
  subject: "",
  message: "",
  priority: "normal",
});
```

**Updated State Object:**
```typescript
const [newConversation, setNewConversation] = useState({
  type: "member" as "member" | "staff",
  memberId: "",
  staffParticipants: [] as string[],
  subject: "",
  message: "",
  priority: "normal",
});
```

**Updated Create Function:**
```typescript
const createConversation = async () => {
  const isStaffConversation = newConversation.type === "staff";
  
  // Validation
  if (isStaffConversation && newConversation.staffParticipants.length === 0) {
    toast.error("Please select at least one staff member");
    return;
  }
  if (!isStaffConversation && !newConversation.memberId) {
    toast.error("Please select a member");
    return;
  }

  const { data: convData, error } = await supabase
    .from("conversations")
    .insert({
      member_id: isStaffConversation ? null : newConversation.memberId,
      staff_participants: isStaffConversation 
        ? [...newConversation.staffParticipants, currentStaffId] 
        : [],
      conversation_type: isStaffConversation ? "staff" : "member",
      subject: newConversation.subject,
      status: "open",
      priority: newConversation.priority,
      assigned_to: currentStaffId,
    })
    .select()
    .single();

  // ... create first message
};
```

---

### Phase 4: Update Conversation List Display

**Modified Conversation Interface:**
```typescript
interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  priority: string;
  last_message_at: string;
  created_at: string;
  assigned_to: string | null;
  conversation_type: "member" | "staff" | "internal";
  
  // For member conversations
  member_id: string | null;
  member?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  
  // For staff conversations
  staff_participants: string[];
  participants_info?: {
    id: string;
    first_name: string;
    last_name: string;
  }[];
  
  // Common
  assigned_staff?: { first_name: string; last_name: string } | null;
  unread_count?: number;
  last_message_preview?: string;
}
```

**List Item Display Logic:**
```typescript
// In conversation list item render
{conv.conversation_type === "member" ? (
  <div className="flex items-center gap-2">
    <User className="h-4 w-4" />
    <span>{conv.member?.first_name} {conv.member?.last_name}</span>
  </div>
) : (
  <div className="flex items-center gap-2">
    <Users className="h-4 w-4 text-blue-500" />
    <span>{conv.participants_info?.map(p => p.first_name).join(", ")}</span>
    <Badge variant="outline" className="text-xs">Staff</Badge>
  </div>
)}
```

---

### Phase 5: Update Fetch & Filter Logic

**Updated fetchConversations:**
```typescript
const fetchConversations = async () => {
  const { data: convData } = await supabase
    .from("conversations")
    .select(`
      *,
      member:members!conversations_member_id_fkey(id, first_name, last_name, email, phone)
    `)
    .order("last_message_at", { ascending: false });

  // Fetch staff participants for staff conversations
  const staffConversations = convData?.filter(c => c.conversation_type === "staff") || [];
  const allParticipantIds = staffConversations.flatMap(c => c.staff_participants || []);
  
  const { data: participantsData } = await supabase
    .from("staff")
    .select("id, first_name, last_name")
    .in("id", allParticipantIds);

  const participantsMap = new Map(participantsData?.map(s => [s.id, s]) || []);

  // Add participants_info to staff conversations
  const enrichedConversations = convData?.map(conv => ({
    ...conv,
    participants_info: conv.conversation_type === "staff"
      ? (conv.staff_participants || []).map(id => participantsMap.get(id)).filter(Boolean)
      : undefined,
  }));

  setConversations(enrichedConversations);
};
```

**Updated Filter Tabs:**
Add a new filter tab for staff conversations:
```typescript
<TabsTrigger value="staff">
  <Users className="h-4 w-4 mr-1" />
  Staff
</TabsTrigger>
```

Filter logic:
```typescript
case "staff":
  filtered = filtered.filter(c => c.conversation_type === "staff");
  break;
```

---

### Phase 6: Apply Same Changes to Call Centre MessagesPage

**File:** `src/pages/call-centre/MessagesPage.tsx`

Apply identical changes:
1. Update dialog with type selection
2. Update conversation creation logic
3. Update conversation list display
4. Update fetch and filter logic

---

### Summary of Files to Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Make member_id nullable, add staff_participants & conversation_type |
| `src/pages/admin/MessagesPage.tsx` | Modify | Add staff messaging to dialog, update list display |
| `src/pages/call-centre/MessagesPage.tsx` | Modify | Same changes as admin MessagesPage |

---

### Technical Implementation Details

**Database Migration SQL:**
```sql
-- 1. Make member_id nullable
ALTER TABLE public.conversations ALTER COLUMN member_id DROP NOT NULL;

-- 2. Add new columns
ALTER TABLE public.conversations ADD COLUMN conversation_type TEXT DEFAULT 'member';
ALTER TABLE public.conversations ADD COLUMN staff_participants UUID[] DEFAULT '{}';

-- 3. Add check constraint
ALTER TABLE public.conversations ADD CONSTRAINT conversation_type_check 
CHECK (conversation_type IN ('member', 'staff', 'internal'));

-- 4. Update existing conversations to have type 'member'
UPDATE public.conversations SET conversation_type = 'member' WHERE conversation_type IS NULL;

-- 5. Ensure existing RLS still works - staff can manage all types
-- (Existing policy already allows staff to manage all conversations)
```

**UI Component Updates:**
- Import `Users` icon from lucide-react for staff conversations
- Add Tabs component inside dialog for type selection
- Conditionally render member dropdown vs staff multi-select
- Use Checkbox for multi-select staff participants

---

### Visual Indicators in Conversation List

| Type | Icon | Badge |
|------|------|-------|
| Member | `<User />` | None |
| Staff | `<Users className="text-blue-500" />` | `Staff` outline badge |
| Internal | `<MessageSquare className="text-purple-500" />` | `Internal` outline badge |

