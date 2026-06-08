---
status: clean
phase: 36-mobile-performance
reviewed: 2026-05-28
commits_reviewed: 4d684aa..HEAD
files_reviewed: 17
resolved: 2026-05-28
findings:
  blocker: 0
  high: 1
  medium: 1
  low: 0
  info: 2
resolution:
  high_resolved: 1
  medium_resolved: 1
  info_resolved: 1
  info_accepted: 1
  resolution_commits: [014e8e7, <documented below — compressToWebP comment + this doc update>]
---

## Resolution (post-review)

All actionable findings resolved in-phase before phase close:

- **HIGH** → fixed by `014e8e7 fix(36): give ManageMembership its own token lifecycle (race-condition with shared fileToken)`. ManageMembership now binds `:token="manageToken"` (separate from the detail Dialog's `fileToken`). `openEdit` + `openManage` are async and await `pb.files.getToken()` before opening; `watch(showManage)` clears on close. Pattern matches ExpensesTab (`1bcf697`) exactly.
- **MEDIUM** → folded into the same commit (`openEdit` converted to `async`).
- **INFO #1** (compressToWebP fast-path undocumented) → added 1-line clarifying comment in `compressToWebP.ts` immediately before the identity-return ternary.
- **INFO #2** (perfInstrument console.info in production) → **ACCEPTED**. The console.info is intentional per PF-05 design (developer-visible baseline capture for the one-shot session gate). The wallecx feature surface is small-audience and the log carries only counts + bytes + ms (no record content per T-36-01 mitigation). If a future phase deems it noisy, the suggested `import.meta.env.DEV` guard or removal can land then.

Post-resolution gates: type-check 0 errors, test:unit 59/59, lint clean except grandfathered VaccinationDetail.vue:5.

---

# Phase 36 Code Review

## Summary

Phase 36 delivers a well-structured mobile performance pass: vendor code-splitting, `defineAsyncComponent` + Suspense conversions, a centralised `perfInstrument` wrapper, and a WebP pipeline with correct `.webp` filename rename. All mandatory invariants pass. One high-severity functional bug is present in the `MembershipsTab` edit-from-detail flow — the shared `fileToken` reference is cleared by the asynchronous `@hide` handler while `ManageMembership` is already open, blanking the card-image thumbnail mid-render. This pattern was introduced in commit `3cc013a` (phase 36-04) and has no equivalent defect in the `ExpensesTab` path (which correctly uses a dedicated `manageToken`).

---

## Findings

### [HIGH] MembershipsTab shared fileToken cleared by @hide while ManageMembership is open

- **File:** `src/components/projects/wallecx/MembershipsTab.vue:127–136, 330, 346, 368`
- **Issue:** `ManageMembership` is wired to `:token="fileToken"`. The `openEdit(record)` function sets `showDetail.value = false` then `showManage.value = true` synchronously. PrimeVue's `@hide` event fires asynchronously after the Dialog/Drawer close animation completes. When `@hide` fires, both inline handlers (`@hide="selectedRecord = null; fileToken = ''"`) clear `fileToken` to the empty string. At that point `ManageMembership` is already mounted and its `thumbnailUrl` computed (`ManageMembership.vue:143–154`) reactively recomputes with an empty token, producing a broken URL for the card-image thumbnail in edit mode. The `Add Card` path (`openManage(null)`) is unaffected because no thumbnail is shown for new records.
- **Why it matters:** Any user who opens a card's detail view and then clicks Edit will see the card-image thumbnail flash briefly then go blank (broken request with missing token). Depending on PocketBase's auth rules the image may also return 401/403. This is a user-visible functional regression introduced by phase 36-04 attaching the token to ManageMembership without giving it an independent token lifecycle.
- **Suggested fix:** Mirror the `ExpensesTab` pattern exactly — introduce a dedicated `manageToken` ref, fetch it inside `openEdit` (and `openManage` for non-null records) before setting `showManage = true`, and clear it with `watch(showManage, v => { if (!v) manageToken.value = '' })`. Remove `:token="fileToken"` from the `<ManageMembership>` binding and replace with `:token="manageToken"`. The `@hide` handlers on the detail Dialog/Drawer can continue to clear `fileToken` without impacting the manage flow.

```ts
// MembershipsTab.vue — add alongside existing refs
const manageToken = ref<string>('')

// Replace openEdit and openManage:
async function openEdit(record: Memberships): Promise<void> {
  try {
    manageToken.value = await pb.files.getToken()
  } catch (e: unknown) {
    manageToken.value = ''
    toast.error('Card image preview unavailable. Form will still save.')
    console.error('MembershipsTab: getToken (manage) failed', e)
  }
  manageRecord.value = record
  showDetail.value = false
  showManage.value = true
}

function openManage(record: Memberships | null): void {
  manageToken.value = ''   // create mode — no thumbnail
  manageRecord.value = record
  showManage.value = true
}

// Add watcher to clear on close:
watch(showManage, (v) => {
  if (!v) manageToken.value = ''
})
```

```html
<!-- Replace in template: -->
<ManageMembership
  v-model:visible="showManage"
  v-model:record="manageRecord"
  :token="manageToken"
  @created="onCreated"
  @updated="onUpdated"
/>
```

---

### [MEDIUM] MembershipsTab openEdit is synchronous — no token fetch before opening ManageMembership

- **File:** `src/components/projects/wallecx/MembershipsTab.vue:127–131`
- **Issue:** This is the root cause behind the HIGH finding above, captured separately for clarity. `openEdit` is declared `function openEdit` (not `async`), so it cannot `await pb.files.getToken()` before opening the manage dialog. By contrast, `ExpensesTab.openManage` is `async function openManage` and awaits the token fetch before setting `showManage = true`. The structural asymmetry means a direct fix must also convert `openEdit` to `async`.
- **Why it matters:** Even after decoupling `manageToken` from `fileToken`, an async-unaware `openEdit` would open `ManageMembership` before the token is available, producing a brief blank thumbnail on first render. Awaiting the fetch (with a try/catch that still opens the dialog on failure) is the correct pattern.
- **Suggested fix:** Folded into the HIGH fix above — convert `openEdit` to `async function openEdit` as shown.

---

## Info

### [INFO] compressToWebP already-WebP fast-path is correct but undocumented

- **File:** `src/lib/wallecx/compressToWebP.ts:26–29`
- **Issue:** When `compressed.name` already ends in `.webp`, `webpName === compressed.name` is true and the function returns `compressed` directly (no `new File` allocation). This is correct. However, the comment block above only documents the rename case; the identity-return branch is implicit. A future maintainer reading the code may wonder whether the early-return is intentional or an oversight.
- **Suggested fix:** Add a one-line comment: `// Already .webp — no rename needed; return the compressed file directly.` immediately before the ternary.

---

### [INFO] perfInstrument console.info fires in production builds

- **File:** `src/lib/pocketbase/perfInstrument.ts:37–39`
- **Issue:** The `console.info(...)` call inside `instrumentedGetFullList` is gated only by the `sessionStorage` one-shot flag; there is no `import.meta.env.DEV` guard. The comment `// T-36-01 mitigation: log NEVER includes record content, only counts + sizes` documents the privacy rationale, but the log will appear in production DevTools for every user on first session. This is intentional per the design (baseline capture), but is worth documenting explicitly if the intent is to remove it post-phase.
- **Suggested fix:** No immediate action required if the console log is intentional for baseline data collection. If it should be development-only, wrap with `if (import.meta.env.DEV)` or promote the intent to a comment in the file header so the next phase knows when to remove it.

---

## Invariants Verified

| Invariant | Status | Evidence |
|-----------|--------|----------|
| vite.config.ts line 28: `registerType: "prompt"` | PASS | `vite.config.ts:28` — byte-intact |
| vite.config.ts line 42: `scope: "/"` | PASS | `vite.config.ts:42` — byte-intact |
| vite.config.ts line 86: `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` | PASS | `vite.config.ts:86` — byte-intact |
| vite.config.ts line 88: `navigateFallback: "index.html"` | PASS | `vite.config.ts:88` — byte-intact |
| CON-VIEWPORT-FIT: `viewport-fit=cover, interactive-widget=resizes-content` byte-intact | PASS | `index.html:9` — exact string present; LOCKED comment on line 8 intact |
| CON-CONFIRMDIALOG-SINGLETON: exactly 1 `<ConfirmDialog` in wallecx/ | PASS | `WallecxApp.vue:122` only; grep confirms no others |
| CON-PB-COUNT-BUG: 0 new `.getList(` introduced in wallecx/ | PASS | grep across wallecx/ returns 0 hits |
| NFR-REQUESTKEY-UNIQUE: all 5 mount-path requestKeys distinct | PASS | `vaccinations-getFullList`, `memberships-getFullList`, `expenses-getFullList`, `expense-budgets-getFullList`, `expense-categories-getFullList` — all distinct; verified across VaccinationsTab, MembershipsTab, ExpensesTab, ExpensesReportsView |
| CON-CARD-COLOR-NO-HASH: ManageMembership ColorPicker uses direct v-model without `#` prefix | PASS | `ManageMembership.vue:387–391` — `v-model="cardColor"` with default `"002244"` (no `#`); FormData appended without `#` at line 275 |
| BR-2: BarcodeDisplay.vue NOT modified this phase | PASS | `git diff 4d684aa..HEAD -- src/components/projects/wallecx/BarcodeDisplay.vue` returns empty |

---

## Fix-Forward Sites Verified (commits 79dda03, 1d9747b, 1bcf697)

### 79dda03 — WebP thumb-skip pattern across 5 sites

| Site | Pattern | Status |
|------|---------|--------|
| ManageExpense receipt | Full URL always (no `.webp` check needed — comment documents legacy receipts may have `.jpg` extension with WebP bytes) | PASS |
| ManageMembership card_image | `filename.toLowerCase().endsWith(".webp")` → full URL, else `thumb: "100x100"` | PASS |
| VaccinationGroupCard | `record.card.toLowerCase().endsWith(".webp")` → full URL, else `thumb: "100x100"` | PASS |
| VaccinationList | `record.card.toLowerCase().endsWith(".webp")` → full URL, else `thumb: "100x100"` | PASS |
| AttachmentPreview | `filename.toLowerCase().endsWith('.webp')` → full URL, else `thumb: "400x400"` | PASS |

All 5 sites are consistent in pattern. No copy-paste typos detected.

### 1d9747b — compressToWebP `.webp` rename + ManageExpense always-skip thumb

- `compressToWebP.ts`: regex `replace(/\.[^.]+$/, '.webp')` correctly renames any extension to `.webp` | PASS
- `ManageExpense.vue:223`: `pendingFile.value = await compressToWebP(strippedFile)` — uses helper output directly, no `new File` wrapper re-applying original `.jpg` name | PASS
- `receiptThumbnailUrl` computed uses `pb.files.getURL(..., { token: props.token })` with no `thumb` param — always skips thumb | PASS

### 1bcf697 — token prop wired to ManageExpense + ExpensesTab

- `ManageExpense.vue:14–16`: `token?: string` prop added | PASS
- `ExpensesTab.vue:26`: `manageToken` ref added | PASS
- `ExpensesTab.vue:91–101`: `openManage` fetches token before opening dialog, clears on null record | PASS
- `ExpensesTab.vue:107–109`: `watch(showManage, v => { if (!v) manageToken.value = '' })` clears on close | PASS
- Pattern matches MembershipsTab token wiring structurally, except MembershipsTab uses the shared `fileToken` (see HIGH finding) | NOTE |

---

## Notable Patterns (positive)

- **perfInstrument one-shot gate**: The double try/catch around `sessionStorage` and `localStorage` operations is robust — private mode and storage-quota failures are silent and non-fatal, preserving the invariant that instrumentation never breaks the data fetch.
- **compressToWebP identity-return**: The `webpName === compressed.name` guard avoids an unnecessary `new File` allocation when the input is already named `.webp`. Correct and efficient.
- **ManageExpense receipt always-full-URL**: The comment explaining why legacy `.jpg`-named receipts must also use the full URL (not just `.webp` check) demonstrates strong domain awareness of the PF-07 pitfall and pre-empts a future regression.
- **defineAsyncComponent + Suspense + WallecxSkeleton**: The WallecxApp tab conversion is clean — each `<Suspense>` has a byte-matched skeleton fallback variant. The WallecxSkeleton component itself with 5 named variants is a good consolidation.
- **Vaccination requestKey gap closed**: The `vaccinations-getFullList` requestKey was the only missing one at phase start; commit `9358c5c` explicitly updated the STATE.md invariant and commit `5111281` wired it — the audit trail is clear.

---

_Reviewed: 2026-05-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
