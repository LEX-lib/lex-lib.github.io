# Phase 37: PWA Install + Standalone Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 37-pwa-install-standalone-polish
**Areas discussed:** Banner evolution — Android UX, 30-day dismissal record format, Offline banner UX, Manifest shortcuts deep-link mechanism

---

## Banner evolution — Android UX

### Q1: Branch logic

| Option | Description | Selected |
|--------|-------------|----------|
| Event presence + iOS UA combined | Android branch when installPromptEvent non-null; iOS branch when isIosSafari && !isStandalone && no event | ✓ |
| Event presence only (no UA sniff) | Both branches purely event-driven (still needs UA for iOS — marginal simplification) | |
| Two physical components, one wrapper | Split into PwaInstallBannerIos.vue + PwaInstallBannerAndroid.vue (would override A-43-5 LOCKED) | |

**User's choice:** Event presence + iOS UA combined.
**Notes:** A-43-5 ("extended, not split") respected. Self-extinguishing via existing App.vue `appinstalled` handler.

### Q2: Android visual

| Option | Description | Selected |
|--------|-------------|----------|
| Same navy bar, swap content | Reuse #002244 fixed-bottom bar; copy 'Install Wallecx for faster access and home-screen shortcuts.'; right-aligned Install button | ✓ |
| Two-line layout with explicit Install button | Two-row banner, taller, different shape from iOS branch | |
| Inline link icon + Install action | mdi:download icon + minimal text + arrow-icon button | |

**User's choice:** Same navy bar, swap content.
**Notes:** Visual continuity over per-platform distinctiveness.

### Q3: Post-prompt UX

| Option | Description | Selected |
|--------|-------------|----------|
| Hide banner on either outcome, no toast | accepted → clear; dismissed → write 30-day record + hide; M-9 honored | ✓ |
| Toast on accepted, silent on dismissed | vue-sonner 'Installing…' on accepted only | |
| Only hide on accepted; keep visible on dismissed | Pushy — Chrome already throttles re-prompts | |

**User's choice:** Hide banner on either outcome, no toast.
**Notes:** Chrome's own install dialog is sufficient user feedback.

### Q4: Mount scope

| Option | Description | Selected |
|--------|-------------|----------|
| Keep at WallecxApp.vue (line 125) | Wallecx-scoped — matches start_url=/projects/wallecx | ✓ |
| Lift to App.vue (site-wide) | Banner shows on any Lexarium route — but install pitch off-topic on /blog etc | |

**User's choice:** Keep at WallecxApp.vue.

---

## 30-day dismissal record format

### Q1: Record shape

| Option | Description | Selected |
|--------|-------------|----------|
| ISO timestamp + platform | JSON `{ dismissedAt, platform }`; single key; 30d gate via Date.now() comparison | ✓ |
| Bare ISO timestamp string | Simplest; no room to grow without migration | |
| Two separate keys per platform | Per-platform independent dismissal; two storage entries | |

**User's choice:** ISO timestamp + platform.
**Notes:** Schema captures `platform` for future per-platform behavior; current gate is platform-agnostic.

### Q2: Legacy migration

| Option | Description | Selected |
|--------|-------------|----------|
| Treat legacy 'true' as dismissed-forever-until-30d-from-first-read | Migrate `'true'` to `{ dismissedAt: now }`; 30-day clock starts now; fair re-show | ✓ |
| Treat legacy 'true' as dismissed-forever | Existing iOS dismissers never see banner again — violates NFR intent | |
| Wipe the legacy value, fresh start | Surprise re-show after upgrade | |

**User's choice:** Lazy migrate; 30-day clock starts now.

### Q3: Suppression rules

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone mode — never show (locked) | Hard gate only: isStandalone → suppress; localStorage failure → silent suppress | ✓ |
| Also suppress if user is unauthenticated | Redundant — route guard already enforces | |
| Also suppress for N seconds after first visit | Adds session-timer state surface | |

**User's choice:** Standalone mode + localStorage failure — no extra suppressions.

---

## Offline banner UX (PWA-07)

### Q1: Surface — banner vs toast

