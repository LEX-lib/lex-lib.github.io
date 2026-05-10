# Pitfalls Research — Wallecx Vaccination Records (Phase 1)

**Domain:** Personal multi-user health-records mini-app on PocketBase + Vue 3 SPA, with image/PDF attachments, deployed via Vercel.
**Researched:** 2026-05-10
**Confidence:** HIGH for PocketBase/PDF.js/Vercel-specific items (verified against official docs and existing CONCERNS.md), MEDIUM for behavioural/UX items (general health-app practice).

> Cross-references existing Lexarium concerns from `.planning/codebase/CONCERNS.md`. Where a known bug or pattern in the rest of the codebase already demonstrates a pitfall, it is cited inline with file:line and tagged **[Repo precedent]**.

---

## Critical Pitfalls

### Pitfall 1: Per-user isolation enforced only by client filters, not by collection rules

**Severity:** CRITICAL
**What goes wrong:**
The `wallecx_vaccinations` collection ships with permissive list/view/update/delete rules (e.g. `@request.auth.id != ""` only) and the SPA "filters" by `user.id` in the query. Any authenticated Lexarium user (LexTrack user, MonitoX user, anyone with a valid token) can list, fetch, modify, or delete *every other user's* vaccination records by sending a raw API call without the filter. Health data leaks across the multi-user boundary on day 1.

**Why it happens:**
The `pb` client is shared across all four mini-apps (`src/lib/pocketbase/index.ts`, see CONCERNS "Mini-apps share global state via single `pb` client (HIGH)"). The Lexarium router guard is client-side only (CONCERNS "Auth guard is client-side only (HIGH)"). Developers extend that habit and rely on a `filter: \`user = "${auth.user.id}"\`` string in the SPA, forgetting that PocketBase rules — not the client — are the actual gate. There is also a tempting precedent in the same codebase: `GiftExchangeManage.vue:9` defines `isSuperUser = computed(() => authStore.isLoggedIn)` (CONCERNS "Manage page exposed to anyone authenticated (HIGH)"), which is the wrong pattern to copy.

**How to avoid:**
- Set every rule on `wallecx_vaccinations` to require ownership: `@request.auth.id != "" && user = @request.auth.id` for `listRule`, `viewRule`, `updateRule`, `deleteRule`. For `createRule`: `@request.auth.id != "" && @request.data.user = @request.auth.id`.
- Never trust `@request.body` alone for the user field — set it from `@request.auth.id` in a `onRecordCreateRequest` hook if you want belt-and-braces.
- Test the rule with a second user's token using API Playground (already in this codebase) before considering the feature done.
- Do **not** introduce a "manager" or "admin" view in v1. If/when admin tooling is needed, model it as a real PocketBase role on `users`, not `isLoggedIn`.

**Warning signs:**
- A code review where the only access control is a filter string in the Vue component.
- `superusers.authWithPassword` or `pb.authStore.isAdmin` referenced in app code.
- The phrase "we'll add the rule later."
- `getList` returning records with a `user` field that doesn't match the current user.

**Phase to address:** Phase 1 — gate is the schema migration that creates the collection. Cannot ship Phase 1 without server-side rules verified.

---

### Pitfall 2: Filter-string injection on lookups (`getFirstListItem`, `getList`)

**Severity:** HIGH
**What goes wrong:**
A Wallecx detail/edit screen does `pb.collection('wallecx_vaccinations').getFirstListItem(\`vaccine_name = "${userInput}"\`)`. A user types `" || user != ""` or escapes the quote with `\\` and the parser-level filter becomes `vaccine_name = "" || user != ""` — bypassing per-user isolation *even if the collection rule is correct*, because the rule is `&&`-combined with the supplied filter and an attacker-shaped filter can short-circuit semantics or trigger a 500.

**Why it happens:**
This is the dominant pattern already in the Lexarium codebase. CONCERNS "PocketBase filter-string interpolation (MEDIUM)" lists 11 occurrences across `GiftExchange*.vue` and others. PocketBase's filter parser has its own quoting rules and JS `${}` interpolation does not escape them. Developers reach for template literals out of habit.

**How to avoid:**
- Use parameterised filters everywhere. PocketBase SDK supports placeholders: `pb.collection('wallecx_vaccinations').getFirstListItem("id = {:id}", { filter: { id } })` and the `getList(page, perPage, { filter, ... })` form with bind params.
- Lint rule (or simple grep in CI) banning template-literal `\`...${...}...\`` strings passed to `filter`/`getFirstListItem`/`getList`.
- For date filtering, follow the existing safe pattern in `LexTrackView.vue:104` which uses `dayjs.format('YYYY-MM-DD')` (no user-supplied chars).

**Warning signs:**
- Any `\`...${var}...\`` passed as the first arg to `getFirstListItem` or as `.filter` in `getList`.
- New `eslint-disable` lines next to a `pb.collection(...)` call.
- Manual `.replace(/"/g, '')` "sanitisation" of user input — that's the wrong primitive.

**Phase to address:** Phase 1 — establish the parameterised pattern in the first mapper file (`vaccinationMapper.ts`) so it sets the convention for the future vault record types.

---

### Pitfall 3: Save loop that never refreshes IDs (re-create on every edit)

