import type { AddPaytimePayment } from "@/types/paytime/payments/types";

export function mapToCreatePayment(payment: AddPaytimePayment): FormData {
  const formData = new FormData();
  formData.append("boarder", payment.boarder);
  formData.append("recorded_by", payment.recorded_by);
  formData.append("category", payment.category);
  formData.append("month", payment.month);
  formData.append("payment_date", payment.payment_date);
  if (payment.amount != null) {
    formData.append("amount", String(payment.amount));
  }
  if (payment.notes) {
    formData.append("notes", payment.notes);
  }
  if (payment.screenshot) {
    formData.append("screenshot", payment.screenshot);
  }
  return formData;
}

/**
 * `boarder` and `recorded_by` are deliberately omitted. PocketBase evaluates
 * the update rule against the record's stored values, so a rule shaped like
 * `boarder.user = @request.auth.id` passes on a request that also sets
 * `boarder` to a different boarder's row — which would hand the record away.
 * The same reasoning applies to `recorded_by`: never send an owner-ish field
 * on update.
 *
 * `notes` is always appended, unlike on create: an empty string is how a
 * cleared note gets persisted, whereas omitting the field leaves the old
 * value in place. `screenshot` is the opposite — omitted unless the user
 * picked a new file, so an untouched attachment survives the update.
 */
export function mapToUpdatePayment(
  payment: Omit<AddPaytimePayment, "boarder" | "recorded_by">,
): FormData {
  const formData = new FormData();
  formData.append("category", payment.category);
  formData.append("month", payment.month);
  formData.append("payment_date", payment.payment_date);
  if (payment.amount != null) {
    formData.append("amount", String(payment.amount));
  }
  formData.append("notes", payment.notes ?? "");
  if (payment.screenshot) {
    formData.append("screenshot", payment.screenshot);
  }
  return formData;
}
