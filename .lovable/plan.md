

## First-Time Visitor Language Selection Popup

### Overview
Create a professional, welcoming popup that appears immediately when a first-time visitor lands on the site. The popup will display the ICE Alarm logo and two large clickable flag options (UK and Spain flags) for English and Spanish. Once selected, the language is set across the entire platform and the choice is remembered so the popup never shows again.

---

### Design Specification

**Visual Design:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     [ICE Alarm Logo]                        │
│                        España                               │
│                                                             │
│              Choose Your Preferred Language                 │
│              Elija su idioma preferido                      │
│                                                             │
│     ┌─────────────────┐    ┌─────────────────┐             │
│     │                 │    │                 │             │
│     │    🇬🇧 / 🇪🇸     │    │    🇬🇧 / 🇪🇸     │             │
│     │   (SVG Flag)    │    │   (SVG Flag)    │             │
│     │                 │    │                 │             │
│     │    English      │    │    Español      │             │
│     │                 │    │                 │             │
│     └─────────────────┘    └─────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Modal overlay with blurred background
- Logo prominently displayed at top
- Bilingual heading (both languages shown)
- Two large, hoverable flag cards
- Smooth animations on hover
- No close button - user must select a language
- Professional, clean design matching brand identity

---

### Phase 1: Create Language Selection Modal Component

**File:** `src/components/LanguageSelectionModal.tsx`

**Component Features:**
- Uses Dialog component from Radix UI
- Controlled by localStorage check for first-time visitors
- Large clickable flag cards (not emoji - use proper SVG flags)
- Bilingual header text (English and Spanish shown together)
- Sets i18n language on selection
- Stores `languageSelected: true` in localStorage
- Smooth fade-in animation

**Component Structure:**
```typescript
interface LanguageSelectionModalProps {
  open: boolean;
  onLanguageSelect: (lang: string) => void;
}

export function LanguageSelectionModal({ open, onLanguageSelect }: Props) {
  return (
    <Dialog open={open}>
      <DialogContent hideCloseButton className="max-w-md text-center">
        <Logo size="lg" className="mx-auto mb-4" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Choose Your Language / Elija su Idioma
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* English Card */}
          <button onClick={() => onLanguageSelect('en')} 
            className="p-6 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all">
            {/* UK Flag SVG */}
            <span className="text-lg font-medium mt-3">English</span>
          </button>
          
          {/* Spanish Card */}
          <button onClick={() => onLanguageSelect('es')}
            className="p-6 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all">
            {/* Spain Flag SVG */}
            <span className="text-lg font-medium mt-3">Español</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Phase 2: Create SVG Flag Components

**File:** `src/components/flags/UKFlag.tsx`
**File:** `src/components/flags/SpainFlag.tsx`

High-quality SVG flag components that scale well and look professional:

**UK Flag Example:**
```typescript
export function UKFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className}>
      {/* Union Jack SVG paths */}
    </svg>
  );
}
```

**Spain Flag Example:**
```typescript
export function SpainFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 750 500" className={className}>
      {/* Spanish flag SVG paths */}
    </svg>
  );
}
```

---

### Phase 3: Integrate Modal into App Component

**File:** `src/App.tsx`

**Changes:**
1. Add state to track if language selection popup should show
2. Check localStorage on mount for `iceAlarmLanguageSelected`
3. If not found, show the modal
4. On language selection, set i18n language and store flag in localStorage

**Implementation:**
```typescript
const App = () => {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  useEffect(() => {
    // Check if this is a first-time visitor
    const hasSelectedLanguage = localStorage.getItem('iceAlarmLanguageSelected');
    if (!hasSelectedLanguage) {
      setShowLanguageModal(true);
    }
  }, []);
  
  const handleLanguageSelect = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    localStorage.setItem('iceAlarmLanguageSelected', 'true');
    setShowLanguageModal(false);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* ... existing providers */}
        <LanguageSelectionModal 
          open={showLanguageModal} 
          onLanguageSelect={handleLanguageSelect} 
        />
        {/* ... rest of app */}
      </BrowserRouter>
    </QueryClientProvider>
  );
};
```

---

### Phase 4: Add Translation Keys

**File:** `src/i18n/locales/en.json`
**File:** `src/i18n/locales/es.json`

Add new translation keys for the language selection modal:

```json
// en.json - add to "languageSelection" section
{
  "languageSelection": {
    "title": "Choose Your Language",
    "titleSpanish": "Elija su Idioma", 
    "english": "English",
    "spanish": "Español"
  }
}

// es.json - add matching section
{
  "languageSelection": {
    "title": "Choose Your Language",
    "titleSpanish": "Elija su Idioma",
    "english": "English", 
    "spanish": "Español"
  }
}
```

Note: Both titles are shown simultaneously in the modal (bilingual display), so both languages see both texts.

---

### Summary of Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/LanguageSelectionModal.tsx` | Create | Main language selection modal component |
| `src/components/flags/UKFlag.tsx` | Create | High-quality UK flag SVG component |
| `src/components/flags/SpainFlag.tsx` | Create | High-quality Spain flag SVG component |
| `src/App.tsx` | Modify | Add modal state, localStorage check, and render modal |
| `src/i18n/locales/en.json` | Modify | Add languageSelection translation keys |
| `src/i18n/locales/es.json` | Modify | Add languageSelection translation keys |

---

### Technical Details

**localStorage Key:** `iceAlarmLanguageSelected`
- Value: `"true"` when user has made a selection
- Checked on every app load
- Combined with existing `i18nextLng` key for language persistence

**Why Not Use i18nextLng Key Alone?**
- The browser language detector sets `i18nextLng` automatically based on browser settings
- We need a separate flag to distinguish between "auto-detected" and "user-selected"
- This ensures the popup only shows once, even if user later clears just the language preference

**Modal Behavior:**
- Cannot be dismissed without selection (no X button, no backdrop click)
- Blocks interaction with the rest of the site
- Professional, welcoming design
- Large touch-friendly buttons for elderly users

**Performance:**
- Modal component is loaded immediately (not lazy loaded)
- Both language bundles already eagerly loaded
- Instant language switch with no network delay

