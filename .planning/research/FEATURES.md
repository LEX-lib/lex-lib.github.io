# Feature Research: Wallecx v2.0 — Membership / Loyalty Cards

**Domain:** Digital wallet for personal loyalty, membership, and ID cards with barcode/QR display
**Researched:** 2026-05-13
**Confidence:** HIGH (barcode formats, standard card fields, UX patterns from Apple Wallet / Google Wallet specs and multiple live apps); MEDIUM (differentiator value judgment, per-card-type barcode defaults)

---

## Scope Anchor

This research covers the NEW membership cards feature added in v2.0. Vaccination records, PocketBase auth, PrimeVue UI, and the navy/amber design system are already built — do not re-research them. Focus: what does a personal membership/loyalty/ID card store need to ship and what are the field, barcode, and UX patterns that the ecosystem has established?

## Reference Products Surveyed

| Product | Category | What It Represents |
|---------|----------|--------------------|
| Apple Wallet (PassKit) | OS-level wallet | Canonical field schema and barcode symbology spec |
| Google Wallet (Passes API) | OS-level wallet | Layout constraints, field structure, pass types |
| Stocard (ceased Dec 2024, absorbed by Klarna) | Dedicated loyalty wallet | Dominant market player; feature set represents category table stakes |
| Barcodes: Loyalty Card Wallet (trybarcodes.com) | Dedicated loyalty wallet | Active iOS-first replacement for Stocard niche |
| FidMe (still active) | Loyalty + cashback hybrid | 10,000+ pre-loaded brand cards, QR/barcode/stamps |
| Key Ring | Loyalty + coupons | Store cards + shopping lists integration |
| SuperCards (App Store) | Stocard successor | Post-Stocard migration target; same use-case |

---

## Table Stakes

Features users expect from any card-wallet app. Missing these makes the product feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Create a card manually (name, issuer, barcode value, card number) | Core CRUD; every loyalty wallet supports this | LOW | PrimeVue Dialog + Zod + PocketBase; mirrors vaccination pattern |
| View all cards in a visual grid | Wallet-feel; cards as coloured tiles, not rows | LOW-MED | CSS grid of card components; 2-column default matching vaccination toggle |
| Full-screen barcode / QR display on card tap | Primary use case: show phone at counter | MED | See Fullscreen UX Patterns section below |
| Barcode rendering from stored value + type | Without rendering the barcode is just a number string | MED | JsBarcode (1D) + qrcode.vue (QR); see Library section |
| Edit card details | Card numbers change, expiry rolls over | LOW | Same ManageCard dialog pre-filled |
| Delete a card | Removing old/cancelled memberships | LOW | Confirm dialog; existing pattern |
| Fallback plain number display when no barcode | Some cards have no scannable code, just a number | LOW | If `barcode_value` is empty, show `card_number` as styled text |
| Card colour personalisation | Differentiates cards visually; every wallet app does it | LOW | `card_colour` hex field; colour-picker in the form |
| Per-user isolation (same as vaccinations) | Wallet data is personal; cross-user leak is a trust failure | LOW | PocketBase collection rules: `@request.auth.id = user.id` |
| Expiry date field (optional) | Gym memberships, insurance cards, gift cards all expire | LOW | Date field; show visual warning when near or past expiry |
| Empty state + loading + error states | Zero-card new users need a clear CTA | LOW | Mirrors vaccination pattern; "Add your first card" |
| Confirm before delete | A deleted loyalty card is mildly annoying to recover | LOW | PrimeVue ConfirmDialog |
| Notes field | Membership number PIN, redemption instructions, contact number | LOW | Plain textarea |

---

## Differentiators

