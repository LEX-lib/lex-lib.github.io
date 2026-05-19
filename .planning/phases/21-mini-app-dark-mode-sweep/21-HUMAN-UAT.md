# Phase 21: Mini-App Dark Mode Sweep — Human UAT

**Generated:** 2026-05-19
**Phase:** 21-mini-app-dark-mode-sweep
**Scope:** THEME-09 (LexTrack) + THEME-10 (Larga) + THEME-11 (Gift Exchange / MonitoX) + THEME-12 (API Playground)
**Tester:** human (visual confirmation only — code-verifiable structural fixes already passed in plans 21-01..21-04)
**Verification approach:** Open each route on a 375px viewport AND on a ≥ 640px viewport, in BOTH light and dark mode (toggle via the NavBar sun/moon button delivered in Phase 19), and tick each item below.

## How to enter / leave dark mode

- **Primary path:** Click the sun/moon toggle in `CustomNavBar` (Phase 19 delivery). State persists via the `useTheme` composable's localStorage contract.
- **DevTools fallback:** Open DevTools → Elements → select `<html>` → toggle the `my-app-dark` class manually. Useful when reproducing edge cases or when the Phase 19 toggle isn't yet visible on a given route.
- **Initial paint:** Phase 19's `index.html` inline FOUC script sets `.my-app-dark` on `<html>` before Vue mounts, so the first render should already match the stored theme.

## How to run

1. `npm run dev`
2. Open `http://localhost:5173/` in a Chromium-based browser
3. Open DevTools → Device Toolbar; have a 375px-wide mobile preset ready (e.g. iPhone SE)
4. For each section below, test in BOTH viewports (375px + ≥ 640px / desktop ≥ 1024px) AND BOTH themes (light + dark)
5. Sign each section off only after every checkbox passes

---

## §1 — LexTrack (THEME-09, ROADMAP §Phase 21 SC 1)

**Route:** `/projects/lextrack` (requires login — use the credentials your dev environment has configured)

**Underlying delivery:** Plan 21-01 — semantic-token refactor (Option A) so LexTrack now renders correctly in BOTH themes via Phase 18 `.my-app-dark` token overrides in `base.css`. Files: `LexTrackApp.vue`, `AddMeeting.vue`, `ManageMeeting.vue`, `ManageSupport.vue`, `ManageTask.vue`. `ActivityCard.vue` audited unchanged.

### Light mode (≥ 640px)

- [ ] LexTrack page shell — light page background (`#f5f7fa`), main card white (`#ffffff`), no leftover dark-mode bleed
- [ ] Section headings (Tasks / Meetings / Support) render dark (`#0d1117`) — fully legible
- [ ] DSU Task list rows — white card faces, dark heading text, body text mid-slate, dividers visible but subtle
- [ ] DSU Meeting list rows — same pattern; meeting duration pill renders with INDIGO background + indigo text (theme-aware accent)
- [ ] Support request list rows — same pattern
- [ ] AddMeeting dialog opens — white surface, dark form labels, light inputs with mid-slate text
- [ ] ManageTask / ManageMeeting / ManageSupport dialogs — same pattern; PrimeVue Editor toolbar + content render light
- [ ] PrimeVue DatePicker popup — light panel, indigo selected-date highlight
- [ ] PrimeVue TabView — light tab background, INDIGO-600 (`#4f46e5`) underline on the selected tab

### Dark mode (≥ 640px)

- [ ] LexTrack page shell — dark page background (`#0d1117`), main card dark navy (`#1a1a2e`), NO white bleed
- [ ] Section headings — light heading text (`#f5f7fa`), fully legible against dark card
- [ ] DSU Task list rows — dark card faces, light heading text, lighter-slate body text, dividers (`#2a3142`) visible
- [ ] DSU Meeting list rows — same pattern; meeting duration pill renders with `bg-indigo-900/30 text-indigo-300` (paired dark variant)
- [ ] Support request list rows — same pattern
- [ ] AddMeeting dialog opens — dark surface, light form labels, dark inputs with light text, indigo CTA still legible
- [ ] ManageTask / ManageMeeting / ManageSupport dialogs — same pattern; PrimeVue Editor toolbar + content paint via the `:pt` semantic-token classes (no leftover light bleed)
- [ ] Jira link in Task cards — INDIGO-300 (theme-aware accent), legible against the dark card
- [ ] Status / amount badges (success / warning / error / info) — STILL in their semantic palette (theme-independent — D-13)
- [ ] PrimeVue DatePicker popup — dark navy panel, light dates, INDIGO-300 (`#a5b4fc`) selected-date highlight
- [ ] PrimeVue TabView — dark tab background, INDIGO-300 (`#a5b4fc`) underline on the selected tab

