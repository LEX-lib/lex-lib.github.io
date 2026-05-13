# Pitfalls Research — Wallecx v2.0 Membership Cards

**Domain:** Barcode/QR rendering + fullscreen scan display + second PocketBase record type + hex colour picker in Vue 3 SPA.
**Researched:** 2026-05-13
**Confidence:** HIGH for barcode-library behaviour and PrimeVue ColorPicker (verified against official docs and GitHub issue tracker), HIGH for Wake Lock API (MDN + caniuse.com), MEDIUM for fullscreen iOS behaviour (community reports + Apple forums), MEDIUM for PocketBase multi-collection patterns (official docs + community discussions).

> This document covers NEW pitfalls introduced by the v2.0 membership-cards milestone. Pitfalls already solved in the vaccination records slice (per-user isolation, save-loop, EXIF GPS, isSaving guard, filter injection, v-html) are **not** repeated here — they are addressed patterns that must be carried forward into the new `wallecx_memberships` collection using the same conventions.

---

## Section 1: Barcode Rendering Pitfalls

### BR-1: JsBarcode throws an uncaught exception on invalid input, crashing the component

**What goes wrong:**
JsBarcode validates barcode values against format-specific rules before rendering. If the value fails validation — wrong length for EAN-13, non-numeric characters in a numeric-only format, characters outside the Code39 charset — it throws a synchronous `Error` with message like `"[value] is not a valid input for [format]"`. Because the throw happens inside a Vue `onMounted` or watcher callback where the template has already rendered the `<svg>` element, Vue catches it in the component lifecycle but the error propagates to the global error handler (if one exists) or silently swallows it (if not). The user sees a blank barcode area with no explanation.

**Why it happens:**
JsBarcode was designed for Node.js and browser scripting, not reactive frameworks. It has no "soft fail" mode — it either renders or throws. Vue 3 `watch` callbacks do not automatically catch synchronous exceptions from the watched handler; the exception surfaces as an unhandled promise rejection only when the watcher is async.

Specific format constraints that bite real users:
- **EAN-13**: must be exactly 13 digits; the 13th is a checksum digit JsBarcode validates. A 12-digit retail barcode (EAN-12 / UPC-A) throws unless the checksum digit is appended.
- **Code39**: uppercase letters, digits, and `- . $ / + % SPACE` only. Lowercase letters throw. Asterisks (`*`) are the start/stop symbol — if a user's card value includes a `*` it throws.
- **Code128**: accepts any ASCII but length matters; extremely long values can produce SVGs wider than the viewport without throwing, just silently rendering off-screen.
- **ITF** (Interleaved 2 of 5): must have an even number of digits; an odd-length numeric string throws.

**Prevention:**
1. Wrap every JsBarcode render call in `try/catch`. On catch, set a `barcodeError: string | null` reactive ref and render a fallback UI (the plain card number in large text) instead of the SVG.
2. Add client-side pre-validation in the `ManageMembership.vue` form using Zod: `z.string().regex(/^\d{13}$/)` for EAN-13, `z.string().regex(/^[A-Z0-9\-\.\$\/\+\% ]+$/)` for Code39. Show inline field errors before the user hits save.
3. The fallback must be a visible element, not an empty `<div>`. Render the card number as large plain text with a "Barcode unavailable" caption.
4. Never pass an empty string to JsBarcode — check `barcodeValue.trim() !== ''` before calling.

**Phase assignment:** Phase implementing barcode rendering (MembershipCard component). The try/catch fallback must be present from day one — it cannot be added later after users have saved invalid-format values.

---

### BR-2: QR code renders invisibly on dark card backgrounds — contrast failure

**What goes wrong:**
QR codes rendered with `qrcode.vue` or similar libraries default to black-on-white (`#000000` on `#ffffff`). When the card's `card_color` is a dark colour (navy, charcoal, dark green), the developer may try to match the QR code's foreground/background to the card palette. Dark-on-dark QR codes fail to scan: most phone scanner algorithms require a minimum contrast ratio of 3:1 between modules and background; effective scanning requires 4.5:1 or higher. Even if the code is technically visible to the human eye, the camera sensor may not capture sufficient contrast under overhead fluorescent lighting.

Additionally, QR codes rendered with a red or orange foreground colour fail on some cameras because the sensor struggles to distinguish red wavelengths as "dark" — the camera sees a red module as too bright and loses the pattern.

