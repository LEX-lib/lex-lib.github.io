---
phase: 21-mini-app-dark-mode-sweep
plan: 04
subsystem: api-playground / dark-mode
tags:
  - dark-mode
  - api-playground
  - vue3
  - audit-driven
  - theme-12
requirements:
  - THEME-12
dependency-graph:
  requires:
    - Phase 18 `@custom-variant dark` + `.my-app-dark` token block in base.css
    - Phase 19 useTheme composable / NavBar toggle (controls `.my-app-dark` on `<html>`)
  provides:
    - API Playground dark-mode legibility tweaks under explicit `.my-app-dark`
    - Consolidated `21-HUMAN-UAT.md` covering all 4 Phase 21 mini-apps (D-21 deliverable)
  affects:
    - THEME-12 (API Playground dark mode) — structurally satisfied via audit + targeted overrides
    - ROADMAP §Phase 21 SC 4 — API Playground contribution complete
    - Phase 21 closure (D-21 cross-plan UAT artifact produced)
tech-stack:
  added: []
  patterns:
    - "Audit-driven outcome: file is dark-by-design in both themes (Postman-style navy + amber palette); no light-hex chrome surfaces exist to override"
    - "`.my-app-dark`-scoped contrast/legibility overrides on muted text, input placeholders, and scrollbar thumbs (NOT a light-mode pairing — analogous to Larga 21-02's audit-only outcome)"
    - "Custom inline regex JSON highlighter preserved verbatim (no Prism / Highlight.js / Shiki / hljs / Monaco / CodeMirror import — D-15 confirmed)"
key-files:
  created:
    - .planning/phases/21-mini-app-dark-mode-sweep/21-HUMAN-UAT.md
    - .planning/phases/21-mini-app-dark-mode-sweep/21-04-SUMMARY.md
  modified:
    - src/components/projects/api-playground/ApiPlaygroundApp.vue
decisions:
  - "Audit-driven: API Playground is INTENTIONALLY dark-by-design in both themes; the existing navy/amber palette satisfies the spirit of THEME-12 (dark backgrounds + legible text in dark mode) without a light-mode refactor"
  - "Honored D-14 chrome-only lock: no structural refactor of the file's 2048 lines; the dark overrides are appended additively in the same `<style scoped>` block"
  - "Honored D-15 no-dependency lock: zero changes to package.json / package-lock.json; the custom inline regex JSON highlighter (lines 135-159) is preserved"
  - "Honored D-16 chrome-only treatment for the body textarea (no syntax highlighting added)"
  - "Did NOT touch the `.json-pre` / `.json-key` / `.json-string` / `.json-number` / `.json-boolean` / `.json-null` rules — the navy `<pre>` provides its own dark surface that contrasts cleanly with the (also dark) page bg; the plan exempted these explicitly and the audit confirmed no contrast loss"
  - "Did NOT modify the dynamic inline `style=\"{ color: methodColor }\"` bindings — those are theme-independent semantic method colors (GET green / POST yellow / PUT blue / etc.)"
  - "D-21 consolidated UAT doc generated as the last deliverable, covering all 4 mini-apps (LexTrack / Larga / MonitoX / API Playground)"
metrics:
  duration: ~15 minutes
  completed: 2026-05-19
  tasks_completed: 4 (Task 1: investigation; Task 2: chrome overrides; Task 3: consolidated UAT doc; Task 4: this SUMMARY)
  commits: 2 atomic content commits + 1 docs commit (this SUMMARY)
---

# Phase 21 Plan 04: API Playground Dark Mode + Phase 21 UAT Summary

API Playground audited end-to-end; the file is **intentionally dark-by-design in both themes** (Postman-style navy + amber palette), so the THEME-12 contract is satisfied without a light-mode refactor. Added targeted `.my-app-dark`-scoped contrast/legibility overrides for muted text, input placeholders, and scrollbar thumbs. The custom inline regex JSON highlighter is preserved verbatim (no third-party library imported — D-15 confirmed). Generated the consolidated phase-level `21-HUMAN-UAT.md` covering all 4 mini-apps as the D-21 deliverable.

## 1. D-15 highlighter investigation outcome

**Confirmed:** NO third-party syntax highlighter is imported. Greps for `prism|highlight|shiki|hljs|monaco|codemirror` in `ApiPlaygroundApp.vue` return zero import-line matches. The only `highlight`-substring matches are:

- `const highlightedJson = computed(...)` — the custom function name (line 135)
- `<pre class="json-pre" v-html="highlightedJson"></pre>` — the consumer (line 894)
- `--accent: #e89820  (brand amber — interactive highlight)` — palette comment (line 1003)

