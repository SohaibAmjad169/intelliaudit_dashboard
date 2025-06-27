# Field Notes & Equipment Service Migration Plan

## Current Issues
- Multiple overlapping services for field notes processing
- Deprecated endpoints still in use (`equipment-prisma/field-notes`)
- Tight coupling between components and services
- Inconsistent naming conventions and organization

## Implementation Plan

### Phase 1: Create New Field Notes Service (Today)
- [x] Create `frontend/src/services/field-notes/` directory
- [x] Implement `field-notes.service.ts` calling the new `/field-notes` endpoint
- [x] Create proper TypeScript interfaces for request/response data
- [x] Add comprehensive error handling and logging

### Phase 2: Migrate Frontend Components to New Service (Current Sprint)
- [x] Update `FieldNotesProcessor.tsx` to use the new service
- [ ] Verify functionality in development environment
- [ ] Add any missing features
- [x] Update imports across the codebase

### Phase 3: Clean Up Equipment Services (Next Sprint)
- [x] Identify all components using `ashrae-equipment.ts` and `field-notes.ts`
- [x] Migrate those components to use the new field notes service
- [x] Remove old services and dependencies

### Phase 4: Reorganize Services (Next Sprint)
- [ ] Standardize naming conventions
- [ ] Move photo analysis to its own directory
- [ ] Clean up equipment-specific services
- [ ] Update imports across the codebase

## Implementation Details

### New Directory Structure
```
/services/
  /field-notes/
    field-notes.service.ts
    field-notes.types.ts
  /equipment/
    equipment.service.ts
    equipment.types.ts
  /photos/
    photo-analysis.service.ts
    photo-analysis.types.ts
```

### Migration Strategy
- Create new implementations alongside existing code
- Switch components one by one to the new implementations
- Test thoroughly after each change
- Remove deprecated implementations after all components are migrated

### Backward Compatibility
- Maintain old services during transition
- Add deprecation warnings to console.log
- Document migration path for other developers

## Progress Update - Today
- Created new field-notes directory and service
- Implemented proper TypeScript interfaces for all data structures
- Updated FieldNotesProcessor component to use new service
- Added comprehensive error handling in new service
- Next: Verify functionality with real field notes 