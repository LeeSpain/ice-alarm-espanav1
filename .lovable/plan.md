
## Complete Member Dashboard Translation Audit & Fixes

### Overview
A comprehensive code-by-code review of all member dashboard pages has been completed. The majority of the interface is correctly translated, but several hardcoded strings and missing translation keys were identified. This plan ensures 100% bilingual coverage without losing any existing functionality.

---

### Issues Identified

#### Category 1: Date/Locale Formatting (Critical)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `ClientDashboard.tsx` | 146-151 | Date hardcoded to `'en-GB'` locale | Use i18n locale-aware formatting with `date-fns/locale` |

**Current Code:**
```typescript
const currentDate = new Date().toLocaleDateString('en-GB', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
```

**Fixed Code:**
```typescript
import { es, enGB } from 'date-fns/locale';
import { format } from 'date-fns';

const locale = i18n.language === 'es' ? es : enGB;
const currentDate = format(new Date(), 'EEEE, d MMMM yyyy', { locale });
```

---

#### Category 2: Hardcoded Plan/Billing Labels

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `ClientDashboard.tsx` | 155-166 | `formatPlanType()` and `formatBillingFrequency()` return hardcoded English | Use existing translation keys from `membership` namespace |

**Current Code:**
```typescript
const formatPlanType = (type: string) => {
  return type === "single" ? "Single Person" : type === "couple" ? "Couple" : type;
};

const formatBillingFrequency = (freq: string) => {
  switch (freq) {
    case "monthly": return "/month";
    case "quarterly": return "/quarter";
    case "annual": return "/year";
    default: return "";
  }
};
```

**Fixed Code:**
```typescript
const formatPlanType = (type: string) => {
  return type === "single" ? t("membership.single") : type === "couple" ? t("membership.couple") : type;
};

const formatBillingFrequency = (freq: string) => {
  switch (freq) {
    case "monthly": return t("subscription.mo");
    case "quarterly": return t("subscription.quarterly", "/quarter");
    case "annual": return t("subscription.yr");
    default: return "";
  }
};
```

---

#### Category 3: Hardcoded Placeholders & Labels

| File | Line | Issue | Key to Use/Add |
|------|------|-------|----------------|
| `ProfilePage.tsx` | 181 | `placeholder="Select language"` | `t("profile.selectLanguage")` |
| `ProfilePage.tsx` | 334 | `"Address Line 2 (Optional)"` fallback | Key exists, remove fallback |
| `ProfilePage.tsx` | 387 | `"Spain"` hardcoded default | `t("common.spain")` |
| `EmergencyContactsPage.tsx` | 68-82 | `RELATIONSHIPS` array hardcoded in English | Use `t("contacts.relationships.*")` keys |
| `EmergencyContactsPage.tsx` | 380 | `"Full name"` fallback placeholder | Key exists, remove fallback |
| `MedicalInfoPage.tsx` | 327 | `"Dr. Name"` fallback placeholder | Key exists, remove fallback |
| `MedicalInfoPage.tsx` | 331 | `"+34 000 000 000"` placeholder | Use `t("common.phonePlaceholder")` |
| `MedicalInfoPage.tsx` | 345 | `"Hospital name"` fallback | Key exists, remove fallback |
| `MedicalInfoPage.tsx` | 370 | `"Add condition..."` fallback | Key exists, remove fallback |
| `MedicalInfoPage.tsx` | 405 | `"Add medication..."` fallback | Key exists, remove fallback |
| `MedicalInfoPage.tsx` | 427 | `"Any other important..."` fallback | Key exists, remove fallback |

---

#### Category 4: Navigation Fallbacks (Low Priority but should clean up)

| File | Lines | Issue |
|------|-------|-------|
| `ClientLayout.tsx` | 83-124 | All menu items have `|| "English Fallback"` patterns |

These fallbacks are defensive but create inconsistency. The keys exist, so fallbacks can be removed.

---

#### Category 5: Missing Translation Keys

**Keys to Add to `en.json`:**

