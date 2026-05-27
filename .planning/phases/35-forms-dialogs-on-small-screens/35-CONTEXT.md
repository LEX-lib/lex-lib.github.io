# Phase 35: Forms & Dialogs on Small Screens - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Make all 4 Wallecx Manage dialogs (`ManageExpense`, `ManageBudget`, `ManageMembership`, `ManageVaccination`) genuinely usable on a phone. Delivers: a shared `BaseMobileDialog.vue` wrapper (FD-07), sticky Save/Cancel action bars that stay above the virtual keyboard (LT-08), iOS 16px no-zoom rule (FD-01), per-input `inputmode`/`autocomplete`/`enterkeyhint` (FD-03), full-screen `touchUI` DatePickers on mobile (FD-04), camera capture with gallery fallback (FD-05), focused-input auto-scroll (FD-06), and a dirty-state discard guard (FD-09).

This is the **content/forms** layer — Phase 34 fixed the frame (touch targets, safe-area, sticky chrome, drag handles). Migration order is fixed: ManageExpense → ManageBudget → ManageMembership → ManageVaccination (A-43-2, highest-risk last).

</domain>

<decisions>
## Implementation Decisions

### BaseMobileDialog architecture (FD-07, LT-08)
- **D-35-01:** `BaseMobileDialog.vue` **OWNS the Dialog-vs-Drawer decision.** It internally renders `<Dialog>` (desktop) or bottom `<Drawer>` (mobile) via `useMobileEnv().isMobile`. Each Manage dialog **collapses its Phase-34 `v-if="!isMobile"` / `v-else` branches into ONE `<BaseMobileDialog>` instance** — the form body in a `#default` slot, Save/Cancel in an `#actions` slot.
- **D-35-02:** The form renders **once, inside the slot** (not duplicated per branch). This eliminates the two-`<Form>`-instance duplication Phase 34 introduced (and the drift risk the code review flagged), and keeps the ColorPicker direct-v-model (#8135) and `administeredDate` direct-v-model outside `@primevue/forms` (#8191) bindings **in the child component, untouched** — the wrapper only swaps the shell around the slotted content.
- **D-35-03:** Proposed wrapper contract (planner may refine): `v-model:visible`, `:title`, `:is-dirty`, `:is-saving`, `:show-camera?`; slots `#default` (form body) and `#actions` (Save/Cancel). `<DragHandle>` (mobile `#header`), bottom safe-area inset, sticky action bar, and the dirty-guard are built INTO the wrapper so each dialog stops re-implementing them.
- **D-35-04:** Migrate in the locked order ManageExpense → ManageBudget → ManageMembership → ManageVaccination. ManageMembership (3rd) explicitly re-verifies `card_color` no-hash round-trip + `membershipMapper.spec.ts`; ManageVaccination (last) explicitly preserves the `administeredDate` direct-v-model + the two-`<Form>` → one-`<Form>` collapse.

### Sticky action bar + keyboard avoidance (LT-08, FD-06)
- **D-35-05:** Action bar = **`position: sticky; bottom: 0`** inside the scrollable dialog content, padded by `max(env(safe-area-inset-bottom), …)`. Android (`interactive-widget=resizes-content`, already in index.html) shrinks the viewport so the bar naturally sits above the keyboard. iOS overlays the keyboard — handled by the auto-scroll below.
- **D-35-06:** Focused-input auto-scroll = **`scrollIntoView({ block: 'center' })` on `focusin`** (minimal JS, works both platforms). **Documented fallback:** if iOS testing shows the sticky bar hidden under the overlay keyboard, escalate to a `VisualViewport` resize listener that offsets the bar. Try the simple path first; verify on device (Phase 38).

### Dirty-state discard guard (FD-09)
- **D-35-07:** `isDirty` = **current form values compared against an on-open snapshot** (true "changed", not a touched flag) — no false prompt on an untouched or reverted form.
- **D-35-08:** The **"Discard changes?" `useConfirm` fires only on MOBILE Drawer dismissal** (backdrop-tap / swipe-down / Esc). Desktop `<Dialog>` keeps its current free-dismiss behavior. Save and explicit Cancel bypass the guard.
- **D-35-09:** Reuses the **single shell-level `<ConfirmDialog>`** at WallecxApp.vue (CON-CONFIRMDIALOG-SINGLETON) — no second instance. The guard intercepts dismissal **before** the Drawer closes (block the `update:visible`→false, show confirm, close on accept).

### Camera capture UX (FD-05)
- **D-35-10:** **Two affordances** wherever an image upload already exists: a **"Take photo"** control (`capture="environment"` → rear camera) AND a separate **"Choose from gallery"** control (plain file input, no `capture`). The gallery control is the reliability net for iOS standalone where `capture` can silently fail.
- **D-35-11:** Both feed the **existing EXIF-strip + image-compression/WebP path** (no new pipeline). Applies to **ManageExpense (receipt), ManageVaccination (record image), and ManageMembership (card image) only** — **ManageBudget has no upload, so no camera there.** (Researcher confirms exact upload sites per dialog.)

### iOS no-zoom + input attributes (FD-01, FD-03, FD-04)
- **D-35-12:** FD-01 global rule lands in `wallecx-overrides.css`: `@media (max-width: 640px) { .p-inputtext, .p-inputnumber-input, .p-textarea, .p-select-label, .p-multiselect-label, .p-datepicker-input { font-size: 16px !important } }`. Scope consistent with the Phase-34 overrides idiom; consider `.wallecx-root` scoping if blast radius matters (but inputs are also teleported in overlays — planner decides; 16px on inputs site-wide is benign).
- **D-35-13 (CORRECTED 2026-05-27):** FD-04 — PrimeVue 4.5.5 **dropped the DatePicker `touchUI` prop** (it was a PrimeVue 3 Calendar prop; verified absent in node_modules/primevue/datepicker types + runtime). The locked approach is now **`:inline="isMobile"`** at every DatePicker site (ManageExpense date, ExpensesToolbar From/To, ExpensesReportsView Custom range, ManageVaccination date, ManageMembership expiry): the calendar renders as a large always-visible touch-friendly inline grid on mobile, popup overlay on desktop. Best matches FD-04's "full-screen touch" intent. Preserve the `administeredDate` direct-v-model binding (do NOT fold back into `@primevue/forms`). Inline grid's vertical cost is absorbed by the dialog's own scroll + the sticky action bar (D-35-05).

### Claude's Discretion
- **FD-03 per-field attribute mapping** (mechanical): `inputmode="decimal"` on Amount/budget; `inputmode="numeric"` on card/lot numbers; `autocomplete` per field; `enterkeyhint="next"` on intermediate fields, `enterkeyhint="done"` on the last field. Planner/executor pick exact values per input.
- Exact `BaseMobileDialog` prop names, slot names, and internal markup.
- Whether the sticky action bar needs a top border/shadow separator.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 35: Forms & Dialogs on Small Screens" — goal, 6 success criteria, requirements (LT-08, FD-01/03/04/05/06/07/09), bound NFR/CON (NFR-IOS-NO-ZOOM, NFR-DRAWER-DIRTY-GUARD, CON-CARD-COLOR-NO-HASH, CON-CONFIRMDIALOG-SINGLETON, NFR-BR-2-PRESERVED).
- `.planning/REQUIREMENTS.md` — LT-08 + FD-01..09 full text.
- `.planning/STATE.md` §"Architectural Invariants" — ColorPicker #8135 / card_color no-hash, single ConfirmDialog, BR-2, D-33-01-A administeredDate #8191.

### Phase 34 substrate (just shipped)
- `.planning/phases/34-layout-audit-touch-targets/34-CONTEXT.md` + `34-SUMMARY` files — deferred-to-35 items: dialog sticky-action-bar safe-area insets + overlay-button sizing.
- `src/assets/wallecx-overrides.css` — the non-scoped overrides home (44px floor scoped under `.wallecx-root`, bottom-Drawer `max(env(...),1.25rem)` padding, sticky chrome). FD-01 16px rule lands here.
- `src/components/projects/wallecx/DragHandle.vue` — reused in BaseMobileDialog's mobile `#header`.
- `src/composables/useMobileEnv.ts` — `isMobile` drives the Dialog/Drawer split and `touchUI`.

### Components to migrate (current Dialog/Drawer branch state post-Phase-34)
- `src/components/projects/wallecx/ManageExpense.vue` — reference Dialog/Drawer structure + existing receipt FileUpload + `onHide` reset + EXIF/compression path (the analog for BaseMobileDialog extraction).
- `src/components/projects/wallecx/ManageBudget.vue` — no upload; `onHide` reset added in Phase 34.
- `src/components/projects/wallecx/ManageMembership.vue` — ColorPicker direct-v-model (#8135), card_color no-hash; `membershipMapper.spec.ts` must still pass.
- `src/components/projects/wallecx/ManageVaccination.vue` — `administeredDate` direct-v-model outside `@primevue/forms` (#8191); two `<Form>` instances to collapse to one.
- `src/components/projects/wallecx/WallecxApp.vue` — shell `<ConfirmDialog>` reused by FD-09.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **useMobileEnv()** — `isMobile` for the Dialog/Drawer split + `:touchUI`.
- **DragHandle.vue** (Phase 34) — drop into BaseMobileDialog's mobile header.
- **useConfirm + shell `<ConfirmDialog>`** — already used by the 3 Tab components for delete confirms; FD-09 reuses the same singleton for the discard guard.
- **EXIF-strip + image-compression/WebP path in ManageExpense** — both camera + gallery inputs feed it; no new pipeline.
- **wallecx-overrides.css** — non-scoped overrides file (teleported-DOM safe); FD-01 16px rule + any BaseMobileDialog teleported styling live here.

### Established Patterns
- All 4 dialogs currently use `v-if="!isMobile"` `<Dialog>` / `v-else` `<Drawer position="bottom">` (Phase 34). BaseMobileDialog consolidates this into one slot-based wrapper.
- ColorPicker direct-v-model (#8135) and administeredDate direct-v-model (#8191) live in the child components and must NOT be re-bound through `@primevue/forms`.
- `onHide` reset pattern exists in all 4 dialogs (isSaving / transient state reset).

### Integration Points
- BaseMobileDialog imported by all 4 Manage dialogs.
- FD-01/FD-04 touch ExpensesToolbar + ExpensesReportsView DatePickers too (not just the Manage dialogs).
- Dirty-guard wires into the shell ConfirmDialog via useConfirm.

</code_context>

<specifics>
## Specific Ideas

- "Owns the split" is the explicit choice — one wrapper, form rendered once, branches collapsed. This deliberately consolidates (and improves on) the v-if/v-else branches Phase 34 added as a stepping stone.
- Start with the simplest keyboard strategy (sticky-bottom + scrollIntoView); only escalate to VisualViewport if iOS device testing proves the bar is hidden.
- Camera = two explicit affordances (Take photo / Choose from gallery), not one combined control — iOS standalone reliability.

</specifics>

<deferred>
## Deferred Ideas

- **VisualViewport-based keyboard handling** — only if the sticky-bottom + scrollIntoView baseline fails on a real iOS device (verify in Phase 38). Documented fallback, not default scope.
- **iPad-768 tablet Drawer-vs-Dialog refinement** — BaseMobileDialog uses the binary isMobile split; a tablet-specific presentation (isTablet) is not in this phase.
- **Real-device keyboard/zoom/camera UAT** — belongs to Phase 38 Mobile UAT Sweep (real iOS + Android).

</deferred>

---

*Phase: 35-forms-dialogs-on-small-screens*
*Context gathered: 2026-05-27*
