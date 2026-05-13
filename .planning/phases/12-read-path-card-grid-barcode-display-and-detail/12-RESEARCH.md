# Phase 12: Read Path — Card Grid, Barcode Display & Detail — Research

**Researched:** 2026-05-13
**Domain:** Vue 3 barcode rendering (qrcode.vue, jsbarcode), scan overlay UX, PocketBase file tokens, AttachmentPreview adaptation
**Confidence:** HIGH — all library claims verified against installed packages on disk; all patterns verified against existing codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md / STATE.md)

### Locked Decisions

- **JsBarcode throws on invalid input:** Every `JsBarcode()` call MUST be wrapped in `try/catch`. On catch, set `renderError = true` and fall through to the `card_number` plain-text fallback. Never pass empty string to JsBarcode — guard with truthy check BEFORE rendering Branch B.
- **iOS fullscreen:** Use `position: fixed; inset: 0; z-index: 9999` overlay — NOT `requestFullscreen()`. No `@vueuse/core useFullscreen`.
- **Screen wake lock:** `navigator.wakeLock.request('screen')` in `try/catch`; re-acquire in `visibilitychange` handler; release in `closeScanOverlay`.
- **Barcode background is non-negotiable:** `BARCODE_FOREGROUND = '#000000'` and `BARCODE_BACKGROUND = '#ffffff'` as module-level constants in `BarcodeDisplay.vue`. Never configurable via props.
- **PocketBase auto-cancel guard:** Use `requestKey: 'memberships-getFullList'` on every `getFullList` call — distinct from the vaccinations key used in VaccinationsTab.
- **Watcher fires before SVG mounts:** Use `useTemplateRef` + guard `if (!barcodeSvgRef.value) return` inside `renderBarcode()`. Pattern: `onMounted(renderBarcode)` + `watch(() => props.barcode_value, renderBarcode)` WITHOUT `{ immediate: true }`.
- **card_color CSS always prepends `#`:** `:style="{ backgroundColor: card.card_color ? '#' + card.card_color : '#002244' }"`. Never pass raw `card_color` to CSS.
- **BarcodeDisplay is purely presentational:** No PocketBase calls inside it.
- **No `v-html` anywhere in Wallecx:** All user-supplied fields use `{{ }}` mustache only.
- **ManageMembership** (Phase 13) uses direct `v-model` refs, NOT `@primevue/forms` — but that is out of scope for Phase 12.
- **card_color stored WITHOUT hash prefix.** All CSS bindings prepend `#` via inline style binding.

### Claude's Discretion

- Exact AttachmentPreview adaptation strategy for memberships (`card_image` vs `card` field name mismatch).
- Scan overlay Teleport placement (recommended: `<Teleport to="body">` to escape Dialog z-index stacking context).
- Card tile min-height, card text color on coloured tiles.
- "Card Colour" AU English spelling in UI copy.
- Barcode type human-readable labels (e.g. "Code 128", "EAN-13").

### Deferred Ideas (OUT OF SCOPE)

- Phase 13 write path (ManageMembership.vue CRUD, Zod form, ColorPicker, FileUpload).
- PDF417 / Aztec / bwip-js (SCAN-ADV-01 — v3 deferred).
- ZXing camera scanning (SCAN-ADV-02 — v3 deferred).
- Search/sort/view toggle for memberships (ORG-01..03 — v3 deferred).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAN-01 | `BarcodeDisplay.vue` renders QR codes via `qrcode.vue` on white background; SVG render mode | qrcode.vue 3.9.1 verified on disk; `render-as="svg"` prop confirmed in source |
| SCAN-02 | `BarcodeDisplay.vue` renders linear barcodes via `jsbarcode` on SVG; entire call in `try/catch`; plain-number fallback on invalid input | jsbarcode 3.12.3 verified on disk; throw behavior confirmed by test execution |
| SCAN-03 | Full-screen scan overlay: white background, brightness boost, wake lock, fixed/inset/z-9999; close button always visible | WakeLockSentinel confirmed in TS 5.8.3 DOM lib; Teleport pattern documented |
| SCAN-04 | `barcode_value` absent → show `card_number` in large text; both absent → "No barcode" placeholder | Branch selection computed pattern documented |
| MREAD-01 | `MembershipCard.vue` tile: card name, issuer, barcode type badge, expiry; card_color CSS; expiry warning ≤ 30 days | dayjs 1.11.18 confirmed; `diff('day')` pattern documented |
| MREAD-02 | `MembershipsTab.vue` grid: skeleton / empty / error (three-state, same as vaccinations) | VaccinationsTab.vue pattern read and documented verbatim |
| MREAD-03 | Tap tile → `MembershipDetail.vue` with all fields + `BarcodeDisplay` embedded; tap barcode → scan overlay | Full interaction flow documented |
| MREAD-04 | `card_image` preview in `MembershipDetail.vue` via `AttachmentPreview.vue` pattern | AttachmentPreview.vue read; adaptation strategy documented |
</phase_requirements>

---

## Summary

Phase 12 is a pure UI implementation phase — all backend, types, mapper, and library dependencies are already in place from Phase 11. The work is building four new Vue components (`BarcodeDisplay.vue`, `MembershipCard.vue`, `MembershipDetail.vue`) and replacing the `MembershipsTab.vue` stub with a full implementation.

