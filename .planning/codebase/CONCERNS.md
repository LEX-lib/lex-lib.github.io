# Codebase Concerns

**Analysis Date:** 2026-04-28

## Data Synchronization Issues

**Watch initialization not firing on mount:**
- Issue: `watch(selectedDate, ...)` at `src/views/LexTrackView.vue:97` only fires on change, not on initial component mount
- Files: `src/views/LexTrackView.vue` (lines 97-123)
- Impact: Page loads with empty activities list until user interacts with the date picker; data only fetches when date changes
- Fix approach: Use `immediate: true` in watch options or call fetch function in onMounted hook to load initial data

**Delete operations only mutate local state:**
- Issue: `removeSupport`, `removeMeeting`, `removeTask` functions (lines 37-41, 61-65, 87-91 in `src/views/LexTrackView.vue`) use lodash `remove()` to delete from local arrays but never call `pb.collection(...).delete()`
- Files: `src/views/LexTrackView.vue` (lines 37-41, 61-65, 87-91)
- Impact: Deletions appear to work in the UI but are never persisted to PocketBase; deleted items reappear after page reload, creating confusing user experience and potential data integrity issues
- Fix approach: Refactor remove functions to call `pb.collection('dsu_supports').delete(id)` before removing from local array, or batch delete operations in the save function

**Dialog "Save" buttons show UI feedback without persisting data:**
- Issue: `ManageMeeting.vue:20`, `ManageTask.vue:22`, and `ManageSupport.vue:20` have "Save" buttons that only display a toast notification; data persistence happens only via the page-level Save button in `LexTrackView.vue`
- Files: `src/components/projects/lextrack/ManageMeeting.vue`, `src/components/projects/lextrack/ManageTask.vue`, `src/components/projects/lextrack/ManageSupport.vue`
- Impact: Users see success notifications for actions that don't actually persist; creates false confidence and potential data loss if page is closed before clicking page-level Save
- Fix approach: Either make dialog Save buttons actually persist to PocketBase, or clarify UI messaging that changes only commit when page Save is clicked

**ActivityCard Enter key creates incomplete objects:**
- Issue: `src/components/projects/lextrack/ActivityCard.vue:30` pushes bare `{ title: (event.target as HTMLInputElement).value }` object missing required `date` field
- Files: `src/components/projects/lextrack/ActivityCard.vue` (line 30)
- Impact: New items created via Enter key lack the required `date` field, forcing fragile patching at save time; could cause PocketBase validation errors
- Fix approach: Create complete item objects with all required fields (including `date` from parent context) before pushing to array

## Schema Design Issues

**Missing URL field for support items:**
- Issue: `dsu_supports` schema (src/types/lextrack/dsu_supports/types.d.ts) has no `link` field, but real-world admin tasks typically need associated URLs (service desk tickets, MHD links, etc.)
- Files: `src/types/lextrack/dsu_supports/types.d.ts`, `src/components/projects/lextrack/ManageSupport.vue`
- Impact: Support items cannot capture critical reference links; users must track URLs separately or paste them in descriptions
- Fix approach: Add optional `link: string` field to `DsuSupports` schema and update ManageSupport.vue to include URL input field

**Single link field insufficient for tasks:**
- Issue: `dsu_tasks.jira_link` field (src/types/lextrack/dsu_tasks/types.d.ts:9) is a single URL string, but real-world tasks often have multiple links (Jira ticket + PR + Release Notes + MHD)
- Files: `src/types/lextrack/dsu_tasks/types.d.ts` (line 9), `src/components/projects/lextrack/ManageTask.vue`
- Impact: Tasks with multiple related resources cannot be properly tracked; users forced to concatenate URLs in a single field or use descriptions
- Fix approach: Change `jira_link` to a `links: Array<{ label?: string; url: string }>` structure or add separate fields for common link types

**Duration only accepts minutes:**
- Issue: `dsu_meetings.duration_minutes` field (src/types/lextrack/dsu_meetings/types.d.ts:9) only accepts minutes as a number, but requirements call for "hour OR minutes" toggle
- Files: `src/types/lextrack/dsu_meetings/types.d.ts` (line 9), `src/components/projects/lextrack/ManageMeeting.vue` (line 43)
- Impact: Long meetings require converting hours to minutes; no way to track whether duration represents hours or minutes without context
- Fix approach: Change to structure like `duration: { value: number; unit: 'hours' | 'minutes' }` or add separate `duration_hours` field with unit toggle in UI

## Error Handling & Robustness

**No error handling in save function:**
- Issue: `src/views/LexTrackView.vue:125-161` has no try-catch blocks or error handling for PocketBase create/update/delete operations
- Files: `src/views/LexTrackView.vue` (lines 125-161)
- Impact: Network failures, validation errors, or auth issues during save silently fail; users don't know if data was persisted; partial saves can occur (some items succeed, others fail)
- Fix approach: Wrap save loops in try-catch, show error toast on failure, implement rollback for partial saves, add user feedback for success/failure

**No loading or error UI states:**
- Issue: Save function provides no loading indicator, error messages, or success confirmation; button remains enabled during async operations
- Files: `src/views/LexTrackView.vue` (lines 179)
- Impact: Users can click Save multiple times or close page during save; no feedback on operation status; poor UX for slow networks
- Fix approach: Add loading state ref, disable Save button during operation, show loading spinner, display toast on success/error

