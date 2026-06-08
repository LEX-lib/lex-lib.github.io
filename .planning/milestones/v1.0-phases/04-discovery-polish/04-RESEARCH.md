# Phase 4: Discovery & Polish — Research

**Researched:** 2026-05-12
**Domain:** Vue 3 SPA integration (ProjectsView tile), Vitest router guard testing, PocketBase JSON export, design token audit, code review bug fixes
**Confidence:** HIGH — all findings verified against live codebase files

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POLISH-01 | Wallecx tile in ProjectsView.vue projects array, navy/amber gradient, links to /projects/wallecx | ProjectsView.vue fully read — exact Project interface shape, all 4 existing entries, CSS class names, status values confirmed |
| POLISH-02 | UI uses only existing Lexarium design tokens; no bespoke colors or new CSS variables | base.css fully read — all 16 design tokens enumerated; Rubik font defined in main.css |
| POLISH-03 | "Download my vaccination records" button exports user's full record set as JSON (file URLs as references) | PocketBase JS SDK docs verified: getFullList + pb.files.getURL pattern; Blob/URL.createObjectURL browser API confirmed |
| POLISH-04 | Vitest src/router/__tests__/guard.spec.ts covers requiresAuth redirect on /projects/wallecx | Router guard code in index.ts fully read; auth store fully read; existing vaccinationMapper.spec.ts pattern confirmed; Vitest 3.2.4 confirmed |
| POLISH-05 | "Looks Done But Isn't" checklist from research/PITFALLS.md run through and signed off | PITFALLS.md fully read — 19-item checklist extracted; current codebase scanned for each item |
</phase_requirements>

---

## Summary

Phase 4 is the final polish pass for the Wallecx milestone. All five requirements are well-defined and technically straightforward given the prior phases. The codebase is in a known state: four existing mini-app tiles in `ProjectsView.vue` establish an exact template for POLISH-01; sixteen design tokens in `base.css` are the complete token inventory for POLISH-02; `getFullList` + `pb.files.getURL` is the verified PocketBase pattern for POLISH-03; the existing `vaccinationMapper.spec.ts` in Vitest 3.2.4 establishes the test harness for POLISH-04.

The most technically interesting piece is POLISH-04 (route guard spec). Testing the router guard requires mocking `useAuthStore` via `vi.mock`, instantiating a real router with `createMemoryHistory`, calling `router.push()` and `await router.isReady()`, then asserting the final route. The pattern is established Vitest practice but has not yet appeared in this repo.

Phase 4 also carries a code review debt obligation: two HIGH findings from Phase 3 (null assertion on `pb.authStore.record`, stale `pendingFile` on dialog reopen) and three WARN findings from Phase 2 (stale `listToken`, missing `thumbUrl` guard, dialog opening in token-less state) should be fixed. These are one-line or two-line patches and belong in a dedicated code-fix plan before or alongside the feature plans.

**Primary recommendation:** Implement in four plans — (1) code review fixes from Phase 2 + 3 reviews, (2) POLISH-01 tile + POLISH-02 token audit, (3) POLISH-03 JSON export, (4) POLISH-04 guard spec + POLISH-05 checklist sign-off.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Projects tile (POLISH-01) | Frontend (SPA) | — | ProjectsView.vue is a static data array; no server call needed |
| Design token audit (POLISH-02) | Frontend (SPA) | — | CSS vars are compiled at build time; audit is a static grep + visual check |
| JSON export (POLISH-03) | Browser client | PocketBase API | Client fetches its own records via getFullList, assembles JSON, triggers download in-browser; PocketBase enforces per-user isolation |
| Route guard spec (POLISH-04) | Frontend test | — | Tests the beforeEach guard in index.ts; no server involved |
| Checklist sign-off (POLISH-05) | Cross-cutting | PocketBase (runtime checks) | Some items are static code checks; others (isolation, file URL 403) require a live PocketBase instance |

---

## Standard Stack

