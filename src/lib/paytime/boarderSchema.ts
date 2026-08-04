import { z } from "zod";

/** Mirrors paytime_boarders.tags's per-element bound (json field, maxSize 0 in PocketBase — the bound lives here instead). */
export const MaxTagLength = 60;

/**
 * D-38-04: trim, collapse inner whitespace, lowercase. Lives here (not only
 * in the UI) so every write path through the app lands on one canonical
 * form and the rule is unit-testable — this is the mitigation for the
 * typo-fragmentation risk ("Second Floor" vs "second floor" vs "second
 * floor ") that got free-text boarder names rejected at milestone scope.
 */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Upper-cases the first letter of each word for display; the stored value stays lowercase. */
export function titleCaseTag(tag: string): string {
  return tag.replace(/\S+/g, (word) => word[0]!.toUpperCase() + word.slice(1));
}

export const boarderSchema = z.object({
  name: z.string().trim().min(1, "Display name is required."),
  /**
   * Per-element bounds run before the transform so an over-long tag is
   * reported as a field error rather than silently stored. The transform
   * then normalizes every element, drops anything that normalizes to the
   * empty string (e.g. a whitespace-only tag), and de-duplicates while
   * preserving first-seen order — the vocabulary itself is never seeded
   * here (D-38-02); this only shapes what one boarder's own array holds.
   */
  tags: z
    .array(
      z
        .string()
        .min(1, "A tag cannot be empty.")
        .max(MaxTagLength, "A tag must be 60 characters or fewer."),
    )
    .transform((rawTags) => {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const rawTag of rawTags) {
        const normalized = normalizeTag(rawTag);
        if (!normalized || seen.has(normalized)) {
          continue;
        }
        seen.add(normalized);
        result.push(normalized);
      }
      return result;
    }),
  /** Empty string means no linked account — see PaytimeBoarder.user. */
  user: z.string(),
  is_active: z.boolean(),
});

export type BoarderInput = z.infer<typeof boarderSchema>;

/** Flattens Zod issues into a { field: firstMessage } map for inline display. */
export function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
