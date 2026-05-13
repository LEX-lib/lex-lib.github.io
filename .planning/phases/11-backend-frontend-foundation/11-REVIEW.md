---
phase: 11-backend-frontend-foundation
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/types/wallecx/memberships/types.d.ts
  - src/lib/pocketbase/membershipMapper.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-05-13
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two new files establish the type contract and PocketBase update mapper for the `wallecx_memberships` collection. The overall structure is sound and closely mirrors the analog vaccination pair (`vaccinations/types.d.ts` + `vaccinationMapper.ts`), which is good for consistency.

Three warnings are raised: a redundant field declaration that conflicts with the inherited `RecordModel`, a missing `card_image` field from the mapper return type that may silently drop file-clear operations, and `AddMembership` retaining the `user` field which creates a risk of client-supplied user ID injection on create. Three info items cover naming convention alignment, dead-code risk for the `card_image` return-type omission, and a minor comment style inconsistency.

---

## Warnings

### WR-01: `id`, `created`, `updated` re-declared on interface that already inherits them from `RecordModel`

**File:** `src/types/wallecx/memberships/types.d.ts:4-6`
**Issue:** `RecordModel` from the PocketBase SDK already declares `id: string`, `created: string`, and `updated: string`. Repeating them on `Memberships` works (TypeScript allows compatible re-declaration), but it is misleading — it implies the fields are being narrowed or overridden when they are not. This pattern differs slightly from the analog `Vaccinations` interface, which also repeats them — so this is a pre-existing inconsistency in the codebase rather than a new one, but it should be addressed here before it spreads further.
**Fix:** Remove the redundant declarations and rely on `RecordModel`:
```ts
export interface Memberships extends RecordModel {
  // id, created, updated are inherited from RecordModel — do not re-declare
  user: string;
  card_name: string;
  // ...rest of fields
}
```

---

### WR-02: `card_image` excluded from `mapToUpdateMembership` return type and implementation — silently drops file-clear intent

**File:** `src/lib/pocketbase/membershipMapper.ts:3-23`
**Issue:** `card_image` is present on `Memberships` but is not mapped in `mapToUpdateMembership`. If a caller wants to clear the stored image (e.g. set it to `""` or `null`), passing the record through this mapper will silently omit that field. PocketBase file fields require explicit `null` or `""` to clear; omitting the field entirely leaves the server-side value unchanged. This is a logic error if the mapper is the sole code-path used for updates.

The `vaccinationMapper.ts` analog does not have a file field, so there is no established pattern to follow — this is a new concern unique to the membership mapper.

**Fix:** Include `card_image` in the return type and implementation, or add a JSDoc note that callers must handle file uploads/clears separately and must NOT route them through this mapper:
```ts
// Option A — include the field so callers can pass "" to clear it
export function mapToUpdateMembership(record: Memberships): {
  card_name: string;
  issuer?: string;
  barcode_value?: string;
  barcode_type?: string;
  card_number?: string;
  expiry_date?: string;
  notes?: string;
  card_color?: string;
  card_image?: string;
} {
  return {
    card_name: record.card_name,
    issuer: record.issuer,
    barcode_value: record.barcode_value,
    barcode_type: record.barcode_type,
    card_number: record.card_number,
    expiry_date: record.expiry_date,
    notes: record.notes,
    card_color: record.card_color,
    card_image: record.card_image,
  };
}

// Option B — document the intentional exclusion so future maintainers
// understand file fields must be sent as FormData separately.
```

---

### WR-03: `AddMembership` includes `user` — risk of client-supplied user ID on create

**File:** `src/types/wallecx/memberships/types.d.ts:19`
**Issue:** `AddMembership` is defined as `Omit<Memberships, "id" | "created" | "updated">`, which retains `user: string`. If a service function accepts `AddMembership` as its payload type and forwards it directly to PocketBase's `create()`, the caller controls which `user` the record is associated with. PocketBase server-side rules should enforce ownership, but relying on the type to carry `user` invites mistakes — a component could accidentally pass the wrong user ID, or the field could be populated from an untrusted source.

The analog `AddVaccination` has the same issue, so this is a pre-existing pattern. However, this is the right moment to establish a safer pattern.

**Fix:** Omit `user` from `AddMembership` and have the service layer inject the authenticated user's ID from `pb.authStore.model?.id`:
```ts
export type AddMembership = Omit<Memberships, "id" | "created" | "updated" | "user">;
```
Then in the service/store:
```ts
pb.collection("wallecx_memberships").create({
  ...payload,
  user: pb.authStore.model?.id,
});
```

---

## Info

### IN-01: Interface named `Memberships` (plural) — convention inconsistency

**File:** `src/types/wallecx/memberships/types.d.ts:3`
**Issue:** The interface is named `Memberships` (plural), matching the analog `Vaccinations`. Both represent a **single record** from the collection, so the singular form (`Membership`, `Vaccination`) is semantically more accurate. This is a naming convention issue — the MoneyMe standards specify PascalCase for interfaces, which both satisfy, but do not address singular/plural for record types. The plural naming mirrors PocketBase collection names, which is one reason the pattern may have been chosen deliberately.

This is flagged as Info rather than Warning because changing it now would cascade across future consumers and the analog pair — a codebase-wide rename decision is better made deliberately.
**Suggestion:** If the team decides on singular naming, apply it consistently to both `Memberships` and `Vaccinations` at the same time.

---

### IN-02: `barcode_type` comment lists allowed values inline — consider a string union or enum

**File:** `src/types/wallecx/memberships/types.d.ts:11`
**Issue:** The comment `// 'qr' | 'code128' | 'ean13' | 'code39' | 'number'` documents the valid values but does not enforce them at the type level. Because PocketBase returns select fields as plain strings, this is understandable, but the allowed values could drift from the actual PocketBase schema without a compile-time error.
**Suggestion:** Consider a string union type alias:
```ts
export type BarcodeType = "qr" | "code128" | "ean13" | "code39" | "number";

export interface Memberships extends RecordModel {
  // ...
  barcode_type?: BarcodeType;
  // ...
}
```
This keeps the same runtime behaviour (string) while giving the compiler enough information to catch invalid values.

---

### IN-03: `mapToUpdateMembership` return type is an anonymous object literal — consider a named type

**File:** `src/lib/pocketbase/membershipMapper.ts:3-12`
**Issue:** The return type is an inline object literal. The analog `mapToUpdateVaccination` uses the same pattern, so this is consistent. However, a named type (e.g. `UpdateMembership`) would make it easier to reference the type elsewhere (e.g. in a store function signature or a unit test) without re-importing the mapper.
**Suggestion:** Export a named type and use it as the return type:
```ts
export type UpdateMembership = {
  card_name: string;
  issuer?: string;
  barcode_value?: string;
  barcode_type?: string;
  card_number?: string;
  expiry_date?: string;
  notes?: string;
  card_color?: string;
  card_image?: string;
};

export function mapToUpdateMembership(record: Memberships): UpdateMembership {
  // ...
}
```

---

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