```json
{
  "common": {
    "spain": "Spain",
    "phonePlaceholder": "+34 000 000 000"
  },
  "profile": {
    "selectLanguage": "Select language"
  },
  "subscription": {
    "quarterly": "/quarter"
  },
  "contacts": {
    "subtitle": "People we call if you need help",
    "networkTitle": "Your Emergency Network",
    "networkDesc": "These contacts will be called in order of priority if we can't reach you during an emergency. You can have up to 3 contacts.",
    "addPrompt": "Add emergency contacts so we can reach your loved ones if needed.",
    "addFirst": "Add Your First Contact",
    "limitReached": "You've reached the maximum of 3 emergency contacts. Remove one to add another.",
    "dialogDesc": "Enter the details for your emergency contact.",
    "selectRelationship": "Select relationship",
    "notesPlaceholder": "Any additional information...",
    "deleteTitle": "Delete Contact",
    "deleteConfirm": "Are you sure you want to remove this emergency contact? This action cannot be undone.",
    "updated": "Contact updated successfully",
    "added": "Contact added successfully",
    "deleted": "Contact deleted"
  },
  "medical": {
    "subtitle": "Important health details for emergencies",
    "emergencyTitle": "Emergency Medical Data",
    "emergencyDesc": "This information is shared with emergency services when you need help. Keep it up to date for your safety.",
    "noData": "No Medical Information",
    "addPrompt": "Add your medical details so we can provide better emergency care.",
    "addInfo": "Add Medical Information",
    "hospital": "Preferred Hospital",
    "hospitalName": "Hospital name",
    "conditions": "Medical Conditions",
    "addCondition": "Add condition...",
    "addMedication": "Add medication...",
    "addAllergy": "Add allergy...",
    "notesPlaceholder": "Any other important medical information...",
    "selectBloodType": "Select blood type"
  },
  "support": {
    "faq": {
      "testPendant": "How do I test my pendant?",
      "testPendantAnswer": "Press and hold the SOS button for 3 seconds. Our team will answer and confirm your device is working. We recommend testing monthly.",
      "sosButton": "What happens when I press the SOS button?",
      "sosButtonAnswer": "When you press and hold for 3 seconds, an alert goes to our 24/7 team. They'll speak to you through your pendant and coordinate any help needed.",
      "fallDetection": "How does fall detection work?",
      "fallDetectionAnswer": "Your pendant detects sudden movements like falls. If detected, we call through your pendant. No response? We follow your emergency protocol.",
      "geoFencing": "What is geo-fencing?",
      "geoFencingAnswer": "Geo-fencing creates a virtual boundary around a location. If you leave this area, designated contacts can be alerted.",
      "updateMedical": "How do I update my medical information?",
      "updateMedicalAnswer": "Go to 'Medical Info' in your dashboard and click 'Edit' to update your information directly.",
      "addContacts": "How do I add emergency contacts?",
      "addContactsAnswer": "Go to 'Emergency Contacts' in your dashboard. You can add up to 3 contacts who will be called if we can't reach you."
    },
    "title": "Support Hub",
    "subtitle": "Get help from our AI assistant, message our team, or find answers",
    "aiAssistant": "AI Assistant",
    "staffMessages": "Messages",
    "helpCenter": "Help Center",
    "forEmergencies": "For Emergencies",
    "pressSosButton": "Press your SOS button or call us directly",
    "teamWithYou": "Our 24/7 team is here for you",
    "enterSubjectAndMessage": "Please enter a subject and message",
    "messageSent": "Message sent!",
    "failedToSend": "Failed to send message",
    "backToSupport": "Back to Support",
    "conversation": "Conversation",
    "started": "Started",
    "you": "You",
    "typeMessage": "Type your message...",
    "status": {
      "open": "Open",
      "resolved": "Resolved",
      "closed": "Closed"
    }
  }
}
```

**Equivalent keys to add to `es.json`:**

