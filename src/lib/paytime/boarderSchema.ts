import { z } from "zod";

export const boarderSchema = z.object({
  name: z.string().trim().min(1, "Display name is required."),
  tags: z.array(z.string().min(1)),
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
