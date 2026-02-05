
# Video Hub Complete Review & Improvement Plan

## Current Implementation Status: ✅ Solid Foundation

After reviewing all Video Hub files, the implementation is well-structured with:
- Clean component architecture
- Proper hooks for data management
- Full bilingual support (EN/ES)
- Proper database schema with RLS
- Edge function for render queue

---

## Issues Found & Improvements

### 1. Performance Optimizations

**A. Memoization Missing in Components**
- `VideoProjectsTab`: `filteredProjects`, `getTemplateName`, badge functions recalculate on every render
- `VideoExportsTab`: `getProjectDetails` called multiple times per row
- `VideoCreateTab`: Large component with no memoization

**B. Unnecessary Re-fetching**
- `VideoExportsTab` fetches both exports AND projects - should use a joined query or cache
- Templates fetched separately in multiple components

### 2. UX Improvements

**A. Create Video Wizard Issues**
- No step validation before proceeding (can skip without filling required fields)
- No way to edit an existing project (only create new)
- "Render Video" button doesn't actually call the render edge function (just saves as draft)
- No progress indicator for ongoing renders in the Projects tab

**B. Missing Features**
- No delete functionality for projects
- No bulk actions (select multiple, bulk archive)
- Search doesn't filter by status/format/language
- No pagination for large datasets
- Projects tab "Open" action does nothing (no edit mode)

**C. Template Selection UX**
- When clicking "Use Template" in Templates tab, doesn't pass the selected template ID to Create tab

### 3. Code Quality Issues

**A. Duplicate Code**
- `handleSaveDraft` and `handleRender` in `VideoCreateTab` are nearly identical
- Badge rendering logic duplicated across components

**B. Missing Error Handling**
- No try-catch around mutations in Create tab
- No error states displayed to users
- Edge function errors not surfaced properly

**C. Unused Imports/Variables**
- `VideoCreateTab`: `Textarea` import removed but component still functional
- `VideoExportsTab`: `_type` parameter unused in handleDownload

### 4. Missing Integrations

- Render button doesn't call the `video-render-queue` edge function
- No realtime subscription for render progress updates
- "Send to AI Outreach" creates a link but AI Outreach page doesn't read it

---

## Implementation Plan

### Phase 1: Performance Fixes (Quick Wins)

**1.1 Add useMemo to VideoProjectsTab**
- Memoize `filteredProjects` based on `projects` and `searchQuery`
- Memoize badge rendering functions

**1.2 Optimize VideoExportsTab**
- Use `useMemo` for project lookup map
- Avoid recalculating project details on each render

**1.3 Add React.memo to tab components**
- Wrap tab components to prevent unnecessary re-renders when switching tabs

### Phase 2: Fix Critical Functionality

**2.1 Wire up Render Button**
- Modify `handleRender` to:
  1. Create the project first
  2. Call the `video-render-queue` edge function with the project ID
  3. Show proper loading/success/error states

**2.2 Add Render Status to Projects Tab**
- Fetch latest render status per project
- Show render progress badge (Queued/Rendering 45%/Complete)
- Add refresh button or realtime subscription

**2.3 Fix Template → Create Flow**
- Pass template ID when clicking "Use Template"
- Pre-fill the Create tab with the selected template

### Phase 3: UX Enhancements

**3.1 Add Project Edit Mode**
- Make "Open" action load project data into Create tab
- Add "Edit" mode vs "Create" mode differentiation
- Show "Update Project" button in edit mode

**3.2 Add Step Validation**
- Step 1: Require project name (show warning)
- Step 2-4: No strict requirements
- Step 5: Validate before render

**3.3 Add Delete Project**
- Add delete option in dropdown menu
- Confirmation dialog before deletion
- Add hook method for deletion

**3.4 Add Filters**
- Status filter (All/Draft/Approved/Archived)
- Format filter (All/Portrait/Landscape/Square)
- Language filter (All/EN/ES/Both)

### Phase 4: Code Cleanup

**4.1 Extract Shared Badge Component**
- Create `VideoBadges.tsx` with:
  - `StatusBadge`
  - `LanguageBadge`
  - `FormatBadge`
- Reuse across Projects and Exports tabs

**4.2 Consolidate Save/Render Logic**
- Create shared `prepareProjectPayload()` function
- Single mutation with status parameter

**4.3 Add Proper Error Handling**
- Wrap mutations in try-catch
- Show error toasts with message
- Add error states in hooks

### Phase 5: Realtime & Advanced Features

**5.1 Realtime Render Progress**
- Subscribe to `video_renders` table changes
- Auto-update progress in Projects tab
- Auto-refresh Exports when render completes

**5.2 Add Pagination**
- Add pagination to Projects table (10/25/50 per page)
- Add pagination to Exports table

---

## Detailed File Changes

| File | Changes |
|------|---------|
| `VideoProjectsTab.tsx` | Add useMemo, add delete action, add filters, add render status, wire up "Open" action |
| `VideoCreateTab.tsx` | Add edit mode, wire up render function, add validation, consolidate save logic |
| `VideoTemplatesTab.tsx` | Pass template ID on "Use Template" click |
| `VideoExportsTab.tsx` | Add useMemo for project lookup, remove unused variable |
| `VideoHubPage.tsx` | Add filter states, pass edit project handler, add selected template state |
| `useVideoProjects.ts` | Add deleteProject mutation |
| `useVideoRenders.ts` | Add realtime subscription for progress updates |
| `VideoBadges.tsx` (new) | Shared badge components |

---

## Priority Order

1. **Critical**: Wire up render button to edge function (currently non-functional)
2. **High**: Add edit project functionality (Open action does nothing)
3. **High**: Add render status display in Projects tab
4. **Medium**: Performance optimizations (memoization)
5. **Medium**: Add filters and delete functionality
6. **Low**: Realtime updates, pagination

---

## Technical Details

### Render Button Fix
```typescript
const handleRender = async () => {
  if (!projectData.name) {
    toast.error(t("videoHub.create.nameRequired"));
    return;
  }

  try {
    // 1. Create/update the project
    const project = await createProject({...});
    
    // 2. Call render edge function
    const response = await supabase.functions.invoke('video-render-queue', {
      body: { project_id: project.id }
    });
    
    if (response.error) throw response.error;
    
    toast.success(t("videoHub.create.renderQueued"));
    onComplete();
  } catch (error) {
    toast.error(error.message || t("common.error"));
  }
};
```

### Project Edit Mode
```typescript
// In VideoHubPage
const [editingProject, setEditingProject] = useState<VideoProject | null>(null);

// Pass to VideoCreateTab
<VideoCreateTab 
  editingProject={editingProject}
  onComplete={() => {
    setEditingProject(null);
    setActiveTab("projects");
  }} 
/>

// Pass handler to ProjectsTab
<VideoProjectsTab 
  onEdit={(project) => {
    setEditingProject(project);
    setActiveTab("create");
  }}
/>
```

### Shared Badge Component
```typescript
// src/components/admin/video-hub/VideoBadges.tsx
export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const variants = {
    draft: "secondary",
    approved: "bg-status-active text-white",
    archived: "outline"
  };
  return <Badge variant={variants[status]}>{t(`videoHub.statuses.${status}`)}</Badge>;
}
```

---

## Summary

The Video Hub implementation has a solid foundation but needs:
1. **Functional fixes**: Render button, edit mode, template selection flow
2. **Performance**: Memoization and query optimization
3. **UX**: Filters, delete, validation, status indicators
4. **Code quality**: Shared components, error handling, cleanup

This plan addresses all issues while maintaining the existing architecture and bilingual support.
