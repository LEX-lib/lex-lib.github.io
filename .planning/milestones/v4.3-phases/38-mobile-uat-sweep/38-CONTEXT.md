# Phase 38: Mobile UAT Sweep + PWA-UAT-01 - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 38 is a **real-device UAT sweep that records verification results** — it closes PWA-05 (PWA-UAT-01) and finalizes the real-device confirmations for the NFR/CON items that bind to this phase. It is a **testing/recording phase, not a build phase**: it produces no production code (see D-04). The output is a recorded UAT artifact, not a feature.

**In scope:** executing and recording the net-new real-device checks (D-03); consolidating Phase 37's already-recorded device QA; producing `38-HUMAN-UAT.md`.
**Out of scope:** any production code changes, fixing failures in-phase (→ separate gap phase per D-04), List Virtualization (Phase 38b, conditional).
</domain>

<decisions>
## Implementation Decisions

### Device Matrix
- **D-01:** Test targets are **real iOS** + **real Android** (primary; both available and already used in Phase 37 QA) and **iPad-820 as an emulated 820px-width viewport** in desktop browser DevTools — NOT a physical iPad. iPad layout/forms checks are valid under emulation; install/standalone-only behaviors (home-screen install, true standalone display-mode) cannot be fully proven on emulation and MUST be recorded as "emulation-verified (layout only)" with that caveat, not as a full real-device pass.

### Evidence Reuse
- **D-02:** **Carry forward** Phase 37's 9 recorded device-QA passes (`37-UAT.md`) as authoritative — do NOT re-run them. Phase 38 executes **only the net-new checks** in D-03. The carried-forward items are referenced/linked in `38-HUMAN-UAT.md`, not re-tested.

### Net-New Check Set (what Phase 38 actually runs)
- **D-03:** The sweep executes these checks not freshly covered by Phase 37's QA:
  1. **Force-quit + relaunch + auth survival** (real iOS + real Android) — PWA-05 core: app relaunches to working state, PocketBase auth persists across a full force-quit.
  2. **iPad-820 viewport (emulated)** — Wallecx layout, tabs, forms, and dialogs render correctly at 820px width (record per D-01 caveat).
  3. **BR-2 barcode** — renders black bars on white background in **BOTH light and dark theme** on a real device (NFR-BR-2-PRESERVED final coverage; Phase 34 D-34-06 carried forward).
  4. **LT-07 double-scroll** — no double-scroll trap on a real device (Phase 34 deferral).
  5. **16px no-zoom inputs** (real iOS) — focusing inputs does not trigger iOS auto-zoom (NFR-IOS-NO-ZOOM real-device confirmation; grep audit already PASS).
  6. **Sticky bar above keyboard** — form action bar stays above the on-screen keyboard (Phase 35 device behavior).
  7. **Camera affordances** — the 2-affordance camera/upload flow works on a real device (Phase 35).
  8. **Inline DatePicker** — renders/behaves correctly on a real mobile viewport (Phase 35).
  9. **Dirty-guard** — unsaved-changes guard fires on a real device (NFR-DRAWER-DIRTY-GUARD real-device confirmation; human-verify already APPROVED).

### Failure Handling
- **D-04:** **UAT-only.** Phase 38 records pass/fail; it does NOT fix failures in-phase and writes no production code. Any failed check is logged in `38-HUMAN-UAT.md` and routed to a **separate gap-closure phase/cycle** (`/gsd:plan-phase --gaps` style), keeping Phase 38 a clean recording sweep.

### Recording + Deferral Policy
- **D-05:** Results are recorded in **`38-HUMAN-UAT.md`** (same pattern as `34-HUMAN-UAT.md` / `35` human-verify). A device target that is unavailable may be **deferred only with the user's explicit sign-off**, recorded as **non-blocking for milestone close**. (Milestone is NOT hard-blocked on every check being green — defer-with-signoff is permitted.)

### Claude's Discretion
- Exact structure/format of `38-HUMAN-UAT.md`, ordering of checks, and how carried-forward Phase 37 results are linked vs summarized.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & milestone structure
- `.planning/REQUIREMENTS.md` — PWA-05 (PWA-UAT-01) definition + the NFR/CON items bound to Phase 38: NFR-BR-2-PRESERVED, NFR-IOS-NO-ZOOM, NFR-IOS-SPLASH, NFR-IOS-EVICTION-UX, NFR-PWA-BANNER-FREQUENCY, NFR-DRAWER-DIRTY-GUARD, CON-CONFIRMDIALOG-SINGLETON, CON-PWA-SCOPE.
- `.planning/STATE.md` — v4.3 phase structure + locked architectural invariants.
- `.planning/ROADMAP.md` — Phase 38 section (goal, success criteria, binds list).

### Carried-forward evidence (Phase 37 — already passed, do NOT re-run)
- `.planning/phases/37-pwa-install-standalone-polish/37-UAT.md` — the 9 device checks already executed + the Edge-on-Android Quick Actions known constraint.
- `.planning/phases/37-pwa-install-standalone-polish/37-VERIFICATION.md` — Phase 37 code-level verification (status: passed).

### Deferred-item provenance (what Phase 38 must close)
- `.planning/phases/34-layout-audit-touch-targets/34-HUMAN-UAT.md` — LT-07 double-scroll deferral to Phase 38.
- `.planning/phases/34-layout-audit-touch-targets/34-CONTEXT.md` §D-34-06 — BR-2 barcode light+dark check.
- `.planning/phases/35-forms-dialogs-on-small-screens/35-06-PLAN.md` — Phase 35 device-dependent behaviors deferred to Phase 38 (16px no-zoom, keyboard bar, camera, inline DatePicker, dirty-guard).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- This is a UAT phase — no new code. The "assets" are the recorded test artifacts above. The app under test is the v4.3 build already shipped to `master` and deployed to the Vercel preview.

### Established Patterns
- HUMAN-UAT recording pattern: Phases 34 and 35 used `*-HUMAN-UAT.md` with per-check expected/result + deferral notes. Phase 38 follows the same shape.
- Phase 37 device-QA already proved the harness works on the user's real iOS + Android devices via the Vercel preview URL.

### Integration Points
- Test surface is the deployed PWA (Vercel preview / production), not local — real install behavior requires a deployed HTTPS origin.
</code_context>

<specifics>
## Specific Ideas

- **iPad-820 is emulation-only** (D-01) — be explicit in the record that install/standalone behaviors there are not real-device-proven.
- **Edge-on-Android is a known constraint** (carried from Phase 37): Android Quick Actions require a Chrome/Samsung Internet WebAPK install; Edge adds a non-WebAPK shortcut. Record as a documented platform limitation, not a failure.
- Test against the **deployed Vercel preview** with **Vercel Deployment Protection disabled** (so manifest/SW/assets load on-device, as established during Phase 37 QA).
</specifics>

<deferred>
## Deferred Ideas

- **Phase 38b — List Virtualization (PF-06):** conditional, triggered only by Phase 36's performance instrumentation. Out of scope for Phase 38.
- **Any failures found during the sweep:** routed to a separate gap-closure phase per D-04 — not fixed in Phase 38.
</deferred>

---

*Phase: 38-mobile-uat-sweep*
*Context gathered: 2026-06-05*