### 375px viewport — both themes

- [ ] No horizontal scroll on any LexTrack screen
- [ ] AddMeeting, ManageMeeting, ManageTask, ManageSupport all reachable + dismissible (close X / overlay tap)
- [ ] Form inputs are full-width and tap targets are ≥ 44px

### `ActivityCard.vue` spot-check (out-of-scope but worth eyeballing)

- [ ] The two `style="color: #024"` inline-style icons inside `<InputGroupAddon>` still read OK in both themes (deferred per 21-01 SUMMARY; flag as a follow-up if visibly bad in dark)

---

## §2 — Larga (THEME-10, ROADMAP §Phase 21 SC 2)

**Route:** `/projects/larga`

**Underlying delivery:** Plan 21-02 — audit-only; the Vue/PrimeVue chrome already adapts via Phase 18 variant alignment, so the file's only source change is a single `:global(.my-app-dark)` override targeting the Leaflet geocoder input (D-09).

### Light mode (≥ 640px)

- [ ] Map renders with OSM default (light) tiles
- [ ] Route picker buttons (PrimeVue) — visible, primary colors recognizable
- [ ] Geocoder search input — light background, dark text, dark placeholder
- [ ] Route info panel below the map — light card, dark text, legible
- [ ] "Routes passing near searched place" heading — dark

### Dark mode (≥ 640px)

- [ ] Page chrome (route picker, info panel, controls) renders with dark backgrounds + light text
- [ ] PrimeVue Card wrapping the entire app — dark navy surface, light text (Phase 18 variant auto-switch)
- [ ] Route picker buttons — recognizable PrimeVue dark variant
- [ ] **Geocoder input — dark background, light text, mid-slate placeholder** (D-09 verbatim override applied; without this, the bundled Leaflet CSS would force a light input on a dark page)
- [ ] **Map tiles STAY light** — this is intentional per D-07 (OSM default tiles are universally legible; no dark tile provider swap)
- [ ] No light panel bleed against the dark page surface
- [ ] Geocoder dropdown suggestions — readable; if they bleed light, flag as a follow-up override candidate

### 375px viewport — both themes

- [ ] No horizontal page scroll
- [ ] Map fills the available width; controls reachable
- [ ] Route picker buttons stack acceptably (or scroll within the route panel)

---

## §3 — Gift Exchange / MonitoX (THEME-11, ROADMAP §Phase 21 SC 3)

**Routes:** `/projects/gift-exchange`, `/projects/gift-exchange/join`, `/projects/gift-exchange/draw`, `/projects/gift-exchange/manage`

**Underlying delivery:** Plan 21-03 — mechanical `dark:` Tailwind pairings (Phase 18 pattern) across all 4 files (~123 line replacements). Theme-independent action buttons (`bg-black` / `bg-red-600` / `bg-blue-600`) intentionally NOT paired.

### Each sub-route — Light mode (≥ 640px)

- [ ] Landing (`GiftExchange.vue`) — light page bg (`bg-gray-50`), white card, dark headings, yellow lobby-code chip, admin participants table legible
- [ ] Join (`GiftExchangeJoin.vue`) — light card with all 4 view states legible (code entry, enrollment-closed, enrollment form, success); blue lobby info chip; red lock icon
- [ ] Draw (`GiftExchangeDraw.vue`) — light card, lobby+code login flow legible, flip-card "front" gift-box still festive
- [ ] Manage (`GiftExchangeManage.vue`) — light page, lobby selection grid + create-lobby modal + shareable-link blue panel + participants table all legible

### Each sub-route — Dark mode (≥ 640px)

- [ ] Landing — dark page (`dark:bg-surface-page`), dark card (`dark:bg-surface-card`), light heading text, paired yellow chip (`dark:bg-yellow-900/30 dark:text-yellow-300`), green check-circle icon visible (paired)
- [ ] Join — dark surfaces across all 4 view states; blue lobby info chip uses `dark:bg-blue-900/30 dark:text-blue-300/400`; red lock icon `dark:text-red-300`; green success icon `dark:text-green-300`
- [ ] Draw — dark surfaces; blue lobby info chip paired; yellow waiting-state icon `dark:text-yellow-300`
- [ ] Manage — dark surfaces across lobby selection (selected variant `dark:bg-blue-900/30`), create-lobby modal, shareable-link blue panel, participants table (header `dark:bg-surface-page`, rows `dark:bg-surface-card`, status pills green/yellow paired)
- [ ] **Theme-independent buttons** (`bg-black` for Enroll/Validate/Check; `bg-red-600` for Start-Drawing / Delete; `bg-blue-600` for Create / Copy) stay visually identical in both themes — that's intentional
- [ ] Status colors (success/warning/error/info) stay in their fixed semantic palette (D-13)