| Option | Description | Selected |
|--------|-------------|----------|
| Persistent banner backed by useOnline | Fixed-position; stays until reconnect; matches 'clear offline banner' ROADMAP wording | ✓ |
| Toast on offline, toast on reconnect | Lighter visual weight; user can dismiss → lose state | |
| Banner + reconnect toast hybrid | Two surfaces — more code, explicit positive feedback | |

**User's choice:** Persistent banner backed by useOnline.

### Q2: Mount + visual

| Option | Description | Selected |
|--------|-------------|----------|
| App.vue scope, top of viewport, distinct color | Site-wide; just under CustomNavBar; status-warning tone (not navy) | ✓ |
| WallecxApp.vue scope, bottom, same navy bar | Wallecx-only; collision with install banner | |
| App.vue scope, bottom, distinct color | Site-wide but bottom — stacks against install banner | |

**User's choice:** App.vue scope, top of viewport, distinct color.

### Q3: Retry CTA

| Option | Description | Selected |
|--------|-------------|----------|
| No retry button — banner just reflects useOnline | Honest; banner auto-clears on reconnect; copy 'You're offline. Changes will resume when you reconnect.' | ✓ |
| Retry button with HEAD request | Useful for captive portal; UI button firing network calls | |
| Reload-page button | Crude; loses in-flight form state | |

**User's choice:** No retry button.
**Notes:** Conflicts with ROADMAP SC#4 'retry affordance' wording — reconciliation in Q4.

### Q4: ROADMAP fit

| Option | Description | Selected |
|--------|-------------|----------|
| Reword SC#4 — useOnline IS the retry mechanism | Planner edits ROADMAP/REQUIREMENTS PWA-07 to drop 'retry affordance' wording | ✓ |
| Add the retry button after all | Honors ROADMAP literally | |
| Banner copy includes 'Retrying…' indicator | No button; UI implies retry — middle path | |

**User's choice:** Reword SC#4. Captured as D-37-12.

---

## Manifest shortcuts deep-link mechanism (PWA-09)

### Q1: URL shape

| Option | Description | Selected |
|--------|-------------|----------|
| Single route + ?action=... query param | One route, one auth guard, no router changes | ✓ |
| Hash-based /projects/wallecx#add-expense | Weaker semantics for action dispatch | |
| Dedicated routes /projects/wallecx/add/expense | 4 new router entries, more surface to test | |

**User's choice:** Single route + ?action query param.

### Q2: Dispatch mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Map action → activeTab + pendingAction ref watched by tab components | Simple ref + watch in WallecxApp; no Pinia | ✓ |
| Provide/inject actionBus | More wiring, same outcome | |
| Pinia store | Violates locked invariant (no new Pinia for Wallecx) | |

**User's choice:** pendingAction ref. Off the table: Pinia.

### Q3: Manifest shortcut entries

| Option | Description | Selected |
|--------|-------------|----------|
| name + short_name + url + 96x96 icon per shortcut | @vite-pwa/assets-generator extends to generate the 4 PNGs in public/shortcuts/ | ✓ |
| name + url only, no icons | App icon fallback; less polish | |
| Full set + maskable variants | 8 PNGs total — diminishing returns | |

**User's choice:** Per-shortcut 96×96 icons.

### Q4: Auth fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve action through login redirect | Existing guard uses to.fullPath; planner adds query-preservation test | ✓ |
| Drop the action on login redirect | Poor UX | |
| Show toast 'Sign in to add expense' | Login-page logic for 4 shortcut paths only | |

**User's choice:** Preserve via existing redirect mechanism. Test gap noted (D-37-16).

---

## Claude's Discretion

- Dark-mode `theme-color` hex value (matching dark-background token vs reading computed value)
- `apple-touch-startup-image` splash background color
- iOS eviction-aware auth-expired copy site (toast at WallecxApp line 61, login page, or both)
- SW-update toast safe-area implementation (vue-sonner per-call style vs global Toaster prop vs CSS override)
- Splash + shortcut-icon visual content

## Deferred Ideas

- Two-physical-component split of PwaInstallBanner.vue (off the table per A-43-5)
- Cross-platform dismissal independence (schema supports it; not built now)
- Session-timer pre-banner delay (rejected)
- Toast on accepted install outcome (rejected)
- Retry button on offline banner (rejected; docs reworded instead)
- Hash and dedicated-route URL shapes for shortcuts (rejected)
- Maskable-purpose shortcut icons (rejected)