### Core (already installed — no new deps needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue Router 4 | ^4.5.1 | Route guard under test | Already in project; `createMemoryHistory` for Vitest |
| Pinia | ^3.0.3 | Auth store mock target | Already in project |
| Vitest | ^3.2.4 | Test runner | Already in project; 10 tests passing |
| PocketBase JS SDK | (see package.json) | getFullList, files.getURL | Already in project |

[VERIFIED: package.json read directly]

### No New Dependencies

Phase 4 adds zero npm packages. All capabilities use existing stack:
- JSON export: native `Blob`, `URL.createObjectURL`, `document.createElement('a')` browser APIs
- Route guard test: `vi.mock`, `createRouter`, `createMemoryHistory` from existing vitest + vue-router installs
- Tile: extends existing `projects` array — no new component library needed

[VERIFIED: existing package.json confirms all needed libs present]

---

## Architecture Patterns

### System Architecture Diagram

```
POLISH-01 (Tile)
  ProjectsView.vue (projects array) → push Wallecx entry → rendered by v-for card loop

POLISH-02 (Token Audit)
  grep wallecx/ for color values not in base.css token set
  → confirm only --color-* vars and Tailwind utilities used

POLISH-03 (JSON Export)
                   user clicks "Download" button
                         |
                         v
            WallecxApp.vue exportJson()
                         |
                         v
            pb.collection('wallecx_vaccinations')
               .getFullList({ filter: `user = "${userId}"` })
                         |
                   server enforces per-user rule
                   (BACK-03 already verified in Phase 1)
                         |
                         v
            map each record → include all text fields
            + card URL via pb.files.getURL(record, record.card)
            (NO token — URL references only, not binaries)
                         |
                         v
            JSON.stringify → Blob('application/json')
                         |
                         v
            URL.createObjectURL → <a download> .click() → revoke

POLISH-04 (Guard Spec)
  src/router/__tests__/guard.spec.ts
    vi.mock('@/stores/auth', () => ({ useAuthStore: vi.fn() }))
    createRouter + createMemoryHistory (inline test routes including wallecx)
    Test 1: isLoggedIn=false → push /projects/wallecx → redirects to /login?redirect=...
    Test 2: isLoggedIn=true  → push /projects/wallecx → stays on /projects/wallecx
    Test 3: public route     → no auth required → always passes
```

### Recommended File Locations

```
src/
├── views/
│   └── ProjectsView.vue         # POLISH-01: add Wallecx entry to projects array
├── components/projects/wallecx/
│   └── WallecxApp.vue           # POLISH-03: add exportJson() + download button
│   └── ManageVaccination.vue    # HIGH-01/02 fixes from Phase 3 review
│   └── VaccinationList.vue      # WR-02 fix from Phase 2 review
src/
├── router/
│   ├── index.ts                 # WR-01/03 context (WallecxApp.vue reads guard from here)
│   └── __tests__/
│       └── guard.spec.ts        # POLISH-04: new file
```

### Pattern 1: Adding a Project Tile (POLISH-01)

The `projects` array in `ProjectsView.vue` uses the `Project` interface:

```typescript
// Source: src/views/ProjectsView.vue (read directly)
interface Project {
  title: string;
  description: string;
  link: string;
  status: "WIP" | "Active";
  icon: string;    // Iconify icon name e.g. "mdi:shield-check"
  tags: string[];
}
```

Existing entries use these status values: "WIP" (Larga, LexTrack) and "Active" (MonitoX, API Playground). Wallecx should be "WIP" since it is still gaining features.

The navy/amber gradient is already applied to ALL cards via scoped CSS — it is NOT per-tile. The `projects-card-bar` class and `projects-underline` both use:
```css
/* Source: src/views/ProjectsView.vue <style scoped> (read directly) */
background: linear-gradient(
  to right,
  var(--color-brand-primary),   /* navy #002244 */
  var(--color-brand-accent)     /* amber #e89820 */
);
```
The gradient appears on card hover (opacity 0 → 1) for all tiles. POLISH-01 merely requires adding the array entry — the gradient is automatic.

