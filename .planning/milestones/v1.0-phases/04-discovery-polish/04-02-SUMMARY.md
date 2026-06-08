---
phase: 04-discovery-polish
plan: "02"
subsystem: frontend
tags: [projects-view, design-tokens, audit, checklist]
dependency_graph:
  requires: [04-01-PLAN]
  provides: [POLISH-01, POLISH-02]
  affects: [src/views/ProjectsView.vue, .planning/phases/04-discovery-polish/04-CHECKLIST.md]
tech_stack:
  added: []
  patterns: [static-data-array-extension, design-token-audit-grep]
key_files:
  created:
    - .planning/phases/04-discovery-polish/04-CHECKLIST.md
  modified:
    - src/views/ProjectsView.vue
decisions:
  - "POLISH-02 audit: all Wallecx components use only design token var() references — zero bespoke hex/rgb/hsl values; PASS"
  - "Item 13 (dist grep) deferred: import.meta.env.PROD in App.vue v-if causes Vue compiler/rolldown error; npm run build fails; fix to isProd const required in 04-04-PLAN"
  - "import.meta in template expressions is not supported by the Vue template compiler in the rolldown build pipeline; must be moved to script-side constant"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-12"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 4 Plan 02: Wallecx Tile + Design Token Audit Summary

Wallecx tile added to the ProjectsView.vue projects array as the 5th entry (POLISH-01); design token audit confirms zero bespoke color values in all Wallecx components (POLISH-02); 04-CHECKLIST.md created with all 19 PITFALLS items catalogued.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Wallecx entry to ProjectsView.vue | 9d6ad96 | src/views/ProjectsView.vue |
| 2 | Run design token audit and produce 04-CHECKLIST.md | 4684305 | .planning/phases/04-discovery-polish/04-CHECKLIST.md |

## Outcomes

**POLISH-01:** Wallecx is the 5th element in the `projects` ref array with all 6 required fields: `title: "Wallecx"`, `description` (health vault copy), `link: "/projects/wallecx"`, `status: "WIP"`, `icon: "mdi:shield-check"`, `tags: ["Vue 3", "PocketBase", "Auth", "Privacy"]`. The navy/amber gradient applies automatically via scoped CSS. `npm run type-check` exits 0.

**POLISH-02:** Design token audit grep across all Wallecx `.vue` files returned 33 matches — every single one is `style="color: var(--color-...)"` using an approved design token. Zero raw hex values, zero `rgb()`, zero `hsl()`, zero hardcoded color names. **PASS.**

**04-CHECKLIST.md:** Created with all 19 PITFALLS.md "Looks Done But Isn't" items. Items 1–12, 14, 17 signed off with evidence from prior phases. Items 9, 10, verified by grep at execution time. Items 15 and 16 remain open pending 04-03 and 04-04.

## Deviations from Plan

### Auto-discovered Issues

**1. [Rule 1 - Bug] App.vue import.meta.env.PROD causes build failure**
- **Found during:** Task 2 (attempted `npm run build` for VITE_LOGIN_ dist check)
- **Issue:** Vue template compiler (via rolldown) does not support `import.meta` in `v-if` attribute expressions. `npm run build` fails with: `Error parsing JavaScript expression: import.meta may appear only with 'sourceType: "module"'`. This was introduced when 04-01-PLAN fixed the SpeedInsights gate.
- **Fix:** Move `import.meta.env.PROD` to a script-side constant (`const isProd = import.meta.env.PROD`) and reference that in the template.
- **Deferred to:** 04-04-PLAN (out of scope for this plan; does not affect type-check or test:unit)
- **Impact:** `npm run build` currently fails; deploy is blocked. Item 13 (dist VITE_LOGIN_ grep) cannot be completed until build is restored.

## Checklist Status Summary

| # | Item | Status |
|---|------|--------|
| 1 | Per-user isolation | SIGNED OFF |
| 2 | Filter injection safety | SIGNED OFF |
| 3 | File access 403 without token | SIGNED OFF |
| 4 | Save round-trip no duplicate | SIGNED OFF |
| 5 | Delete removes record + file | SIGNED OFF |
| 6 | EXIF stripped | SIGNED OFF |
| 7 | pdfjs-dist >= 4.2.67 | SIGNED OFF |
| 8 | CSP not regressed | SIGNED OFF |
| 9 | No v-html in Wallecx | SIGNED OFF (grep verified) |
| 10 | No template-literal filters | SIGNED OFF (grep verified) |
| 11 | Watcher fires on mount | SIGNED OFF |
| 12 | Save button disables during save | SIGNED OFF |
| 13 | Auth token not in prod bundle | DEFERRED (build broken) |
| 14 | Mapper test passes | SIGNED OFF |
| 15 | Route guard test | OPEN — 04-04-PLAN |
| 16 | JSON export works | OPEN — 04-03-PLAN |
| 17 | No component name collision | SIGNED OFF |
| 18 | Hard-refresh resolves SPA route | SIGNED OFF |
| 19 | Speed Insights gated | SIGNED OFF (logically; build blocked) |

## Self-Check: PASSED

- [x] `src/views/ProjectsView.vue` modified — Wallecx entry at lines 51–59
- [x] `.planning/phases/04-discovery-polish/04-CHECKLIST.md` created — 112 lines, 19 items
- [x] Commit `9d6ad96` exists (Task 1)
- [x] Commit `4684305` exists (Task 2)
- [x] `npm run type-check` exits 0
- [x] `npm run test:unit` exits 0 — 10 tests passing
- [x] grep "Wallecx" ProjectsView.vue — match found (line 51)
- [x] grep "mdi:shield-check" ProjectsView.vue — match found (line 56)
- [x] grep "projects/wallecx" ProjectsView.vue — match found (line 54)
- [x] 04-CHECKLIST.md contains all 19 items, POLISH-02 audit result pasted (not placeholder)
