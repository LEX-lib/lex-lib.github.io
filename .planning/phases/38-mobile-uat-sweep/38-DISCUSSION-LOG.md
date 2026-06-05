# Phase 38: Mobile UAT Sweep — Discussion Log

**Date:** 2026-06-05
**Mode:** discuss (default)
*Human-reference record of the discuss-phase session. Not consumed by downstream agents.*

## Context note

Before discussion: `ROADMAP.md` was a 12-line fragment with no parseable phase sections — rebuilt from STATE.md's canonical v4.3 structure (commit `cac4194`) so Phase 38 could be discussed/planned.

## Gray areas discussed

### 1. iPad target
- **Options:** Real iPad / Emulated 820px viewport / Skip+defer
- **Chosen:** Emulated 820px viewport
- **Note:** iPad layout checks valid under emulation; install/standalone behaviors recorded as "emulation-verified (layout only)" with caveat. → D-01

### 2. Reuse of Phase 37 device QA
- **Options:** Carry forward + run net-new only / Re-run everything fresh
- **Chosen:** Carry forward + run net-new only
- **Note:** Phase 37's 9 device checks (37-UAT.md) treated as authoritative; Phase 38 runs only net-new checks. → D-02, D-03

### 3. On failure
- **Options:** UAT-only (record → separate gap phase) / Record + fix in-phase
- **Chosen:** UAT-only — record → separate gap phase
- **Note:** Phase 38 writes no production code; failures routed to a follow-up gap cycle. → D-04

### 4. Recording + deferral policy
- **Options:** HUMAN-UAT.md + defer-with-signoff / Block milestone until all green
- **Chosen:** HUMAN-UAT.md + defer-with-signoff (non-blocking for milestone close)
- **Note:** Results in 38-HUMAN-UAT.md; unavailable targets deferred only with explicit sign-off. → D-05

## Deferred ideas
- Phase 38b List Virtualization (PF-06) — conditional, out of scope.
- Sweep failures → separate gap-closure phase.

## Claude's discretion
- Exact 38-HUMAN-UAT.md structure, check ordering, carried-forward linking.