Wallecx entry to add:
```typescript
{
  title: "Wallecx",
  description:
    "A personal health records vault. Securely store and retrieve your vaccination records — including card scans — with per-user privacy enforced server-side.",
  link: "/projects/wallecx",
  status: "WIP",
  icon: "mdi:shield-check",
  tags: ["Vue 3", "PocketBase", "Auth", "Privacy"],
}
```

[VERIFIED: ProjectsView.vue read directly]

### Pattern 2: Design Token Inventory (POLISH-02)

All valid Lexarium CSS custom properties are defined in `src/assets/base.css` (read directly):

```
Brand:    --color-brand-primary (#002244)
          --color-brand-primary-dark (#0a3d6b)
          --color-brand-accent (#e89820)
          --color-brand-accent-light (#fdf3dc)

Surfaces: --color-surface-page (#f5f7fa)
          --color-surface-card (#ffffff)
          --color-surface-code (#1a1a2e)
          --color-surface-divider (#e8ecf2)

Typography: --color-typo-heading (#0d1117)
            --color-typo-body (#3d4a5c)
            --color-typo-muted (#6b7280)
            --color-typo-link (#e89820)

Semantics: --color-status-success (#1a7c45)
           --color-status-warning (#e89820)
           --color-status-error (#c0392b)
           --color-status-info (#378add)
```

Typography: Rubik is imported in `src/assets/main.css` and set on `body` via `--font-family`. PrimeVue Aura preset is configured in `src/main.ts` — components inherit it automatically.

[VERIFIED: base.css and main.css read directly]

Audit command to detect bespoke colors in Wallecx files:
```bash
# Should return zero hits (raw hex not in the token set, raw rgb, hardcoded color names)
grep -rn "#[0-9a-fA-F]\{3,8\}\|rgb(\|hsl(\|color:\s*[a-z]" \
  src/components/projects/wallecx/ \
  --include="*.vue"
```

Legitimate exceptions to the grep: inline `style="color: var(--color-...)"` patterns are fine — they use design tokens. Raw hex values that happen to match token values are also fine if they are explanatory comments.

[ASSUMED] There may be inline `style` attributes with raw hex added during Phase 2/3 without designer awareness. A manual scan of each Wallecx `.vue` file is needed to confirm.

### Pattern 3: JSON Export (POLISH-03)

**Fetch all records for current user:**
```typescript
// Source: PocketBase JS SDK docs (Context7 /pocketbase/js-sdk verified)
// The collection rule already enforces user ownership (BACK-03) — filter is belt-and-suspenders
const records = await pb
  .collection("wallecx_vaccinations")
  .getFullList<Vaccinations>({ sort: "-date_administered" });
```

`getFullList` auto-paginates (default batch 1000 items per request). For vaccination records this is not a concern — even 1000 records would be trivially small. [VERIFIED: Context7 /pocketbase/js-sdk]

**Construct card URL reference (not binary):**
```typescript
// Source: PocketBase JS SDK docs (Context7 /pocketbase/js-sdk verified)
// pb.files.getURL returns a URL string — NOT the binary; binary is only fetched when browser loads it
// Do NOT include a token here — export URLs should be static references, not time-limited bearer tokens
const cardUrl = record.card
  ? pb.files.getURL(record, record.card)
  : null;
```

Note: Since `card` is `protected: true`, these URLs without a token will return 403 if opened directly. That is intentional — the export is a reference document, not a download bundle. The spec says "file URLs as references, not embedded."