**Why it happens:**
The card colour controls the visual identity of the card tile; it is tempting to style the barcode to match. The standard says barcode foreground must be dark relative to background — not relative to the card's accent colour.

**Prevention:**
1. Always render QR codes and linear barcodes with a **white background panel** (`#ffffff`) and **black foreground** (`#000000`), regardless of the card's `card_color`. Wrap the SVG/canvas in a `rounded-md bg-white p-2` container.
2. Never expose `colorDark` / `colorLight` props to end users. The barcode rendering is a functional element, not a design element.
3. Explicitly prohibit red, orange, and warm-light foreground values in the barcode renderer props — use constants `BARCODE_FOREGROUND = '#000000'` and `BARCODE_BACKGROUND = '#ffffff'` with no overrides from card data.
4. In fullscreen scan mode, add extra white padding around the barcode (quiet zone) — QR code specs require 4 module-widths of quiet zone; most library defaults provide this but verify it isn't clipped by the card layout.

**Phase assignment:** Phase implementing barcode rendering and fullscreen scan view.

---

### BR-3: Bundle size spike from including all JsBarcode format encoders

**What goes wrong:**
The standard JsBarcode import (`import JsBarcode from 'jsbarcode'`) loads all supported barcode formats: Code128, Code39, EAN, UPC, ITF, Pharmacode, Codabar, MSI — totalling approximately 47 kB minified / 11 kB gzipped. For a Vite/rolldown build the tree-shaker can only eliminate JsBarcode encoders if the library provides named ESM exports, which the current JsBarcode release (`3.11.6`) does not — it ships a UMD bundle that treats the whole library as one chunk. The result is the full 47 kB is always bundled even if only Code128 is used.

For QR codes, `qrcode` (the underlying library for `qrcode.vue`) adds approximately 40 kB minified / 15 kB gzipped.

Combined: approximately 26 kB gzipped added to the Wallecx chunk if both are imported eagerly.

**Why it happens:**
Wallecx is a mini-app under `/projects/wallecx`. If the barcode/QR libraries are imported at the top of `WallecxApp.vue` or `MembershipCard.vue`, Vite bundles them into the Wallecx route chunk, which is already lazy-loaded from the router. The size hit is confined to the Wallecx chunk, not the global bundle — but it still affects Wallecx first-load time on slow mobile connections.

**Prevention:**
1. Keep the barcode/QR imports inside the `MembershipCard.vue` component (or a dedicated `MembershipBarcode.vue` subcomponent) so Vite can split them into a sub-chunk. Since `WallecxApp.vue` lazy-loads `MembershipCard.vue` only when the Memberships tab is active, there is a natural split point.
2. Use `defineAsyncComponent(() => import('./MembershipBarcode.vue'))` for the barcode subcomponent with a `<Skeleton>` loading slot — this defers the ~26 kB until the user first navigates to the memberships tab.
3. For JsBarcode, prefer format-specific imports if the library ever ships per-format ESM: `import { CODE128 } from 'jsbarcode/src/barcodes/CODE128'`. For now, import the full library but keep it isolated to the barcode component.
4. Run `npm run build` and check the Rollup chunk report after adding the libraries. Anything over 50 kB gzipped for the Wallecx chunk warrants attention.

**Phase assignment:** Phase implementing membership card grid and barcode rendering.

---

### BR-4: `qrcode.vue` Canvas vs SVG — canvas fails in strict CSP environments

**What goes wrong:**
`qrcode.vue` offers both `QrcodeCanvas` (renders to `<canvas>`) and `QrcodeSvg` (renders to inline SVG). If the existing Lexarium `index.html` CSP includes `default-src 'self'` without explicitly allowing `blob:` or if canvas-to-blob operations are restricted, `QrcodeCanvas` may fail silently. Additionally, canvas-rendered QR codes cannot be right-click-saved as images in some browsers.

SVG QR codes are preferable because they are resolution-independent (crisp on high-DPI screens), scale correctly in fullscreen mode without pixelation, and are not affected by canvas CSP restrictions.

**Prevention:**
1. Use `QrcodeSvg` (or the `render-as="svg"` prop) for all QR code rendering. Do not use canvas for QR codes in this project.
2. For JsBarcode (linear barcodes), the library renders to SVG by default when passed an `<svg>` element reference — prefer SVG over canvas here too.
3. SVG output scales perfectly to fullscreen without blur. Canvas at standard DPI appears pixelated when scaled up in fullscreen mode.
4. Verify the existing CSP in `index.html` does not need updating for SVG inline rendering (it does not — inline SVG is part of the HTML document and covered by `default-src 'self'`).

