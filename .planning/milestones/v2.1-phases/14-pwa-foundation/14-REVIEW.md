---
phase: 14-pwa-foundation
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - vercel.json
  - public/wallecx-icon.svg
  - package.json
  - vite.config.ts
  - env.d.ts
  - src/components/projects/wallecx/WallecxApp.vue
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Six files were reviewed covering the PWA Foundation layer: Vercel hosting config, the Wallecx PWA icon, project dependencies, Vite/Workbox config, environment type declarations, and the top-level app shell component.

All locked decisions from the project context are correctly implemented:
- `registerType: 'prompt'` is in place (line 27, `vite.config.ts`)
- `scope: '/'` is in place (line 41, `vite.config.ts`)
- `navigateFallback: 'index.html'` without a leading slash is correct (line 72, `vite.config.ts`)
- `/api/*` is excluded via both `navigateFallbackDenylist` and a `NetworkOnly` runtime cache rule
- `pb.authStore.isValid` (a getter, not a method) is used correctly for JWT expiry — not `useAuthStore().isLoggedIn`
- `navigator.storage?.persist` is guarded with optional chaining for iOS < 17 compatibility

Two warnings were found: the workbox runtime file is not covered by any explicit Vercel cache header rule, and the `VITE_FEATURE_FLAG_EXAMPLE` environment variable carries a misleading `string | boolean` union type. Three info items cover an unescaped regex dot in vercel.json, a stale CLAUDE.md documentation note, and a dead/unused env declaration.

---

## Warnings

### WR-01: `workbox-*.js` runtime file not covered by any Vercel cache header rule

**File:** `vercel.json:36`

**Issue:** The vercel.json `headers` array defines immutable caching (`max-age=31536000, immutable`) only for `/assets/(.*)`. The Workbox runtime bundle is emitted to the dist root as `workbox-<hash>.js` (e.g., `workbox-98f7a950.js`), which does NOT match the `/assets/(.*)` pattern. It also does not match `/sw.js` or the HTML rules. It therefore falls through to Vercel's platform default, which may apply a short TTL or serve without an explicit `Cache-Control` header.

Because the file carries a content hash, immutable long-term caching is safe and correct. Without the explicit header, browsers may re-fetch the workbox runtime on every navigation, adding unnecessary latency for offline-capable users. More critically, mismatched caching between `sw.js` (always revalidated) and the workbox runtime (unknown TTL) can cause the SW to load a stale runtime on partial-cache scenarios.

**Fix:** Add a dedicated header rule for root-level hashed JS files, or extend the assets pattern to also cover the dist root:

```json
{
  "source": "/workbox-:hash.js",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "max-age=31536000, immutable"
    }
  ]
}
```

Place this rule before the generic rewrite. Alternatively, configure `vite-plugin-pwa` to emit the workbox runtime into the `assets/` subdirectory via `workbox.swDest` or `workbox.inlineWorkboxRuntime: true` (inline eliminates the separate file entirely).

---

### WR-02: `VITE_FEATURE_FLAG_EXAMPLE` typed as `string | boolean` — Vite env vars are always `string`

**File:** `env.d.ts:7`

**Issue:** The `ImportMetaEnv` interface declares `VITE_FEATURE_FLAG_EXAMPLE: string | boolean`. All Vite environment variables exposed via `import.meta.env` are injected as string literals at build time; they are never `boolean`. Typing one as `string | boolean` creates a false contract: any code that consumes this variable and acts on the `boolean` branch will silently receive a string `"true"` or `"false"` instead of the boolean `true`/`false`, leading to incorrect truthiness checks.

For example, `if (import.meta.env.VITE_FEATURE_FLAG_EXAMPLE)` evaluates to `true` for the string `"false"` because non-empty strings are truthy in JavaScript.

**Fix:** Remove the `boolean` branch from the union type and parse explicitly at call sites:

```typescript
// env.d.ts
readonly VITE_FEATURE_FLAG_EXAMPLE: string;
```

```typescript
// Usage at call site
const isEnabled = import.meta.env.VITE_FEATURE_FLAG_EXAMPLE === 'true';
```

---

## Info

### IN-01: Unescaped regex dot in vercel.json `source` patterns

**File:** `vercel.json:13` and `vercel.json:26`

**Issue:** The `source` patterns `"/(.*).webmanifest"` and `"/(.*).html"` use an unescaped `.` which in Vercel's path-matching syntax matches any character, not just a literal dot. A request to a path like `/fooXwebmanifest` or `/indexXhtml` would incorrectly match these rules and receive the wrong cache and content-type headers.

This is unlikely to be exploited in practice (the rewrite rule catches everything anyway), but it is an inaccurate pattern.

**Fix:** Escape the dot with `\\.` in both patterns:

```json
"source": "/(.*)\\.webmanifest"
"source": "/(.*)\\.html"
```

---

### IN-02: `VITE_FEATURE_FLAG_EXAMPLE` is unused dead code in `env.d.ts`

**File:** `env.d.ts:7`

**Issue:** The only reference to `VITE_FEATURE_FLAG_EXAMPLE` in the entire `src/` tree is a commented-out line in `src/main.ts` (line 22). The declaration in `ImportMetaEnv` is therefore dead — it defines a contract for a variable that is never used in production code.

**Fix:** Remove line 7 from `env.d.ts` until the feature flag is actually implemented. Keeping placeholder declarations in type files increases maintenance noise and can cause confusion when auditing which env vars are actually required at deploy time.

---

### IN-03: CLAUDE.md documents a `dist/404.html` copy step that is absent from `package.json`

**File:** `package.json:11`

**Issue:** `CLAUDE.md` states: `npm run build — Type-check + production build (copies dist/index.html → dist/404.html for GitHub Pages SPA routing)`. However, the `build` script is `run-p type-check "build-only {@}"`, which does not include any copy step. No `postbuild` hook or Vite plugin performs this copy either.

The project now deploys to Vercel (vercel.json is present), where the SPA rewrite rule handles all paths — making the `404.html` copy unnecessary for the current deployment target. However, the stale CLAUDE.md documentation may mislead future developers into believing GitHub Pages deployment is still live or that the copy step exists.

**Fix:** Update `CLAUDE.md` to reflect the current Vercel deployment and remove the outdated `404.html` copy note. If GitHub Pages deployment needs to be preserved as a fallback, add the copy step back:

```json
"build": "run-p type-check \"build-only {@}\" && cp dist/index.html dist/404.html"
```

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