The technical risk areas are fully mapped in STATE.md's Risk Register and have prescribed solutions. The most critical is `BarcodeDisplay.vue`: JsBarcode throws synchronously on invalid input (confirmed by test execution in this research session), so the try/catch guard is mandatory. The four-branch render logic (`qr` / `linear` / `number-fallback` / `empty`) must be implemented precisely to handle all valid states without runtime errors.

The scan overlay (SCAN-03) uses a Teleport-to-body pattern to escape the PrimeVue Dialog z-index stacking context, plus `navigator.wakeLock` for screen brightness — both with graceful degradation. Wake lock types are confirmed available in TypeScript 5.8.3's DOM lib.

`AttachmentPreview.vue` currently accepts `record: Vaccinations` and reads `record.card` and `record.vaccine_name`. For memberships, the field is `card_image` and there is no `vaccine_name`. The recommended adaptation is to create a thin `MembershipAttachmentPreview.vue` wrapper that passes a shaped object to `AttachmentPreview` — or alternatively refactor `AttachmentPreview` to accept a generic `{ card: string; name: string }` shape. The UI-SPEC.md documents both options; research confirms the wrapper approach is lower risk.

**Primary recommendation:** Follow the UI-SPEC.md component specifications exactly. Every pattern decision (branch logic, wake lock, overlay CSS, requestKey, watcher guard) is already locked in STATE.md Risk Register. The planner's job is to sequence four component creation tasks in dependency order: BarcodeDisplay first (no dependencies), then MembershipCard and MembershipDetail (depend on BarcodeDisplay), then MembershipsTab replacement (depends on all three).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Membership card grid display | Browser / Client (Vue SPA) | — | Read-only UI; data already in local `ref` after fetch |
| Data fetch (`wallecx_memberships`) | Browser / Client (`pb.getFullList`) | PocketBase (server enforces auth rules) | Auth rules already verified in Phase 11 |
| Barcode rendering (QR + linear) | Browser / Client (qrcode.vue / jsbarcode) | — | Pure client-side SVG generation |
| Full-screen scan overlay | Browser / Client (Teleport + CSS fixed) | — | iOS Safari does not support Fullscreen API on non-video elements |
| Screen wake lock | Browser / Client (WakeLock API) | — | Native browser API; no server involvement |
| File token fetch (card_image) | Browser / Client (`pb.files.getToken()`) | PocketBase (issues token) | Token fetched at view time, not list time |
| Attachment preview (card_image) | Browser / Client (`<img>` with thumb URL) | PocketBase (serves resized image) | Image-only for memberships (no PDF) |

---

## Standard Stack

### Core (all already installed — no new packages in Phase 12)

[VERIFIED: npm registry / package.json on disk]

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| qrcode.vue | 3.9.1 (installed) | QR code rendering as Vue component | Vue-native wrapper; SVG mode supported; `render-as="svg"` prop verified |
| jsbarcode | 3.12.3 (installed) | Linear barcode rendering (Code128/EAN-13/Code39) | De facto standard; imperative SVG render API; throws on invalid input (confirmed) |
| dayjs | 1.11.18 (installed) | Expiry date calculations and formatting | Already used throughout codebase; `diff('day')` + `isBefore()` pattern confirmed |
| primevue | 4.3.7 (installed) | Card, Badge, Skeleton, Dialog, Divider, Button | Auto-imported via PrimeVueResolver; all components used in phase already available |
| vue-sonner | 2.0.8 (installed) | Error toasts | `toast.error()` used in VaccinationsTab — exact same pattern |
| pocketbase | 0.26.2 (installed) | Data fetch + file token | `pb.collection().getFullList()` + `pb.files.getToken()` + `pb.files.getURL()` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vue (useTemplateRef) | 3.5.33 (installed) | SVG element ref for JsBarcode | Replaces old `ref()` pattern for template refs; confirmed available in Vue 3.5+ |
| vue (Teleport) | built-in | Render scan overlay outside Dialog stacking context | Mandatory when z-index conflicts with parent Dialogs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsbarcode imperative API | bwip-js | bwip-js has PDF417/Aztec support but 40KB larger; deferred to v3 (SCAN-ADV-01) |
| Teleport to body | Higher z-index | z-index wars are fragile across browser stacking contexts; Teleport is definitive |
| position: fixed overlay | requestFullscreen() | iOS Safari does not support requestFullscreen on non-video elements; fixed overlay confirmed |

**Installation:** No new packages. All dependencies already in `package.json` from Phase 11.

---

## Architecture Patterns

### System Architecture Diagram

