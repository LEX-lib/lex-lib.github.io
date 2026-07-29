import { pb } from "@/lib/pocketbase";
import type { PaytimePayment } from "@/types/paytime/payments/types";

/**
 * Full-size proof URL. `screenshot` is a protected file field, so the token is
 * required or PocketBase answers 403.
 */
export function screenshotUrl(payment: PaytimePayment, token: string): string {
  return payment.screenshot
    ? pb.files.getURL(payment, payment.screenshot, { token })
    : "";
}

/**
 * Thumbnail URL, or the full file when no thumbnail can be generated.
 *
 * PocketBase's thumb generator returns 404 for WebP sources (wallecx hit this
 * as Phase 36 PF-07). Every compressed screenshot is WebP, so most PayTime
 * uploads take the fallback branch — requesting ?thumb unconditionally breaks
 * every preview. Keep this rule in one place; it is easy to "simplify" wrongly.
 */
export function screenshotThumbUrl(
  payment: PaytimePayment,
  token: string,
  size = "100x100",
): string {
  const filename = payment.screenshot;
  if (!filename) {
    return "";
  }
  const isWebP = filename.toLowerCase().endsWith(".webp");
  return pb.files.getURL(
    payment,
    filename,
    isWebP ? { token } : { thumb: size, token },
  );
}
