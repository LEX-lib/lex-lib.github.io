---
phase: 37-pwa-install-standalone-polish
audit_date: 2026-06-05
auditor: gsd-security-auditor (claude-sonnet-4-6)
asvs_level: 1
block_on: high
threats_total: 29
threats_mitigate: 15
threats_accept: 14
threats_open: 0
status: SECURED
---

# Phase 37 Security Audit — PWA Install + Standalone Polish

## Result: SECURED

All 15 `mitigate`-disposition threats have verified mitigations in implementation code.
All 14 `accept`-disposition threats are documented accepted risks that remain reasonable.
No supply-chain additions detected.

---

## Threat Verification Table

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-37-01-03 | DoS | mitigate | CLOSED | `vite.config.ts:112` — `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024`. 38 splash PNGs totalling 416 KB in `public/`, no individual file exceeds 2 MiB. No Workbox "Skipping precaching" condition can be triggered by these assets. |
| T-37-01-SC | Tampering | mitigate | CLOSED | `git diff df1dbf1 HEAD -- package.json` — zero new dependencies added. Only change: `generate-pwa-assets` script entry. `@vite-pwa/assets-generator` was already a devDependency. |
| T-37-02-03 | DoS | mitigate | CLOSED | `src/components/OfflineBanner.vue:11` — `class="fixed top-0 left-0 right-0 z-50 ..."`; Teleports to `<body>`. `CustomNavBar` carries no `z-` class. No overlay collision. |
| T-37-02-SC | Tampering | mitigate | CLOSED | Same package.json diff — `@vueuse/core` was already a runtime dependency. No new packages added. |
| T-37-03-02 | Tampering | mitigate | CLOSED | `src/components/projects/wallecx/PwaInstallBanner.vue:51-71` — `isDismissed()` wraps `JSON.parse(raw)` in a `try { } catch { return true; }` block. Parse failure returns `true` (suppresses banner — fails closed). |
| T-37-03-05 | DoS | mitigate | CLOSED | `PwaInstallBanner.vue:124` — `event.prompt()` called synchronously as the first statement in `handleAndroidInstall()`, before the `await event.userChoice` on line 126. No async operation precedes it within the click handler. |
| T-37-03-SC | Tampering | mitigate | CLOSED | Same package.json diff — zero new packages. |
| T-37-04-03 | Tampering | mitigate | CLOSED | `index.html` — grep for `rel="manifest"` returns zero matches. No manual manifest link is present; vite-plugin-pwa injects the manifest link at build time. |
| T-37-04-04 | DoS | mitigate | CLOSED | `vite.config.ts:112` — 3 MiB cap configured. 38 splash PNGs total 416 KB (all in `public/` root, matched by `globPatterns: ["**/*.{...png...}"]`). No single PNG approaches 3 MiB. Expanded matrix (commit e8770ae) does not breach the cap. |
| T-37-04-SC | Tampering | mitigate | CLOSED | Same package.json diff — zero new packages. |
| T-37-05-01 | Tampering | mitigate | CLOSED | `WallecxApp.vue:87` — `if (typeof action === 'string' && ACTION_TAB_MAP[action])`. Only actions present as keys in `ACTION_TAB_MAP` (4 entries: add-expense, add-vaccination, add-membership, open-reports) are dispatched. Arbitrary strings fail the allowlist lookup silently. |
| T-37-05-02 | Tampering (XSS) | mitigate | CLOSED | `WallecxApp.vue:88` — `ACTION_TAB_MAP[action]` is used only as an object-key lookup producing a tab name string assigned to `activeTab.value`. No `v-html`, `innerHTML`, or `dangerouslySetInnerHTML` usage found in `WallecxApp.vue`, `ExpensesTab.vue`, `VaccinationsTab.vue`, or `MembershipsTab.vue`. Tab components receive `pendingAction` as a prop used only in watcher comparisons. |
| T-37-05-03 | Info Disclosure | mitigate | CLOSED | `WallecxApp.vue:91` — `router.replace({ query: {} })` called after dispatch, clearing `?action=` from URL. |
| T-37-05-06 | DoS | mitigate | CLOSED | `WallecxApp.vue:89,92-93` — two sequential `await nextTick()` calls; `pendingAction.value = null` at line 93 after second tick. All three tab components (`ExpensesTab.vue:123`, `VaccinationsTab.vue:220`, `MembershipsTab.vue:187`) use `{ immediate: true }` watchers. CR-02 null reset does NOT weaken the mitigation: the first nextTick allows tabs to mount and consume the action; the second tick allows watcher callbacks to execute; null is then assigned, making null-checks in all three tab watcher branches a no-op on any future Suspense remount. |
| T-37-05-SC | Tampering | mitigate | CLOSED | Same package.json diff — zero new packages. |