Features that set a personal card vault apart. Not required at launch but add genuine value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Card photo / custom background image | Upload the physical card's artwork for visual identity | LOW-MED | Optional file field (`card_image`); shown as card background or thumbnail |
| Category / card type tagging | Filter by Loyalty, Gym, Insurance, Library, Transport | LOW | Enum or free-text `card_type` field; enables grouped view |
| Search + sort on card grid | At 20+ cards, scroll-to-find fails | LOW | Mirrors vaccination search/sort — can reuse toolbar pattern |
| Screen brightness boost on fullscreen view | Dark-environment scanning (counter scanners need contrast) | LOW | `document.documentElement.style.filter = 'brightness(1.5)'`; reset on exit |
| Screen wake-lock during fullscreen scan | Prevents auto-sleep mid-scan at checkout | LOW-MED | Web Screen Wake Lock API (`navigator.wakeLock.request('screen')`) — good browser support since 2022 |
| Wallecx tab navigation (Vaccinations / Memberships) | Single Wallecx entry point with two sections | LOW | PrimeVue TabView or router-based tabs |
| Landscape orientation hint on fullscreen for wide barcodes | Code128 barcodes are wide; landscape scan reads better | LOW | CSS `@media (orientation: portrait)` hint; CSS `transform: rotate` trick |
| Card grid view vs list view toggle | Matches existing vaccination view-toggle pattern | LOW | Reuse the existing toggle UX |

---

## Anti-Features

Features commonly built in the category that are wrong for this scope.