The `highlightedJson` computed (lines 135-159) is a **custom inline regex implementation** that wraps token matches in `<span class="json-key|json-string|json-number|json-boolean|json-null">`, sanitized with DOMPurify before passing to `v-html`. Zero library swap was needed; the planner's pre-confirmation was correct.

## 2. Audit outcome — the file is dark-by-design

The chrome around the JSON viewer (toolbar, sidebar, request tabs, URL bar, key-value tables, auth section, body editor, response meta bar, save modal, scrollbars) uses a hardcoded navy + amber Postman-style palette in the `<style scoped>` block:

| Token | Hex | Role |
|---|---|---|
| `--bg-deep` | `#001122` | Deepest surface, page bg, code area, inputs |
| `--bg-panel` | `#001e3c` | Panels, sidebar, headers, modal |
| `--bg-raised` | `#002a52` | Raised surfaces, dropdown, hover state |
| `--border` | `#0a3d6b` | Borders / dividers |
| `--text-base` | `#d0dbe8` | Primary text |
| `--text-muted` | `#7a96b0` | Secondary / muted text |
| `--text-dim` | `#3d5a73` | Disabled / placeholder / section labels |
| `--accent` | `#e89820` | Brand amber — interactive highlight |
| `--accent-dim` | `rgba(232,152,32,0.12)` | Active state tint |
| `--danger` | `#e05c5c` | Destructive actions |

This is intentional — API Playground is a developer tool styled like Postman / Insomnia / Bruno where a navy + amber code-editor aesthetic is the brand. The same palette informs the JSON viewer's `<pre class="json-pre">` (background `#001122`, color `#d0dbe8`, key `#7eb8f7`, string `#a8d4ff`, number `#e89820`, boolean `#ff8c69`, null `#7a96b0`), which the plan explicitly exempts ("the existing navy-dark `json-pre` palette already contrasts cleanly on a dark page background, so no syntax-color change is required").

**Concretely audited:** the file contains
- **0** light-hex chrome surfaces (no `#fff` / `#ffffff` / `#fafafa` / `#f5f5f5` / `#f0f0f0` / `#eee` / `#e0e0e0` / `#f9fafb` used as a background or border)
- **0** light Tailwind utilities (`bg-white` / `text-gray-*` / `border-gray-*` / `bg-gray-*` all return zero matches via `grep`)
- **0** existing `.my-app-dark` selectors (zero matches; the file pre-Plan was theme-blind)
- **0** third-party highlighter imports (D-15 confirmed)

The only "white" hex literals are `rgba(255, 255, 255, 0.05–0.08)` semi-transparent additive button-hover highlights on dark surfaces (lines 1193, 1235, 1304, 1321) — these are correct in both themes and stay untouched. Similarly `rgba(0, 0, 0, …)` is used for modal overlay (line 1860) and box-shadow (lines 1204, 1873), which are correct in both themes.

The plan's `must_haves.truths` statement #3 ("Every hardcoded light hex used as a chrome surface has a paired `.my-app-dark` override") is **trivially satisfied** because no light-hex chrome surfaces exist to override. This mirrors plan 21-02 (Larga)'s audit-only outcome where the inspection revealed nothing to pair.

## 3. Overrides applied

Added a single `.my-app-dark`-scoped block at the bottom of the `<style scoped>` block (preserving the existing rules verbatim), grouped by surface:

| Selector | Rule | Rationale |
|---|---|---|
| `.my-app-dark .api-playground` | `background: #001122; color: #d0dbe8;` | Explicitly confirms the navy baseline under explicit dark mode (no visual change; structural anchor for the override block) |
| `.my-app-dark .body-label`, `.my-app-dark .kv-head`, `.my-app-dark .auth-label`, `.my-app-dark .json-toolbar-label` | `color: #5a7a9b;` | Section labels were `#3d5a73` (~1.7:1 on `#001e3c`); bumped to `#5a7a9b` for better legibility under explicit dark mode while staying within the navy palette |
| `.my-app-dark .response-empty-inner`, `.my-app-dark .auth-empty` | `color: #5a7a9b;` | Empty-state callouts — same brightness bump so prompts read clearly against `#001122` |
| `.my-app-dark .url-input::placeholder`, `.my-app-dark .pg-input::placeholder`, `.my-app-dark .kv-input::placeholder`, `.my-app-dark .body-textarea::placeholder` | `color: #5a7a9b;` | Input placeholders — bumped from `#3d5a73` so empty inputs still hint their expected content |
| `.my-app-dark ::-webkit-scrollbar-thumb` | `background: #0f4a80;` | Slightly more visible scrollbar thumb |
| `.my-app-dark ::-webkit-scrollbar-thumb:hover` | `background: #5a7a9b;` | Brighter hover state |