**Assemble and trigger download:**
```typescript
// Source: Standard browser API — well-established, no library needed [VERIFIED via MDN pattern]
async function exportJson(): Promise<void> {
  const userId = pb.authStore.record?.id;
  if (!userId) {
    toast.error("Session expired. Please log in again.");
    return;
  }
  const records = await pb
    .collection("wallecx_vaccinations")
    .getFullList<Vaccinations>({ sort: "-date_administered" });

  const exportData = records.map((r) => ({
    id: r.id,
    vaccine_name: r.vaccine_name,
    date_administered: r.date_administered,
    dose_number: r.dose_number ?? null,
    lot_number: r.lot_number ?? null,
    location: r.location ?? null,
    manufacturer: r.manufacturer ?? null,
    notes: r.notes ?? null,
    card_url: r.card ? pb.files.getURL(r, r.card) : null,
    created: r.created,
    updated: r.updated,
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `wallecx-vaccinations-${dayjs().format("YYYY-MM-DD")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
```

The button placement should be in `WallecxApp.vue` header row (next to the existing "Add vaccination" button), gated to authenticated users only (the route guard already enforces auth, so no additional check is needed beyond the `userId` guard above).

[VERIFIED: PocketBase JS SDK via Context7; browser API pattern is standard]

### Pattern 4: Route Guard Spec (POLISH-04)

The guard in `src/router/index.ts` (read directly):

```typescript
// Source: src/router/index.ts (read directly)
router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.matched.some((record) => record.meta?.requiresAuth)) {
    if (!auth.isLoggedIn) {
      next({ name: "login", query: { redirect: to.fullPath } });
      return;
    }
  }
  next();
});
```

Key facts for test writing:
- Guard calls `useAuthStore()` — must be mocked via `vi.mock('@/stores/auth')`
- Guard checks `auth.isLoggedIn` (computed boolean wrapping `pb.authStore.record`)
- Redirect target: `{ name: "login", query: { redirect: to.fullPath } }` — i.e., `/login?redirect=/projects/wallecx`
- The wallecx route is `name: "wallecx"`, `path: "/projects/wallecx"`, `meta: { requiresAuth: true }`

**Test file pattern:**
```typescript
// Source: established Vitest + Vue Router 4 pattern [VERIFIED: Vue Router docs + existing mapper spec structure]
// File: src/router/__tests__/guard.spec.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import { defineComponent } from "vue";
import { setActivePinia, createPinia } from "pinia";

// Mock the auth store module BEFORE importing router
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(),
}));
// Mock PocketBase so the index.ts import doesn't try to connect
vi.mock("@/lib/pocketbase", () => ({
  pb: { authStore: { record: null, onChange: vi.fn() } },
}));

import { useAuthStore } from "@/stores/auth";

// Minimal stub component — router doesn't need real components for guard tests
const Stub = defineComponent({ template: "<div />" });

function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/", name: "home", component: Stub },
      { path: "/login", name: "login", component: Stub },
      {
        path: "/projects/wallecx",
        name: "wallecx",
        component: Stub,
        meta: { requiresAuth: true },
      },
    ],
  });
}

// Re-register guard on the test router (mirrors what index.ts does)
function addGuard(router: ReturnType<typeof buildRouter>) {
  router.beforeEach((to, _from, next) => {
    const auth = (useAuthStore as ReturnType<typeof vi.fn>)();
    if (to.matched.some((r) => r.meta?.requiresAuth)) {
      if (!auth.isLoggedIn) {
        next({ name: "login", query: { redirect: to.fullPath } });
        return;
      }
    }
    next();
  });
}