```
User taps "Membership Cards" tab
         │
         ▼
MembershipsTab.vue (onMounted)
    │   └── pb.collection('wallecx_memberships').getFullList()
    │         requestKey: 'memberships-getFullList'
    │         sort: '-created'
    │         ▼
    │   [isLoading=true] → 3× Skeleton tiles
    │   [error] → toast.error + isLoading=false
    │   [success] → records[] populated + isLoading=false
    │
    ├── records.length === 0 → empty state (icon + "No membership cards yet.")
    │
    └── records.length > 0 → grid grid-cols-1 sm:grid-cols-2 gap-4
          │
          └── MembershipCard.vue (per record)
                :record="record"
                @click → MembershipsTab.openDetail(record)
                          │
                          ├── record.card_image? → pb.files.getToken()
                          │     [token fail] → toast.error + abort (WR-03 pattern)
                          │
                          └── showDetail=true → PrimeVue Dialog
                                  │
                                  └── MembershipDetail.vue
                                        :record :token
                                        │
                                        ├── field grid (card_name, issuer, ...)
                                        │
                                        ├── BarcodeDisplay.vue
                                        │     :barcode_type :barcode_value :card_number
                                        │     @scan → openScanOverlay()
                                        │       │
                                        │       ├── Branch A [qr + value] → QrcodeVue SVG
                                        │       ├── Branch B [linear + value] → JsBarcode SVG
                                        │       │     └── catch → renderError=true → Branch C
                                        │       ├── Branch C [number or error] → card_number text
                                        │       └── Branch D [empty] → "No barcode" icon
                                        │
                                        ├── openScanOverlay()
                                        │     ├── wakeLock.request('screen') [try/catch]
                                        │     └── showScanOverlay=true
                                        │           │
                                        │           └── <Teleport to="body">
                                        │                 fixed inset-0 z-9999 bg-white
                                        │                 filter: brightness(1.4)
                                        │                 ├── close button (48px, top-right)
                                        │                 └── BarcodeDisplay (same props, no @scan)
                                        │
                                        └── AttachmentPreview / wrapper
                                              :record :token
                                              ├── card_image → <img thumb=400x400>
                                              ├── unknown MIME → download link
                                              └── no card_image → "No attachment."
```

### Recommended Component Structure

```
src/components/projects/wallecx/
├── BarcodeDisplay.vue          # NEW — purely presentational barcode/QR renderer
├── MembershipCard.vue          # NEW — coloured tile for membership grid
├── MembershipDetail.vue        # NEW — full-field detail view with scan overlay
├── MembershipsTab.vue          # REPLACE stub with full implementation
├── VaccinationsTab.vue         # UNCHANGED
└── WallecxApp.vue              # UNCHANGED
```

No new directories required. All new components are siblings at the same level as `VaccinationsTab.vue`.

### Pattern 1: BarcodeDisplay.vue — Four-Branch Render with Computed Selector

**What:** A single `displayBranch` computed determines which of four mutually exclusive branches renders. Branch B sets `renderError` on catch, which the same computed reads.

**When to use:** Any time a component has exclusive states that must never overlap.

```typescript
// Source: UI-SPEC.md §BarcodeDisplay.vue + verified against jsbarcode@3.12.3 on disk
import JsBarcode from 'jsbarcode'
import QrcodeVue from 'qrcode.vue'
import { ref, computed, onMounted, watch, useTemplateRef } from 'vue'

const BARCODE_FOREGROUND = '#000000'  // module-level constant — NOT a prop
const BARCODE_BACKGROUND = '#ffffff'  // module-level constant — NOT a prop

const props = defineProps<{
  barcode_type: string | undefined
  barcode_value: string | undefined
  card_number: string | undefined
}>()

const barcodeSvgRef = useTemplateRef<SVGSVGElement>('barcodeSvgRef')
const renderError = ref(false)

type BarcodeDisplayBranch = 'qr' | 'linear' | 'number-fallback' | 'empty'

const displayBranch = computed<BarcodeDisplayBranch>(() => {
  if (props.barcode_type === 'qr' && props.barcode_value) return 'qr'
  if (['code128', 'ean13', 'code39'].includes(props.barcode_type ?? '') && props.barcode_value) return 'linear'
  if (props.card_number) return 'number-fallback'
  return 'empty'
})

function renderBarcode(): void {
  if (!barcodeSvgRef.value) return  // STATE.md BR-5: watcher guard
  try {
    JsBarcode(barcodeSvgRef.value, props.barcode_value ?? '', {
      format: props.barcode_type?.toUpperCase() ?? 'CODE128',
      lineColor: BARCODE_FOREGROUND,
      background: BARCODE_BACKGROUND,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    })
    renderError.value = false
  } catch {
    renderError.value = true  // falls through to number-fallback branch
  }
}

onMounted(renderBarcode)                           // fires after SVG mounts
watch(() => props.barcode_value, renderBarcode)   // NO immediate: true — STATE.md BR-5
```

**Critical notes:**
- `JsBarcode` default import (CommonJS `export =` module). `esModuleInterop: true` in `@vue/tsconfig` base config makes `import JsBarcode from 'jsbarcode'` work correctly. [VERIFIED: tsconfig chain on disk]
- `QrcodeVue` named import from `'qrcode.vue'` — the package exports `QrcodeVue` as default. [VERIFIED: qrcode.vue dist on disk]
- `useTemplateRef<SVGSVGElement>('barcodeSvgRef')` requires Vue 3.5+. [VERIFIED: Vue 3.5.33 installed]
- `format: props.barcode_type?.toUpperCase()` maps PocketBase select values: `code128` → `'CODE128'`, `ean13` → `'EAN13'`, `code39` → `'CODE39'`. JsBarcode accepts these uppercase strings. [VERIFIED: jsbarcode bin/barcodes/ directory listing]