---

## Accepted Risks

The following threats carry `accept` disposition. No code evidence is required. Reasonableness confirmed below.

| Threat ID | Category | Accepted Risk | Reasonableness |
|-----------|----------|---------------|----------------|
| T-37-01-01 | Info Disclosure | Splash PNGs derived from public branding; no PII | Reasonable — PNGs are static brand assets committed to a public repo |
| T-37-01-02 | Spoofing | Splash branding could be locally replaced | Reasonable — client-side asset; not a server-side integrity concern |
| T-37-02-01 | Spoofing | `navigator.onLine` cannot be maliciously spoofed | Reasonable — browser API, no user-controlled input path |
| T-37-02-02 | Tampering | Static banner copy cannot be injected | Reasonable — copy is a string literal; no dynamic rendering |
| T-37-03-01 | Info Disclosure | localStorage dismissal key contains no PII | Reasonable — stores only ISO timestamp and platform string |
| T-37-03-03 | Info Disclosure | Client timestamp used for 30-day gate | Reasonable — only used for UX suppression, no server trust |
| T-37-03-04 | Info Disclosure | UA string read for iOS detection | Reasonable — read-only, not stored, not transmitted |
| T-37-03-06 | DoS | Browser-controlled install dialog | Reasonable — browser enforces user-gesture requirement; outside app control |
| T-37-04-01 | Tampering | Static `index.html` branding values | Reasonable — static HTML in public repo; no runtime injection |
| T-37-04-02 | Spoofing | Static manifest name/short_name | Reasonable — manifest is a static file; no dynamic input |
| T-37-04-05 | Info Disclosure | Static `start_url` in manifest | Reasonable — start URL is a public route |
| T-37-05-04 | Elevation of Privilege | Deep-link dispatch occurs after auth guard | Reasonable — `meta.requiresAuth` guard redirects unauthenticated requests; pendingAction only runs inside authenticated component mount |
| T-37-05-05 | Tampering | Static shortcut URLs in manifest | Reasonable — shortcut URLs are static values in `vite.config.ts`; not user-controlled |
| T-37-05-07 | Info Disclosure | Static toast style/copy | Reasonable — toast content is a string literal; no user data rendered |

---

## Unregistered Flags

None. No new attack surface was identified during implementation review that lacks a threat mapping in the plan-time register.

---

## Supply-Chain Audit

Comparison baseline: commit `df1dbf1` (last pre-phase-37 commit).

```
git diff df1dbf1 HEAD -- package.json
```

Result: Zero dependency additions or removals. Only change is the `generate-pwa-assets` npm script entry. Both `@vite-pwa/assets-generator` (devDependency) and `@vueuse/core` (dependency) were present before phase 37 began. All T-*-SC threats: CLOSED.

---

## Notes

- The OfflineBanner `z-50` (T-37-02-03) is at the `<body>` Teleport root; CustomNavBar carries no competing z-index class. Overlay collision risk is nil.
- The CR-02 fix (`pendingAction.value = null` after second nextTick) was audited for mitigation weakening against T-37-05-06. The double-nextTick sequence is sequential: tab watcher callbacks fire in the first tick window, null assignment follows in the second. The `{ immediate: true }` watchers re-evaluate on null and take no action (null does not match any action string). The mitigation is intact and CR-02 strengthens it by preventing replay.
- Workbox precache size (T-37-04-04): 38 splash PNGs at 416 KB total. The `maximumFileSizeToCacheInBytes: 3 * 1024 * 1024` cap applies per-file. Largest splash PNG observed well under 2 MiB. No precache exclusion warnings expected.