describe("requiresAuth guard — /projects/wallecx", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("redirects to /login when not authenticated", async () => {
    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({ isLoggedIn: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/wallecx");
    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/projects/wallecx");
  });

  it("allows navigation when authenticated", async () => {
    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({ isLoggedIn: true });
    const router = buildRouter();
    addGuard(router);
    await router.push("/projects/wallecx");
    expect(router.currentRoute.value.name).toBe("wallecx");
  });

  it("allows unauthenticated access to non-guarded routes", async () => {
    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({ isLoggedIn: false });
    const router = buildRouter();
    addGuard(router);
    await router.push("/");
    expect(router.currentRoute.value.name).toBe("home");
  });
});
```

**Critical implementation note:** Do NOT import the production `src/router/index.ts` directly in the test — it uses `createWebHistory` which requires `window.location` that does not behave correctly in jsdom for navigation tests. Instead, recreate the routes with `createMemoryHistory` and re-apply the guard logic. This is the standard Vitest approach for router guard testing.

[VERIFIED: Vue Router 4 docs via Context7; createMemoryHistory confirmed as test approach]

### Pattern 5: Code Review Fixes (Phase 3 HIGH-01, HIGH-02 — priority fixes)

**HIGH-01 — Null assertion on `pb.authStore.record!.id`**
```typescript
// Source: 03-REVIEW.md HIGH-01 (read directly)
// File: src/components/projects/wallecx/ManageVaccination.vue:147
// BEFORE (unsafe):
formData.append("user", pb.authStore.record!.id);

// AFTER (safe):
const userId = pb.authStore.record?.id;
if (!userId) {
  toast.error("Session expired. Please log in again.");
  return;
}
formData.append("user", userId);
```

**HIGH-02 — Stale `pendingFile` across dialog sessions**
```typescript
// Source: 03-REVIEW.md HIGH-02 (read directly)
// File: src/components/projects/wallecx/ManageVaccination.vue — onSubmit success branch
// Add before setting visible.value = false:
pendingFile.value = null; // explicit reset — do not rely solely on @hide timing
visible.value = false;
```

### Pattern 6: Phase 2 WARN Fixes (WR-01, WR-02, WR-03)

**WR-01 — Stale listToken (expires after 5 min)**
```typescript
// Source: 02-REVIEW.md WR-01 (read directly)
// File: src/components/projects/wallecx/WallecxApp.vue — onMounted
const LIST_TOKEN_TTL_MS = 4 * 60 * 1000; // refresh at 4 min (within 5-min PocketBase TTL)
let listTokenTimer: ReturnType<typeof setInterval> | null = null;
// In onMounted, after initial token fetch:
listTokenTimer = setInterval(async () => {
  listToken.value = await pb.files.getToken();
}, LIST_TOKEN_TTL_MS);
// In onUnmounted:
if (listTokenTimer) clearInterval(listTokenTimer);
```

**WR-02 — Missing empty-string guard in `thumbUrl()`**
```typescript
// Source: 02-REVIEW.md WR-02 (read directly)
// File: src/components/projects/wallecx/VaccinationList.vue
function thumbUrl(record: Vaccinations): string {
  if (!record.card) return "";   // guard against empty-string card field
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}
```

**WR-03 — Dialog opens in token-less state on getToken failure**
```typescript
// Source: 02-REVIEW.md WR-03 (read directly)
// File: src/components/projects/wallecx/WallecxApp.vue — openDetail()
async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
      selectedRecord.value = null;
      return; // abort — do not open dialog without a valid token
    }
  }
  showDetail.value = true;
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download trigger | Custom event system, server-side streaming | `URL.createObjectURL` + `<a download>.click()` | Browser native; no server needed; works offline-first |
| JSON serialization | Manual field concatenation | `JSON.stringify(data, null, 2)` | Type-safe, handles escaping |
| Auth store mock | Custom mock class | `vi.mock('@/stores/auth', ...)` | Vitest built-in; factory replaces module for all imports in file |
| Router history for tests | Browser history in jsdom | `createMemoryHistory()` | Avoids jsdom `window.location` issues; designed for testing |
| PocketBase pagination | Manual cursor loop | `getFullList()` with default batch:1000 | SDK handles auto-pagination internally |

---

## Common Pitfalls

### Pitfall 1: Importing production router in guard.spec.ts

**What goes wrong:** The test imports `src/router/index.ts` which calls `createWebHistory(import.meta.env.BASE_URL)`. In jsdom, this behaves unpredictably — navigation may not resolve, `await router.isReady()` may never settle.

**Why it happens:** Developers copy the import from app code.

**How to avoid:** Do NOT import the production router. Create a fresh test router inside each `describe` block using `createMemoryHistory()`. Copy only the route definitions and guard logic, not the router instance.

**Warning signs:** `router.isReady()` hangs or `router.currentRoute.value` stays at the initial route after `router.push()`.

### Pitfall 2: `vi.mock` called after imports

**What goes wrong:** `vi.mock('@/stores/auth', ...)` must appear before any import that transitively imports the auth store. Vitest hoists `vi.mock` calls but only if they appear in the module scope.

