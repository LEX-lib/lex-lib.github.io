# Phase 02 Deferred Items

## Pre-existing Lint Errors (out of scope for Phase 2)

Discovered during 02-03 Task 3 (`npm run lint`). These are pre-existing failures in files not modified by Phase 2.

| File | Rule | Issue |
|------|------|-------|
| `site.js` | `no-unused-vars` | `nextTick` imported but never used |
| `vite.config.ts` | `no-unused-vars` | `fs` imported but never used |
| `vite.config.ts` | `no-unused-vars` | `path` imported but never used |

These should be cleaned up in a separate chore commit outside Phase 2 scope.