**Severity:** HIGH
**What goes wrong:**
A Wallecx form lets the user add a new vaccination, hits save (POST → PocketBase creates record `abc123`), then the user edits a field and hits save again. Because the local record's `id` was never set from the server response, the second save is another POST → creates record `def456`. The list now shows two of the same vaccination; the original is orphaned with the original attachment file.

**Why it happens:**
**[Repo precedent]** This bug exists today in LexTrack: CONCERNS "LexTrack save loop never refreshes IDs (MEDIUM)" (`src/views/LexTrackView.vue:127-165`). New entries call `pb.collection(...).create(item)` without capturing the returned record id. Wallecx will be implemented by the same developer in the same idiom, so the bug will be copy-pasted unless explicitly prevented.

**How to avoid:**
- Mapper contract: `createVaccination(input)` must `return await pb.collection('wallecx_vaccinations').create(form)` and the caller must do `Object.assign(item, created)` (id, created, updated, file token).
- For files: re-read the *server's* filename for the attachment after create — the original filename gets a `_xxxxxxxxxx` suffix on disk and your local `file: File` object no longer matches the URL.
- Form state machine: `draft → saving → saved(id)`. Disable save button while `saving`. Treat `saved(id)` as the only state where re-saves issue PATCH.
- Unit test the create→update sequence in `__tests__/vaccinationMapper.spec.ts`.

**Warning signs:**
- `pb.collection(...).create(item)` with no `await` capture into a variable.
- Two list-view rows with identical text after the user edits once.
- Orphan files in PocketBase storage with no record pointing at them.

**Phase to address:** Phase 1 — bake into the first mapper. Add a regression test before the dialog component is wired up.

---

### Pitfall 4: Delete UI that only removes from local state (record persists on server)

**Severity:** HIGH
**What goes wrong:**
User clicks "Delete" on a vaccination row. The row disappears from the table. User logs out, logs in next day — the record is back. Worse: the *file* is still in PocketBase storage. Worst: in a multi-user scenario, the user thinks their sensitive record is gone (and changes their behaviour accordingly) when it is still discoverable.

**Why it happens:**
**[Repo precedent]** CONCERNS "`removeSupport`/`removeMeeting`/`removeTask` only mutate local state (HIGH)" — `src/views/LexTrackView.vue:42-91` removes from a `ref` array via `lodash-es/remove` but never calls `pb.collection(...).delete(...)`. Same dev, same idiom, same risk.

**How to avoid:**
- Delete handler signature: `async function deleteVaccination(item)` → `if (item.id) await pb.collection('wallecx_vaccinations').delete(item.id)` *first*, then splice from local list. Show a toast on success.
- On failure (network, 403), do NOT splice locally. Surface the error.
- Add a confirmation dialog with the vaccine name in plain text — finger-slip on a phone is the dominant failure mode for this UI.
- Unit test: stub `pb.collection().delete()` to throw; assert local list is unchanged.

**Warning signs:**
- `remove(arr, ...)` or `arr.splice(...)` is the entire body of a delete handler.
- No `await` in the delete function.
- "Delete" button has no confirmation step.

**Phase to address:** Phase 1.

---

### Pitfall 5: PDF rendering via `v-html` or untrusted iframe (PDF.js CVE-2024-4367)

**Severity:** HIGH
**What goes wrong:**
The detail view shows a PDF attachment by either (a) `<div v-html="pdfHtml">` after some toString-of-PDF nonsense, (b) `<iframe :src="pdfUrl">` pointing at the PocketBase file URL with no sandbox, or (c) using PDF.js without updating past 4.2.67. A malicious PDF (the user uploads a "vaccination certificate" they were emailed) embeds a PostScript calc-function that executes JavaScript in PDF.js's worker — CVE-2024-4367 — XSS in the SPA origin. Because the SPA also holds the PocketBase auth token in `localStorage`, the attacker reads it and now has full account access.

**Why it happens:**
PDF preview "looks easy" — drop the URL into an iframe, ship it. PDF.js bundles get pinned and forgotten. Vue 3 `v-html` is the standard "render HTML I have" reflex (already used in `ApiPlaygroundApp.vue:894`, see CONCERNS "`v-html` of API response in API Playground (MEDIUM)").

**How to avoid:**
- Use `pdfjs-dist` ≥ 4.2.67 (CVE-2024-4367 fix) and pin it. Keep it on a Renovate/Dependabot watch.
- Render PDFs to a `<canvas>` via PDF.js `getDocument().promise.then(pdf => pdf.getPage(n).then(page => page.render({ canvasContext, viewport })))` — never raw `v-html`.
- If you must use an iframe (cheapest preview), set `sandbox="allow-same-origin"` only and cross-check the PDF's MIME type from PocketBase headers. Better: separate the preview origin (e.g. `pdf-preview.lexarium.app`) so an XSS there can't read the SPA's auth token. For Phase 1 this is overkill — choose canvas rendering with pinned PDF.js.
- Update the existing CSP in `index.html`: PDF.js needs `worker-src 'self' blob:` and `script-src 'self' blob:` for its worker. Add these *narrowly*, not by relaxing `script-src 'self'` globally.
- Keep `frame-src 'none'` unless you switch to the iframe approach.