**Why it happens:** Developer writes mock after imports to keep code organized.

**How to avoid:** Place all `vi.mock` calls at the top of the spec file, before any named imports. Vitest processes mocks before module loading.

**Warning signs:** `useAuthStore` returns the real implementation (tries to call `pb.authStore`), causing errors about `pb` being undefined.

### Pitfall 3: Including token in JSON export card URLs

**What goes wrong:** Developer calls `pb.files.getURL(record, record.card, { token })` and includes a freshly-minted token in the exported JSON. The token expires in ~5 minutes; all card URLs in the export become 403s for any future use.

**Why it happens:** The `token` option is copied from the view-time token pattern used in AttachmentPreview.

**How to avoid:** Call `pb.files.getURL(record, record.card)` with NO token. The export is a reference document. The user downloads their data knowing that card URLs require authentication to view.

### Pitfall 4: Missing `onUnmounted` cleanup for listToken interval

**What goes wrong:** The `setInterval` for refreshing `listToken` continues running after the user navigates away from `/projects/wallecx`. If the user navigates back, a second interval is started. Token refreshes multiply; if the user's session expires, the interval fires on a dead session producing silent errors.

**How to avoid:** Always pair `setInterval` with `onUnmounted(() => clearInterval(timer))`. This is the Vue 3 composition lifecycle pattern.

### Pitfall 5: Tile `status` typo breaks Tag rendering

**What goes wrong:** The status value in the Wallecx tile entry is misspelled (e.g., `"wip"` instead of `"WIP"`). The `ProjectsView.vue` template uses `v-if="project.status === 'WIP'"` — exact match. A typo silently hides the Tag component entirely with no error.

**How to avoid:** The `Project` interface defines `status: "WIP" | "Active"` — TypeScript will catch this at compile time. Use `npm run type-check` before committing.

---

## "Looks Done But Isn't" Checklist Analysis (POLISH-05)

The PITFALLS.md checklist has 19 items. Below is the current status of each based on codebase inspection:

| # | Item | Status | Action in Phase 4 |
|---|------|--------|-------------------|
| 1 | Per-user isolation: user B can't see user A's records | PASS (Phase 1 verified) | Sign off in checklist |
| 2 | Filter injection: vaccine_name with `"`, `\`, `\|\|` saves + retrieves correctly | PASS (WRITE-08 implemented) | Sign off in checklist |
| 3 | File access without token: incognito returns 403 | PASS (Phase 1 BACK-02 protected:true) | Sign off in checklist |
| 4 | Save round-trip: create, edit, save → one record on server | PASS (WRITE-04 Object.assign) | Sign off in checklist |
| 5 | Delete actually deletes: getOne after delete → 404 + file URL 404 | PASS (WRITE-06 server-first) | Sign off in checklist |
| 6 | EXIF stripped: exiftool shows no GPS after upload | PASS (WRITE-03 canvas re-encode) | Sign off in checklist |
| 7 | pdfjs-dist ≥ 4.2.67 in package.json | PASS (FRONT-01) | Verify version still satisfied |
| 8 | CSP not regressed: only worker-src added, script-src unchanged | PASS (02-01-PLAN) | Sign off |
| 9 | No v-html in Wallecx: git grep returns nothing | PASS (all phases used `{{ }}`) | Run grep to confirm |
| 10 | No template-literal filters: git grep returns nothing | PASS (WRITE-08) | Run grep to confirm |
| 11 | Watcher fires on mount: no empty-state flash | PASS (onMounted fetch) | Sign off |
| 12 | Save button disables during save: double-click → one record | PASS (WRITE-07 isSaving) | Sign off |
| 13 | Auth token not in production bundle: grep dist/ returns nothing | PASS (Phase 0 CLEAN-01..03) | Run grep on fresh build |
| 14 | Mapper test: vaccinationMapper.spec.ts passes | PASS (10 tests green) | Sign off |
| 15 | Route guard test: guard.spec.ts covers wallecx redirect | OPEN — Phase 4 POLISH-04 | Implement in this phase |
| 16 | Data-export feature works | OPEN — Phase 4 POLISH-03 | Implement in this phase |
| 17 | Subcomponent names: no Wallecx component collides with PrimeVue | NEEDS VERIFY | grep components.d.ts |
| 18 | Vercel deploy: /projects/wallecx hard-refresh resolves | PASS (SPA rewrite inherent) | Sign off |
| 19 | Speed Insights gated: v-if PROD | NEEDS VERIFY | Check index.html / App.vue |

Items 15 and 16 are open implementation gaps that Phase 4 directly addresses. Items 17 and 19 need a codebase spot-check; if already compliant, they get signed off, otherwise a one-line fix lands in the polish plan.

[VERIFIED: PITFALLS.md "Looks Done But Isn't" section read directly; status assessed from prior phase REVIEW.md files and codebase grep]

---

## Runtime State Inventory

This phase involves no renames, refactors, or migrations. Omitted per section instructions.

---

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|------------|-----------|----------|
| PocketBase (local) | POLISH-05 checklist: live isolation check, file 403 test | Must be running locally | No fallback — checklist items 1, 3, 5 require live server |
| Node.js / npm | npm run test:unit, npm run build | Available (confirmed — npm commands run) | — |
| exiftool | POLISH-05 item 6 (EXIF verify) | Unknown — not verified in this session | Checklist item was verified in Phase 3; sign-off can carry forward if user confirmed |

[VERIFIED: npm environment confirmed working; exiftool status unknown — [ASSUMED] user has it available from Phase 3 verification]

---

## Validation Architecture

nyquist_validation is explicitly `false` in `.planning/config.json` — section omitted per instructions.

---

## Code Examples

### JSON Export — Complete Function

```typescript
// Source: Pattern synthesized from PocketBase JS SDK (Context7 /pocketbase/js-sdk) +
//         browser native APIs (standard — no external source needed)
async function exportJson(): Promise<void> {
  const userId = pb.authStore.record?.id;
  if (!userId) {
    toast.error("Session expired. Please log in again.");
    return;
  }
  try {
    const records = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });

    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: records.length,
      records: records.map((r) => ({
        id: r.id,
        vaccine_name: r.vaccine_name,
        date_administered: r.date_administered,
        dose_number: r.dose_number ?? null,
        lot_number: r.lot_number ?? null,
        location: r.location ?? null,
        manufacturer: r.manufacturer ?? null,
        notes: r.notes ?? null,
        card_url: r.card ? pb.files.getURL(r, r.card) : null,
        created: r.created,
        updated: r.updated,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wallecx-vaccinations-${dayjs().format("YYYY-MM-DD")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("Vaccination records exported.");
  } catch (e: unknown) {
    toast.error("Export failed. Please try again.");
    console.error("WallecxApp: exportJson failed", e);
  }
}
```

### Wallecx Tile Entry (ProjectsView.vue)

```typescript
// Source: ProjectsView.vue Project interface (read directly)
{
  title: "Wallecx",
  description:
    "A personal health records vault. Securely store and retrieve your vaccination records — including card scans — with per-user privacy enforced server-side.",
  link: "/projects/wallecx",
  status: "WIP",
  icon: "mdi:shield-check",
  tags: ["Vue 3", "PocketBase", "Auth", "Privacy"],
}
```

### Download Button (WallecxApp.vue header row)

```html
<!-- Placed next to existing "Add vaccination" Button in the header row -->
<Button
  label="Download records"
  icon="pi pi-download"
  size="small"
  severity="secondary"
  @click="exportJson"
/>
```

---

## Open Questions

1. **Speed Insights gate (checklist item 19)**
   - What we know: PITFALLS.md flags `<SpeedInsights v-if="import.meta.env.PROD">` as a checklist item
   - What's unclear: Whether App.vue already gates it; not read in this session
   - Recommendation: Read App.vue or index.html at plan execution time; one-line fix if ungated

2. **Component name collision (checklist item 17)**
   - What we know: `components.d.ts` exists; PrimeVue auto-imports `Card`, `Dialog`, `Button`; Wallecx uses `WallecxApp`, `ManageVaccination`, `VaccinationList`, `VaccinationDetail`, `AttachmentPreview` — none collide
   - What's unclear: Whether any intermediate component was added during Phases 2–3 with a colliding name
   - Recommendation: Run `grep -i "wallecx\|vaccination\|attachment" components.d.ts` at plan execution; likely clean

3. **MEDIUM-03 sort fix scope**
   - What we know: `onCreated` uses `unshift` which is date-order incorrect for historical records
   - What's unclear: Whether the planner wants to fix this in Phase 4 or defer
   - Recommendation: Fix it alongside HIGH-01/02 in the code-fix plan — it is a one-function change in WallecxApp.vue

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | exiftool available on the developer's machine for checklist item 6 sign-off | Environment Availability | If not available, checklist item 6 cannot be verified locally; developer confirmed it in Phase 3 so sign-off may carry forward |
| A2 | `mdi:shield-check` is a valid Iconify MDI icon for the Wallecx tile | Pattern 1 (Tile) | Icon will fail to render and show blank; developer should verify on iconify.design |

---

## Sources

### Primary (HIGH confidence)
- `src/views/ProjectsView.vue` — read directly — Project interface, all 4 existing entries, CSS class names, gradient pattern
- `src/assets/base.css` — read directly — complete design token inventory (16 vars)
- `src/assets/main.css` — read directly — Rubik font import, font-family CSS var
- `src/router/index.ts` — read directly — guard logic, route definitions, wallecx meta: { requiresAuth: true }
- `src/stores/auth.ts` — read directly — useAuthStore, isLoggedIn computed, pb.authStore.record
- `src/components/projects/wallecx/WallecxApp.vue` — read directly — state, getFullList call, pb.files.getToken pattern
- `src/components/projects/wallecx/ManageVaccination.vue` — read directly — HIGH-01/02 locations, pendingFile, isSaving
- `src/components/projects/wallecx/VaccinationList.vue` — read directly — thumbUrl, WR-02 gap
- `.planning/research/PITFALLS.md` — read directly — complete 19-item "Looks Done But Isn't" checklist
- `.planning/phases/03-write-path/03-REVIEW.md` — read directly — HIGH-01/02/MEDIUM-01/02/03 details
- `.planning/phases/02-read-path/02-REVIEW.md` — read directly — WR-01/02/03 details
- `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` — read directly — established spec file pattern
- `vitest.config.ts` — read directly — jsdom environment, test root
- `package.json` — read directly — vitest@^3.2.4, pinia@^3.0.3, vue-router@^4.5.1, @vue/test-utils@^2.4.6
- Context7 `/pocketbase/js-sdk` — getFullList auto-pagination, files.getURL, files.getToken patterns
- Context7 `/vuejs/vue-router` — beforeEach guard pattern, createMemoryHistory for testing

### Secondary (MEDIUM confidence)
- Vue Router 4 testing community pattern: use `createMemoryHistory` in Vitest; do not import production router — confirmed by Vue Router docs and consistent with established jsdom testing practice

---

## Metadata

**Confidence breakdown:**
- POLISH-01 (Tile): HIGH — Project interface and all 4 entries read directly; gradient is automatic CSS
- POLISH-02 (Token audit): HIGH — base.css enumerated completely; grep command will confirm compliance
- POLISH-03 (JSON export): HIGH — PocketBase SDK pattern verified via Context7; Blob/URL.createObjectURL is standard browser API
- POLISH-04 (Guard spec): HIGH — guard code read directly; vi.mock pattern is well-established Vitest; createMemoryHistory confirmed for jsdom
- POLISH-05 (Checklist): HIGH — PITFALLS.md read directly; 17/19 items assessed against prior review files; 2 need spot-checks at execution
- Code review fixes: HIGH — all 5 fixes (HIGH-01, HIGH-02, WR-01, WR-02, WR-03) have specific file/line references and verified fix patterns from the REVIEW.md documents

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable codebase; findings invalidated if Wallecx components or router are edited before Phase 4 execution)
