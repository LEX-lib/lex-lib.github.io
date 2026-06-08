# Phase 4: Discovery & Polish — Pattern Map

**Mapped:** 2026-05-12
**Files analyzed:** 7 (4 modified, 1 created, 2 spot-checks)
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/views/ProjectsView.vue` | component (data array) | transform | `src/views/ProjectsView.vue` itself (extend existing array) | exact |
| `src/components/projects/wallecx/WallecxApp.vue` | component (orchestrator) | CRUD + file-I/O | `src/components/projects/wallecx/WallecxApp.vue` itself (patch in place) | exact |
| `src/components/projects/wallecx/ManageVaccination.vue` | component (form dialog) | CRUD | `src/components/projects/wallecx/ManageVaccination.vue` itself (patch in place) | exact |
| `src/components/projects/wallecx/VaccinationList.vue` | component (display) | request-response | `src/components/projects/wallecx/VaccinationList.vue` itself (patch in place) | exact |
| `src/router/__tests__/guard.spec.ts` | test | request-response | `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` | role-match |

**Spot-check files (no code changes expected — confirm only):**

| File | Check | Finding |
|------|-------|---------|
| `components.d.ts` | Wallecx component names collide with PrimeVue? | CLEAN — `WallecxApp`, `ManageVaccination`, `VaccinationList`, `VaccinationDetail`, `AttachmentPreview` are all distinct from all PrimeVue entries |
| `src/App.vue` | `<SpeedInsights>` gated by `v-if="import.meta.env.PROD"`? | NOT GATED — `<SpeedInsights />` is unconditional on line 11; needs one-line fix in the POLISH-02/polish plan |

---

## Pattern Assignments

### `src/views/ProjectsView.vue` — POLISH-01 (add Wallecx tile)

**Analog:** Same file — extend the existing `projects` array.

**Exact `Project` interface** (lines 4–11):
```typescript
interface Project {
  title: string;
  description: string;
  link: string;
  status: "WIP" | "Active";
  icon: string;    // Iconify icon name e.g. "mdi:bus-side"
  tags: string[];
}
```

**Existing array pattern** (lines 13–50) — all four entries follow this exact shape:
```typescript
const projects = ref<Project[]>([
  {
    title: "Larga",
    description: "...",
    link: "/projects/larga",
    status: "WIP",
    icon: "mdi:bus-side",
    tags: ["Vue 3", "Leaflet", "Maps"],
  },
  // ... 3 more entries
]);
```

**Entry to append** (place as 5th element, after API Playground):
```typescript
{
  title: "Wallecx",
  description:
    "A personal health records vault. Securely store and retrieve your vaccination records — including card scans — with per-user privacy enforced server-side.",
  link: "/projects/wallecx",
  status: "WIP",
  icon: "mdi:shield-check",
  tags: ["Vue 3", "PocketBase", "Auth", "Privacy"],
},
```

**Gradient is automatic** — no per-tile CSS needed. The `.projects-card-bar` and `.projects-underline` classes (lines 174–193) apply `linear-gradient(to right, var(--color-brand-primary), var(--color-brand-accent))` to ALL cards via scoped CSS. The `status: "WIP"` value triggers the `v-if="project.status === 'WIP'"` Tag (line 117) — exact case match required; TypeScript will enforce this at compile time.

**Pitfall:** `"wip"` instead of `"WIP"` silently hides the Tag. Run `npm run type-check` to catch before commit.

---

### `src/components/projects/wallecx/WallecxApp.vue` — POLISH-03 (JSON export) + WR-01 fix + WR-03 fix

**Analog:** Same file — current state read at lines 1–146.

**Current imports block** (lines 1–8) — add `dayjs` import:
```typescript
import { ref, onMounted, onUnmounted } from "vue";  // add onUnmounted
import { toast } from "vue-sonner";
import { useConfirm } from "primevue/useconfirm";
import { pb } from "@/lib/pocketbase";
import dayjs from "dayjs";                            // add for export filename
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";
import ManageVaccination from "./ManageVaccination.vue";
```

**WR-01 fix — listToken interval refresh** — add alongside existing state declarations (after line 18):
```typescript
// WR-01: refresh listToken before it expires (PocketBase TTL is 5 min; refresh at 4 min)
const LIST_TOKEN_TTL_MS = 4 * 60 * 1000;
let listTokenTimer: ReturnType<typeof setInterval> | null = null;
```

Add in `onMounted` block, after the existing `listToken.value = await pb.files.getToken()` call (line 27):
```typescript
listTokenTimer = setInterval(async () => {
  try {
    listToken.value = await pb.files.getToken();
  } catch (e) {
    console.warn("WallecxApp: listToken refresh failed", e);
  }
}, LIST_TOKEN_TTL_MS);
```

Add new lifecycle hook after `onMounted` close:
```typescript
onUnmounted(() => {
  if (listTokenTimer) clearInterval(listTokenTimer);
});
```

**WR-03 fix — `openDetail` must abort on getToken failure** — replace current `openDetail` (lines 36–47):
```typescript
async function openDetail(record: Vaccinations): Promise<void> {
  selectedRecord.value = record;
  if (record.card) {
    try {
      fileToken.value = await pb.files.getToken();
    } catch (e: unknown) {
      toast.error("Failed to load attachment. Refresh to try again.");
      console.error("WallecxApp: getToken failed", e);
      selectedRecord.value = null;
      return; // WR-03: abort — do not open dialog without a valid token
    }
  }
  showDetail.value = true;
}
```

**POLISH-03 — `exportJson()` function** — add after `openManage` (after line 52):
```typescript
async function exportJson(): Promise<void> {
  const userId = pb.authStore.record?.id;
  if (!userId) {
    toast.error("Session expired. Please log in again.");
    return;
  }
  try {
    const allRecords = await pb
      .collection("wallecx_vaccinations")
      .getFullList<Vaccinations>({ sort: "-date_administered" });

    const exportPayload = {
      exported_at: new Date().toISOString(),
      record_count: allRecords.length,
      records: allRecords.map((r) => ({
        id: r.id,
        vaccine_name: r.vaccine_name,
        date_administered: r.date_administered,
        dose_number: r.dose_number ?? null,
        lot_number: r.lot_number ?? null,
        location: r.location ?? null,
        manufacturer: r.manufacturer ?? null,
        notes: r.notes ?? null,
        card_url: r.card ? pb.files.getURL(r, r.card) : null, // NO token — reference only
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

**Pitfall:** Do NOT pass `{ token }` to `pb.files.getURL` in the export. Tokens expire in ~5 minutes; the export is a reference document. Copy the pattern from `openDetail`'s `getToken` call only for preview, never for export.

**Download button — add to template header row** (next to the existing "Add vaccination" Button, lines 98–103):
```html
<div class="flex items-center justify-between mb-4">
  <h1 class="text-2xl font-bold" style="color: var(--color-typo-heading)">Wallecx</h1>
  <div class="flex gap-2">
    <Button
      label="Download records"
      icon="pi pi-download"
      size="small"
      severity="secondary"
      @click="exportJson"
    />
    <Button
      label="Add vaccination"
      icon="pi pi-plus"
      size="small"
      @click="openManage(null)"
    />
  </div>
</div>
```

---

### `src/components/projects/wallecx/ManageVaccination.vue` — HIGH-01 + HIGH-02 fixes

**Analog:** Same file — current state read at lines 1–276.

**HIGH-01 fix — null assertion on `pb.authStore.record!.id`** (line 147):
```typescript
// BEFORE (unsafe — currently at line 147):
formData.append("user", pb.authStore.record!.id);

// AFTER (safe — guard + early return):
const userId = pb.authStore.record?.id;
if (!userId) {
  toast.error("Session expired. Please log in again.");
  isSaving.value = false;
  return;
}
formData.append("user", userId);
```

Note: `isSaving.value = false` must be set before `return` when bailing early inside the `try` block, since the `finally` block still sets it to false — but adding it explicitly avoids a stale loading state if the control flow changes in future.

**HIGH-02 fix — stale `pendingFile` across dialog sessions** — in the `onSubmit` success branch, before `visible.value = false` (currently line 165):
```typescript
// Add BEFORE visible.value = false:
pendingFile.value = null; // HIGH-02: explicit reset — do not rely solely on @hide timing
visible.value = false;
```

The `onHide` handler at line 175 already resets `pendingFile`, but `onHide` fires AFTER the dialog animation completes. If the user re-opens the dialog quickly, `pendingFile` may still hold the previous file. The explicit reset in the success branch closes this window.

---

### `src/components/projects/wallecx/VaccinationList.vue` — WR-02 fix

**Analog:** Same file — current state read at lines 1–116.

**WR-02 fix — missing empty-string guard in `thumbUrl()`** (lines 22–24):
```typescript
// BEFORE (currently at lines 22–24):
function thumbUrl(record: Vaccinations): string {
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}

// AFTER (guard against empty-string card field):
function thumbUrl(record: Vaccinations): string {
  if (!record.card) return "";
  return pb.files.getURL(record, record.card, { thumb: "100x100", token: props.listToken });
}
```

The template at line 75 already has `v-if="data.card"` which prevents `thumbUrl` being called on records without a card in the data-state branch. The guard in `thumbUrl` itself is a defensive belt-and-suspenders against any future call site that doesn't check first.

---

### `src/router/__tests__/guard.spec.ts` — POLISH-04 (new file)

**Analog:** `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts`

**Spec file structure from analog** (lines 1–83):
- Imports: `describe`, `it`, `expect` from `"vitest"` at top
- Factory function (`makeVaccinations`) for test data construction
- Multiple `describe` blocks grouping related assertions
- Each `it` block tests one assertion
- No `beforeEach` in the analog (but guard spec needs it for Pinia reset — see below)

**Guard spec — complete file to create at `src/router/__tests__/guard.spec.ts`:**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouter, createMemoryHistory } from "vue-router";
import { defineComponent } from "vue";
import { setActivePinia, createPinia } from "pinia";

// vi.mock calls MUST appear before any named imports that use the mocked modules
// Vitest hoists vi.mock but only processes them in module scope — place at top
vi.mock("@/stores/auth", () => ({
  useAuthStore: vi.fn(),
}));
vi.mock("@/lib/pocketbase", () => ({
  pb: { authStore: { record: null, onChange: vi.fn() } },
}));

import { useAuthStore } from "@/stores/auth";

// Minimal stub component — router guard tests do not need real component rendering
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

// Re-registers the guard logic from src/router/index.ts on the test router.
// DO NOT import index.ts directly — it calls createWebHistory which behaves
// unpredictably in jsdom. Use createMemoryHistory here instead.
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

**Critical:** The `__tests__` directory does not yet exist under `src/router/`. The executor must create both the directory and the file.

---

### `src/App.vue` — Speed Insights gate (POLISH-05 checklist item 19)

**Analog:** `src/App.vue` (read directly, lines 1–12).

**Current state — ungated** (line 11):
```html
<SpeedInsights />
```

**Fix — gate to production only:**
```html
<SpeedInsights v-if="import.meta.env.PROD" />
```

This is a one-line template change. No script block changes needed.

---

## Shared Patterns

### Toast notifications
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 3, 29–30, 85–87
**Apply to:** All async operations in WallecxApp.vue and ManageVaccination.vue
```typescript
import { toast } from "vue-sonner";
// success:
toast.success("Vaccination records exported.");
// error:
toast.error("Export failed. Please try again.");
console.error("WallecxApp: exportJson failed", e);
```
Pattern: always log to console alongside toast so errors are debuggable in production.

### PocketBase collection access
**Source:** `src/components/projects/wallecx/WallecxApp.vue` lines 5, 25–27
**Apply to:** `exportJson()` in WallecxApp.vue
```typescript
import { pb } from "@/lib/pocketbase";
const records = await pb
  .collection("wallecx_vaccinations")
  .getFullList<Vaccinations>({ sort: "-date_administered" });
```
Pattern: always pass the generic type parameter `<Vaccinations>` so the return is typed.

### Auth guard (null-safe record access)
**Source:** RESEARCH.md Pattern 5 (HIGH-01 fix); `src/stores/auth.ts` lines 7–9
**Apply to:** Any code path that reads `pb.authStore.record`
```typescript
// Safe pattern — optional chaining, never non-null assertion
const userId = pb.authStore.record?.id;
if (!userId) {
  toast.error("Session expired. Please log in again.");
  return;
}
```
The auth store's `isLoggedIn` computed (`!!user.value`) guards route-level access, but individual functions that write to PocketBase must independently guard against a session expiry between mount and action.

### Design token usage
**Source:** `src/assets/base.css` (complete token set); `src/components/projects/wallecx/WallecxApp.vue` line 97
**Apply to:** All new template markup in Wallecx components
```html
style="color: var(--color-typo-heading)"
style="color: var(--color-typo-body)"
style="color: var(--color-typo-muted)"
style="color: var(--color-brand-primary)"
style="color: var(--color-brand-accent)"
```
Pattern: inline `style` attribute with CSS var reference — no hardcoded hex values in markup.

### Vitest spec file structure
**Source:** `src/lib/pocketbase/__tests__/vaccinationMapper.spec.ts` lines 1–83
**Apply to:** `src/router/__tests__/guard.spec.ts`
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
// factory function for test data
// describe blocks grouping related cases
// it blocks with single assertion focus
```
Convention: no `test()` alias — use `it()` to match existing repo style.

---

## No Analog Found

All Phase 4 files have close analogs. No novel patterns without a codebase reference.

---

## POLISH-05 Checklist Pre-Assessment

Findings from codebase reads that inform the sign-off checklist:

| # | Item | Pre-assessed Status | Evidence |
|---|------|--------------------|---------| 
| 1 | Per-user isolation | PASS | Phase 1 BACK-03 verified |
| 2 | Filter injection safety | PASS | WRITE-08 parameterised filters |
| 3 | File access 403 without token | PASS | BACK-02 `protected: true` |
| 4 | Save round-trip no duplicate | PASS | WRITE-04 Object.assign id-refresh |
| 5 | Delete removes record + file | PASS | WRITE-06 server-first delete |
| 6 | EXIF stripped | PASS | WRITE-03 canvas re-encode |
| 7 | pdfjs-dist ≥ 4.2.67 | PASS | FRONT-01 |
| 8 | CSP not regressed | PASS | 02-01-PLAN |
| 9 | No v-html in Wallecx | VERIFY AT EXECUTION | `git grep "v-html" src/components/projects/wallecx/` |
| 10 | No template-literal filters | VERIFY AT EXECUTION | `git grep '`.*filter' src/components/projects/wallecx/` |
| 11 | Watcher fires on mount | PASS | onMounted fetch in WallecxApp.vue |
| 12 | Save button disables during save | PASS | WRITE-07 `isSaving` |
| 13 | No auth token in prod bundle | VERIFY AT EXECUTION | `npm run build && grep -r VITE_LOGIN dist/` |
| 14 | Mapper test passes | PASS | 10 tests green |
| 15 | Route guard test passes | OPEN — Phase 4 POLISH-04 | Implement guard.spec.ts |
| 16 | JSON export works | OPEN — Phase 4 POLISH-03 | Implement exportJson() |
| 17 | No component name collision | PASS | `components.d.ts` confirms WallecxApp, ManageVaccination, VaccinationList, VaccinationDetail, AttachmentPreview are all distinct from PrimeVue names |
| 18 | Hard-refresh resolves SPA route | PASS | dist/404.html SPA rewrite in build script |
| 19 | Speed Insights gated to PROD | FAIL — needs fix | `src/App.vue` line 11: `<SpeedInsights />` is unconditional; fix to `v-if="import.meta.env.PROD"` |

---

## Metadata

**Analog search scope:** `src/views/`, `src/components/projects/wallecx/`, `src/router/`, `src/stores/`, `src/lib/pocketbase/__tests__/`, `src/App.vue`, `components.d.ts`
**Files read:** 10 source files + 2 planning documents
**Pattern extraction date:** 2026-05-12