**Phase assignment:** Phase implementing barcode rendering.

---

### BR-5: Watcher-driven barcode re-render fires before the SVG element mounts

**What goes wrong:**
A common pattern is to `watch(barcodeValue, () => JsBarcode('#barcode-svg', barcodeValue.value, options))`. If the component conditionally renders the `<svg id="barcode-svg">` element (e.g., inside a `v-if="barcodeValue"`), the watcher may fire before the DOM element exists on the first render cycle. `document.querySelector('#barcode-svg')` returns `null`, and JsBarcode receives `null` — throwing a second type of error distinct from the invalid-input error.

**Why it happens:**
Vue 3's reactivity updates the DOM asynchronously. A synchronous watcher fires before the `v-if` branch has had a chance to insert the element. Using `{ immediate: true }` on the watcher without `nextTick` guarantees is the most common trigger.

**Prevention:**
1. Use `templateRef` (`const svgRef = useTemplateRef<SVGElement>('barcode-svg')`) and render JsBarcode against the ref, not a DOM query. The ref is `null` until mount, which you can check.
2. Wrap the JsBarcode call in `nextTick` when triggered by a watcher: `watch(barcodeValue, async () => { await nextTick(); if (svgRef.value) JsBarcode(svgRef.value, ...); })`.
3. Alternatively, use `onMounted` + `watch` without `{ immediate: true }`: `onMounted(() => renderBarcode())` + `watch(barcodeValue, renderBarcode)`. This avoids the race entirely.
4. For `qrcode.vue`, the `QrcodeSvg` component handles its own reactive re-rendering via props — no manual DOM manipulation needed; this pitfall only applies to direct JsBarcode usage.

**Phase assignment:** Phase implementing barcode rendering in card components.

---

## Section 2: Fullscreen Scan Display Pitfalls

### FS-1: Screen dims and locks during barcode scan — the Wake Lock API is required

**What goes wrong:**
A user opens the fullscreen scan overlay, holds the phone up to the counter scanner, and the screen auto-dims (5–15 seconds on iOS/Android defaults) or locks (30–60 seconds). The barcode disappears. The user has to unlock, navigate back, and try again. In a queue at a pharmacy or transport gate, this is a significant UX failure.

**Why it happens:**
Phone OS screen timeout applies to web pages including PWA fullscreen views. There is no CSS or HTML attribute to prevent dimming. The JavaScript `Screen Wake Lock API` (`navigator.wakeLock.request('screen')`) is the only browser-native solution.

**Browser support as of 2026-05:**
- Chrome (Android): supported since Chrome 84
- Safari (iOS): supported since iOS 16.4 — but **a bug broke Wake Lock in installed PWA mode until iOS 18.4** (Apple fixed in March 2025). In iOS 18.4+ it works correctly.
- Firefox: supported since Firefox 126
- The API is available in **secure contexts only** (HTTPS) — Vercel deployments satisfy this.

**Prevention:**
1. In the fullscreen scan overlay `onMounted`, call `navigator.wakeLock.request('screen')` inside a `try/catch`. Store the sentinel: `const wakeLock = ref<WakeLockSentinel | null>(null)`.
2. Release the wake lock in `onUnmounted` and when the overlay closes: `wakeLock.value?.release()`.
3. The wake lock is auto-released when the tab becomes hidden (user switches apps). Re-acquire it on `visibilitychange`: `document.addEventListener('visibilitychange', () => { if (!document.hidden) wakeLock.value = await navigator.wakeLock.request('screen'); })`.
4. Guard with feature detection: `if ('wakeLock' in navigator)` — do not throw if unsupported (older iOS Safari 16.3 and below).
5. Do **not** rely on Wake Lock to also increase brightness — the API prevents dimming but cannot force maximum brightness. Inform users via a tooltip: "Keep screen bright for best scanning."

**Phase assignment:** Phase implementing fullscreen scan overlay.

---

### FS-2: The Fullscreen API does not work on iPhones — use a viewport overlay instead

**What goes wrong:**
`document.documentElement.requestFullscreen()` works on Android Chrome and desktop browsers. On iPhone (all iOS versions before iOS 26), the Fullscreen API is **not supported for non-video elements**. Calling `requestFullscreen()` on an iPhone returns a rejected promise or `undefined`. As of iOS 26 (September 2025), Safari added support — but devices on iOS 17/18 will remain on the old behaviour for years.

