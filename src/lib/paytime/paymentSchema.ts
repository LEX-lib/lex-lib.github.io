import { z } from "zod";

/**
 * True only if the YYYY-MM-DD string names a real calendar day.
 *
 * Deliberately not `dayjs(value, "YYYY-MM-DD", true)`: strict parsing needs
 * dayjs's customParseFormat plugin, which this app never registers, so those
 * args are silently ignored and "2026-02-31" loosely parses to Mar 3. The
 * round-trip below rejects rollovers with no plugin dependency.
 */
function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Mirrors paytime_payments.screenshot in PocketBase (maxSize 0 = PB's 5 MB default). */
export const MaxScreenshotBytes = 5 * 1024 * 1024;

/** Mirrors paytime_payments.screenshot.mimeTypes. */
export const AcceptedScreenshotTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heif",
  "image/heic",
] as const;

export const paymentSchema = z.object({
  category: z.enum(["electricity", "internet", "boarding_fee", "others"], {
    error: "Select what the payment is for.",
  }),
  month: z
    .string({ error: "Select the month this payment covers." })
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format."),
  payment_date: z
    .string({ error: "Select the date paid." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
    .refine(isRealCalendarDate, {
      message: "Date is not a valid calendar date.",
    }),
  amount: z
    .number({ error: "Amount is required." })
    .positive("Amount must be greater than zero.")
    .max(99_999_999.99, "Amount is too large."),
  notes: z.string().max(2000, "Notes must be 2000 characters or fewer.").optional(),
  screenshot: z
    .instanceof(File)
    .refine((file) => file.size <= MaxScreenshotBytes, {
      message: "Screenshot must be 5 MB or smaller.",
    })
    .refine(
      (file) =>
        (AcceptedScreenshotTypes as readonly string[]).includes(file.type),
      { message: "Screenshot must be a PNG, JPEG, WebP, or HEIC image." },
    )
    .optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

/** Flattens Zod issues into a { field: firstMessage } map for inline display. */
export function collectFieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