| Feature | Why Tempting | Why Wrong for Wallecx | Alternative |
|---------|--------------|----------------------|-------------|
| NFC tap-to-add cards | Stocard announced it; feels modern | Requires native app capability; not available in a browser-deployed SPA (Web NFC is Android-Chrome-only and not Wallecx's deployment target) | Manual barcode value entry + optional card photo |
| Integration with merchant loyalty APIs (live points balance) | FidMe / Key Ring fetch real-time balances | Requires per-merchant OAuth, API keys, and maintenance as APIs change — far beyond a personal vault mini-app | Store the card; the user checks points in the merchant's own app |
| Apple Wallet / Google Wallet export | "Add to Apple Wallet" button | Requires server-side PassKit cert signing (Apple) or Google service account (Google) — server infrastructure Wallecx doesn't have | Display the barcode in-app; that solves the same problem for counter scanning |
| Cashback / offers feed | FidMe does this; looks like added value | Turns a vault into a commerce product; wrong scope, wrong data feeds | Out of scope; link to the merchant app if needed |
| Barcode scanning camera input to add cards | Snap the card's barcode to fill the value | Requires camera + ZXing decode; build cost is MED-HIGH; manual entry works fine | Type or paste the barcode value from the card; optional photo covers the "show physical card" use case |
| Gamification (streaks, tier progress, points history) | Stocard had deal notifications | Wallecx is a vault, not a loyalty engagement platform | Defer indefinitely; different product category |
| Sharing / shareable links to a card | "Send my membership to a friend" | PocketBase per-user rules need signed token infra; loyalty cards are personal (unlike vaccination record sharing which has a clearer medical use case) | Out of scope |
| Geolocation reminders ("you're near Woolworths, open your card") | Key Ring does this | Background geolocation in a web SPA is battery-hostile and unreliable; not Wallecx's deployment model | Out of scope |
| Auto-detect barcode format from value string | "Smart" format sniffing | Brittle — EAN-13 is 13 digits, but so is some Code128; wrong sniff causes scan failure | User selects format from a dropdown; provide helpful format descriptions |
| Rich card artwork generation (like Apple Wallet's visual pass designer) | Looks premium | Multiple-week design + render pipeline; passcreator.com is a product just for this | `card_colour` + optional uploaded photo is 80% of the value at 5% of the cost |

---

## Standard Card Field Schema

Based on Apple PassKit, Google Wallet Passes, Stocard, and FidMe field surveys:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `card_name` | string | YES | "Woolworths Rewards", "City Library", "PureGym" |
| `issuer` | string | NO | Organisation name if different from card name |
| `barcode_value` | string | NO | Raw string to encode; empty = no barcode rendered |
| `barcode_type` | enum | NO | QR, CODE128, EAN13, CODE39, PDF417, CODABAR; default CODE128 |
| `card_number` | string | NO | Human-readable number (fallback display + printing on card) |
| `expiry_date` | date | NO | MM/YYYY or full date; warn when <30 days or past |
| `card_colour` | hex string | NO | Background colour for the card tile; default #1a1a2e |
| `card_image` | file | NO | Optional photo of physical card; displayed as bg or thumbnail |
| `notes` | string | NO | PIN, redemption instructions, contact number |
| `card_type` | enum/string | NO | Category tag: Loyalty, Gym, Library, Insurance, Transport, Other |
| `user` | relation | YES | FK to PocketBase `users`; enforced in collection rules |

---

## Barcode Format Guide

### 1D Linear Barcodes

| Format | Character Set | Common Real-World Uses | Width Profile | Scanner Compatibility |
|--------|--------------|----------------------|---------------|----------------------|
| **Code 128** | Full ASCII (128 chars) | Retail loyalty cards, event tickets, employee badges, healthcare wristbands, parcel labels | Variable (compact for long strings) | Universal — all laser + imager POS scanners |
| **EAN-13** | 13 digits only | Retail product barcodes on physical cards (static — same barcode printed on every card in a run) | Fixed 13-digit width | Universal retail POS |
| **EAN-8** | 8 digits only | Smaller cards where space is tight; subset of EAN-13 use cases | Narrower than EAN-13 | Universal retail POS |
| **Code 39** | Alphanumeric (A-Z, 0-9, some symbols) | Legacy: automotive, military, some library systems (older installs); much larger than Code 128 for same data | Wide (low density) | Universal but bulky |
| **Codabar** | Digits + limited symbols | Blood banks, FedEx shipping, older library systems (newer libraries use Code 128 or QR) | Variable | Widely supported |
| **ITF-14** | 14 digits (GTIN-14) | Outer cartons / warehouse; almost never appears on consumer-held cards | Fixed 14-digit | Less relevant for personal wallet |

### 2D Barcodes

| Format | Capacity | Common Real-World Uses | Scanner Compatibility |
|--------|----------|----------------------|----------------------|
| **QR Code** | Up to ~3,000 alphanumeric chars | Modern loyalty programs, gym check-in, insurance cards, event tickets, government IDs, URLs | Universal: phones + modern POS imagers |
| **PDF417** | Up to ~1,100 bytes | Government IDs (driver's licence, passport), boarding passes, Apple Wallet generic pass | Imager scanners only (not laser) |
| **Aztec** | Up to 3,000 chars | Apple Wallet boarding passes, UK rail tickets | Imager scanners |
| **Data Matrix** | Up to 2,335 chars | Healthcare / pharmaceutical labelling; rarely on consumer loyalty cards | Industrial imager scanners |

### Per-Card-Type Defaults (Recommended UI Defaults)

| Card Category | Recommended Default Format | Rationale |
|--------------|---------------------------|-----------|
| Grocery / supermarket loyalty | **Code 128** | Dominant in Woolworths, Coles, Tesco, Kroger legacy POS systems; POS laser scanners read it reliably |
| Pharmacy loyalty | **Code 128** or **QR** | Priceline/Chemist Warehouse use Code 128; newer systems shifting to QR |
| Gym membership | **QR Code** | Modern gym turnstiles use phone-camera QR readers (not laser scanners) |
| Library card | **Code 39** or **Codabar** | Older library systems (RFID increasingly displacing both) |
| Insurance card | **QR Code** | Modern insurance wallets use QR; some legacy cards still use Code 39 |
| Transport / transit | **QR Code** or **PDF417** | Opal, Myki, Oyster digital passes; PDF417 for printed boarding passes |
| Gift card | **EAN-13** or **Code 128** | Depends on issuer; EAN-13 for retail-printed cards, Code 128 for variable-issue |
| General membership / access | **Code 128** | Most versatile; default when card type is unknown |
| ID / access badge | **QR Code** | Modern access control predominantly QR |

**Design decision for Wallecx:** Default `barcode_type` to `CODE128` in the create form. Show a plain-English description next to each option in the dropdown. Let the user override — they can read their physical card or look up their loyalty app.

---

## Fullscreen UX Patterns

### What Reference Apps Do

Based on analysis of Stocard, Barcodes (trybarcodes.com), Apple Wallet, and FidMe:

1. **Tap-to-fullscreen** — tapping the card tile opens a dedicated fullscreen or modal view, not just enlarging inline. The barcode fills the width of the screen with maximum height the display allows.

2. **White background behind the barcode** — regardless of the card's colour theme, the barcode rendering area is always white or very light grey. Dark backgrounds cause scanner read failures. The card-colour branding is shown as a header strip only.

3. **Screen brightness boost** — apps typically maximise screen brightness on fullscreen entry. In a web SPA, this is approximated with `filter: brightness(1.5)` on the barcode container, or using the Screen Brightness API if available (Chrome Android experimental). Most reliable approach: document-level filter on fullscreen entry, reversed on exit.

4. **Screen wake-lock** — prevents the phone screen from sleeping mid-scan. Web platform: `navigator.wakeLock.request('screen')`. Well-supported on Chrome/Edge/Samsung Internet since 2022. Graceful degrade: if wake lock fails (Safari doesn't support it), show a toast: "Keep your screen on while scanning."

5. **Hide UI chrome** — fullscreen hides the navbar, toolbar, any cards below. Only the barcode + card name + close/exit button are visible.

6. **Card name + number as text below barcode** — human-readable fallback in case the scanner fails; also lets a cashier type it manually. Show `card_number` (or first 16 chars of `barcode_value` if `card_number` is absent) below the barcode.

7. **Close / exit control** — swipe down or a visible "X" / back arrow. Do not rely on browser back button alone; in a modal fullscreen view the back button is ambiguous.

8. **Orientation** — 1D barcodes (Code 128, EAN-13) are wider than tall; landscape orientation scans better on narrow phones. Show a soft prompt: "Rotate to landscape for wide barcodes." Do not force rotation — the Web Orientation Lock API requires an installed PWA. For web SPA: show the hint only, CSS rotate the barcode SVG 90° as a user toggle if the barcode is being clipped.

### Recommended Implementation for Wallecx

```
Tap card tile
  → Open PrimeVue Dialog fullscreen (maximizable=true) OR navigate to /projects/wallecx/scan/:id
  → Dialog shows:
      [Card name + issuer — header strip in card_colour]
      [White area — barcode SVG centred, full-width minus padding]
      [card_number or barcode_value text — below barcode, monospace]
      [Notes snippet — if present]
      [Close button — top right]
  → On dialog open:
      document.body.style.filter = 'brightness(1.4)' (or target the modal root)
      navigator.wakeLock.request('screen').catch(() => toast.info('Keep your screen on while scanning'))
  → On dialog close:
      Revert brightness
      Release wake lock
```

**PrimeVue approach:** Use `<Dialog :maximizable="true" :modal="true">` and trigger `.maximize()` programmatically on open. This gives the fullscreen appearance while staying within Vue's reactivity model. Alternatively, a dedicated route `/projects/wallecx/scan/:id` gives true fullscreen and better back-button behaviour — recommended if the barcode view has its own URL.

---

## Barcode Rendering Library Recommendation

### For 1D barcodes (Code128, EAN-13, Code39, Codabar)

**Recommend: `jsbarcode` via `vue-barcode` wrapper**

- `jsbarcode` is the most widely used browser barcode generator; no dependencies, renders to SVG or Canvas
- `vue-barcode` (npm: `vue-barcode`, by lindell) wraps JsBarcode as a Vue component — but note: the fengyuanchen fork (`@fengyuanchen/vue-barcode`) is Vue 3 compatible and more actively maintained
- Alternatively: use `jsbarcode` directly with a `<canvas ref>` in a Vue composable — avoids wrapper-specific Vue version concerns
- Supported formats: CODE128, EAN, EAN-13, EAN-8, UPC-A, CODE39, ITF-14, MSI, Codabar, Pharmacode

**Complexity:** LOW — `npm install jsbarcode`, call `JsBarcode(canvasRef.value, value, { format: 'CODE128' })` in `onMounted` / watcher.

### For QR codes

**Recommend: `qrcode.vue` (npm: `qrcode.vue`, by scopewu)**

- Actively maintained (version 3.8.1 updated May 2025); supports both Vue 2 and Vue 3
- Exports `<QrcodeCanvas>` and `<QrcodeSvg>` components
- Zero config: `<QrcodeSvg :value="barcodeValue" :size="280" />`
- Alternative: `useQRCode` from VueUse integrations — already installed in Lexarium; zero new deps

**Complexity:** LOW — import and render.

### For PDF417 (transport / government ID pass type)

**Recommend: `bwip-js`** — covers 100+ symbologies including PDF417, Aztec, Data Matrix. Heavier (~400KB), but only loaded if card type = PDF417. Use dynamic import.

---

## Feature Dependencies

```
[PocketBase wallecx_memberships collection]
    └──required by──> [Create / Edit / Delete card]
    └──required by──> [List / grid view]
    └──required by──> [Fullscreen scan view]

[barcode_value + barcode_type fields on record]
    └──required by──> [JsBarcode render]
    └──required by──> [qrcode.vue render]
    └──enables──────> [Fullscreen scan display]

[card_number field]
    └──fallback for──> [Barcode-less cards (plain number display)]
    └──shown in──────> [Fullscreen view below barcode]

[Fullscreen scan view]
    └──required by──> [Screen wake-lock]
    └──required by──> [Brightness boost]
    └──enables──────> [Landscape orientation hint]

[card_colour field]
    └──enables──────> [Visual card tile differentiation]
    └──used in──────> [Fullscreen view header strip]

[card_type / category field]
    └──enables──────> [Grouped view by category]
    └──enables──────> [Default barcode format suggestion per category]

[expiry_date field]
    └──enables──────> [Expiry badge / warning on card tile]

[Wallecx tab navigation]
    └──requires─────> [Vaccinations tab (already built)]
    └──requires─────> [Memberships tab (new)]
    └──independent──> [Both sections share WallecxApp.vue shell]
```

---

## MVP for v2.0

### Launch With

- [ ] `wallecx_memberships` PocketBase collection — same per-user rules pattern as vaccinations
- [ ] Fields: `card_name` (required), `issuer`, `barcode_value`, `barcode_type` (enum, default CODE128), `card_number`, `expiry_date`, `card_colour`, `notes`, `card_image` (optional file), `card_type`
- [ ] Coloured card grid — 2-column default, matches vaccination grid
- [ ] Barcode rendering — JsBarcode for 1D (Code128, EAN-13, Code39, Codabar) + qrcode.vue for QR
- [ ] Fallback plain number display when `barcode_value` is empty
- [ ] Fullscreen scan dialog — white barcode area, brightness boost, wake-lock attempt
- [ ] Full CRUD — create/edit/delete with Zod validation, PrimeVue dialogs, mapper
- [ ] Wallecx tab navigation switching between Vaccinations and Memberships
- [ ] Expiry date shown on card tile with visual warning for expired / near-expiry
- [ ] Empty state, loading, error toasts

### Defer to v2.x

- [ ] Search + sort on membership grid (follow vaccination pattern after v2.0 validates)
- [ ] Card category filter / grouped view by `card_type`
- [ ] View toggle (grid vs list) on memberships
- [ ] Screen brightness API (if available) — additional enhancement over CSS filter
- [ ] Landscape rotation hint in fullscreen view
- [ ] PDF417 / Aztec via `bwip-js` dynamic import (niche formats)

### Out of Scope (Explicitly)

- NFC tap-to-add
- Apple Wallet / Google Wallet export / PassKit signing
- Live points balance integration
- Barcode camera scanning to populate `barcode_value`
- Geolocation reminders
- Sharing / public card links
- Cashback / merchant offers feed

---

## Confidence Assessment

| Finding | Confidence | Basis |
|---------|------------|-------|
| Standard card fields (name, barcode value+type, card number, expiry, colour) | HIGH | Apple PassKit spec + Google Wallet Passes + multiple surveyed apps |
| Code 128 as the dominant loyalty/retail barcode format | HIGH | CardPrinting.com industry guide + Scandit barcode type guide + supermarket POS ecosystem |
| QR code for gym / modern loyalty / insurance | HIGH | Live app behaviour observed across Barcodes app, FidMe, gym app patterns |
| Codabar for libraries (legacy) | MEDIUM | Industry sources; many libraries now use RFID or Code 128 |
| White background + brightness boost for fullscreen scan | HIGH | Pattern visible in all surveyed loyalty wallet apps; counter-scanner physics |
| Screen wake-lock via Web API | HIGH | MDN docs + caniuse.com show broad support since Chrome 84, Edge 84 |
| JsBarcode recommendation for 1D | HIGH | Widely used, no deps, Vue 3 compatible via direct canvas ref |
| qrcode.vue recommendation for QR | HIGH | Actively maintained May 2025, explicit Vue 3 support |
| Landscape orientation hint (not lock) | HIGH | Web Orientation Lock requires PWA; hint-only is correct for SPA |
| Barcode camera scanning deferred | HIGH | ZXing wrapper adds significant build cost; manual entry + optional photo achieves the same result |

---

## Sources

- [Apple Wallet PassKit: Pass Design and Creation](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Creating.html)
- [Apple Human Interface Guidelines: Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)
- [Apple & Google Wallet Pass Design Guide — Litecard](https://litecard.com.au/docs/apple-google-wallet-pass-design-guide/)
- [The Anatomy of a Wallet Pass — Passcreator](https://www.passcreator.com/en/features/ultimate-guide/the-anatomy-of-a-wallet-pass)
- [Barcodes: Loyalty Card Wallet app — Product listing](https://trybarcodes.com/)
- [Stocard — Klarna acquisition / shutdown Dec 2024](https://stocardapp.com/en/us)
- [Stocard alternatives — AlternativeTo.net](https://alternativeto.net/software/stocard/)
- [FidMe: Loyalty Cards, Cashback — App Store](https://apps.apple.com/us/app/fidme-loyalty-cards-cashback/id391329324)
- [Common Barcode Types for Plastic Cards — CardPrinting.com](https://www.cardprinting.com/page/common-barcode-types)
- [Barcode Types Guide — Scandit](https://www.scandit.com/resources/guides/types-of-barcodes-choosing-the-right-barcode/)
- [Barcode Format Comparison: CODE128 vs CODE39 vs EAN — WildandFreeTools](https://wildandfreetools.com/blog/barcode-format-comparison-guide/)
- [JsBarcode — GitHub (lindell)](https://github.com/lindell/JsBarcode)
- [qrcode.vue — GitHub (scopewu)](https://github.com/scopewu/qrcode.vue)
- [bwip-js — npm](https://www.npmjs.com/package/bwip-js)
- [bwip-js vs jsbarcode comparison — npm-compare.com](https://npm-compare.com/bwip-js,jsbarcode)
- [Digital Loyalty Card Implementation Guide — The Droids on Roids](https://www.thedroidsonroids.com/blog/digital-loyalty-card-implementation-guide)
- [QR Codes for Membership Cards — Bitly](https://bitly.com/blog/qr-codes-for-membership-cards/)
- [Screen Wake Lock API — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)

---
*Feature research for: Wallecx v2.0 Membership Cards*
*Researched: 2026-05-13*