### Flip-card reveal (Landing + Draw)

- [ ] Light mode: red gradient gift-box "front" reads festive on light card
- [ ] Dark mode: red gradient gift-box "front" reads festive on dark card
- [ ] Light mode: drawn-name "back" panel — white surface, dark name, gold (`#ffd700`) border still festive
- [ ] Dark mode: drawn-name "back" panel — dark surface, light name, gold border still festive

### 375px viewport — both themes

- [ ] All 4 sub-routes usable; no horizontal page scroll
- [ ] CTA buttons reachable; modals dismissible
- [ ] Participants table in Manage scrolls horizontally if needed (or wraps acceptably)

---

## §4 — API Playground (THEME-12, ROADMAP §Phase 21 SC 4)

**Route:** `/projects/api-playground`

**Underlying delivery:** Plan 21-04 — audit revealed the file is **intentionally dark-by-design in BOTH themes** (Postman-style navy + amber palette baked into the scoped `<style>` block). No light-mode chrome surface exists to pair; no third-party highlighter is imported (D-15 confirmed). Source change is limited to `.my-app-dark`-scoped contrast/legibility tweaks for muted text + placeholders + scrollbar under explicit dark mode. The custom inline regex JSON highlighter is unchanged (D-15 audit + D-14 chrome-only lock honored).

### Light mode (≥ 640px)

- [ ] Page renders with the navy/amber Postman-style palette (NOT light surfaces) — this is BY DESIGN, matching the JSON viewer's dark palette
- [ ] Toolbar, tabs, request panel, response panel — dark navy surfaces with mid-slate / amber accents, all text legible
- [ ] URL bar — dark navy input with amber method-select pill; amber Send button with dark navy text
- [ ] Request tabs (Params / Headers / Auth / Body) — dark navy tab strip, amber selected tab indicator
- [ ] Headers / params table rows — dark inputs, mid-slate column labels
- [ ] History sidebar — dark navy, mid-slate request names, amber active-request highlight
- [ ] JSON response body (`<pre class="json-pre">`) — navy `#001122` background, readable JSON syntax colors (keys light blue `#7eb8f7`, strings paler blue `#a8d4ff`, numbers amber `#e89820`, booleans coral `#ff8c69`, null muted slate `#7a96b0`)
- [ ] Status badges (success green / error red) — semantic palette readable on dark navy meta bar
- [ ] Method-color text (GET green `#4ade80` / POST yellow `#facc15` / PUT blue `#60a5fa` / PATCH purple `#a78bfa` / DELETE red `#f87171` / HEAD/OPTIONS slate/orange) — unchanged in both themes (theme-independent semantic method colors)

### Dark mode (≥ 640px)

- [ ] Same navy/amber palette as light mode (file is dark-by-design)
- [ ] **Section labels** (BODY / PARAMS / HEADERS / RESPONSE JSON / etc.) — slightly brighter (`#5a7a9b`) under explicit dark mode compared to default `#3d5a73`; check that the upgrade is visibly easier to read on the dark bar
- [ ] **Input placeholders** (URL, headers, params, body, auth fields) — slightly brighter (`#5a7a9b`) so empty inputs still hint expected content
- [ ] **Empty-state callouts** (response-empty "Send a request" / auth-empty) — slightly brighter caption text
- [ ] **Scrollbar thumb** — slightly more visible (`#0f4a80`) when explicit dark mode is on
- [ ] JSON response body — STILL the navy `<pre>` palette (intentional both-theme palette); JSON syntax colors remain readable against `#001122`
- [ ] Method-color text — unchanged in both themes

### 375px viewport — both themes

- [ ] Sidebar collapses or scrolls horizontally without page-wide horizontal scroll
- [ ] Request panel scrolls; response panel scrolls; no horizontal page scroll
- [ ] Save / Send buttons reachable
- [ ] Modal (Save request, Rename) opens centered and is dismissible

### Special note for API Playground

