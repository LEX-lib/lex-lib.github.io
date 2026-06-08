# Phase 13: Write Path — ManageMembership CRUD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 13-write-path-managemembership-crud
**Areas discussed:** ColorPicker UX, Barcode field visibility, Edit image handling, Delete trigger location

---

## ColorPicker UX

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-filled navy #002244 | Picker opens with default brand colour already selected. No empty-state to handle. | ✓ |
| Empty / no colour selected | Picker starts blank; user must actively choose or leave empty. | |
| Random pleasant colour | Pre-fill with randomised pastel or curated set. | |

**User's choice:** Pre-filled navy #002244

| Option | Description | Selected |
|--------|-------------|----------|
| No clear option | Colour always set to something (starts at navy). User can pick navy explicitly if they want default. | ✓ |
| Yes, add a Clear button | Sets card_color to empty string; display components default to navy. | |

**User's choice:** No clear option

**Notes:** card_color ref initialises to '002244' (no #) for new cards. Consistent with STATE.md locked decision on ColorPicker emit format.

---

## Barcode field visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Hide entirely with v-if | Field disappears when barcode_type === 'number'. Clean UI — no confusing disabled field. | ✓ |
| Show but disabled / greyed out | Field stays visible but uneditable when Number only selected. | |

**User's choice:** Hide entirely with v-if

| Option | Description | Selected |
|--------|-------------|----------|
| Clear it | barcode_value ref set to '' when switching to Number only. | ✓ |
| Preserve it in memory | Restore value if user switches back. Requires extra stash ref. | |

**User's choice:** Clear it on switch to Number only

**Notes:** v-if on barcode_value field tied to `barcode_type !== 'number'`. Switching to Number only fires a watcher or @change handler that sets barcode_value ref to ''.

---

## Edit: existing image handling

| Option | Description | Selected |
|--------|-------------|----------|
| Show thumbnail + 'Replace' upload | Display small thumbnail (thumb URL + token) when editing. FileUpload button says 'Replace image'. | ✓ |
| Just show FileUpload button (overwrite-only) | Same as create mode — no thumbnail shown. | |

**User's choice:** Show thumbnail + 'Replace' upload

| Option | Description | Selected |
|--------|-------------|----------|
| No — replacement only | Upload replaces image; no remove/clear option. | ✓ |
| Yes — add a Remove image button | Send PocketBase field clear to remove image. | |

**User's choice:** Replacement only — no remove option

**Notes:** Thumbnail uses `pb.files.getURL(record, record.card_image, { thumb: '100x100', token })`. Token must be passed as prop from MembershipsTab openDetail flow (token already fetched there for MembershipDetail). If no new file selected on save, card_image field is omitted from FormData.

---

## Delete trigger location

| Option | Description | Selected |
|--------|-------------|----------|
| Inside MembershipDetail dialog | Edit and Delete buttons in detail dialog footer/header. User sees card before committing. | ✓ |
| Delete button inside Edit dialog (danger zone) | Delete button at bottom of edit dialog. Fewer dialogs but less discoverable. | |
| Action buttons on MembershipCard tile | Edit/Delete icons on tile. Most direct but risk of accidental taps. | |

**User's choice:** Inside MembershipDetail dialog

| Option | Description | Selected |
|--------|-------------|----------|
| Edit button inside MembershipDetail dialog | Pairs with Delete. View → Edit → Manage dialog opens pre-filled. | ✓ |
| Separate Edit button on MembershipCard tile | Tile has both view click area and separate edit icon. | |

**User's choice:** Edit button inside MembershipDetail dialog

**Notes:** MembershipDetail.vue emits 'edit' and 'delete' events. MembershipsTab.vue listens: @edit closes detail and opens ManageMembership pre-filled; @delete fires useConfirm() flow. ConfirmDialog added to MembershipsTab.vue template.

---

## Claude's Discretion

- Exact dialog width (40vw matching ManageVaccination.vue)
- Field order in the form
- Zod schema specifics (regex for card_color, conditional barcode_value validation)
- MembershipDetail footer vs inline action button placement
- pendingFile ref reset strategy (explicit in success branch before visible = false)

## Deferred Ideas

None — discussion stayed within phase scope.
