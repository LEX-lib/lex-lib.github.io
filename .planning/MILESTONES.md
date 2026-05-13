# Milestones

## v1.0 — Wallecx MVP

**Shipped:** 2026-05-12
**Phases:** 0–4 (5 phases, 17 plans)
**Timeline:** 2026-05-10 → 2026-05-12 (3 days)
**Requirements:** 33/34 shipped (READ-06 dropped)

### Delivered

1. Stripped dev credentials (VITE_LOGIN_*) from codebase; added `lint:secrets` regression guard — production bundle no longer carries shipped credentials
2. `wallecx_vaccinations` PocketBase collection with server-side per-user isolation — two-user smoke test confirmed cross-user isolation across all access types
3. MIME-branched attachment preview (image/PDF/download) with short-lived view-time tokens and zero `v-html`
4. Full CRUD write path: Zod-validated dialog, EXIF-stripping image pipeline, `isSaving` guard preventing double-submits
5. Projects directory tile, design token audit, JSON export — Wallecx discoverable and design-consistent
6. First repo tests: `vaccinationMapper.spec.ts` (mapper contract) and `guard.spec.ts` (auth redirect)

### Known deferred items at close: 11 (see STATE.md Deferred Items)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`
**Requirements:** `.planning/milestones/v1.0-REQUIREMENTS.md`