**Why it happens:**
Apple historically restricted the Fullscreen API on iPhone to video elements only. iPad had limited support with vendor prefixes (`webkitRequestFullscreen`). The restriction existed from iOS 12 through iOS 18, affecting the majority of current real-world devices.

**Prevention:**
1. Do not implement the fullscreen scan view via the Fullscreen API. Instead, implement it as a `position: fixed; inset: 0; z-index: 9999` overlay div that covers the entire viewport. This works identically on all devices.
2. Use Tailwind classes: `fixed inset-0 z-50 bg-black flex flex-col items-center justify-center`.
3. Set `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` (already present in most Vite-generated `index.html` files) to cover the notch area on iPhone.
4. The status bar will still be visible on iPhone in a browser tab — this is expected and acceptable. The QR/barcode can still be scanned with the status bar present.
5. If targeting installed PWA mode (Add to Home Screen), add `"display": "standalone"` to the web app manifest to get near-fullscreen on both iOS and Android.
6. Lock orientation to landscape is also not reliably possible (Screen Orientation API not supported on iOS Safari) — design the scan overlay to work in both portrait and landscape.

**Phase assignment:** Phase implementing fullscreen scan overlay.

---

### FS-3: Screen brightness cannot be increased via web APIs — manual instruction required

**What goes wrong:**
The user is in a dimly-lit store. The QR code needs maximum screen brightness to scan reliably. Web browsers have no API to programmatically set or increase screen brightness — the W3C Screen Brightness API is proposed (`WICG/proposals#17`) but not implemented in any browser as of 2026. Wake Lock prevents dimming but cannot go above the user's current brightness setting.

**Why it happens:**
Brightness control is considered a sensitive hardware API and has not been standardised for web access.

**Prevention:**
1. Display a persistent "Tip" message in the fullscreen overlay: "For best scanning: increase your screen brightness in Settings." Use a dismissible `Message` component from PrimeVue.
2. Set the fullscreen overlay background to pure black (`#000000`) everywhere except the white barcode panel — the contrast makes the barcode panel appear brighter to the scanner.
3. Use `QrcodeSvg` / SVG barcodes (not canvas) — SVG renders crisply at any DPI and does not have the slight gamma shift that canvas exhibits on OLED screens.
4. Do not promise "auto-brightness" in marketing copy or UI strings.

**Phase assignment:** Phase implementing fullscreen scan overlay.

---

### FS-4: Tap to exit fullscreen conflicts with tap to copy card number

**What goes wrong:**
The fullscreen overlay has a "tap anywhere to close" gesture. The card also shows the card number which should be tappable to copy to clipboard. These two interactions conflict: tapping the card number both copies it AND closes the overlay.

**Prevention:**
1. Use an explicit close button (X icon, top-right corner, large tap target: `min-h-[44px] min-w-[44px]`) rather than "tap anywhere to close."
2. If a background-tap-to-close gesture is desired, attach it only to the background overlay element (not the card content area), using `@click.self` on the outer div.
3. The copy-to-clipboard button should call `event.stopPropagation()` to prevent bubbling to any parent tap handlers.

**Phase assignment:** Phase implementing fullscreen scan overlay.

---

### FS-5: Fullscreen overlay stacking context interferes with PrimeVue Dialog z-index

**What goes wrong:**
PrimeVue Dialogs use `z-index: 1100` (Aura theme default). If the fullscreen overlay is rendered at `z-index: 9999` inside a `<Teleport to="body">`, the stacking works. But if the overlay is a sibling inside the same Vue component tree without a `<Teleport>`, it may be clipped by a parent `overflow: hidden` or `transform` — both of which create a new stacking context that traps the `z-index`.

**Prevention:**
1. Always render the fullscreen scan overlay via `<Teleport to="body">`. This ensures it is a direct child of `<body>` and participates in the root stacking context.
2. Set `z-index` to at least `1200` to clear PrimeVue's Dialog layer.
3. Test on mobile: PrimeVue's Drawer and Dialog components add CSS transforms for their slide/fade animations which create stacking contexts — the overlay must be teleported to escape them.

**Phase assignment:** Phase implementing fullscreen scan overlay.

---

## Section 3: Multi-Record-Type Pitfalls

### MR-1: Component name collision between Vaccination and Membership components