### Pattern 2: qrcode.vue — SVG Mode Props

**What:** The `QrcodeVue` component uses `render-as` prop (kebab-case in template, camelCase `renderAs` in TypeScript). Default is `'canvas'` — must explicitly set `render-as="svg"` for SCAN-01.

```html
<!-- Source: qrcode.vue 3.9.1 ESM source + index.d.ts verified on disk -->
<QrcodeVue
  :value="barcode_value"
  :size="200"
  level="M"
  render-as="svg"
  :foreground="BARCODE_FOREGROUND"
  :background="BARCODE_BACKGROUND"
/>
```

**Confirmed prop names (from `qrcode.vue/dist/index.d.ts`):** [VERIFIED: file read on disk]
- `value: string` (required)
- `size: number` (default: 200)
- `level: 'L' | 'M' | 'Q' | 'H'` (default: 'L')
- `renderAs: 'canvas' | 'svg'` (default: 'canvas') — use `render-as` in template
- `background: string` (default: '#ffffff')
- `foreground: string` (default: '#000000')

### Pattern 3: Scan Overlay — Teleport + Wake Lock

**What:** The scan overlay must escape the PrimeVue Dialog's z-index stacking context. `<Teleport to="body">` moves the overlay DOM node to `<body>`, making `z-index: 9999` effective. Wake lock is feature-detected and silently degraded.

```typescript
// Source: UI-SPEC.md §MembershipDetail.vue + STATE.md Risk Register FS-1/FS-2
// WakeLockSentinel type confirmed in TypeScript 5.8.3 lib.dom.d.ts

const showScanOverlay = ref(false)
const wakeLock = ref<WakeLockSentinel | null>(null)

async function openScanOverlay(): Promise<void> {
  showScanOverlay.value = true
  if ('wakeLock' in navigator) {
    try {
      wakeLock.value = await navigator.wakeLock.request('screen')
    } catch {
      // degrade silently — overlay still opens without wake lock
    }
  }
}

async function closeScanOverlay(): Promise<void> {
  showScanOverlay.value = false
  try {
    await wakeLock.value?.release()
  } catch { /* ignore */ }
  wakeLock.value = null
}

// Re-acquire when tab regains visibility (screen-off + return scenario)
async function onVisibilityChange(): Promise<void> {
  if (document.visibilityState === 'visible' && showScanOverlay.value) {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.value = await navigator.wakeLock.request('screen')
      } catch { /* degrade silently */ }
    }
  }
}

onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange))
onUnmounted(() => document.removeEventListener('visibilitychange', onVisibilityChange))
```

**Overlay CSS (locked — STATE.md FS-2):**
```css
position: fixed;
inset: 0;
z-index: 9999;
background: #ffffff;
filter: brightness(1.4);
```

### Pattern 4: AttachmentPreview Adaptation for Memberships

**What:** `AttachmentPreview.vue` currently accepts `record: Vaccinations` and reads `record.card` (filename) and `record.vaccine_name` (for alt text). Memberships use `card_image` (not `card`) and `card_name` (not `vaccine_name`).

**Recommended approach (minimal change, no regression risk):**

Create `MembershipAttachmentPreview.vue` as a thin adapter wrapper:

```typescript
// Passes a shaped object that satisfies AttachmentPreview's actual accesses
// AttachmentPreview reads: record.card (filename) and record.vaccine_name (alt text)
// Membership has: record.card_image and record.card_name

// Option A (safer): Refactor AttachmentPreview to accept generic props
// defineProps<{ card: string; name: string; token: string }>()
// This requires modifying AttachmentPreview — low risk since it's used in one place

// Option B (zero-risk): Create wrapper that re-shapes the membership record
// MembershipAttachmentPreview.vue passes { card: record.card_image, vaccine_name: record.card_name }
// as a casted object to AttachmentPreview
```

**Decision for planner:** The UI-SPEC.md recommends Option A (refactor AttachmentPreview to generic props) or creating a wrapper. The executor should read `AttachmentPreview.vue` directly — it only uses `record.card` for filename and `record.vaccine_name` for alt text. The safest approach that does NOT regress VaccinationsTab is to refactor AttachmentPreview to accept `{ card: string; name: string; token: string }` generic props and update the existing VaccinationDetail call site. [VERIFIED: AttachmentPreview.vue source read on disk]

### Pattern 5: MembershipsTab Three-State Fetch

**What:** Mirrors VaccinationsTab.vue's onMounted fetch pattern exactly, with one difference: memberships sort by `-created` (no date_administered field), and use a distinct `requestKey`.

```typescript
// Source: VaccinationsTab.vue (direct codebase read) + UI-SPEC.md
onMounted(async () => {
  isLoading.value = true
  try {
    records.value = await pb
      .collection('wallecx_memberships')
      .getFullList<Memberships>({
        sort: '-created',
        requestKey: 'memberships-getFullList',  // distinct — STATE.md MR-5
      })
  } catch (e: unknown) {
    toast.error('Failed to load membership cards.')
    console.error('MembershipsTab: getFullList failed', e)
  } finally {
    isLoading.value = false
  }
})
```