**`grep -c "\.my-app-dark" src/components/projects/api-playground/ApiPlaygroundApp.vue` → 13** (acceptance criterion `≥ 1` satisfied).

**No `var(--color-surface-*)` / `var(--color-typo-*)` tokens used** — the navy/amber palette is brand-specific to this tool and doesn't map cleanly to the generic site `surface-card` / `typo-body` tokens (which are designed for a different aesthetic). Using navy literals here is consistent with the existing `<style>` block's own decision to inline navy hex values.

**`!important`** — none of the original rules use `!important`, so the dark overrides don't need it either (D-08 from Phase 20 doesn't apply).

**`:deep()`** — not used; the override targets only classes in the component's own `<style scoped>` scope (no v-html-rendered content needed overrides per the JSON viewer exemption).

## 4. Status of JSON viewer (`.json-pre` family)

**Left unchanged.** The plan explicitly exempted the JSON viewer because its `<pre class="json-pre">` element provides its own contrasting surface (`background: #001122`, `color: #d0dbe8`) that reads cleanly on both light and dark page backgrounds. Audit re-confirmed:

- `.json-pre` background `#001122` is identical to the page background `.api-playground` `#001122` — the viewer blends seamlessly into the page in both themes
- `.json-key` `#7eb8f7`, `.json-string` `#a8d4ff`, `.json-number` `#e89820`, `.json-boolean` `#ff8c69`, `.json-null` `#7a96b0` — all sit at 4.5:1+ contrast against `#001122`

No contrast failure observed. No `.my-app-dark :deep(.json-*)` override added. Documented decision matches the plan's pre-confirmation in `must_haves.truths` #2.

## 5. No-dependency confirmation

```bash
git diff --name-only HEAD~2 HEAD -- package.json package-lock.json
```

Returns: empty. **No dependency added.** D-15 lock honored. The custom inline regex highlighter at `src/components/projects/api-playground/ApiPlaygroundApp.vue` lines 135-159 is the only JSON-coloring mechanism in play.

## 6. Anti-regression confirmation

```bash
git diff --name-only HEAD~2 HEAD
```

Returns exactly:

```
.planning/phases/21-mini-app-dark-mode-sweep/21-HUMAN-UAT.md
src/components/projects/api-playground/ApiPlaygroundApp.vue
```

(This SUMMARY.md will be in a separate `docs(21-04)` commit after this file is written.)

**None of the locked anti-regression files appear in the diff:**

- `src/main.ts` — untouched
- `src/composables/useTheme.ts` — untouched
- `src/composables/useIsMobile.ts` — untouched
- `src/assets/base.css` — untouched (no new tokens added)
- `src/assets/wallecx-overrides.css` — untouched
- `src/components/projects/wallecx/**` — untouched
- `src/components/projects/lextrack/**` — untouched (Plan 21-01 scope, completed earlier)
- `src/components/projects/larga/**` — untouched (Plan 21-02 scope, completed earlier)
- `src/components/projects/gift-exchange/**` — untouched (Plan 21-03 scope, completed earlier)
- `src/views/**` — untouched
- `index.html` — untouched
- `package.json` / `package-lock.json` — untouched

## 7. THEME-12 trace

THEME-12 (API Playground dark mode) decomposes into ROADMAP §Phase 21 SC 4 sub-surfaces:

| Sub-surface | THEME-12 class anchor | Override delivered |
|---|---|---|
| **Request panel** | `.request-pane`, `.tab-bar`, `.tab-btn`, `.tab-content` | Dark-by-design baseline confirmed via `.my-app-dark .api-playground`; tab-bar uses `#001e3c` panel + `#0a3d6b` divider in both themes |
| **Response display** | `.response-pane`, `.response-meta-bar`, `.response-content` | Dark-by-design baseline (`#001122` page bg confirmed under `.my-app-dark`); status badges (`.status-badge.success` / `.status-badge.error`) use semantic palette unchanged |
| **Headers / params / body tables** | `.kv-table`, `.kv-head`, `.kv-row`, `.kv-input` | `.my-app-dark .kv-head` brightens column labels; `.my-app-dark .kv-input::placeholder` brightens placeholder hints |
| **Auth section** | `.auth-section`, `.auth-label`, `.auth-empty`, `.pg-input` | `.my-app-dark .auth-label` and `.my-app-dark .auth-empty` brighten label + empty-state text; `.my-app-dark .pg-input::placeholder` brightens placeholder |
| **Body editor** | `.body-tab`, `.body-header`, `.body-label`, `.body-textarea` | `.my-app-dark .body-label` brightens label; `.my-app-dark .body-textarea::placeholder` brightens placeholder; body textarea remains `#001122 / #d0dbe8` in both themes (D-16 chrome-only: no syntax highlighting added) |
| **JSON viewer toolbar** | `.json-toolbar`, `.json-toolbar-label`, `.json-copy-btn` | `.my-app-dark .json-toolbar-label` brightens "RESPONSE JSON" label |
| **JSON syntax-highlighted body** | `.json-pre`, `:deep(.json-key/.json-string/.json-number/.json-boolean/.json-null)` | UNCHANGED — intentionally dark in both themes (D-15 audit; passes contrast against `#001122`) |
| **Sidebar / history list** | `.pg-sidebar`, `.collections-list`, `.collection-item`, `.sidebar-header` | Dark-by-design baseline; no override needed |
| **Method-color pills** (GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS) | inline `style="{ color: methodColor }"` | UNCHANGED — theme-independent semantic method colors (deliberately preserved per plan constraint) |
| **Scrollbars** | `::-webkit-scrollbar-thumb` | `.my-app-dark ::-webkit-scrollbar-thumb` slightly brighter thumb + hover |