**Warning signs:**
- `v-html` appears anywhere in `WallecxDetail.vue`.
- An `<iframe>` without `sandbox=""`.
- `pdfjs-dist` not pinned in `package.json`, or the version is < 4.2.67.
- CSP relaxed broadly to make a viewer "just work."

**Phase to address:** Phase 1 if PDF preview ships in v1. If preview is deferred (download-only), this becomes Phase 2 and Phase 1 should disable PDF preview UI rather than ship a placeholder.

---

### Pitfall 6: Orphan files after record delete (cascade-delete file gap)

**Severity:** HIGH
**What goes wrong:**
A user deletes a vaccination record. The record row goes away. The attached card scan stays in PocketBase storage forever. Over a year of use the storage bill grows; more importantly, a sensitive medical scan persists past the user's perceived "I deleted it." If the file URL was ever cached, copied, or exposed to a CDN, deletion of the record does not invalidate it.

**Why it happens:**
PocketBase's open issue [#151](https://github.com/pocketbase/pocketbase/issues/151) documents that *cascade-delete via relations* (`onDelete: cascade`) historically did not remove files from storage — only direct record deletes do. Even direct record deletes happen in a separate goroutine after the response, so for a few seconds the file URL is still live. Developers assume "delete record = delete file" and never verify.

**How to avoid:**
- v1 schema: keep the file field on the same record. Don't model the attachment as a separate `wallecx_vaccination_files` collection joined by relation — that triggers the cascade-delete-doesn't-remove-files bug.
- After delete, verify: in the smoke test, capture the file URL pre-delete, delete the record, and assert the URL returns 404 within 5 seconds.
- Document the "files clean up async" caveat for the user (or just delay the success toast until a HEAD on the file URL returns 404).
- Set a server-side scheduled job (PocketBase cron hook) to sweep orphan files monthly. Defer this to Phase 2; document the gap in Phase 1.

**Warning signs:**
- A "soft delete" pattern (`deleted_at`) being introduced "for safety" — it leaves files live forever.
- Two collections joined by relation where the file lives on the parent.
- No test that verifies the file URL is unreachable after delete.

**Phase to address:** Phase 1 (single-collection design); Phase 2 (orphan sweeper hook).

---

### Pitfall 7: EXIF GPS coordinates leak the user's home address

**Severity:** HIGH (privacy)
**What goes wrong:**
The user uploads a photo of their vaccination card taken on their phone — at home, on the kitchen counter. The JPEG includes EXIF GPS tags pointing at their home (within metres). The file is stored as-is in PocketBase. Even with per-user isolation, the user's *own* attachment leaks GPS in the file binary. If the attachment is ever exported, shared, screenshotted-with-metadata, or the storage is breached, the GPS is the leak — not the visual content.

**Why it happens:**
Phone cameras default to writing EXIF GPS. PocketBase stores files as uploaded (correct behaviour for a generic file field). The Vue SPA passes the raw `File` object to a `FormData` and uploads. No one stripped EXIF.

**How to avoid:**
- Strip EXIF client-side before upload using the canvas trick: load the image into an `Image`, draw to a `<canvas>`, export via `canvas.toBlob('image/jpeg', 0.92)`. Canvas does not preserve EXIF — you get a clean image with only pixel data. Verified pattern as of 2025.
- Surface the strip in the upload UI: "We've removed location data from your photo for privacy." This is also a differentiator vs naive health trackers.
- For PDFs, EXIF doesn't apply but PDF metadata (`/Author`, `/Producer`) does. Stripping PDFs in-browser is much harder; document the gap and recommend users upload PDFs they generated themselves rather than scans from a clinic kiosk.
- Test: upload a file with known GPS EXIF (test fixture), download from PocketBase, confirm `exiftool` shows no GPS.

**Warning signs:**
- The upload code path is just `formData.append('attachment', file)` with no preprocessing.
- No mention of EXIF in the `WallecxApp.vue` PR description.
- A `image/heic` allowed MIME type with no transcode (HEIC carries even more metadata and is unreadable on many platforms anyway).

**Phase to address:** Phase 1 — privacy guarantee is part of the Core Value ("save and retrieve their own vaccination records … without ever losing access"). Sensitivity is implied. Stripping is cheap and table-stakes for a health vault.

---

### Pitfall 8: File field misconfiguration — wrong MIME allowlist, wrong size, single vs multi

**Severity:** MEDIUM
**What goes wrong:**
The file field is configured permissively (`maxSize: 0` → defaults to 5 MB; `maxSelect: 0` → ambiguous; no `mimeTypes` allowlist) or *too restrictively* (`mimeTypes: ['image/jpeg']` blocks PNG photos and PDFs entirely). Common failure modes:
- Modern phone photos (12 MP HEIC, 4–8 MB) hit the 5 MB default and silently fail to upload.
- PDFs from email scanners (10–25 MB) blow through the limit.
- `maxSelect: 1` is set but the field is read in code as an array (`record.attachment[0]`) → `undefined`.
- No allowlist → user uploads `.exe` because the "file picker" had no `accept` attribute.

**Why it happens:**
PocketBase defaults: `maxSize` defaults to 5 MB if zero; `maxSelect <= 1` means single-file (stored as string, not array); `maxSize * maxSelect` is the request body limit (verified from official docs). Developers don't read the docs; they configure in the admin UI clicking through.

