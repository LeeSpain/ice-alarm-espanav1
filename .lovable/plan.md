

## Members Update Feature - CRM Card Enhancement

### Overview
Add a "Members Update" button to the CRM card in the Member Detail page that allows staff to send an email to the member with a secure link. When clicked, this link opens a pre-filled form where the member can update their missing profile information without needing to log in.

---

### How It Works

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WORKFLOW DIAGRAM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. STAFF ACTION                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Admin clicks "Request Member Update" on CRM Card                    │   │
│   │ → Modal shows missing fields detected                               │   │
│   │ → Staff selects which email to send to                              │   │
│   │ → Clicks "Send Update Request"                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│   2. BACKEND PROCESSING                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Edge function creates secure token (expires in 7 days)              │   │
│   │ → Stores token in member_update_tokens table                        │   │
│   │ → Sends bilingual email via Resend with update link                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│   3. MEMBER RECEIVES EMAIL                                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Email: "Please update your information"                             │   │
│   │ → Contains secure link: /member-update?token=xxxxx                  │   │
│   │ → Link valid for 7 days                                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│   4. MEMBER CLICKS LINK                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Public page loads (no login required)                               │   │
│   │ → Token validated via edge function                                 │   │
│   │ → Form pre-filled with existing member data                         │   │
│   │ → Missing fields highlighted for completion                         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                         │
│   5. MEMBER SUBMITS FORM                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Edge function validates token (not expired, not used)               │   │
│   │ → Updates member record                                             │   │
│   │ → Marks token as used                                               │   │
│   │ → Shows success message                                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Missing Fields Detection

The system will detect and flag these commonly missing/incomplete fields:

| Category | Fields to Check |
|----------|-----------------|
| **Profile** | NIE/DNI, Phone, Address Line 2 |
| **Medical** | Blood Type, Doctor Name, Doctor Phone, Hospital Preference, Allergies, Medications |
| **Emergency Contacts** | Less than 2 contacts, Missing email on contacts |

---

### Technical Implementation

#### 1. Database: New Table for Secure Tokens

```sql
CREATE TABLE public.member_update_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  requested_fields TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.member_update_tokens ENABLE ROW LEVEL SECURITY;

-- Staff can create and view tokens
CREATE POLICY "Staff can manage update tokens"
  ON public.member_update_tokens FOR ALL
  USING (is_staff(auth.uid()));
```

#### 2. Edge Function: `send-member-update-request`

**Purpose:** Generate token, store in DB, send email to member

```typescript
// Key functionality:
// 1. Validate staff user
// 2. Fetch member data + check what's missing
// 3. Generate cryptographically secure token
// 4. Store token with 7-day expiry
// 5. Send bilingual email via Resend with link
```

**Request payload:**
```json
{
  "memberId": "uuid",
  "recipientEmail": "member@email.com",
  "requestedFields": ["nie_dni", "blood_type", "doctor_name"]
}
```

#### 3. Edge Function: `validate-member-update-token`

**Purpose:** Validate token, return member data for pre-filling form

```typescript
// Key functionality:
// 1. Check token exists and not expired
// 2. Check token not already used
// 3. Fetch member data + medical info + emergency contacts
// 4. Return pre-filled data for form
```

#### 4. Edge Function: `submit-member-update`

**Purpose:** Process the member's form submission

```typescript
// Key functionality:
// 1. Validate token again (security check)
// 2. Update members table
// 3. Update/create medical_information if needed
// 4. Update emergency_contacts if needed
// 5. Mark token as used
// 6. Log activity
```

#### 5. Frontend: Update CRM Tab with Request Button

Add to `CRMTab.tsx`:

```tsx
// New "Request Member Update" button in header
<Button onClick={() => setShowUpdateModal(true)} variant="outline" size="sm">
  <Send className="h-4 w-4 mr-2" />
  {t('crm.requestMemberUpdate')}
</Button>

// Modal showing:
// - Missing fields detected
// - Email selection (member's email)
// - Send button
```

#### 6. New Component: `MemberUpdateRequestModal.tsx`

Modal component for staff to:
- See which fields are missing
- Choose email recipient
- Send update request

#### 7. New Public Page: `/member-update`