## 8. D-21 deliverable — consolidated `21-HUMAN-UAT.md`

Generated `.planning/phases/21-mini-app-dark-mode-sweep/21-HUMAN-UAT.md` as the **single phase-level UAT document** covering all 4 Phase 21 mini-apps (per D-21, mirroring Phase 18/20's UAT structure):

- §1 LexTrack (THEME-09) — light + dark, 375px + ≥640px, per-screen checklist (LexTrackApp + 4 manage dialogs); also includes spot-check for ActivityCard's deferred `#024` icon color
- §2 Larga (THEME-10) — light + dark, geocoder + chrome (D-07 note that map tiles intentionally stay light)
- §3 MonitoX / Gift Exchange (THEME-11) — light + dark, 4 sub-routes (Landing / Join / Draw / Manage), plus flip-card reveal both states
- §4 API Playground (THEME-12) — light + dark, with explicit note that the file is dark-by-design and the visual difference between light/dark is deliberately subtle
- Failure-mode catalog with symptom + likely-cause + responsible-plan table
- Sign-off block with anti-regression `git log` command for the human to verify

The UAT doc anchors visible runtime UAT for the entire phase; any failure becomes a gap-closure follow-up plan rather than re-opening 21-01..21-04.

## 9. Verification results

| Check | Command | Exit code |
|---|---|---|
| TypeScript type-check | `npm run type-check` | **0 (PASS)** |
| Production build | `npm run build-only` | **0 (PASS)** — built in 2.59s |

`build-only` emitted the standard chunk-size advisory for `vendor.js` (unrelated to this plan; identical advisory was present pre-plan). PWA precache regeneration succeeded (56 entries / 4978.02 KiB). The `ApiPlaygroundApp` chunk built at 78.75 kB (gzip 28.88 kB) — only marginally larger than pre-plan due to the small dark override block.

## 10. Phase-level next steps

With this SUMMARY landed, all four Phase 21 plans (21-01 LexTrack, 21-02 Larga, 21-03 MonitoX, 21-04 API Playground) have their per-plan SUMMARYs in place AND the consolidated `21-HUMAN-UAT.md` is ready. The human runs the UAT doc per its instructions (`npm run dev`, both themes, both viewports, all 4 routes). Any failure becomes a gap-closure follow-up plan; passing UAT closes ROADMAP §Phase 21 (SC 1-4) and clears the way for the next milestone work.

## Known Stubs

None introduced by this plan.

## Threat Flags

None — pure CSS override additions; no new network endpoints, auth paths, file access patterns, or schema changes.

## TDD Gate Compliance

N/A — plan type is `execute`, not `tdd`.

## Self-Check: PASSED

Verified that all claimed files/commits exist:

- `src/components/projects/api-playground/ApiPlaygroundApp.vue` — FOUND (HEAD; +67 lines added)
- `.planning/phases/21-mini-app-dark-mode-sweep/21-HUMAN-UAT.md` — FOUND (HEAD; new file, 239 lines)
- 2 content commits exist in `git log`:
  - `5155c61` feat(21-04): add .my-app-dark legibility overrides to API Playground
  - `88b8921` docs(21-04): add consolidated 21-HUMAN-UAT.md for phase 21
- `npm run type-check` exited 0
- `npm run build-only` exited 0 (2.59s)
- `grep -c "\.my-app-dark" src/components/projects/api-playground/ApiPlaygroundApp.vue` → 13 (≥ 1)
- Anti-regression locked files NOT in `git diff --name-only HEAD~2 HEAD`
- `package.json` / `package-lock.json` NOT in `git diff` (D-15 lock honored)
- No `import .* (prism|highlight|shiki|hljs|monaco|codemirror)` in the file
