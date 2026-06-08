---
plan: 02-04
phase: 02-read-path
status: complete
completed: "2026-05-11"
tasks_total: 1
tasks_completed: 1
requirements_satisfied:
  - READ-04
  - READ-05
  - READ-07
---

# Plan 02-04: WallecxApp.vue Wiring — Summary

## What Was Built

Extended `src/components/projects/wallecx/WallecxApp.vue` to complete the Phase 2 read path end-to-end. The existing shell (records fetch, isLoading state) was preserved and extended with token management, a detail dialog, and the two new child components.

## Key Changes

### New State Refs (4 added)
- `selectedRecord: ref<Vaccinations | null>(null)` — the record currently open in the detail dialog
- `showDetail: ref(false)` — controls Dialog `v-model:visible`
- `fileToken: ref<string>("")` — short-lived token for the detail view attachment (generated at dialog open)
- `listToken: ref<string>("")` — short-lived token for list thumbnails (generated at page load)

### onMounted Extension
`listToken.value = await pb.files.getToken()` added inside the try block after `getFullList`. Token failure is caught by the existing error handler — thumbnails simply won't load but the list still renders.

### openDetail Function
```typescript
async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
    }
  }
  showDetail.value = true;  // opens dialog even on token failure — graceful degradation
}
```

### Template Replacement
The placeholder `<div>` with record-count paragraph was removed and replaced with:
- `<VaccinationList>` — wired with `:records`, `:is-loading`, `:list-token`, `@view="openDetail"`, and no-op `@edit`/`@remove` stubs
- `<Dialog>` — `header="Vaccination Record"`, `width: '40rem'`, responsive breakpoints, `@hide` resets selectedRecord and fileToken
- `<VaccinationDetail v-if="selectedRecord">` — inside the Dialog, receives record + fileToken

## Threat Model Mitigations Verified

| Threat | Mitigation |
|--------|-----------|
| T-02-04-02: fileToken at view time | `pb.files.getToken()` called inside `openDetail`, not at mount — token is fresh per dialog open |
| T-02-04-03: token failure DoS | try/catch in openDetail; `showDetail.value = true` executes regardless — dialog opens without attachment |
| T-02-04-04: selectedRecord residue | `@hide` resets `selectedRecord = null; fileToken = ''` — no stale data after close |
| T-02-04-05: write stubs active | `@edit="() => {}"` and `@remove="() => {}"` are no-ops; VaccinationList also has `:disabled="true"` on those buttons |

## Self-Check

| Check | Result |
|-------|--------|
| `grep -c "listToken"` ≥ 3 | 3 ✓ |
| `grep -c "fileToken"` ≥ 3 | 4 ✓ |
| `grep -c "openDetail"` ≥ 2 | 2 ✓ |
| `grep -c "VaccinationList"` ≥ 1 | 1 ✓ |
| `grep -c "VaccinationDetail"` ≥ 1 | 1 ✓ |
| `grep "Vaccination Record"` | 1 ✓ |
| `grep "width: '40rem'"` | 1 ✓ |
| `grep -c "pb.files.getToken"` ≥ 2 | 2 ✓ |
| `grep "records.length.*vaccination record"` = 0 | 0 ✓ (placeholder removed) |
| `git grep "v-html" src/components/projects/wallecx/` = 0 | 0 ✓ |
| `grep "worker-src 'self' blob:" index.html` = 1 | 1 ✓ |
| `npm run type-check` exit 0 | ✓ |

## Self-Check: PASSED

## Files Modified

- `src/components/projects/wallecx/WallecxApp.vue` — +41 lines, -4 lines

## Commits

- `24d6d30` feat(02-04): wire WallecxApp.vue — VaccinationList + Dialog + tokens