The visual difference between LIGHT and DARK mode on this route is **deliberately subtle** — the navy/amber palette is the brand of this dev tool. The only `.my-app-dark`-gated changes are contrast tweaks on muted text, placeholders, and the scrollbar. If a reviewer expects a fully different light-mode visual treatment (white surfaces, dark text), that's NOT in scope for THEME-12 and would require a separate plan; document the gap in the failure-mode catalog below if it's perceived as a regression.

---

## Failure-mode catalog

If anything fails the above, file a finding with:

- Mini-app + sub-route + viewport (375 / ≥ 640) + theme (light / dark)
- Symptom (light bleed / contrast / clipping / focus ring missing / etc.)
- Suggested fix shape:
  - Plain Tailwind utility missing dark pair → add `dark:` variant
  - Non-Tailwind decorative bleed → scoped `:global(.my-app-dark) .selector { … }` override
  - PrimeVue component bleed → check Phase 18 `@custom-variant` alignment + variant pass-through props
  - Leaflet / 3rd-party CSS bleed → scoped `:global(.my-app-dark)` override targeting the injected DOM class (NEVER edit `node_modules` CSS directly)

### Common likely symptoms + responsible plan

| Symptom                                                                | Likely Cause                                                                 | Reopen Plan |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| LexTrack card faces stay LIGHT in dark mode                            | Semantic-token utility missing from a LexTrack file                          | 21-01       |
| LexTrack PrimeVue Editor toolbar still painting `#374151` literal      | `:pt` semantic-token classes overridden by Editor internal defaults          | 21-01       |
| LexTrack TabView selected-tab underline disappears on light            | `.lextrack-tabview .p-tabview-nav-link.p-highlight` light/dark split missing | 21-01       |
| Larga geocoder input near-invisible on dark                            | `:global(.my-app-dark) .leaflet-control-geocoder-form input` rule missing    | 21-02       |
| Larga map tiles look "wrong" in dark mode                              | NOT a bug — D-07 intentionally keeps tiles light; deferred work              | (deferred)  |
| MonitoX yellow code chip illegible on dark                             | `dark:bg-yellow-900/30 dark:text-yellow-300` pairing missing                 | 21-03       |
| MonitoX flip-card "back" panel white in dark mode                      | `dark:bg-surface-card` pairing missing on the back-panel container           | 21-03       |
| MonitoX participants table row hover invisible on dark                 | `dark:hover:bg-surface-page/30` (or similar) missing                         | 21-03       |
| MonitoX status pill (green Ready / yellow Waiting) too low contrast    | `/30` opacity bg + `dark:text-{color}-300` pairing needs `dark:border-` too  | 21-03       |
| API Playground muted labels (BODY / HEADERS / PARAMS) too dim          | `.my-app-dark .body-label` etc. rules missing or wrong selector              | 21-04       |
| API Playground placeholder text disappears under dark                  | `.my-app-dark .*::placeholder` rules missing                                 | 21-04       |
| API Playground JSON viewer keys/strings illegible on dark page         | `.json-pre` background `#001122` mismatched against new page-bg — unlikely  | 21-04       |
| API Playground scrollbar invisible on dark                             | `.my-app-dark ::-webkit-scrollbar-thumb` rule missing or wrong color         | 21-04       |
| Theme toggle doesn't immediately re-paint the app                      | Phase 19 `useTheme` regression — NOT a Phase 21 plan issue                   | (Phase 19)  |
| FOUC: brief white flash on initial paint before dark applies           | Phase 19 `index.html` FOUC script regression — NOT Phase 21                  | (Phase 19)  |

---

## Sign-off

- [ ] All §1 (LexTrack) items pass — **THEME-09 approved**
- [ ] All §2 (Larga) items pass — **THEME-10 approved**
- [ ] All §3 (Gift Exchange / MonitoX) items pass — **THEME-11 approved**
- [ ] All §4 (API Playground) items pass — **THEME-12 approved**
- [ ] No anti-regression files touched — verify:

  ```bash
  git log --oneline 21-01..HEAD -- \
    src/main.ts \
    src/composables/useTheme.ts \
    src/composables/useIsMobile.ts \
    src/assets/base.css \
    src/assets/wallecx-overrides.css \
    src/components/projects/wallecx/ \
    src/views/ \
    index.html
  ```

  Expected: empty output (no commits from Phase 21 touched any locked file).

- [ ] **Tester signature / date:** _______________________________

---

*Phase 21 UAT generated as the last deliverable of plan 21-04 per D-21 (consolidated phase-level UAT doc covering all 4 mini-apps).*
