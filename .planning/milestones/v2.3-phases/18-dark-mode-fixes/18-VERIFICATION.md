---
phase: 18-dark-mode-fixes
verified: 2026-05-18T00:00:00Z
status: human_needed
score: 5/5 code-level must-haves verified (visual UAT outstanding)
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "DARK-01 — vaccination group grid + membership tile grid in dark mode"
    expected: "No white card faces; tiles preserve user card_color with luminance-aware foreground"
    why_human: "Visual rendering of dark palette across the grid; UAT-driven per D-10/D-11"
  - test: "DARK-02 — ManageVaccination, ManageMembership, VaccinationGroupPanel (drawer + bottom sheet), MembershipDetail (dialog + bottom sheet) in dark mode"
    expected: "Dark surfaces, dark form inputs, legible labels, no light-mode bleed; drag pill bg-gray-600"
    why_human: "Teleported PrimeVue DOM rendered in dark mode — visual confirmation only"
  - test: "DARK-03 — scan overlay + BarcodeDisplay BR-2 invariant"
    expected: "Surrounding chrome dark; barcode itself remains black-on-white in both themes (BR-2)"
    why_human: "Visual rendering of overlay + locked black-on-white barcode invariant"
  - test: "Full 15-component Wallecx sweep (D-10) at desktop + 375px mobile"
    expected: "All 15 components render correctly in both light and dark modes; no peripheral bleed"
    why_human: "Visual sweep per UAT checklist; cannot be automated"
---

# Phase 18: Dark Mode Fixes Verification Report

**Phase Goal:** Every Wallecx surface — card grids, dialogs, the group detail panel, the scan overlay, and BarcodeDisplay — renders with the correct dark palette when the `my-app-dark` class is active; no PrimeVue #7465 light-mode bleed is visible.

**Verified:** 2026-05-18
**Status:** human_needed (code-level prerequisites all PASS; visual UAT required per D-10/D-11)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (code-level prerequisites)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `src/assets/base.css` contains the canonical `@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));` rule positioned AFTER `@import "tailwindcss";` (Tailwind v4 requirement) — DARK-01/02/03 root fix | PASS | base.css line 1 = `@import "tailwindcss";`, line 3 = `@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));`, line 5 = `@theme {`. Exact text matches D-01 specification. |
| 2 | `MembershipCard.vue` defines `pickTextColor(hex: string): string` using WCAG sRGB linearization with 0.2126/0.7152/0.0722 coefficients, threshold 0.5, returning `#0d1117` or `#ffffff`. Helper strips `#` and lowercases input. | PASS | MembershipCard.vue lines 18-26 contain the helper. Lines 19 (`hex.replace('#', '').toLowerCase()`), 23 (gamma 2.4 linearization), 24 (`0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)`), 25 (`L > 0.5 ? '#0d1117' : '#ffffff'`) all present. |
| 3 | `tileStyle` computed in MembershipCard returns `{ backgroundColor, color }`; previously hardcoded white inline styles refactored to bind `cardTextColor`. | PASS | Lines 33-36: `tileStyle` returns both `backgroundColor: cardBg.value` and `color: cardTextColor.value`. Template lines 81, 86, 108 all use `:style="{ color: cardTextColor, ... }"`. Grep for the three hardcoded white styles (`style="color: #ffffff;"`, rgba 0.75, rgba 0.85) returns no matches. |
| 4 | `MembershipDetail.vue` UNCHANGED — Case A audit confirmed (card_color only rendered as 4×4 swatch, no text on card_color background). | PASS | `git diff --name-only be4e6ad^..d3e508b` does NOT include MembershipDetail.vue. The 4×4 swatch (lines 102-107) is preserved verbatim with `inline-block w-4 h-4 rounded` + `backgroundColor: '#' + record.card_color`. |
| 5 | `BarcodeDisplay.vue` UNCHANGED (BR-2 invariant); `src/main.ts` UNCHANGED (darkModeSelector already correct). | PASS | Neither file appears in `git diff --name-only` across phase commits `be4e6ad^..d3e508b`. `BarcodeDisplay.vue` still defines `const BARCODE_FOREGROUND = '#000000'` (line 7) and `const BARCODE_BACKGROUND = '#ffffff'` (line 8). `src/main.ts:89` still reads `darkModeSelector: ".my-app-dark"`. |