**No optimistic update rollback:**
- Issue: Local state changes immediately on user action; if PocketBase operation fails, local state remains changed but data wasn't persisted
- Files: `src/views/LexTrackView.vue` (lines 37-41, 61-65, 87-91, 128-158)
- Impact: Users see changes in UI but data on server is different; refresh causes loss of unsaved work; inconsistent state
- Fix approach: Implement optimistic updates with rollback: save original values before mutation, restore on API failure

## Code Quality Issues

**Debug console.log statements left in production code:**
- Issue: Multiple `console.log()` statements present in LexTrackView.vue
- Files: `src/views/LexTrackView.vue` (lines 34, 40, 58, 84, 122, 160)
- Impact: Debug output in production; potential information leakage; clutters browser console
- Fix approach: Remove all debug logging before release, use proper logging framework if needed

**Large commented code block in template:**
- Issue: Lines 165-245 of `src/views/LexTrackView.vue` contain entire commented-out Dialog component and related logic
- Files: `src/views/LexTrackView.vue` (lines 200-245)
- Impact: Dead code increases file size and confusion; unclear if it's kept for future use or should be deleted; hinders code review and maintenance
- Fix approach: Delete commented code or move to separate branch; use version control to recover if needed

**Unused import: Toaster component:**
- Issue: `Toaster` imported from vue-sonner in ManageMeeting.vue, ManageTask.vue, ManageSupport.vue but never used in templates
- Files: `src/components/projects/lextrack/ManageMeeting.vue:4`, `src/components/projects/lextrack/ManageTask.vue:4`, `src/components/projects/lextrack/ManageSupport.vue:3`
- Impact: Increases bundle size; indicates incomplete implementation (possibly refactored after initial toast setup); code hygiene issue
- Fix approach: Remove unused `Toaster` import from all three files

**Commented-out code in updateTask function:**
- Issue: Lines 81-82 in `src/views/LexTrackView.vue` contain commented duplicate assignment
- Files: `src/views/LexTrackView.vue` (lines 81-82)
- Impact: Clutter and potential confusion about correct implementation
- Fix approach: Remove commented lines

## Testing & Validation

**No tests for LexTrack functionality:**
- Issue: No .test.* or .spec.* files found for any LexTrack views or components despite vitest configuration present
- Files: `src/views/LexTrackView.vue`, `src/components/projects/lextrack/*` (all files)
- Impact: Critical user-facing functionality has zero test coverage; bugs like delete issues or initialization problems could go unnoticed; refactoring is high-risk
- Fix approach: Add unit tests for remove functions, watch initialization, data persistence; add integration tests for save flow with mocked PocketBase

## Security Considerations

**PocketBase URL comes from environment variable:**
- Issue: `src/lib/pocketbase/index.ts:3` uses `import.meta.env.VITE_API_BASE_URL` to set PocketBase connection URL
- Files: `src/lib/pocketbase/index.ts` (line 3)
- Current mitigation: Environment variable configuration allows different endpoints per environment
- Recommendations: Ensure VITE_API_BASE_URL is never exposed in client-side code during build; validate URL to prevent injection; use HTTPS in production; consider adding certificate pinning for sensitive deployments

**PocketBase token stored in browser localStorage:**
- Issue: PocketBase library defaults to localStorage for auth token persistence
- Files: `src/lib/pocketbase/index.ts`
- Current mitigation: localStorage is a reasonable default for SPAs
- Recommendations: Document this choice; ensure auth tokens have appropriate expiration; consider using httpOnly cookies if possible; validate that sensitive data is not stored in localStorage; audit PocketBase SDK version for known security issues

**No input validation before save:**
- Issue: Data from form inputs sent directly to PocketBase without client-side validation
- Files: `src/views/LexTrackView.vue` (lines 125-161)
- Impact: Malformed data could cause errors; potential for stored XSS if descriptions allow HTML
- Fix approach: Add schema validation before save (zod, yup, or similar); sanitize HTML in description fields

## Missing Critical Features

**No persistence mechanism for delete operations:**
- Issue: Remove operations have no way to commit deletion to PocketBase
- Files: `src/views/LexTrackView.vue` (lines 37-41, 61-65, 87-91)
- Blocks: Proper deletion workflow; data consistency

**No indication which items are new vs. existing:**
- Issue: Local items lack clear `id` or status indicator for UI to distinguish new items from fetched records
- Files: `src/views/LexTrackView.vue` (lines 22, 45, 69)
- Blocks: Advanced features like selective save, item-level delete, optimistic updates

## Performance Considerations

**Possible N+1 pattern in save function:**
- Issue: `src/views/LexTrackView.vue:128-158` loops through arrays and makes individual PocketBase calls for each item
- Files: `src/views/LexTrackView.vue` (lines 128-158)
- Impact: Slow save with many items (3 loops × N items = 3N API calls); no batching; network requests serial, not parallel
- Fix approach: Batch operations; use Promise.all for parallel requests; implement server-side batch endpoint if available

**Large components with mixed concerns:**
- Issue: `src/views/LexTrackView.vue` handles state, data fetching, form management, and persistence in one 260-line file
- Files: `src/views/LexTrackView.vue`
- Impact: Difficult to test; high cognitive load; hard to reuse logic; tight coupling
- Fix approach: Extract data fetching to composable; create custom hooks for remove operations; separate state management

---

*Concerns audit: 2026-04-28*
