import type { BoarderInput } from "@/lib/paytime/boarderSchema";

/**
 * Plain objects, not FormData — a boarder has no file field.
 *
 * Unlike `paytimePaymentMapper`'s "never send the owner field on update"
 * discipline, `user` here is safe on both create and update: it's an
 * editable attribute of the boarder (who they're linked to), not the
 * record's own ownership field the way `paytime_payments.user` is.
 *
 * `is_active` deviation (38-COLLECTION.md #1): PocketBase v0.23+ removed
 * per-field bool defaults, so the live `is_active` field carries no server
 * default and an absent value reads back as `false`. This mapper is the
 * only enforcement point — it sends `is_active` explicitly on create so a
 * freshly added boarder is active from the start. Any future write path
 * that bypasses this mapper must set `is_active` itself; there is no
 * server-side backstop.
 */
export function mapToCreateBoarder(input: BoarderInput) {
  return {
    name: input.name,
    tags: input.tags,
    user: input.user,
    is_active: input.is_active,
  };
}

/**
 * `is_active` is intentionally excluded — per D-38-18 its only write path is
 * the row-action menu (Plan 03), not the edit form.
 */
export function mapToUpdateBoarder(input: Omit<BoarderInput, "is_active">) {
  return {
    name: input.name,
    tags: input.tags,
    user: input.user,
  };
}