```json
{
  "common": {
    "spain": "España",
    "phonePlaceholder": "+34 000 000 000"
  },
  "profile": {
    "selectLanguage": "Seleccionar idioma"
  },
  "subscription": {
    "quarterly": "/trimestre"
  },
  "contacts": {
    "subtitle": "Personas a las que llamamos si necesita ayuda",
    "networkTitle": "Su Red de Emergencia",
    "networkDesc": "Estos contactos serán llamados en orden de prioridad si no podemos localizarle durante una emergencia. Puede tener hasta 3 contactos.",
    "addPrompt": "Añada contactos de emergencia para que podamos avisar a sus seres queridos si es necesario.",
    "addFirst": "Añadir Su Primer Contacto",
    "limitReached": "Ha alcanzado el máximo de 3 contactos de emergencia. Elimine uno para añadir otro.",
    "dialogDesc": "Introduzca los datos de su contacto de emergencia.",
    "selectRelationship": "Seleccionar relación",
    "notesPlaceholder": "Cualquier información adicional...",
    "deleteTitle": "Eliminar Contacto",
    "deleteConfirm": "¿Está seguro de que desea eliminar este contacto de emergencia? Esta acción no se puede deshacer.",
    "updated": "Contacto actualizado correctamente",
    "added": "Contacto añadido correctamente",
    "deleted": "Contacto eliminado"
  },
  "medical": {
    "subtitle": "Información de salud importante para emergencias",
    "emergencyTitle": "Datos Médicos de Emergencia",
    "emergencyDesc": "Esta información se comparte con los servicios de emergencia cuando necesita ayuda. Manténgala actualizada para su seguridad.",
    "noData": "Sin Información Médica",
    "addPrompt": "Añada sus datos médicos para que podamos proporcionar mejor atención de emergencia.",
    "addInfo": "Añadir Información Médica",
    "hospital": "Hospital Preferido",
    "hospitalName": "Nombre del hospital",
    "conditions": "Condiciones Médicas",
    "addCondition": "Añadir condición...",
    "addMedication": "Añadir medicación...",
    "addAllergy": "Añadir alergia...",
    "notesPlaceholder": "Cualquier otra información médica importante...",
    "selectBloodType": "Seleccionar grupo sanguíneo"
  },
  "support": {
    "faq": {
      "testPendant": "¿Cómo pruebo mi colgante?",
      "testPendantAnswer": "Mantenga pulsado el botón SOS durante 3 segundos. Nuestro equipo responderá y confirmará que su dispositivo funciona. Recomendamos probarlo mensualmente.",
      "sosButton": "¿Qué pasa cuando pulso el botón SOS?",
      "sosButtonAnswer": "Cuando lo mantiene pulsado 3 segundos, una alerta llega a nuestro equipo 24/7. Hablarán con usted a través de su colgante y coordinarán la ayuda necesaria.",
      "fallDetection": "¿Cómo funciona la detección de caídas?",
      "fallDetectionAnswer": "Su colgante detecta movimientos bruscos como caídas. Si se detecta, llamamos a través de su colgante. ¿Sin respuesta? Seguimos su protocolo de emergencia.",
      "geoFencing": "¿Qué es el geo-cercado?",
      "geoFencingAnswer": "El geo-cercado crea un límite virtual alrededor de una ubicación. Si sale de esta área, los contactos designados pueden ser alertados.",
      "updateMedical": "¿Cómo actualizo mi información médica?",
      "updateMedicalAnswer": "Vaya a 'Información Médica' en su panel y haga clic en 'Editar' para actualizar su información directamente.",
      "addContacts": "¿Cómo añado contactos de emergencia?",
      "addContactsAnswer": "Vaya a 'Contactos de Emergencia' en su panel. Puede añadir hasta 3 contactos que serán llamados si no podemos localizarle."
    },
    "title": "Centro de Soporte",
    "subtitle": "Obtenga ayuda de nuestro asistente IA, contacte a nuestro equipo o encuentre respuestas",
    "aiAssistant": "Asistente IA",
    "staffMessages": "Mensajes",
    "helpCenter": "Centro de Ayuda",
    "forEmergencies": "Para Emergencias",
    "pressSosButton": "Pulse su botón SOS o llámenos directamente",
    "teamWithYou": "Nuestro equipo 24/7 está aquí para usted",
    "enterSubjectAndMessage": "Por favor introduzca un asunto y mensaje",
    "messageSent": "¡Mensaje enviado!",
    "failedToSend": "Error al enviar mensaje",
    "backToSupport": "Volver a Soporte",
    "conversation": "Conversación",
    "started": "Iniciada",
    "you": "Usted",
    "typeMessage": "Escriba su mensaje...",
    "status": {
      "open": "Abierto",
      "resolved": "Resuelto",
      "closed": "Cerrado"
    }
  }
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/client/ClientDashboard.tsx` | Fix date locale, fix `formatPlanType()`, fix `formatBillingFrequency()` |
| `src/pages/client/ProfilePage.tsx` | Add `selectLanguage` placeholder key, remove hardcoded "Spain" |
| `src/pages/client/EmergencyContactsPage.tsx` | Translate `RELATIONSHIPS` array using t() |
| `src/pages/client/MedicalInfoPage.tsx` | Remove fallback strings from placeholders (keys already exist) |
| `src/components/layout/ClientLayout.tsx` | Remove unnecessary English fallbacks (keys exist) |
| `src/i18n/locales/en.json` | Add missing keys listed above |
| `src/i18n/locales/es.json` | Add Spanish translations for all new keys |

---

### Implementation Sequence

1. **Update Translation Files First**
   - Add all missing keys to `en.json`
   - Add all Spanish translations to `es.json`

2. **Fix ClientDashboard.tsx**
   - Import date-fns locale helpers
   - Refactor date formatting to be locale-aware
   - Update `formatPlanType()` to use translation keys
   - Update `formatBillingFrequency()` to use translation keys

3. **Fix ProfilePage.tsx**
   - Add translated placeholder for language selector
   - Replace hardcoded "Spain" with translation key

4. **Fix EmergencyContactsPage.tsx**
   - Convert static `RELATIONSHIPS` array to use translation function

5. **Fix MedicalInfoPage.tsx**
   - Remove fallback strings where keys already exist
   - Ensure all placeholders use translation keys

6. **Clean Up ClientLayout.tsx**
   - Remove defensive fallbacks (keys already exist in both locales)

---

### Verification Checklist

After implementation:
- [ ] Switch to Spanish and verify all dashboard text displays correctly
- [ ] Switch to English and verify nothing is broken
- [ ] Verify date displays in correct locale format
- [ ] Verify all form placeholders translate
- [ ] Verify relationship dropdown translates
- [ ] Verify all toasts/success messages translate
- [ ] Verify Support page FAQ displays in both languages

---

### No Content Loss Guarantee

This plan only:
- Replaces hardcoded strings with translation function calls
- Adds missing keys to translation files
- Removes unnecessary fallback strings where keys already exist

No existing functionality, styling, or logic will be modified.