**How to avoid:**
- Set `maxSelect: 1` (one card per record), `maxSize: 10485760` (10 MB), `mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']`.
- After EXIF strip + canvas re-encode, most phone photos drop below 2 MB anyway. The 10 MB ceiling exists for PDFs.
- Generate `Thumb sizes` (e.g. `100x100`, `400x0`) on the file field for image previews — PocketBase serves them via `?thumb=WxH`. Avoids shipping the full 10 MB to a list view.
- TypeScript: type the field as `attachment: string` (single-file) on the `Vaccinations` interface, not `string[]`.
- Reject `.exe`, `.html`, etc. at upload time (HTML is a vector if you ever serve files inline rather than as `Content-Disposition: attachment`).

**Warning signs:**
- `record.attachment[0]` accessed on a `maxSelect: 1` field.
- `<input type="file">` with no `accept` attribute.
- "Why is this 8 MB photo failing?" in chat.

**Phase to address:** Phase 1 — collection schema decision.

---

### Pitfall 9: PocketBase file URLs are public-by-token but served direct (CDN/cache misconception)

**Severity:** MEDIUM
**What goes wrong:**
Developers assume that because the *records* are gated by collection rules, the *file URLs* are too. They aren't fully — PocketBase serves files via `/api/files/COLLECTION/RECORD_ID/FILENAME[?token=...]`. Without `token=`, access depends on the file field's `protected` flag. If `protected: false` (default), anyone with the URL can fetch the file forever — even after the user logs out, even if they're not logged in at all. The URL gets shared via copy-paste, leaks into analytics referrers, or sits in the browser cache on a shared computer.

**Why it happens:**
PocketBase file behaviour is documented but easy to skim past. The `protected` flag is a per-file-field setting in the collection schema, not a global toggle. Developers test with their own logged-in session and don't notice the URL works in incognito.

**How to avoid:**
- Set `protected: true` on the `attachment` file field in the collection schema. With this set, file URLs require a short-lived `token` query param obtained via `pb.files.getToken()` (or `pb.collection().getList({ files: 'short' })` depending on SDK version). Tokens expire (default ~3 minutes) — appropriate for a health-record viewer.
- Generate the token at view-time, not at list-time. If you put a 3-minute token in a list-view URL, it expires before the user clicks.
- Document that tokens *are bearer credentials*: don't log them, don't put them in error messages, don't paste them into the API Playground for "testing."
- Test: open the file URL in an incognito tab without the token — must 403.

**Warning signs:**
- File URLs that work in incognito.
- `protected` is not set or is `false` in the collection schema.
- Tokens hardcoded into list-view templates (so they expire before render).
- Vercel Speed Insights or any RUM showing file URLs (with tokens) in `referer` headers.

**Phase to address:** Phase 1.

---

### Pitfall 10: `v-html` for vaccination notes / location field

**Severity:** MEDIUM
**What goes wrong:**
A future iteration adds a "Notes" field with rich text (Quill, like LexTrack uses). The notes are saved as raw HTML and rendered with `v-html` in the detail view. Stored XSS — one user's notes script-tags-inject into another user's session... oh wait, but per-user isolation means they only XSS *themselves*. So who cares? **They care if** the database is breached, the data is exported and re-imported, an admin reviews records via a tool that uses `v-html`, or a Phase-3 "share with my doctor" feature renders the same HTML to a third party.

**Why it happens:**
**[Repo precedent]** CONCERNS "Editor descriptions saved as raw HTML (MEDIUM)" — `LexTrackView.vue:127-162` saves Quill output verbatim; sanitisation only happens on read in the *dead* `LexTrackApp.vue:5`. The live view doesn't `v-html` it today, but the data on disk is unsafe. CONCERNS "`v-html` of API response in API Playground (MEDIUM, currently safe)" — `ApiPlaygroundApp.vue:894` uses `v-html` with DOMPurify, which is the *correct* pattern, but is one careless commit away from regressing.

**How to avoid:**
- v1: do NOT add a rich-text notes field. Plain text only. `<textarea>` → store as plain string → render as `{{ notes }}` (Vue auto-escapes).
- If/when notes become rich text in a future phase: `DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p','br','strong','em','ul','ol','li'], ALLOWED_ATTR: [] })` *on write*, not just on read. Add a unit test asserting `<script>` and `<img onerror=>` are stripped.
- Mirror the sanitization test from `ApiPlaygroundApp.vue` (CONCERNS suggests this exists as a coverage gap — opportunity to add it for both apps).

**Warning signs:**
- A Quill `<Editor>` import in `WallecxApp.vue`.
- Any `v-html` directive in the Wallecx folder.
- A migration that changes a `text` field to `editor` type in the collection.

**Phase to address:** Phase 1 (decision: plain text). Phase 2+ if rich text introduced.

---

### Pitfall 11: Race condition / double-submit on save dialog