**What goes wrong:**
`unplugin-vue-components` auto-imports and globally registers every `.vue` file under `src/components/`. When adding membership card components alongside vaccination components in `src/components/projects/wallecx/`, generic names like `ManageRecord.vue`, `RecordCard.vue`, or `RecordDetail.vue` will collide if there is any vaccination component with a similar name — or worse, will shadow PrimeVue components (`Card`, `Dialog`, `Button`).

The existing PITFALLS.md (v1.0) already documents this for vaccination components. Adding a second record type doubles the surface area.

**Why it happens:**
All Wallecx subcomponents share the same global namespace via `unplugin-vue-components`. The plugin resolves conflicts by "last registered wins" — alphabetical file discovery order — so `ManageRecord.vue` for memberships silently overrides the vaccination `ManageVaccination.vue` if they are resolved in the same namespace.

**Prevention:**
1. Prefix all membership components with `Membership`: `MembershipCard.vue`, `ManageMembership.vue`, `MembershipDetail.vue`, `MembershipBarcode.vue`, `MembershipScanOverlay.vue`.
2. Keep the tab-navigation host in `WallecxApp.vue` — do not create a separate `MembershipApp.vue` that duplicates the auth/toolbar/drawer pattern.
3. After adding membership components, verify `components.d.ts` (the auto-generated file) to confirm no membership component name shadows a PrimeVue component or a vaccination component.
4. Run `git diff components.d.ts` after each new component addition as a sanity check.

**Phase assignment:** Phase implementing membership card list (first component added).

---

### MR-2: Forgetting to replicate per-user isolation rules on the new collection