**Score:** 5/5 code-level must-haves verified. Visual rendering of dark palette across all surfaces requires human UAT per D-10/D-11.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/assets/base.css` | Contains `@custom-variant dark` rule positioned after `@import "tailwindcss";` | VERIFIED | Exact rule present on line 3; positioned between `@import` (line 1) and `@theme` (line 5). |
| `src/components/projects/wallecx/MembershipCard.vue` | Contains `pickTextColor` helper; `tileStyle` includes `color:` | VERIFIED | Helper at lines 18-26; `tileStyle` at lines 33-36 emits `color: cardTextColor.value`. Template bindings at lines 81, 86, 108. |
| `src/components/projects/wallecx/MembershipDetail.vue` | Either applies helper OR documents Case A swatch-only audit | VERIFIED (Case A) | SUMMARY documents Case A. File unchanged. Swatch preserved (lines 102-107). |
| `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md` | Tester-facing full Wallecx sweep checklist with DevTools toggle + DARK-01/02/03 scenarios + BR-2 callout + failure-mode catalog + mobile 375px coverage | VERIFIED | All required strings present (41 hits across `my-app-dark`, `DARK-01`, `DARK-02`, `DARK-03`, `BarcodeDisplay`, `black-on-white`, `bottom sheet`, `375px`). All 15 Wallecx components enumerated in §3 sweep table. §8 failure-mode catalog present. §1 DevTools toggle instructions present. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/assets/base.css` | Tailwind v4 utility resolver | `@custom-variant dark` rule | WIRED | Pattern `@custom-variant\s+dark\s+\(&:where\(\.my-app-dark` matches line 3. `npm run build-only` exits 0 → Tailwind v4 accepted the rule. |
| `MembershipCard.vue` tile root | `tileStyle` computed | `:style="[tileStyle, { minHeight: '8rem' }]"` on Card element | WIRED | Template line 76 binds `tileStyle`; computed returns `{ backgroundColor, color }`. Three text rows additionally bind `:style="{ color: cardTextColor, ... }"` (lines 81, 86, 108). |
| `MembershipCard.vue` `cardTextColor` | `pickTextColor` helper | `computed(() => pickTextColor(cardBg.value))` | WIRED | Line 31 wires the helper to the computed; `cardBg` (line 28-30) feeds it. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `MembershipCard.vue` | `cardTextColor` | `pickTextColor(cardBg.value)` where `cardBg = '#' + props.record.card_color || '#002244'` | YES — derived from prop, never empty | FLOWING |
| `MembershipCard.vue` | `tileStyle` | composed of `cardBg` + `cardTextColor` | YES — both inputs are non-empty | FLOWING |
| `base.css` `@custom-variant` | n/a (CSS rule, not runtime data) | Tailwind v4 build pipeline | YES — build succeeded | FLOWING |

No hollow props or static fallbacks. The helper produces real WCAG-derived values from every input.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Tailwind v4 accepts `@custom-variant` rule | `npm run build-only` | exit 0; PWA bundle generated; 56 precache entries | PASS |
| Vue + TS type-check passes | `npm run type-check` | exit 0 (no output, no errors) | PASS |
| Helper compiles into output bundle | Build output `WallecxApp-uXkB66yt.js` 184.36 kB present | PASS | PASS |
| Anti-regression: phase commits did NOT modify locked files | `git log --diff-filter=M be4e6ad^..d3e508b -- src/main.ts BarcodeDisplay.vue MembershipDetail.vue wallecx-overrides.css` | empty output (no modifications) | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DARK-01 | 18-01-PLAN | Card grids dark-correctly | CODE-PASS / UAT-PENDING | `@custom-variant dark` activates `dark:bg-surface-*` / `dark:bg-gray-600` utilities used in VaccinationsTab/MembershipsTab/VaccinationGroupPanel. Luminance helper closes the residual MembershipCard tile contrast issue. Visual confirmation required. |
| DARK-02 | 18-01-PLAN | Dialogs + group detail render correctly | CODE-PASS / UAT-PENDING | Root-fix variant alignment activates all existing `dark:` utilities including drag-pill `dark:bg-gray-600`. Targeted overrides intentionally deferred per D-03 (UAT-driven follow-up). |
| DARK-03 | 18-01-PLAN | Scan overlay + BarcodeDisplay | CODE-PASS / UAT-PENDING | BarcodeDisplay BR-2 invariant preserved (constants unchanged). Overlay chrome benefits from root-fix variant alignment. |

No orphaned requirements.

---

### Anti-Pattern Scan