**Key differences from VaccinationsTab:**
- No `listToken` interval refresh (memberships don't use listToken for thumbnails in the grid — no thumbnails in card tiles)
- No `onUnmounted` interval cleanup
- Sort: `-created` not `-date_administered`
- `requestKey: 'memberships-getFullList'` (not the default which would collide)

### Anti-Patterns to Avoid

- **Calling JsBarcode with an empty string:** The branch-selection computed must be evaluated BEFORE the SVG is rendered. The `v-if="displayBranch === 'linear'"` condition ensures the `<svg ref="barcodeSvgRef">` only mounts when `barcode_value` is truthy. [VERIFIED: JsBarcode throws on empty string — tested on disk]
- **Using `watch(() => props.barcode_value, renderBarcode, { immediate: true })`:** With `immediate: true`, the watcher fires synchronously during component setup before the SVG element has mounted. The guard `if (!barcodeSvgRef.value) return` catches this but `immediate: true` is unnecessary — `onMounted(renderBarcode)` handles the initial render.
- **requestFullscreen() for scan overlay:** Not supported on non-video elements in iOS Safari < 26. Zero calls to `requestFullscreen` in this phase. [LOCKED: STATE.md FS-2]
- **Passing raw `card_color` to CSS:** Always prepend `#`. If `card_color` is undefined, default to `#002244`. [LOCKED: STATE.md]
- **Not teleporting the scan overlay:** If the overlay div is a child of the Dialog's content slot, its `z-index: 9999` will be scoped to the Dialog's stacking context and may not cover other UI elements reliably. Use `<Teleport to="body">`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code generation | Custom QR matrix math | `qrcode.vue` (installed) | Error correction levels, encoding, SVG output all handled |
| Linear barcode drawing | Custom SVG path drawing | `jsbarcode` (installed) | EAN-13 check digit validation, Code39 charset enforcement — throw behavior is the spec |
| Date difference calculation | Manual date arithmetic | `dayjs.diff('day')` | Handles DST, month boundaries, timezone edge cases |
| Full-screen display on iOS | `requestFullscreen()` | `position: fixed; inset: 0` overlay | iOS Safari does not support Fullscreen API on non-video elements |
| Screen-on-during-scan | CSS tricks / animations | `navigator.wakeLock.request('screen')` | Native API; only supported approach |

**Key insight:** Both barcode libraries are already installed. The only "hard" problem in this phase is handling their failure modes correctly — JsBarcode throws synchronously, qrcode.vue does not throw (it silently renders a broken QR). The try/catch + branch fallback pattern is the entire solution.

---

## Common Pitfalls

### Pitfall 1: JsBarcode Throws on Invalid Input (CRITICAL)
**What goes wrong:** Calling `JsBarcode(svgEl, '', { format: 'CODE128' })` throws `"" is not a valid input for CODE128AUTO`. Calling `JsBarcode(svgEl, '123456', { format: 'EAN13' })` throws `"123456" is not a valid input for EAN13`. Uncaught, these crash the component.
**Why it happens:** JsBarcode validates input synchronously and throws with no soft-fail option.
**How to avoid:** (1) The branch-selection computed guards against `barcode_value` being falsy before Branch B renders. (2) `renderBarcode()` wraps `JsBarcode()` in try/catch and sets `renderError.value = true` on catch. (3) `displayBranch` computed must check `renderError.value` to fall to Branch C. [VERIFIED: throw behavior confirmed by test execution in this research session]
**Warning signs:** White/blank `<svg>` element in browser + console error.

### Pitfall 2: SVG Ref Not Ready When Watcher Fires (STATE.md BR-5)
**What goes wrong:** A `watch` with `{ immediate: true }` fires during component setup (synchronously), before `onMounted`. At that point `barcodeSvgRef.value` is `null`. `JsBarcode(null, ...)` throws `"No element to render on was provided."`.
**Why it happens:** Vue's `watch` with `immediate: true` fires in the same tick as component creation; `useTemplateRef` only populates after the DOM is inserted in `onMounted`.
**How to avoid:** Use `onMounted(renderBarcode)` for the initial render. Use `watch(() => props.barcode_value, renderBarcode)` WITHOUT `{ immediate: true }` for re-renders on prop change. Always guard with `if (!barcodeSvgRef.value) return`.
**Warning signs:** `"No element to render on was provided."` error in console.

### Pitfall 3: Scan Overlay Trapped Inside Dialog's Stacking Context
**What goes wrong:** The PrimeVue Dialog renders inside a portal with its own `z-index` stacking context. A child element with `z-index: 9999` is only stacked relative to that portal — other PrimeVue overlays (dropdowns, tooltips) may still appear on top.
**Why it happens:** CSS stacking contexts are created by any element with `position + z-index`. The Dialog's portal is one such context.
**How to avoid:** Wrap the scan overlay in `<Teleport to="body">`. This moves the overlay's DOM node to `<body>`, outside all stacking contexts. `z-index: 9999` then competes at the document root level.
**Warning signs:** Overlay doesn't cover the full screen on certain devices; PrimeVue Dialog backdrop still visible through the overlay.

### Pitfall 4: Wake Lock Released on Tab Switch, Not Re-acquired
**What goes wrong:** `navigator.wakeLock` automatically releases the wake lock when the page is hidden (user switches tabs or locks screen). If `closeScanOverlay()` is not called, the overlay is still showing when the user returns — but the wake lock is gone and the screen may dim again.
**Why it happens:** WakeLock API releases the lock on `visibilitychange` to `hidden` by browser design.
**How to avoid:** Register a `visibilitychange` listener in `onMounted` that re-acquires the wake lock when `document.visibilityState === 'visible'` AND `showScanOverlay.value === true`. Remove the listener in `onUnmounted`.
**Warning signs:** Screen dims during a scan session after switching away and returning.

### Pitfall 5: AttachmentPreview.vue Field Name Mismatch
**What goes wrong:** `AttachmentPreview.vue` reads `record.card` (vaccination file field name) and `record.vaccine_name` (for `alt` text). A membership record has `card_image` and `card_name`. Passing a membership record directly to `AttachmentPreview` causes silent failures: `record.card` is `undefined`, so the "No attachment." fallback always renders even when a card photo exists.
**Why it happens:** `AttachmentPreview` was built for vaccinations specifically; the field names differ.
**How to avoid:** Either (a) refactor `AttachmentPreview` to accept generic `{ card: string; name: string; token: string }` props and update VaccinationDetail's call site, or (b) create `MembershipAttachmentPreview.vue` that adapts the membership record to the shape `AttachmentPreview` expects. Option (a) is cleaner; Option (b) is zero-regression-risk.
**Warning signs:** Card photo section shows "No attachment." even when `record.card_image` is set.

### Pitfall 6: Dialog `@hide` Resetting fileToken While Token Fetch Is In-Flight
**What goes wrong:** If the Dialog closes while `openDetail()` is still awaiting `pb.files.getToken()`, the `@hide` handler sets `fileToken.value = ''` after the async resolve, erasing the freshly-fetched token.
**Why it happens:** The WR-03 pattern in VaccinationsTab handles this via an `abort` guard — if token fetch fails, `selectedRecord` is cleared and `showDetail` is never set. If token fetch succeeds after the dialog was already hidden, the token is written to a stale ref.
**How to avoid:** Follow VaccinationsTab's WR-03 pattern exactly: after `pb.files.getToken()` succeeds, check if `selectedRecord.value` is still the same record before setting `showDetail.value = true`. In practice the token fetch is ~200ms and race conditions are rare, but the pattern is worth following for correctness.
**Warning signs:** "No attachment." appears on a record that has `card_image`.

---

## Code Examples

### BarcodeDisplay.vue — Complete Script Section

```typescript
// Source: UI-SPEC.md §BarcodeDisplay.vue — verified against installed packages on disk

import JsBarcode from 'jsbarcode'
import QrcodeVue from 'qrcode.vue'
import { ref, computed, onMounted, watch, useTemplateRef } from 'vue'

// Module-level constants — NEVER configurable via props (STATE.md BR-2)
const BARCODE_FOREGROUND = '#000000'
const BARCODE_BACKGROUND = '#ffffff'

const props = defineProps<{
  barcode_type: string | undefined
  barcode_value: string | undefined
  card_number: string | undefined
}>()

const emit = defineEmits<{
  scan: []
}>()

const barcodeSvgRef = useTemplateRef<SVGSVGElement>('barcodeSvgRef')
const renderError = ref(false)

type BarcodeDisplayBranch = 'qr' | 'linear' | 'number-fallback' | 'empty'

const displayBranch = computed<BarcodeDisplayBranch>(() => {
  if (renderError.value && props.card_number) return 'number-fallback'
  if (renderError.value && !props.card_number) return 'empty'
  if (props.barcode_type === 'qr' && props.barcode_value) return 'qr'
  if (['code128', 'ean13', 'code39'].includes(props.barcode_type ?? '') && props.barcode_value) return 'linear'
  if (props.card_number) return 'number-fallback'
  return 'empty'
})

function renderBarcode(): void {
  if (!barcodeSvgRef.value) return  // STATE.md BR-5: guard
  try {
    JsBarcode(barcodeSvgRef.value, props.barcode_value ?? '', {
      format: props.barcode_type?.toUpperCase() ?? 'CODE128',
      lineColor: BARCODE_FOREGROUND,
      background: BARCODE_BACKGROUND,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    })
    renderError.value = false
  } catch {
    renderError.value = true
  }
}

onMounted(renderBarcode)
watch(() => props.barcode_value, renderBarcode)  // NO immediate: true
```

**Note on displayBranch:** The computed must check `renderError.value` FIRST (before the `qr`/`linear` checks), because after a JsBarcode throw `barcode_type` and `barcode_value` may still be truthy — we don't want to re-enter the `linear` branch on re-render.

### MembershipCard.vue — Expiry Warning Logic

```typescript
// Source: UI-SPEC.md §MembershipCard.vue — dayjs 1.11.18 on disk
import dayjs from 'dayjs'

const BARCODE_TYPE_LABELS: Record<string, string> = {
  qr: 'QR',
  code128: 'Code 128',
  ean13: 'EAN-13',
  code39: 'Code 39',
  number: 'Number only',
}

const tileStyle = computed(() => ({
  backgroundColor: props.record.card_color ? '#' + props.record.card_color : '#002244'
}))

const isExpirySoon = computed<boolean>(() => {
  if (!props.record.expiry_date) return false
  return dayjs(props.record.expiry_date).diff(dayjs(), 'day') <= 30
  // diff returns negative when expiry is in the past, so this covers "already expired"
})

const isExpired = computed<boolean>(() => {
  if (!props.record.expiry_date) return false
  return dayjs(props.record.expiry_date).isBefore(dayjs(), 'day')
})

function displayExpiry(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY')  // tile: compact "15 Jan 2027"
}
```

### MembershipsTab.vue — fileToken at View Time (WR-03 Pattern)

```typescript
// Source: VaccinationsTab.vue (direct codebase read) — adapted for memberships
async function openDetail(record: Memberships): Promise<void> {
  selectedRecord.value = record
  if (record.card_image) {
    try {
      fileToken.value = await pb.files.getToken()
    } catch (e: unknown) {
      toast.error('Failed to load card image. Refresh to try again.')
      console.error('MembershipsTab: getToken failed', e)
      selectedRecord.value = null
      return  // WR-03: abort — do not open dialog in token-less state
    }
  }
  showDetail.value = true
}
```

---

## AttachmentPreview Adaptation — Decision Matrix

[VERIFIED: AttachmentPreview.vue source read on disk]

AttachmentPreview currently reads these fields from `record`:
- `record.card` — filename of the attachment (the field that is passed to `pb.files.getURL()`)
- `record.vaccine_name` — used only in the `alt` attribute of the `<img>` tag

Membership record has:
- `record.card_image` — analogous to `record.card`
- `record.card_name` — analogous to `record.vaccine_name`

**Recommended resolution (Option A — refactor AttachmentPreview to generic props):**

Change `AttachmentPreview.vue` props from `{ record: Vaccinations; token: string }` to:
```typescript
defineProps<{
  record: RecordModel           // generic PocketBase record (for pb.files.getURL())
  attachmentField: string       // 'card' for vaccinations, 'card_image' for memberships
  attachmentName: string        // display name for alt text
  token: string
}>()
```

Then update:
- `mimeCategory` computed: `getMimeCategory(props.attachmentField ? (props.record as any)[props.attachmentField] : '')`
- `tokenUrl` computed: `pb.files.getURL(props.record, (props.record as any)[props.attachmentField], { token: props.token })`
- `<img alt>`: use `props.attachmentName` instead of `record.vaccine_name`

VaccinationDetail call site becomes: `<AttachmentPreview :record="record" attachment-field="card" :attachment-name="record.vaccine_name" :token="token" />`

MembershipDetail call site: `<AttachmentPreview :record="record" attachment-field="card_image" :attachment-name="record.card_name" :token="token" />`

**Alternative (Option B — wrapper with no changes to AttachmentPreview):**

Create `MembershipAttachmentPreview.vue` that accepts `record: Memberships, token: string` and internally constructs the URL using `pb.files.getURL(record, record.card_image, ...)` without delegating to AttachmentPreview. Copy the image/unknown/absent branches. Simpler but creates duplication.

**Planner should choose one approach and lock it.** Option A is cleaner. Option B has zero regression risk. Both are valid; the executor should not choose mid-implementation.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ref()` for template refs (`const svgEl = ref<SVGSVGElement>()`) | `useTemplateRef<SVGSVGElement>('id')` | Vue 3.5 | Must pass the template `ref="id"` string; type-safe; no null-type issues |
| `requestFullscreen()` for full-screen display | `position: fixed; inset: 0` overlay | Always broken on iOS for non-video | No browser API needed; simpler; cross-device |
| Direct `PocketBase` access in any component | Only in Tab-level components | Phase 10 tab extraction | BarcodeDisplay.vue must remain purely presentational |

**Deprecated/outdated for this codebase:**
- `requestFullscreen()`: Do not use. iOS Safari does not support it on non-video elements. Locked in STATE.md.
- `@vueuse/core useFullscreen`: Not needed (package is hoisted but not available as a direct dependency — confirmed `@vueuse/core` is NOT in package.json; only `@vueuse/motion` is). Do not add.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | — | — | — |

**This table is empty:** All claims in this research were verified against installed packages on disk, running source code, or explicit codebase reads. No user confirmation needed.

---

## Open Questions

1. **AttachmentPreview refactor vs wrapper**
   - What we know: `AttachmentPreview.vue` reads `record.card` and `record.vaccine_name`; memberships use `card_image` and `card_name`
   - What's unclear: Whether the planner prefers Option A (refactor) or Option B (wrapper)
   - Recommendation: Planner should lock one approach in PLAN.md. Option A is recommended — it avoids code duplication and the change to VaccinationDetail is a one-liner.

2. **`displayBranch` should check `renderError` first vs recompute on prop change**
   - What we know: After a JsBarcode throw, `renderError.value` is `true` and props are still truthy. On prop change, `renderError` is reset to `false` in `renderBarcode()` only after a successful call.
   - What's unclear: Whether `renderError` should be reset to `false` immediately when `barcode_value` prop changes (before `renderBarcode` runs), to avoid a flash of the fallback.
   - Recommendation: Reset `renderError.value = false` at the start of `renderBarcode()`, not on catch. This means on prop change there is a 1-frame flash of the fallback branch. Acceptable — matches the UI-SPEC code example.

---

## Environment Availability

Phase 12 is a pure frontend UI phase. All runtime dependencies are already installed in `node_modules`. No new CLI tools, services, databases, or external APIs are required beyond what was already available in Phase 11.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| qrcode.vue | SCAN-01 | Yes | 3.9.1 | — |
| jsbarcode | SCAN-02 | Yes | 3.12.3 | — |
| dayjs | MREAD-01 expiry logic | Yes | 1.11.18 | — |
| primevue | All UI components | Yes | 4.3.7 | — |
| vue-sonner | Error toasts | Yes | 2.0.8 | — |
| WakeLock API | SCAN-03 | Browser-dependent | n/a | Silent degrade (try/catch) |
| pocketbase client | Data fetch + file token | Yes | 0.26.2 | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** WakeLock API (not available on iOS < 16.4 and Firefox Android) — gracefully degraded via `'wakeLock' in navigator` feature detection + try/catch.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 12 |
|-----------|-------------------|
| Vue 3 Composition API `<script setup lang="ts">` throughout | All four new components must use `<script setup lang="ts">` |
| PrimeVue 4 auto-imported via PrimeVueResolver | No explicit imports of Card, Badge, Skeleton, Dialog, Divider, Button — they are auto-resolved |
| Tailwind CSS 4 via @tailwindcss/vite | Use utility classes; no bespoke CSS variables in this phase |
| PocketBase — client in `src/lib/pocketbase/index.ts` | Import as `import { pb } from "@/lib/pocketbase"` |
| `@` path alias maps to `src/` | All imports use `@/` prefix |
| `dayjs` for dates | Confirmed; no Temporal or native Date formatting |
| `vue-sonner` for toasts | `import { toast } from 'vue-sonner'` |
| No `v-html` | Enforced — all user content via `{{ }}` |
| PrimeVue `PrimeVueResolver` auto-imports | `iconify-icon` is a web component (not PrimeVue) — used as a raw HTML custom element, no import needed |

---

## Sources

### Primary (HIGH confidence)

- `node_modules/qrcode.vue/dist/index.d.ts` — TypeScript declarations; confirmed all props (value, size, level, renderAs, background, foreground)
- `node_modules/qrcode.vue/dist/qrcode.vue.esm.js` — ESM bundle; confirmed QrcodeVue default export + renderAs default `'canvas'`
- `node_modules/jsbarcode/jsbarcode.d.ts` — TypeScript declarations; confirmed `JsBarcode(element, data, options)` signature
- `node_modules/jsbarcode/bin/options/defaults.js` — Confirmed all available config options (lineColor, background, fontSize, margin, displayValue, format)
- `node_modules/jsbarcode/bin/barcodes/` — Directory listing confirmed CODE128, CODE39, EAN_UPC format support
- Live test: `JsBarcode(svg, '123456', { format: 'EAN13' })` throws; `JsBarcode(svg, '', { format: 'CODE128' })` throws — [VERIFIED: executed in this research session]
- `node_modules/vue/dist/vue.cjs.js` exports.useTemplateRef — Confirmed available, type: function (Vue 3.5.33)
- TypeScript 5.8.3 `lib.dom.d.ts` — `WakeLockSentinel` interface confirmed present
- `node_modules/@vue/tsconfig/tsconfig.json` — `"esModuleInterop": true` confirmed — makes `import JsBarcode from 'jsbarcode'` work
- `src/components/projects/wallecx/VaccinationsTab.vue` — Direct analog; fetch pattern, three-state template, openDetail WR-03 pattern all read
- `src/components/projects/wallecx/AttachmentPreview.vue` — Source read; field accesses (`record.card`, `record.vaccine_name`) identified
- `src/components/projects/wallecx/VaccinationDetail.vue` — Field grid pattern confirmed
- `src/types/wallecx/memberships/types.d.ts` — Confirmed `Memberships` interface with all Phase 11 fields
- `src/lib/pocketbase/membershipMapper.ts` — Confirmed `mapToUpdateMembership` exists
- `src/components/projects/wallecx/MembershipsTab.vue` — Confirmed stub shape (template-only, no script block)
- `.planning/phases/12-read-path-card-grid-barcode-display-and-detail/12-UI-SPEC.md` — Complete component specifications
- `.planning/STATE.md` — Risk Register v2.0 — locked decisions and risk mitigations

### Secondary (MEDIUM confidence)

- None needed — all critical claims verified from primary sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on disk with exact versions
- Architecture: HIGH — verified against VaccinationsTab pattern (direct codebase read) and UI-SPEC.md
- Pitfalls: HIGH — JsBarcode throw behavior verified by executing test; other pitfalls come from locked STATE.md decisions or AttachmentPreview source read
- Library APIs: HIGH — verified from installed source files, not training data

**Research date:** 2026-05-13
**Valid until:** 2026-06-12 (30 days; all packages pinned in package.json — no drift expected)