**What goes wrong:**
The `wallecx_vaccinations` collection has correct per-user server-side rules (`user = @request.auth.id` in every rule). A new `wallecx_memberships` collection is created in PocketBase admin UI by clicking through quickly. The default rules are either permissive (`@request.auth.id != ""` only — any logged-in user can see any other user's cards) or empty (public access). Because the SPA still correctly filters by the current user in queries, casual testing passes — but any user can call the API directly to see all membership cards.

Membership cards contain card numbers, expiry dates, and potentially insurance card or government ID information — a privacy breach with real-world consequences.

**Prevention:**
1. Apply identical rules to `wallecx_memberships` as on `wallecx_vaccinations` before any frontend work begins:
   - `listRule`: `@request.auth.id != "" && user = @request.auth.id`
   - `viewRule`: `@request.auth.id != "" && user = @request.auth.id`
   - `createRule`: `@request.auth.id != "" && @request.data.user = @request.auth.id`
   - `updateRule`: `@request.auth.id != "" && user = @request.auth.id`
   - `deleteRule`: `@request.auth.id != "" && user = @request.auth.id`
2. Run the two-user smoke test immediately after collection creation (same test as vaccination Phase 1): log in as user B, attempt `pb.collection('wallecx_memberships').getList()` — must return zero records from user A's data.
3. Add this to the definition-of-done for the collection setup phase: "Two-user API isolation test passes before any UI work."

**Phase assignment:** Phase creating the `wallecx_memberships` PocketBase collection (must be first task).

---

### MR-3: WallecxApp.vue state explosion from two independent record lists

**What goes wrong:**
Following the vaccination pattern, a developer adds membership card state directly into `WallecxApp.vue`: `memberships`, `isLoadingMemberships`, `selectedMembership`, `showMembershipDetail`, `membershipFileToken`, `showManageMembership`, `manageMembership`, `showScanOverlay`, `scanMembership` — plus all the equivalent computed properties and handlers. `WallecxApp.vue` already has ~300 lines for vaccinations. A naively-duplicated membership implementation would push it past 600 lines, making both the vaccination and membership logic hard to maintain and test.

**Prevention:**
1. Extract membership state and logic into a dedicated Pinia store: `src/stores/wallecx/memberships.ts` (following the same shape as `useAuthStore`). Keep vaccination state in `WallecxApp.vue` (or extract it to `src/stores/wallecx/vaccinations.ts` for consistency).
2. `WallecxApp.vue` becomes an orchestrator: it delegates to the store and handles tab-switching between the Vaccinations and Memberships views.
3. A Pinia store also makes the mapper + store logic unit-testable independently of the component, consistent with `__tests__/vaccinationMapper.spec.ts`.
4. Tab state (`activeTab: 'vaccinations' | 'memberships'`) lives in `WallecxApp.vue` itself — it is UI state, not business logic.

**Phase assignment:** Phase implementing membership list view.

---

### MR-4: Membership mapper carries the same save-loop and id-refresh risk as vaccinations

**What goes wrong:**
The vaccination mapper (`vaccinationMapper.ts`) was designed to return the server response (with the real `id`) to the caller, enabling the `Object.assign` id-refresh pattern. If a `membershipMapper.ts` is written quickly by copy-paste and the `create` function returns `void` instead of the server record, the same duplicate-on-edit bug (Pitfall 3 from the v1.0 research) reappears for memberships.

**Prevention:**
1. `membershipMapper.ts` must follow the exact same contract as `vaccinationMapper.ts`: `createMembership()` returns `Promise<Memberships>` (the full server record, not void).
2. Add a `membershipMapper.spec.ts` with the create-then-update sequence test before wiring the form dialog.
3. Code-review checklist: `await pb.collection('wallecx_memberships').create(...)` must always be `const created = await ...` (captured, not discarded).

**Phase assignment:** Phase implementing membership CRUD (mapper and form dialog).

---

### MR-5: PocketBase auto-cancel silently drops the membership list fetch when vaccinations load in parallel

**What goes wrong:**
`WallecxApp.vue` loads vaccination records on `onMounted`. If membership records are also fetched on `onMounted` in the same component (or a child component mounted at the same time), PocketBase's default auto-cancellation (`$autoCancel: true`) treats two `getFullList` calls to different collections as potentially duplicate requests and cancels one of them. The cancelled request resolves with an empty array without throwing — the user sees a memberships list that is always empty until they navigate away and back.

**Why it happens:**
PocketBase SDK's auto-cancellation keying is based on collection name + query parameters. Two separate collections should not collide — but if any wrapper function re-uses the same AbortController or the same cancellation key is generated, the second request is silently dropped.

**Prevention:**
1. Explicitly set `{ requestKey: null }` (or a unique string key) on every `getFullList` call: `pb.collection('wallecx_memberships').getFullList({ requestKey: 'memberships-init', sort: '-created' })`. This opts out of auto-cancellation for the initial load.
2. Alternatively, fetch vaccinations and memberships sequentially in `onMounted` with `await` between them — no parallelism, no cancellation risk. The extra latency (~100–200ms) is acceptable on initial load.
3. If parallel fetching is used for performance, use `Promise.all([vaccinationsPromise, membershipsPromise])` where each promise uses a distinct `requestKey`.

**Phase assignment:** Phase implementing the tab-switching WallecxApp with both record types.

---

## Section 4: Color Picker Pitfalls

### CP-1: PrimeVue ColorPicker stores hex WITHOUT the leading `#` — CSS `background-color` will not accept it

**What goes wrong:**
PrimeVue `<ColorPicker v-model="card_color" format="hex">` stores and emits hex values **without** the leading `#`. Example: the user picks navy blue; `card_color.value` is `'002244'`, not `'#002244'`. If this value is used directly in a CSS binding — `:style="{ backgroundColor: card_color }"` — the browser ignores the invalid colour value and the card renders with no background colour (transparent or default). The card grid looks broken.

This is confirmed by the PrimeVue documentation example showing `6466f1` (no hash), and is consistent with the PrimeVue source code which does not prepend `#` when emitting values.

**Prevention:**
1. Store `card_color` in the database **without** the `#` prefix (matching what ColorPicker emits). This avoids a strip-on-save / add-on-load transform.
2. Create a single utility function used everywhere: `function toCSS(hex: string): string { return hex.startsWith('#') ? hex : '#' + hex; }`.
3. In all style bindings: `:style="{ backgroundColor: toCSS(card.card_color) }"`. Never interpolate `card_color` directly into a CSS string.
4. In the form, `v-model` binds directly to the local `formState.card_color` ref — no transformation needed on the ColorPicker side.
5. When reading a card from PocketBase, the stored value is already hash-free; pass it directly to `<ColorPicker v-model="formState.card_color">` — no strip needed.

**Phase assignment:** Phase implementing membership card form and card grid display.

---

### CP-2: Three-digit hex shorthand is misinterpreted by PrimeVue ColorPicker

**What goes wrong:**
If a user types a 3-digit hex shorthand (`fff`, `000`, `f0a`) into any companion text input wired to the same `v-model` as the ColorPicker, PrimeVue ColorPicker misinterprets it and displays the wrong colour. This is an open enhancement issue in the PrimeVue tracker (issue #7505, March 2025 — unfixed as of research date). The misinterpretation is silent — no error is thrown, the picker just shows an incorrect preview.

**Why it happens:**
ColorPicker's internal parser expects exactly 6 hex digits. A 3-character string is treated as a truncated 6-character string with implicit trailing zeros, not as CSS shorthand.

**Prevention:**
1. Do not provide a free-text hex input field in the membership form. Use only the ColorPicker widget for colour selection. This eliminates the shorthand input path entirely.
2. If a text input is added in the future (for power users), normalize 3-digit input to 6-digit before passing to ColorPicker: `hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex`.
3. Add Zod validation on the `card_color` field in the form schema: `z.string().regex(/^[0-9a-fA-F]{6}$/, 'Invalid colour — use a 6-digit hex code')`.

**Phase assignment:** Phase implementing membership card form.

---

### CP-3: ColorPicker initial value ignored when used inside PrimeVue Forms (Forms library bug)

**What goes wrong:**
When `<ColorPicker>` is used inside PrimeVue's `<Form>` component (the `@primevue/forms` controlled-form system), the initial value bound via `v-model` or `:defaultValue` is ignored — the picker always starts showing red (`#ff0000`). This is PrimeVue issue #8135, reported September 2025, unfixed as of research date.

**Why it happens:**
PrimeVue Forms initialises the internal field state from the `defaultValues` prop of the `<Form>` component. ColorPicker has a bug in how it syncs its internal HSB/canvas state from the provided initial hex value when instantiated inside the Form context.

**Prevention:**
1. Do **not** use `<ColorPicker>` inside a PrimeVue `<Form>` wrapper. Use the existing `<form>` + direct `v-model` pattern that Wallecx vaccination forms already use (not the `@primevue/forms` controlled system).
2. The vaccination form (`ManageVaccination.vue`) uses direct refs + `v-model` per field — follow this exact pattern for `ManageMembership.vue`.
3. When editing an existing card, set the local form state ref directly: `formState.card_color = existingCard.card_color` in a `watch(props.record, ...)` handler (same pattern as vaccination edit flow).

**Phase assignment:** Phase implementing membership card form (especially edit flow).

---

### CP-4: Very dark or very light card colours make white or black text unreadable

**What goes wrong:**
The membership card grid shows card name, issuer, and card number text over the `card_color` background. If a user picks a very dark colour (close to black) and the text is dark, or a very light colour and the text is light, the card becomes illegible. There is no built-in readability enforcement in PrimeVue ColorPicker.

**Prevention:**
1. Implement automatic text colour selection based on card background luminance. A simple algorithm: convert hex to RGB, compute relative luminance (`L = 0.2126*R + 0.7152*G + 0.0722*B`), use white text for L < 0.5, black text for L >= 0.5.
2. Export this as a pure utility function `getContrastText(hex: string): '#000000' | '#ffffff'` and use it in both the card grid tile and the fullscreen scan overlay.
3. No user preference needed — this should be automatic and invisible.

**Phase assignment:** Phase implementing membership card grid display.

---

### CP-5: Storing card_color as a plain `text` field with no server-side hex validation

**What goes wrong:**
PocketBase does not have a native `color` field type (open feature request, discussion #400 — unimplemented as of 2026). Storing `card_color` as a plain `text` field with no regex constraint means a user (or a crafted API request bypassing the SPA) can store arbitrary strings: empty string, CSS colour names (`red`), injection payloads, or excessively long strings.

If `card_color` is rendered via `:style="{ backgroundColor: toCSS(card.card_color) }"` and the stored value is something like `red; position: fixed` — this is not a CSS injection risk in Vue because Vue's `:style` binding only sets the named property value, not raw CSS. However, an empty string causes the card to render with no background colour, and a non-hex value causes the colour to be silently ignored.

**Prevention:**
1. Add a PocketBase `text` field with a pattern constraint (regex) on `card_color`: `^[0-9a-fA-F]{6}$` (6 hex digits, no hash). PocketBase supports regex field validation in the admin UI.
2. Also validate client-side in the Zod schema (same regex) so the form rejects invalid values before the API call.
3. Provide a sensible default value in the form: `card_color: '1a56db'` (a readable navy/blue) so new cards always have a valid colour even if the user skips the picker.
4. In the card grid, add a fallback in the style binding: `toCSS(card.card_color || '1a56db')`.

**Phase assignment:** Phase creating the `wallecx_memberships` collection schema and Phase implementing the membership form.

---

## Phase Assignment Summary

| Pitfall | Code | Phase |
|---------|------|-------|
| JsBarcode throws on invalid input (no try/catch + fallback) | BR-1 | Barcode rendering component |
| QR code invisible on dark card — contrast failure | BR-2 | Barcode rendering + card grid |
| JsBarcode full-format bundle not tree-shakeable | BR-3 | Barcode rendering component |
| Canvas QR vs SVG — use SVG | BR-4 | Barcode rendering component |
| Watcher fires before SVG element mounts | BR-5 | Barcode rendering component |
| Screen dims/locks during scan — Wake Lock required | FS-1 | Fullscreen scan overlay |
| Fullscreen API unsupported on iPhone — use viewport overlay | FS-2 | Fullscreen scan overlay |
| Screen brightness cannot be set via web API | FS-3 | Fullscreen scan overlay |
| Tap-to-close conflicts with tap-to-copy | FS-4 | Fullscreen scan overlay |
| Overlay z-index trapped by parent stacking context | FS-5 | Fullscreen scan overlay |
| Component name collision between record types | MR-1 | First membership component |
| Per-user isolation rules not applied to new collection | MR-2 | Collection creation (first task) |
| WallecxApp.vue state explosion from two record types | MR-3 | Membership list view |
| Membership mapper save-loop (copied id-refresh bug) | MR-4 | Membership CRUD mapper |
| PocketBase auto-cancel drops parallel collection fetches | MR-5 | WallecxApp tab integration |
| ColorPicker emits hex without `#` — CSS binding breaks | CP-1 | Membership form + card grid |
| 3-digit hex shorthand misinterpreted by ColorPicker | CP-2 | Membership form |
| ColorPicker initial value ignored in PrimeVue Forms | CP-3 | Membership form (edit flow) |
| Dark/light card colour makes text unreadable | CP-4 | Card grid display |
| No server-side hex validation on card_color text field | CP-5 | Collection schema + form |

---

## Sources

**HIGH confidence — official documentation or verified library source:**
- [PrimeVue ColorPicker docs](https://primevue.org/colorpicker/) — confirms hex format stores without `#`, format options
- [PrimeVue issue #7505](https://github.com/primefaces/primevue/issues/7505) — 3-digit hex misinterpretation (open, March 2025)
- [PrimeVue issue #8135](https://github.com/primefaces/primevue/issues/8135) — ColorPicker initial value ignored in Forms (open, September 2025)
- [MDN — Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) — full API reference
- [caniuse.com — Wake Lock](https://caniuse.com/wake-lock) — browser support matrix
- [web.dev — Screen Wake Lock supported in all browsers](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers) — Safari 16.4+ confirmed
- [JsBarcode issue #269](https://github.com/lindell/JsBarcode/issues/269) — invalid input exception details
- [JsBarcode issue #212](https://github.com/lindell/JsBarcode/issues/212) — uncaught exception on invalid value
- [JsBarcode Code39 wiki](https://github.com/lindell/JsBarcode/wiki/CODE39) — charset restrictions
- [caniuse.com — Fullscreen API](https://caniuse.com/fullscreen) — iPhone restriction documented
- [PocketBase discussion #400](https://github.com/pocketbase/pocketbase/discussions/400) — no native color field type
- [QR code color contrast guidelines — Pageloot](https://pageloot.com/blog/qr-code-color-contrast-best-practices/) — minimum 3:1 ratio requirement
- [QR codes on dark backgrounds — SmartyTags](https://www.smartytags.com/blog/qr-codes-dark-backgrounds) — inversion and contrast failure

**MEDIUM confidence — community reports + Apple forums:**
- [Apple Community — screen brightness for barcode](https://discussions.apple.com/thread/254421438) — iOS brightness behaviour
- [W3C Screen Wake Lock issue #129](https://github.com/w3c/screen-wake-lock/issues/129) — brightness API gap acknowledged
- [magicbell PWA iOS limitations guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — iOS 18.4 Wake Lock PWA fix
- [Apple Developer Forums — Fullscreen API iOS Safari](https://developer.apple.com/forums/thread/133248) — iPhone limitation

---
*Pitfalls research for: Wallecx v2.0 Membership Cards — barcode rendering, fullscreen scan, multi-record type, colour picker*
*Researched: 2026-05-13*