**Severity:** MEDIUM
**What goes wrong:**
User clicks "Save" twice (network slow, button doesn't disable, eager finger). Two POST requests fire. PocketBase creates two records, two file uploads, two attachments. Same end-state as Pitfall 3 but caused by user, not by stale-id. Especially likely on mobile (double-tap zoom).

**Why it happens:**
Vue 3 + PrimeVue dialogs are easy to wire as `<Button @click="save">` without `:loading` or `:disabled` bound to a saving flag. The save handler is `async` but the button state isn't.

**How to avoid:**
- Pattern: `const isSaving = ref(false); async function save() { if (isSaving.value) return; isSaving.value = true; try { ... } finally { isSaving.value = false; } }` — on the button: `:disabled="isSaving" :loading="isSaving"`.
- Idempotency on PocketBase: include a client-generated UUID (`crypto.randomUUID()`) in a `client_id` field with a unique index. A duplicate POST returns the same record. Overkill for v1; keep in mind for Phase 2.
- Disable the form (PrimeVue `<Fieldset :disabled>`) during save, not just the button.

**Warning signs:**
- Save button has no `:loading` binding.
- Two records appearing per save in QA.

**Phase to address:** Phase 1.

---

### Pitfall 12: `watch(date/filter)` doesn't run on mount → empty state flash

**Severity:** LOW (UX)
**What goes wrong:**
The list view watches a `selectedYear` or `vaccineFilter` ref to refetch records. On first mount the ref has its initial value but the watcher doesn't fire, so the user sees an empty list for ~200ms until they touch the filter.

**Why it happens:**
**[Repo precedent]** Verbatim from CONCERNS "`watch(selectedDate)` does not run on mount in `LexTrackView.vue` (MEDIUM)" — same dev, same pattern.

**How to avoid:**
- `watch(selectedYear, fetchVaccinations, { immediate: true })`.
- Or better: `watchEffect(fetchVaccinations)` for simple cases.
- Or load data in `onMounted` *and* watch — but only one of these or you'll double-fetch.

**Warning signs:**
- Empty list flash on first navigation to `/projects/wallecx`.
- `watch(...)` without `{ immediate: true }` followed by no `onMounted` fetch.

**Phase to address:** Phase 1.

---

### Pitfall 13: Dev-login credentials shipped to client / leaked

**Severity:** CRITICAL (operational)
**What goes wrong:**
Wallecx is a more sensitive app than the rest of Lexarium (real health data, real users beyond the owner). Yet the existing `VITE_LOGIN_EMAIL` / `VITE_LOGIN_PASSWORD` mechanism (CONCERNS "Env-injected dev-login credentials shipped to client (HIGH)") inlines those into the production JS bundle if `.env.production` ever has them set. Anyone reading the bundle gets superuser access if those creds are an admin.

**Why it happens:**
Vite inlines all `VITE_*` vars at build time. The CONCERNS doc already flags this for Lexarium broadly; adding Wallecx multiplies the blast radius because the data is now health records.

**How to avoid:**
- Strip `VITE_LOGIN_*` from `env.d.ts` and remove all call sites *before* Wallecx Phase 1 ships. This is a Phase 0 cleanup, not a Wallecx feature.
- Add a CI grep that fails if `import.meta.env.VITE_LOGIN_PASSWORD` is referenced under `src/`.
- Rotate any creds that ever sat in `local.jsonc` (CONCERNS "Plaintext credentials in `local.jsonc` (CRITICAL)").
- Recommend: gate Wallecx behind a separate PocketBase user (or at minimum a non-admin user) — current dev creds may have admin access to the entire DB.

**Warning signs:**
- `local.jsonc` still contains credentials.
- `.env.production` has any `VITE_LOGIN_*` value.
- A `git grep VITE_LOGIN_` returns hits in `src/`.

**Phase to address:** Phase 0 (pre-Wallecx cleanup) — or first task in Phase 1 if folded together.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Skip `protected: true` on file field | One less round-trip for tokens; URLs work in `<img src>` directly | Health-record file URLs are public-by-knowledge-of-URL forever; fails any reasonable privacy review | **Never** for health data |
| Use template-literal filters because "the input is a date" | No need to learn parameterised filters | Pattern propagates; the next dev uses it for a search box; injection lands | Acceptable only when input is from `dayjs.format('YYYY-MM-DD')` (zero user-controlled chars) |
| Skip EXIF strip because "PocketBase is private to me anyway" | Saves ~30 lines of canvas code | Backups, exports, future sharing features all leak GPS retroactively | Only acceptable in a single-user owner-only deployment, which Wallecx is *not* |
| Single-file deployment = single PocketBase user pool for all mini-apps | Reuses existing auth | LexTrack/MonitoX/API Playground users all auto-have Wallecx accounts | Acceptable for v1 (matches current Lexarium model). Revisit when external users join. |
| Skip tests because "it's a personal app" | Faster MVP | The known LexTrack save/delete bugs (CONCERNS) prove this idiom *will* recur in Wallecx | Never — at least add the mapper test (create-then-update) and the auth-rule test |
| Render PDF in `<iframe :src=>` without sandbox | One line of code | CVE-2024-4367-class XSS, full account takeover via auth token in localStorage | Never |
| Soft delete (`deleted_at` flag) instead of real delete | Easy "undo" for users | Files never freed; "I deleted it" UX is a lie | Acceptable only with a documented reaper hook + UX disclosure |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| PocketBase collection rules | `@request.auth.id != ""` only (any logged-in user) | `@request.auth.id != "" && user = @request.auth.id` for list/view/update/delete |
| PocketBase `create` rule | Allowing client to set `user` from request body | `@request.auth.id != "" && @request.data.user = @request.auth.id` (or set it in a hook) |
| PocketBase file URLs | Treating them as private because record is gated | File field needs `protected: true` AND tokens generated at view time |
| PocketBase file delete | Assuming relation cascade removes files | Direct record delete only (issue #151); model files on the parent record, not via relation |
| PocketBase filter strings | `\`name = "${input}"\`` | `('name = {:name}', { filter: { name: input } })` |
| PocketBase 0.26 SDK upgrades | Auto-pinned `^0.26.x` | Pin exact version (CONCERNS "Dependencies at Risk"); auth-store API churns |
| Vercel hosting | Worrying about Vercel Edge Function payload limits for file uploads | **Vercel only proxies the SPA** — uploads go directly from browser to PocketBase. Confirmed: there is no `vercel.json`, no API routes, no Edge Functions in this repo (INTEGRATIONS "Hosting"). Vercel's 4.5 MB request-body limit is irrelevant. |
| Vercel + PocketBase CSP | Adding PDF.js worker breaks `script-src 'self'` | Add `worker-src 'self' blob:` and `script-src 'self' blob:` *narrowly* in `index.html`'s existing CSP |
| Vercel Speed Insights | RUM beacons include URLs as referrer | Don't put auth tokens in URL paths; use query params and consider stripping them via a custom beacon hook (or accept the leak window) |
| `unplugin-vue-components` auto-import | Wallecx subcomponent named `Card.vue` collides with PrimeVue's `Card` | Prefix Wallecx subcomponents (`WallecxCard.vue`, `WallecxList.vue`) — CONCERNS already warns for LexTrack |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Loading full-resolution attachments in list view | List takes 5+ seconds; browser memory spikes | Use PocketBase `?thumb=100x100` for list rows; load full image only in detail view | Breaks at ~10 records on mobile with 8 MP photos |
| Sequential creates of multiple vaccinations | Bulk import takes minutes | `Promise.all(items.map(create))`, or PocketBase batch API (0.22+) | Breaks at ~5 records (matches CONCERNS "LexTrack save runs sequentially") |
| PDF.js loaded eagerly into the main bundle | First-contentful-paint regression on `/` route | Dynamic `import('pdfjs-dist')` inside the detail view only (mirrors existing Leaflet pattern in `LargaApp.vue:69-72`) | Felt immediately on the landing page |
| `unplugin-vue-components` registers every PrimeVue component referenced anywhere | Bundle bloat, noisy `components.d.ts` diffs | Restrict resolver after dead-code cleanup (CONCERNS suggests `Components({ exclude: [...] })`) | Felt at deploy review, not runtime |
| Refetching the full list after every save | UI lag on save; double round-trip | Optimistic update: splice the returned record into local state, no refetch | Breaks above ~50 records |
| Polling for changes (e.g. to detect concurrent edits) | Battery drain on mobile | PocketBase realtime (`pb.collection().subscribe('*', cb)`) — but defer to Phase 2; v1 is single-user-per-record, no concurrency | N/A in v1 |

## Security Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Client-only auth gate for `/projects/wallecx` route | Anyone can hit the API directly with a stale or stolen token | PocketBase collection rules are the truth; route guard is UX only |
| Storing auth token in `localStorage` (PocketBase default) | XSS in *any* mini-app reads the token and accesses Wallecx records | (a) Pin and audit `pdfjs-dist`; (b) never `v-html` untrusted; (c) consider migrating to httpOnly cookie auth in Phase 2 — out of scope for v1 |
| File URL leakage via `referer` header to third-party tile servers (Larga uses Google tiles) | A health file URL ends up in Google logs | Cross-origin isolation: file URLs only opened from `/projects/wallecx`, never from a route that loads cross-origin tiles. Also: `Referrer-Policy: same-origin` meta tag |
| Ingesting clinic-supplied PDFs without scanning | Malicious PDF lands in user's vault, executes via PDF.js | Pin PDF.js ≥ 4.2.67; render via canvas not iframe; document that uploads are not antivirus-scanned |
| Health data in error messages / Sentry / console | Vaccination details in stack-trace breadcrumbs | No global error handler exists today (CONCERNS "No global error handler"); when added, scrub `record.*` fields before logging |
| Treating "logged in" as "authorised for admin actions" | Same bug as `GiftExchangeManage.vue` (CONCERNS) | No admin actions in Wallecx v1. Period. |
| Including user-id in URL (`/projects/wallecx/user/abc/vaccination/xyz`) | Enumeration risk; URLs in browser history | Route is `/projects/wallecx/:vaccinationId` — no user-id; the collection rule enforces ownership |
| Backups with file storage included, not encrypted at rest | Lost backup tape = data breach | Out of scope for SPA but: document the PocketBase data dir contents; user owns hosting decision |
| Over-collection: adding "race", "sex", "DOB" fields "for completeness" | More sensitive data than the user signed up for | Stick to the locked list: vaccine name, date administered, dose number, lot/batch number, location/clinic. Refuse scope creep at PR time. |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---|---|---|
| No "downloaded a copy" affordance | User panics when they can't access PocketBase (offline, host down, account locked) | Phase 1: a "Download all my data (JSON + files zip)" button. This is *the* health-data table-stake. |
| File preview only, no download | User can see it, can't show it to a doctor offline | Both: preview inline + download button on detail view |
| Soft delete with no UI hint | User thinks data is gone; isn't | Either real delete with confirm, or visible "Trash" tab with auto-purge timer |
| PDF preview that fails silently on unsupported PDFs | User uploads, sees blank, doesn't know what's wrong | Catch render failure → show "Preview unavailable. Click to download." |
| "Vaccine name" as a free-text field with no autocomplete | 17 different spellings of "Pfizer-BioNTech" / "Comirnaty" | Provide a non-blocking autocomplete from a small static list (top 20 vaccines), but accept any text. Searchability across records improves. |
| Date picker without timezone awareness | Vaccinations recorded "yesterday" because of UTC drift | Store as `YYYY-MM-DD` (no time component). PocketBase date fields default to datetime; either constrain to date-only via a string field or always use `dayjs(date).startOf('day').utc()` consistently. |
| Photo upload UX with no progress | Mobile user thinks the app froze on a 6 MB upload | PrimeVue `<FileUpload>` with `:auto="false"` + progress; show "Compressing..." (during canvas re-encode) before "Uploading..." |
| No "what data we store" disclosure | Health-data trust deficit | Even one paragraph: "We store [fields] and your attachment in PocketBase. We do not share or analyse your data. You can export and delete at any time." On the empty state and once in settings. |

## "Looks Done But Isn't" Checklist

- [ ] **Per-user isolation:** Verify by logging in as user B and `pb.collection('wallecx_vaccinations').getList()` — must return only B's records. Then try `getOne(userA_record_id)` — must 404, not 200.
- [ ] **Filter injection:** Submit a vaccine_name with `"`, `\`, `||` in it; record must save successfully and lookup must find only that one record (not the whole collection).
- [ ] **File access without token:** Open a file URL in incognito — must 403 if `protected: true`.
- [ ] **Save round-trip:** Create a record, edit it, save again — confirm there's only one record on the server, not two (Pitfall 3).
- [ ] **Delete actually deletes:** Delete a record, then `pb.collection().getOne(id)` — must 404. File URL must 404.
- [ ] **EXIF stripped:** Upload a photo with known GPS; download from PocketBase; `exiftool` shows no GPS.
- [ ] **PDF.js version:** `package.json` pins `pdfjs-dist` ≥ 4.2.67. CSP allows `worker-src 'self' blob:`.
- [ ] **CSP not regressed:** `index.html` CSP is unchanged for `script-src` (only `worker-src` added narrowly).
- [ ] **No `v-html` in Wallecx:** `git grep "v-html" src/components/projects/wallecx` returns nothing.
- [ ] **No template-literal filters:** `git grep -E '\.collection.*filter.*\$\{' src/lib/pocketbase` and `src/components/projects/wallecx` return nothing.
- [ ] **Watcher fires on mount:** Navigate fresh to `/projects/wallecx` — list populates, no empty-state flash.
- [ ] **Save button disables during save:** Slow the network in devtools; double-click save; only one record appears.
- [ ] **Auth token not in production bundle:** `grep -r VITE_LOGIN dist/` returns nothing; `local.jsonc` creds rotated.
- [ ] **Mapper test:** `vaccinationMapper.spec.ts` covers the create-then-update sequence.
- [ ] **Route guard test:** `guard.spec.ts` (CONCERNS suggests this exists as a gap) covers `/projects/wallecx` redirect.
- [ ] **Data-export feature works:** "Download all my data" zip contains records JSON + files; file URLs no longer needed once user has the zip.
- [ ] **Subcomponent names:** `git grep "Components.*global" components.d.ts` — no Wallecx component collides with PrimeVue (`Card`, `Dialog`, `Button`).
- [ ] **Vercel deploy:** SPA route `/projects/wallecx/<uuid>` resolves on hard-refresh (Vercel auto-detected SPA rewrite is in effect — no `vercel.json` needed).
- [ ] **Speed Insights gated:** `<SpeedInsights v-if="import.meta.env.PROD">` (CONCERNS "Vercel Speed Insights fires in dev") so dev RUM doesn't include health-app routes.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| 1. Per-user rules wrong; data leaked | HIGH | (1) Tighten rules immediately; (2) audit PocketBase logs for cross-user `getList`/`getOne` reads — if any non-self reads happened, notify affected users; (3) rotate all auth tokens (`pb.authStore.clear()` server-side via revoke); (4) public post-mortem if external users affected. |
| 2. Filter injection exploited | HIGH | Same as #1 plus: rebuild affected mappers with parameterised filters; add a CI grep guard. |
| 3. Save loop creating duplicates | MEDIUM | Dedupe script: `getFullList` per user, group by `(vaccine_name, date_administered)`, keep oldest, delete the rest, reattach files if needed. |
| 4. Delete UI didn't actually delete | MEDIUM | Re-fetch, compare with last-known UI state, prompt user "We found N records you may have intended to delete — review now." |
| 5. Malicious PDF executed via PDF.js XSS | CRITICAL | Force re-auth all users; rotate PocketBase JWT signing key; review storage for malicious PDFs and quarantine; pin PDF.js fix; CVE response. |
| 6. Orphan files | LOW | One-time sweep script: list all `wallecx_vaccinations` files in storage, cross-reference with `record.attachment`, delete dangling. |
| 7. EXIF GPS leaked | MEDIUM | One-time backfill: download every existing attachment, re-encode through canvas, re-upload, update record. Notify users. |
| 8. File field too small / wrong MIME | LOW | Update collection schema; existing records unaffected; new uploads get the new limits. |
| 9. File URL exposed without protection | MEDIUM | Set `protected: true` on the field; existing URLs become invalid; affected users see broken images and re-fetch with new tokens. Document the change. |
| 10. `v-html` regression | LOW (if caught early) | Revert; sanitize on write; add unit test. |
| 11. Race condition duplicates | LOW | Same as #3 but smaller scope. |
| 12. Empty-state flash | LOW (UX only) | Add `{ immediate: true }` and ship. |
| 13. Dev creds leaked to bundle | CRITICAL | Rotate creds; remove `VITE_LOGIN_*`; redeploy; review access logs since last build. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---|---|---|
| 1. Per-user isolation in collection rules | **Phase 1** (cannot ship without) | Two-user smoke test in checklist |
| 2. Filter-string injection | **Phase 1** (set the convention in the first mapper) | CI grep + unit test with `"` in input |
| 3. Save loop never refreshes IDs | **Phase 1** (mapper contract) | `vaccinationMapper.spec.ts` create-then-update test |
| 4. Delete only mutates local state | **Phase 1** (handler contract) | Spec asserts `pb.delete` called before splice |
| 5. PDF.js XSS / unsafe rendering | **Phase 1** if PDF preview ships, else **Phase 2** | Pinned version in `package.json`; CSP audit |
| 6. Cascade delete leaves files | **Phase 1** (single-collection design) | File URL 404 within 5 s after record delete |
| 7. EXIF GPS leak | **Phase 1** (privacy is core to the value prop) | Round-trip test with `exiftool` |
| 8. File field misconfiguration | **Phase 1** (schema decision) | Smoke upload of 8 MB photo, of PDF, of `.exe` (rejected) |
| 9. File URL public-by-knowledge | **Phase 1** (`protected: true`) | Incognito file URL fetch must 403 |
| 10. `v-html` for notes | **Phase 1** decision (no rich text in v1); **Phase 2+** if introduced | Static analysis: no `v-html` under `wallecx/` |
| 11. Double-submit race | **Phase 1** (button state machine) | Slow-network double-click test |
| 12. Watcher not immediate | **Phase 1** | Manual nav-to-route test; covered by route-guard spec |
| 13. Dev creds in bundle | **Phase 0** cleanup (or first task in Phase 1) | `grep -r VITE_LOGIN dist/` empty; CI grep on `src/` |

## Sources

**Verified — HIGH confidence**
- [PocketBase docs — Files upload and handling](https://pocketbase.io/docs/files-handling/) — `maxSize` defaults to 5 MB; `maxSize * maxSelect` is request body limit; thumb sizes
- [PocketBase docs — Web APIs reference: Files](https://pocketbase.io/docs/api-files/) — file URLs, `?token=`, `?thumb=` query params
- [PocketBase docs — API rules and filters](https://pocketbase.io/docs/api-rules-and-filters/) — `@request.auth.id`, parameterised filter syntax `{:name}`
- [PocketBase issue #151 — cascade delete doesn't remove files](https://github.com/pocketbase/pocketbase/issues/151) — cited Pitfall 6
- [PocketBase discussion #5246 — cascade delete CPU](https://github.com/pocketbase/pocketbase/discussions/5246) — async file deletion
- [PocketBase JSVM FileField reference](https://pocketbase.io/jsvm/classes/FileField.html) — `MaxSelect`/`MaxSize` semantics
- [Codean Labs — CVE-2024-4367 PDF.js arbitrary JS execution](https://codeanlabs.com/blog/research/cve-2024-4367-arbitrary-js-execution-in-pdf-js/) — PDF.js < 4.2.67 XSS
- [Snyk advisory — pdfjs-dist XSS (CVE-2018-5158)](https://security.snyk.io/vuln/SNYK-JS-PDFJSDIST-469200) — older PDF.js precedent
- [Vue.js Security Guide](https://vuejs.org/guide/best-practices/security.html) — `v-html` warnings
- [Syncfusion blog — Top Security Risks in JavaScript PDF Viewers](https://www.syncfusion.com/blogs/post/security-vulnerabilities-javascript-pdf-viewer) — CSP for PDF.js worker

**Verified — MEDIUM confidence (web-search corroborated)**
- Browser canvas as EXIF stripper — multiple 2025 client-side tool implementations confirm canvas re-encode drops metadata. [exif.tools](https://exif.tools/strip), [SimpleTool](https://www.simpletool.co/strip-exif).

**Repo-internal — HIGH confidence (read directly)**
- `.planning/codebase/CONCERNS.md` — full document; specific items cross-referenced inline by quoted heading (Pitfalls 1, 2, 3, 4, 10, 12, 13).
- `.planning/codebase/INTEGRATIONS.md` — confirms Vercel-only-proxies-SPA (no `vercel.json`, no API routes) → Pitfall section "Integration Gotchas / Vercel hosting".
- `.planning/PROJECT.md` — locks the field set (no over-collection), Phase-1 boundaries, and the Core Value statement that frames privacy as table-stakes.

---
*Pitfalls research for: Wallecx vaccination records on PocketBase + Vue 3 SPA*
*Researched: 2026-05-10*
