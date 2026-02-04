

## Goal
Add explicit English fallback values to all translation calls (`t()`) across all AI Agent components to ensure text always renders correctly, even during i18n loading timing edge cases. This matches the pattern already implemented in `AICommandCentre.tsx`.

## Files Requiring Updates

| File | Translation Keys Count |
|------|----------------------|
| `src/pages/admin/AIAgentDetail.tsx` | 15 keys |
| `src/components/admin/ai/AIInstructionsTab.tsx` | 7 keys |
| `src/components/admin/ai/AIToolsTab.tsx` | 8 keys |
| `src/components/admin/ai/AIMemoryTab.tsx` | 12 keys |
| `src/components/admin/ai/AITrainingTab.tsx` | 3 keys |
| `src/components/admin/ai/AISimulatorTab.tsx` | 8 keys |
| `src/components/admin/ai/AIAuditTab.tsx` | 9 keys |
| `src/components/admin/ai/AIAvatarUpload.tsx` | 11 keys |

## Implementation Details

### 1. AIAgentDetail.tsx (15 translations)
Add fallbacks to all translation calls:

```typescript
// Tab labels
t("ai.tabs.instructions", "Instructions")
t("ai.tabs.tools", "Tools & Permissions")
t("ai.tabs.memory", "Memory")
t("ai.tabs.training", "Training")
t("ai.tabs.simulator", "Run / Simulator")
t("ai.tabs.audit", "Audit Log")

// Status badges & buttons
t("ai.enabled", "Enabled")
t("ai.paused", "Paused")
t("ai.pauseAgent", "Pause Agent")
t("ai.enableAgent", "Enable Agent")

// Toast messages
t("ai.agentPaused", "Agent Paused")
t("ai.agentPausedDescription", "This agent will no longer process events.")
t("ai.agentEnabled", "Agent Enabled")
t("ai.agentEnabledDescription", "This agent is now active and processing events.")
t("ai.toggleError", "Failed to toggle agent status")

// Error states
t("ai.agentNotFound", "Agent not found")
t("common.goBack", "Go Back")
t("common.error", "Error")
```

### 2. AIInstructionsTab.tsx (7 translations)
```typescript
t("ai.systemInstruction", "System Instruction")
t("ai.systemInstructionDesc", "The core instructions that define how this agent behaves.")
t("ai.businessContext", "Business Context")
t("ai.businessContextDesc", "Additional context about your business for the agent.")
t("ai.instructionsSaved", "Instructions saved successfully")
t("common.saved", "Saved")
t("common.save", "Save")
t("common.error", "Error")
```

### 3. AIToolsTab.tsx (8 translations)
```typescript
t("ai.operatingMode", "Operating Mode")
t("ai.modes.adviseOnly", "Advise Only")
t("ai.modes.draftOnly", "Draft Only")
t("ai.modes.autoAct", "Auto Act")
t("ai.readPermissions", "Read Permissions")
t("ai.writePermissions", "Write Permissions")
t("ai.autoExecute", "Auto Execute")
t("common.saved", "Saved")
t("common.save", "Save")
t("common.error", "Error")
```

### 4. AIMemoryTab.tsx (12 translations)
```typescript
t("ai.knowledgeBase", "Knowledge Base")
t("ai.addMemory", "Add Memory")
t("ai.memoryTitle", "Title")
t("ai.memoryContent", "Content")
t("ai.importance", "Importance")
t("common.create", "Create")
t("common.created", "Created")
t("common.deleted", "Deleted")
t("common.loading", "Loading...")
t("common.error", "Error")
```

### 5. AITrainingTab.tsx (3 translations)
```typescript
t("ai.trainingData", "Training Data")
t("ai.trainingDataDesc", "Q&A pairs and examples that help train this agent.")
t("ai.noTrainingData", "No training data added yet. Add memory entries with the 'training' tag.")
```

### 6. AISimulatorTab.tsx (8 translations)
```typescript
t("ai.inputContext", "Input Context")
t("ai.inputContextDesc", "Provide JSON context to simulate an agent run.")
t("ai.runSimulation", "Run Simulation")
t("ai.output", "Output")
t("ai.noOutputYet", "Run a simulation to see the output here.")
t("ai.simulationComplete", "Simulation completed")
t("common.error", "Error")
```

### 7. AIAuditTab.tsx (9 translations)
```typescript
t("ai.recentRuns", "Recent Runs")
t("ai.recentActions", "Recent Actions")
t("ai.time", "Time")
t("ai.status", "Status")
t("ai.tokens", "Tokens")
t("ai.duration", "Duration")
t("ai.actionType", "Action Type")
t("common.loading", "Loading...")
```

### 8. AIAvatarUpload.tsx (11 translations)
Already has most fallbacks! Verify and standardize:
```typescript
t("ai.uploadAvatar", "Upload Avatar")
t("ai.avatarDescription", "This image appears in the chat widget")
t("ai.avatarUploaded", "Avatar uploaded")
t("ai.avatarUploadedDescription", "Agent avatar has been updated")
t("ai.avatarRemoved", "Avatar removed")
t("ai.avatarRemovedDescription", "Agent avatar has been removed")
t("ai.avatarInvalidType", "Please upload a JPG, PNG, or WebP image")
t("ai.avatarTooLarge", "Image must be less than 5MB")
t("ai.avatarUploadError", "Failed to upload avatar")
t("ai.avatarRemoveError", "Failed to remove avatar")
t("common.custom", "Custom")
t("common.remove", "Remove")
t("common.error", "Error")
```

## What Will NOT Change
- No functionality changes
- No UI layout changes
- No removal of any features
- All existing translation keys in locale files remain unchanged
- Spanish translations continue to work as expected

## Technical Pattern
The fix follows the established pattern from `AICommandCentre.tsx`:

```typescript
// BEFORE (can show literal key during loading)
{t("ai.tabs.instructions")}

// AFTER (always shows readable text)
{t("ai.tabs.instructions", "Instructions")}
```

## Summary
This is a defensive hardening update adding ~65 fallback strings across 8 files to ensure the AI Command Centre never displays raw translation keys like `ai.tabs.instructions` to users.

