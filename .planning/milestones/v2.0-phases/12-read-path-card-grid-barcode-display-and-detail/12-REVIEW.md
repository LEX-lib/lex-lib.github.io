---
phase: 12-read-path-card-grid-barcode-display-and-detail
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/projects/wallecx/AttachmentPreview.vue
  - src/components/projects/wallecx/BarcodeDisplay.vue
  - src/components/projects/wallecx/MembershipCard.vue
  - src/components/projects/wallecx/MembershipDetail.vue
  - src/components/projects/wallecx/MembershipsTab.vue
  - src/components/projects/wallecx/VaccinationDetail.vue
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-05-13T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files implementing the Wallecx v2.0 Read Path were reviewed: the attachment preview component, barcode/QR renderer, membership card tile, membership and vaccination detail panels, and the memberships tab container. No critical security vulnerabilities were found. XSS vectors are absent throughout — all user-controlled fields are rendered via text interpolation (`{{ }}`), notes use `whitespace-pre-wrap` (not `v-html`), and `innerHTML` / `eval` are not used anywhere.

Four warnings were found: a CSS injection vector via an unvalidated `card_color` value, a stale watch dependency in `BarcodeDisplay` (only `barcode_value` is watched, but a `barcode_type` change alone can make a currently-rendered barcode wrong without re-rendering), a potential wake-lock leak when `MembershipDetail` is unmounted while the scan overlay is open, and a `VaccinationDetail` crash risk when `date_administered` is an empty string.

Three info items were found: a duplicated `BARCODE_TYPE_LABELS` map across `MembershipCard` and `MembershipDetail`, a redundant double-check badge rendering pattern in `MembershipCard`, and an unnecessary `console.log`-class debug path reachable in production.

---

## Warnings

### WR-01: CSS injection via unvalidated `card_color` in MembershipCard and MembershipDetail

**Files:**
- `src/components/projects/wallecx/MembershipCard.vue:15`
- `src/components/projects/wallecx/MembershipDetail.vue:99`

**Issue:** `card_color` is a PocketBase string field. The value is concatenated directly after `#` and set as a CSS `backgroundColor` style without any sanitisation or format validation. A value such as `red; font-size: 9999px` (or a value containing CSS escape sequences) would be injected verbatim into the element's inline style. While Vue 3's style binding sanitises some obvious injection patterns, CSS property-value injection via inline `style` objects is not fully neutralised by Vue — only `:style` attribute-level URL injection (`javascript:`) is blocked. A malformed `card_color` from the database would at minimum break rendering; a crafted value could inject unexpected CSS into the card tile's background-color context.

**Fix:** Validate that `card_color` is a 3- or 6-character hex string before use. Extract a shared utility and apply it in both components:

```typescript
// src/lib/wallecx/colorUtils.ts
const HEX_COLOR_RE = /^[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/

export function safeHexColor(raw: string | undefined, fallback: string): string {
  return raw && HEX_COLOR_RE.test(raw) ? '#' + raw : fallback
}
```

```typescript
// MembershipCard.vue — tileStyle computed
const tileStyle = computed(() => ({
  backgroundColor: safeHexColor(props.record.card_color, '#002244')
}))
```

```html
<!-- MembershipDetail.vue line 99 -->
<span
  class="inline-block w-4 h-4 rounded"
  :style="{ backgroundColor: safeHexColor(record.card_color, 'transparent') }"
></span>
```

---

### WR-02: `BarcodeDisplay` watch only tracks `barcode_value` — `barcode_type` change silently renders a stale barcode

**File:** `src/components/projects/wallecx/BarcodeDisplay.vue:54`

**Issue:** The watcher that triggers `renderBarcode` only observes `props.barcode_value`:

```typescript
watch(() => props.barcode_value, renderBarcode)
```

If a parent updates `barcode_type` (e.g. `code128` → `ean13`) while `barcode_value` stays the same, `renderBarcode` is never called. The SVG retains the stale `CODE128` rendering, and the `displayBranch` computed will re-evaluate to `linear` (the branch is already showing) so no re-mount occurs. The barcode displayed will be the wrong format. This is not a concern in Phase 12's read-only view since both props come from the same immutable record, but it becomes a correctness bug the moment an edit path (Phase 13) passes props from a live form.

**Fix:** Expand the watch to a multi-source form:

```typescript
watch(
  [() => props.barcode_value, () => props.barcode_type],
  renderBarcode
)
```

---

### WR-03: Wake lock leaked when `MembershipDetail` is unmounted with the scan overlay open

**File:** `src/components/projects/wallecx/MembershipDetail.vue:64-65`

**Issue:** `onUnmounted` removes the `visibilitychange` listener but does not release the wake lock. If the Dialog is closed programmatically (e.g. route navigation, parent `v-if` toggle) while `showScanOverlay.value` is `true`, `closeScanOverlay` is never called and `wakeLock.value?.release()` is never awaited. The browser wake lock sentinel is left active until the page is unloaded.

**Fix:** Add a cleanup hook that mirrors `closeScanOverlay`:

```typescript
onUnmounted(async () => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  // Release wake lock if component is torn down while overlay is still open
  if (wakeLock.value) {
    try {
      await wakeLock.value.release()
    } catch { /* ignore */ }
    wakeLock.value = null
  }
})
```

---

### WR-04: `VaccinationDetail` crashes when `date_administered` is an empty string

**File:** `src/components/projects/wallecx/VaccinationDetail.vue:25`

**Issue:** The `Vaccinations` type declares `date_administered: string` as non-optional. However, if a record is saved with an empty string (possible if PocketBase validation is misconfigured or data is migrated), `dayjs('').format('DD MMMM YYYY')` returns `'Invalid Date'` — it does not throw, but this is a user-visible string rendered to the UI with no fallback. Separately, if the value is ever `undefined` at runtime (type cast from an untyped PocketBase response), the call still renders `'Invalid Date'` rather than a graceful `'—'`.

**Fix:** Add a guard in `displayDate`:

```typescript
function displayDate(iso: string): string {
  if (!iso) return '—'
  const d = dayjs(iso)
  return d.isValid() ? d.format('DD MMMM YYYY') : '—'
}
```

---

## Info

### IN-01: `BARCODE_TYPE_LABELS` map is duplicated across `MembershipCard` and `MembershipDetail`

**Files:**
- `src/components/projects/wallecx/MembershipCard.vue:35-41`
- `src/components/projects/wallecx/MembershipDetail.vue:14-21`

**Issue:** The same `Record<string, string>` constant with identical keys and values is defined in two components. When a new barcode type is added, both files must be updated in sync.

**Fix:** Extract to a shared constant, e.g. `src/constants/wallecx/barcodeTypeLabels.ts`, and import from both components.

---

### IN-02: Redundant dual-badge condition in `MembershipCard`

**File:** `src/components/projects/wallecx/MembershipCard.vue:73-83`

**Issue:** The badge rendering uses two mutually exclusive `v-if` / `v-else-if` branches that produce the same output (both render `<Badge value="..." severity="secondary" />`). The `v-else-if` branch for `barcode_type === 'number'` is dead — `'number'` is a valid truthy value and would always be caught by the first branch's `record.barcode_type && record.barcode_type !== 'number'` guard (inverted). However, when `barcode_type === 'number'`, the first branch's `v-if` is `false`, so the `v-else-if` correctly fires. The logic is correct but confusing. Both branches produce a `severity="secondary"` badge; the value text differs only by source (`barcodeTypeLabel` vs hardcoded `'Number only'`). Since `BARCODE_TYPE_LABELS['number']` already maps to `'Number only'`, the `v-else-if` branch is redundant.

**Fix:** Collapse into a single conditional:

```html
<Badge
  v-if="record.barcode_type"
  :value="barcodeTypeLabel"
  severity="secondary"
  class="text-xs"
/>
```

---

### IN-03: `console.error` calls in `MembershipsTab` are reachable in production

**File:** `src/components/projects/wallecx/MembershipsTab.vue:26,42`

**Issue:** Both error paths (`getFullList` failure and `getToken` failure) call `console.error(...)` with diagnostic detail. These are intentional for development debugging, but they remain active in the production build with no build-time stripping. This is a minor information-disclosure issue in a personal portfolio context.

**Fix:** Either accept this as a deliberate choice (low risk in a personal app) or wrap in an `import.meta.env.DEV` guard:

```typescript
if (import.meta.env.DEV) {
  console.error('MembershipsTab: getFullList failed', e)
}
```

---

_Reviewed: 2026-05-13T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
