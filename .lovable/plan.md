

# Documentation Center Upgrade - Implementation Plan

## Overview

Upgrade the admin Documentation Center (`/admin/settings` → Docs tab) with a full-featured document viewer, PDF generation, and download capabilities. This will transform it from a basic table view into a professional document management interface.

---

## Current State

| Feature | Status |
|---------|--------|
| Document List View | ✅ Basic table with filters |
| Document Editor | ✅ Create/edit with markdown |
| Document Preview | ❌ None - only edit mode |
| PDF Generation | ❌ Not available |
| Download Options | ❌ Not available |
| Full-screen Reading | ❌ Not available |
| Markdown Rendering | ❌ Basic newline→br only |

---

## Planned Improvements

### 1. Document Viewer Modal (New Component)
Create a dedicated full-screen document viewer for reading documents:

| Feature | Description |
|---------|-------------|
| Full Document Display | Scrollable view with proper markdown rendering |
| Header with Title | Document title, category badge, language, version |
| Metadata Panel | Tags, visibility, importance, last updated |
| Action Buttons | Print/PDF, Download (MD), Close |
| Keyboard Navigation | ESC to close |

### 2. Proper Markdown Rendering
Install `react-markdown` library for professional markdown display:

- Headings (H1-H6) with proper styling
- Bold, italic, strikethrough
- Bullet and numbered lists
- Code blocks with syntax highlighting
- Blockquotes
- Horizontal rules
- Links and images

### 3. PDF Generation (Print-to-PDF)
Implement browser-native print functionality:

- Opens styled document in new window
- Triggers browser print dialog
- User can select "Save as PDF"
- Includes company header and footer
- Clean print-optimized styling

### 4. Download Options
Add multiple download formats:

| Format | Description |
|--------|-------------|
| Markdown (.md) | Original source content |
| Plain Text (.txt) | Stripped markdown formatting |
| Print/PDF | Browser print dialog |

### 5. Enhanced Table Actions
Update the document table with quick actions:

- **View** button - opens viewer modal
- **Edit** button - opens editor (existing)
- **Download** dropdown - MD/TXT options
- **Print** button - opens print view
- **Delete** button - with confirmation (existing)

---

## New Components

### `DocumentViewerModal.tsx`
Full-screen modal for reading documents:

```text
┌─────────────────────────────────────────────────────────────────┐
│  [←] Document Title                          [Print] [Download] │
│  Category: Emergency  │  Language: EN  │  v3  │  Updated: Jan 3 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ## SOS Alert Response Protocol                                 │
│                                                                 │
│  This protocol outlines the step-by-step procedure for         │
│  responding to SOS alerts from member devices...                │
│                                                                 │
│  ### Step 1: Acknowledge Alert                                  │
│  - Click "Acknowledge" within 30 seconds                        │
│  - Attempt first contact with member                            │
│                                                                 │
│  ...                                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Tags: #sos #emergency #response                                │
│  Visibility: Staff, AI                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/admin/settings/DocumentViewerModal.tsx` | Full document viewer with markdown rendering |
| `src/lib/documentPrint.ts` | Utility functions for print/PDF generation |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/settings/DocumentationSettingsTab.tsx` | Add View button, download dropdown, print action |
| `package.json` | Add `react-markdown` and `remark-gfm` dependencies |

---

## Implementation Details

### Markdown Rendering
Using `react-markdown` with GitHub Flavored Markdown (GFM) support:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown 
  remarkPlugins={[remarkGfm]}
  className="prose prose-sm max-w-none dark:prose-invert"
>
  {document.content}
</ReactMarkdown>
```

### Print/PDF Function
Browser-native approach (no external PDF library needed):

```tsx
function printDocument(doc: Documentation) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>${doc.title}</title>
        <style>
          body { font-family: system-ui; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1, h2, h3 { margin-top: 1.5em; }
          /* ... print styles ... */
        </style>
      </head>
      <body>
        <header>ICE Alarm España - ${categoryLabels[doc.category]}</header>
        <h1>${doc.title}</h1>
        ${markdownToHtml(doc.content)}
        <footer>Version ${doc.version} | ${doc.language.toUpperCase()}</footer>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}
```

### Download Functions

```tsx
// Download as Markdown
function downloadMarkdown(doc: Documentation) {
  const blob = new Blob([doc.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.slug}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Download as Plain Text
function downloadText(doc: Documentation) {
  // Strip markdown formatting
  const plainText = doc.content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/- /g, '• ');
  
  const blob = new Blob([plainText], { type: 'text/plain' });
  // ... download logic
}
```

---

## Updated Table Row Actions

Current actions menu will be expanded:

| Action | Icon | Description |
|--------|------|-------------|
| View | Eye | Opens DocumentViewerModal |
| Edit | Pencil | Opens DocumentEditor (existing) |
| Print | Printer | Opens print dialog |
| Download | Download | Submenu: Markdown, Plain Text |
| Delete | Trash | Confirmation dialog (existing) |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-markdown` | ^9.0.1 | Markdown to React rendering |
| `remark-gfm` | ^4.0.0 | GitHub Flavored Markdown support |

---

## Summary

| Improvement | Implementation |
|-------------|----------------|
| Document Viewer | New modal with full content display |
| Markdown Rendering | react-markdown with GFM plugin |
| PDF Generation | Browser print-to-PDF (no library needed) |
| Download Options | Markdown and Plain Text exports |
| Enhanced Actions | View, Edit, Print, Download, Delete |

This upgrade will transform the Documentation Center into a complete document management system where administrators can create, read, edit, print, and download all company documentation.