Public page (no auth required) that:
- Validates token from URL
- Pre-fills form with existing data
- Highlights missing fields
- Submits updates via edge function

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/send-member-update-request/index.ts` | Generate token + send email |
| `supabase/functions/validate-member-update-token/index.ts` | Validate token + return data |
| `supabase/functions/submit-member-update/index.ts` | Process form submission |
| `src/components/admin/member-detail/MemberUpdateRequestModal.tsx` | Staff modal to send request |
| `src/pages/MemberUpdatePage.tsx` | Public form page |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/member-detail/CRMTab.tsx` | Add "Request Update" button + modal trigger |
| `src/App.tsx` | Add public route `/member-update` |
| `src/i18n/locales/en.json` | Add translation keys |
| `src/i18n/locales/es.json` | Add Spanish translations |

---

### Email Template (Bilingual)

```html
<!-- Subject EN: "Please Update Your Information - ICE Alarm" -->
<!-- Subject ES: "Por favor actualice su información - ICE Alarm" -->

<h2>Update Your Information / Actualice su información</h2>

<p>EN: We need some additional information to ensure we can best assist you in an emergency.</p>
<p>ES: Necesitamos información adicional para poder asistirle mejor en caso de emergencia.</p>

<p>EN: Please click the button below to update your profile:</p>
<p>ES: Por favor haga clic en el botón para actualizar su perfil:</p>

<a href="{update_link}">Update My Information / Actualizar mi información</a>

<p>EN: This link expires in 7 days.</p>
<p>ES: Este enlace caduca en 7 días.</p>
```

---

### Security Considerations

1. **Token Security:**
   - Cryptographically random tokens (32 bytes hex)
   - 7-day expiration
   - Single-use (marked as used after submission)
   - Stored securely in database

2. **Validation:**
   - All edge functions validate input with Zod
   - Token checked on both load and submit
   - No direct database access from public page

3. **RLS:**
   - Token table protected by RLS
   - Public form uses edge functions (service role)
   - Activity logged for audit trail

---

### Translation Keys to Add

**English:**
```json
{
  "crm": {
    "requestMemberUpdate": "Request Member Update",
    "sendUpdateRequest": "Send Update Request",
    "missingFields": "Missing Fields Detected",
    "selectRecipient": "Select Email Recipient",
    "updateRequestSent": "Update request sent successfully",
    "updateRequestFailed": "Failed to send update request",
    "noMissingFields": "No missing fields detected",
    "fieldsToUpdate": "The member will be asked to provide:"
  },
  "memberUpdate": {
    "title": "Update Your Information",
    "subtitle": "Please complete the missing information below",
    "tokenExpired": "This link has expired. Please contact us for a new link.",
    "tokenInvalid": "This link is invalid. Please contact us for assistance.",
    "tokenAlreadyUsed": "This form has already been submitted.",
    "updateSuccess": "Thank you! Your information has been updated.",
    "profileSection": "Personal Information",
    "medicalSection": "Medical Information",
    "contactsSection": "Emergency Contacts",
    "submitUpdate": "Submit Update"
  }
}
```

**Spanish:**
```json
{
  "crm": {
    "requestMemberUpdate": "Solicitar Actualización del Socio",
    "sendUpdateRequest": "Enviar Solicitud",
    "missingFields": "Campos Faltantes Detectados",
    "selectRecipient": "Seleccionar Destinatario",
    "updateRequestSent": "Solicitud de actualización enviada",
    "updateRequestFailed": "Error al enviar la solicitud",
    "noMissingFields": "No se detectaron campos faltantes",
    "fieldsToUpdate": "Se solicitará al socio que proporcione:"
  },
  "memberUpdate": {
    "title": "Actualice su Información",
    "subtitle": "Por favor complete la información faltante a continuación",
    "tokenExpired": "Este enlace ha caducado. Por favor contáctenos para obtener uno nuevo.",
    "tokenInvalid": "Este enlace no es válido. Por favor contáctenos para asistencia.",
    "tokenAlreadyUsed": "Este formulario ya ha sido enviado.",
    "updateSuccess": "¡Gracias! Su información ha sido actualizada.",
    "profileSection": "Información Personal",
    "medicalSection": "Información Médica",
    "contactsSection": "Contactos de Emergencia",
    "submitUpdate": "Enviar Actualización"
  }
}
```

