import type { AddPaytimePayment } from "@/types/paytime/payments/types";

export function mapToCreatePayment(payment: AddPaytimePayment): FormData {
  const formData = new FormData();
  formData.append("user", payment.user);
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