Files modified: `src/assets/base.css`, `src/components/projects/wallecx/MembershipCard.vue`, `.planning/phases/18-dark-mode-fixes/18-HUMAN-UAT.md`.

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/assets/base.css` | No TODOs/placeholders/stubs | n/a | Clean |
| `MembershipCard.vue` | No TODOs/placeholders/stubs; helper has clear docstring; bindings flow from real props | n/a | Clean |
| `18-HUMAN-UAT.md` | Template placeholders present (`_______`) — INTENDED (UAT sign-off fields) | INFO | Expected — this is a tester-facing form |

---

### Anti-Regression Checks (BLOCKERS if violated)

| Check | Status | Evidence |
|-------|--------|----------|
| `src/main.ts` NOT modified in phase commits | PASS | Not in `git diff --name-only be4e6ad^..d3e508b`. Line 89 still has `darkModeSelector: ".my-app-dark"`. |
| `src/components/projects/wallecx/BarcodeDisplay.vue` NOT modified (BR-2 invariant) | PASS | Not in phase diff. Constants `BARCODE_FOREGROUND = '#000000'` (line 7) and `BARCODE_BACKGROUND = '#ffffff'` (line 8) intact. |
| `src/components/projects/wallecx/MembershipDetail.vue` NOT modified (Case A audit) | PASS | Not in phase diff. 4×4 swatch (lines 102-107) preserved verbatim. |
| `src/assets/wallecx-overrides.css` NOT modified pre-emptively (D-03 is UAT-driven) | PASS | Not in phase diff. |

---

### Out-of-Scope Guards (BLOCKERS if violated)

| Guard | Status | Evidence |
|-------|--------|----------|
| `tailwindcss-primeui` package NOT added in this phase | PASS | `grep tailwindcss-primeui package.json` → no matches. |
| No in-app dark-mode toggle code added | PASS | No new UI toggle in any phase commit (only `base.css`, `MembershipCard.vue`, `18-HUMAN-UAT.md`, `18-01-SUMMARY.md` changed). |
| No pre-emptive `.my-app-dark .p-*` rules added to `wallecx-overrides.css` (D-03 is UAT-driven) | PASS | File not modified in phase commits. |

---

### UAT Document Completeness

| Section | Status | Evidence |
|---------|--------|----------|
| §1 DevTools `.my-app-dark` toggle instructions (D-11) | PRESENT | Lines 20-35; explicit instructions to add `class="my-app-dark"` via Elements panel. |
| §3 Full 15-component Wallecx sweep table (D-10) | PRESENT | Lines 59-75: all 15 components enumerated and matched against actual `ls src/components/projects/wallecx/*.vue` (count = 15). |
| §4 DARK-01 scenarios (card grids; pale-yellow vs navy contrast) | PRESENT | Lines 81-101 cover both grids + explicit luminance verification. |
| §5 DARK-02 scenarios (4 dialogs + drawer/bottom sheet + drag pill) | PRESENT | Lines 105-141 cover ManageVaccination, ManageMembership, VaccinationGroupPanel (drawer + bottom sheet), MembershipDetail (dialog + bottom sheet), drag pill D-09. |
| §6 DARK-03 scenarios + BR-2 black-on-white callout (D-07) | PRESENT | Lines 144-155: line 149 is explicit CRITICAL BR-2 callout. |
| Both viewports covered (desktop ≥ 640px + 375px mobile) | PRESENT | §3 has 375px column; §5.3, §5.4 split by ≥ 640px vs < 640px; §7 dedicated mobile sweep at 375px. |
| Failure-mode catalog (what light-mode bleed looks like) | PRESENT | §8 lines 173-187: 8 symptom→cause→diagnostic rows. |

---

## Final Verdict

### Phase Goal Achieved: PARTIAL (pending human visual UAT)

All code-level prerequisites for the phase goal are correctly in place:

1. **Structural root fix (D-01)** — the canonical `@custom-variant dark (&:where(.my-app-dark, .my-app-dark *));` rule is present in `src/assets/base.css` at the correct position (after `@import "tailwindcss";`, before `@theme`). This is the one-line PrimeVue #7465 fix that activates every `dark:` Tailwind utility already present in Wallecx components in lock-step with PrimeVue's existing `darkModeSelector`.
2. **Luminance helper (D-05, D-06)** — `pickTextColor` correctly implements WCAG sRGB linearization (0.2126/0.7152/0.0722 coefficients with gamma-2.4 linearization, threshold 0.5) and is wired through `cardBg` → `cardTextColor` → `tileStyle` + three template bindings. The previously-hardcoded white inline styles are fully removed.
3. **BR-2 invariant preserved (D-07)** — `BarcodeDisplay.vue` is byte-identical pre/post phase. Constants `#000000` / `#ffffff` intact.
4. **Anti-regression invariants** — `src/main.ts`, `BarcodeDisplay.vue`, `MembershipDetail.vue` (Case A), and `wallecx-overrides.css` (D-03 deferred) all untouched.
5. **Out-of-scope guards** — no `tailwindcss-primeui`, no in-app toggle, no pre-emptive override rules added.
6. **Build health** — `npm run type-check` and `npm run build-only` both exit 0; Tailwind v4 accepted the `@custom-variant` rule.
7. **UAT doc (D-10, D-11)** — complete with DevTools toggle, full 15-component sweep table, DARK-01/02/03 scenarios, both viewport coverage, BR-2 critical callout, failure-mode catalog.

Visual confirmation that dark mode actually renders correctly across every Wallecx surface is the explicitly-scoped human UAT step per D-10/D-11. The code is structurally correct — only the visual sweep remains.

---

*Verified: 2026-05-18*
*Verifier: Claude (gsd-verifier)*
