---
phase: 6
slug: quality-gate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` (merges `vite.config.ts`) |
| **Quick run command** | `npx vitest run --reporter dot` |
| **Full suite command** | `npm run test:unit` |
| **Estimated runtime** | ~10–20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter dot`
- **After every plan wave:** Run `npm run test:unit`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | QA-04 | N/A | ci | `npm run test:unit` exits 0 | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | QA-01, QA-02 | N/A | unit | `npm run test:unit` (runs after mock installed) | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | QA-01 | N/A | unit | `npm run test:unit -- export` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | QA-01 | N/A | unit | `npm run type-check` | ✅ (existing) | ⬜ pending |
| 06-03-01 | 03 | 2 | QA-01 | N/A | unit | `npm run test:unit -- dsuMeetingMapper dsuTaskMapper dsuSupportMapper dsuDayStatusMapper useDurationField constants` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 2 | QA-01, QA-02 | N/A | unit+component | `npm run test:unit -- export ActivityCard` | ❌ W0 | ⬜ pending |
| 06-05-01 | 05 | 3 | QA-02 | N/A | component | `npm run test:unit -- ManageMeeting ManageTask ManageSupport` | ❌ W0 | ⬜ pending |
| 06-06-01 | 06 | 3 | QA-02 | N/A | component | `npm run test:unit -- LexTrackView` | ❌ W0 | ⬜ pending |
| 06-07-01 | 07 | 4 | QA-03, QA-04 | N/A | integration | `npm run lint && npm run type-check && npm run test:unit` | ✅ (existing scripts) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — change `"test:unit": "vitest"` → `"test:unit": "vitest run"` (QA-04)
- [ ] `npm install -D @pinia/testing` — required for LexTrackView component tests
- [ ] `src/lib/pocketbase/__mocks__/index.ts` — PocketBase mock for all component tests
- [ ] `src/utils/lextrack/export.ts` — extract `buildExportString` + `stripHtml` from LexTrackView.vue
- [ ] `src/lib/pocketbase/__tests__/dsuMeetingMapper.spec.ts`
- [ ] `src/lib/pocketbase/__tests__/dsuTaskMapper.spec.ts`
- [ ] `src/lib/pocketbase/__tests__/dsuSupportMapper.spec.ts`
- [ ] `src/lib/pocketbase/__tests__/dsuDayStatusMapper.spec.ts`
- [ ] `src/composables/lextrack/__tests__/useDurationField.spec.ts`
- [ ] `src/utils/lextrack/__tests__/export.spec.ts`
- [ ] `src/types/lextrack/dsu_day_status/__tests__/constants.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ActivityCard.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ManageMeeting.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ManageTask.spec.ts`
- [ ] `src/components/projects/lextrack/__tests__/ManageSupport.spec.ts`
- [ ] `src/views/__tests__/LexTrackView.spec.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Phase gate — lint + type-check + test:unit all green | QA-03, QA-04 | Final human confirmation that CI scripts produce clean output | Run `npm run lint && npm run type-check && npm run test:unit` — all must exit 0 |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (`vitest run` not `vitest`)
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
