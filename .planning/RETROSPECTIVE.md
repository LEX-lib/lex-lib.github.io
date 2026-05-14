# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v2.0 — Membership Cards

**Shipped:** 2026-05-14
**Phases:** 4 (Phases 10–13) | **Plans:** 12 | **Sessions:** 2

### What Was Built

- WallecxApp.vue refactored from a 452-line monolith into a 35-line PrimeVue Tabs shell; VaccinationsTab.vue verbatim-extracts all vaccination state with zero regression
- `wallecx_memberships` PocketBase collection (10 fields, 5 per-user rules); two-user isolation smoke test
- BarcodeDisplay.vue four-branch renderer (QR/linear/number-fallback/empty) with JsBarcode try/catch; full-screen scan overlay (Teleport, viewport fixed overlay, wake lock, iOS-safe)
- MembershipCard.vue coloured tile grid with expiry warnings; MembershipDetail.vue read-only field grid with embedded barcode and AttachmentPreview
- ManageMembership.vue CRUD dialog — direct v-model refs (ColorPicker issue #8135 workaround), Zod safeParse, conditional barcode_value field, EXIF-stripped FileUpload, server-first delete
- membershipMapper.spec.ts (11 tests); 24 total tests passing

### What Worked

- **Extraction-first approach for Phase 10.** Doing the tab shell refactor as its own phase before any membership work prevented state surface explosion. Clean separation meant Phase 13 could wire emits without touching vaccination logic.
- **Risk pre-research in STATE.md.** Documenting JsBarcode throw behavior, ColorPicker issue #8135, iOS fullscreen limitations, and wake lock patterns before planning meant zero unplanned pivots during execution.
- **Mirroring vaccination patterns exactly.** The membership CRUD path (mapper, spec, dialog, server-first delete, isSaving guard) followed the vaccination blueprint — no new architecture decisions needed, just apply the established pattern.
- **YOLO + parallelization.** Phases 10–12 executed cleanly without interactive gates slowing them down.

### What Was Inefficient

- **REQUIREMENTS.md MWRITE-01 text became inaccurate.** It described `@primevue/forms zodResolver` but the implementation used direct v-model. The requirement text should have been updated during planning when the ColorPicker workaround was decided.
- **v1.1 and v1.2 milestones were never formally archived.** MILESTONES.md only has v1.0 before this v2.0 entry. The intermediate milestones were shipped but not documented in the milestones file.

### Patterns Established

- **requestKey per collection.** Each tab's `getFullList` must use a distinct `requestKey` string (`'memberships-getFullList'` vs vaccinations key) to prevent PocketBase auto-cancel silently dropping parallel fetches.
- **ConfirmDialog at app shell level only.** `useConfirm` broadcasts to the single ConfirmDialog instance in WallecxApp.vue. Tab components call `useConfirm()` but do NOT add `<ConfirmDialog />` tags.
- **JsBarcode always in try/catch.** Throws synchronously on bad input. Catch renders `card_number` as large plain text with "Barcode unavailable" caption.
- **ColorPicker + direct v-model.** ManageMembership.vue is the reference implementation for any future PrimeVue form that needs a ColorPicker.
- **File tokens at view time, not list time.** Fetch a short-lived token in `openDetail()`, not in `onMounted()`. Clear it in `@hide` handler.

### Key Lessons

1. **Extract before you add.** When adding a second tab/feature to an existing component, extract the existing logic into its own component first — even if it's "just a refactor." The extraction phase (Phase 10) cost 2 plans but saved far more complexity in Phases 12 and 13.
2. **Research known library gotchas before planning, not during execution.** JsBarcode, ColorPicker, iOS fullscreen, and wake lock were all researched in STATE.md risk register before Phase 12 planning. Zero surprises during execution.
3. **Mirror existing CRUD patterns exactly.** The save-loop bug (not Object.assign-ing the server record id), the server-first delete pattern, and the isSaving guard were all solved in Phase 3. Copying them verbatim to ManageMembership.vue required no re-thinking.

### Cost Observations

- Model mix: ~90% Sonnet 4.6, ~10% Haiku (quick lookups)
- Sessions: 2 (one for Phases 10–12, one for Phase 13)
- Notable: Phase 10 (extraction) was the riskiest and took the fewest tokens — clean extraction with a clear definition of done

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 5 | 17 | Established baseline patterns (mapper, spec, CRUD dialog, per-user rules) |
| v1.1 | 2 | 4 | First grouping/computed layer over existing data |
| v1.2 | 3 | 5 | Pure client-side computed extensions — no new PocketBase queries |
| v2.0 | 4 | 12 | Second record type via extraction-first tab refactor |

### Cumulative Quality

| Milestone | Tests | Notes |
|-----------|-------|-------|
| v1.0 | 13 | vaccinationMapper.spec.ts (10) + guard.spec.ts (3) |
| v1.1 | 13 | No new tests — grouping is pure computed logic |
| v1.2 | 13 | No new tests — search/sort/toggle are pure computed/ref |
| v2.0 | 24 | +membershipMapper.spec.ts (11) |

### Top Lessons (Verified Across Milestones)

1. **Server-first isolation before UI.** Phases 1 and 11 both built and smoke-tested the PocketBase collection before any component work. Never build UI against an unverified backend.
2. **Re-use component patterns, not abstractions.** v1.0 established the CRUD dialog pattern; v2.0 copied it. Zero temptation to abstract — three nearly identical things don't need a shared base yet.
3. **Per-user rules are the real security boundary.** The route guard is UX. The PocketBase collection rules (five per-user access rules on every collection) are enforced server-side and are the only thing that actually prevents cross-user data access.
