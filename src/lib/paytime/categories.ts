import type { PaymentCategory } from "@/types/paytime/payments/types";

/** Values must match the paytime_payments.category select in PocketBase. */
export const CategoryOptions: { label: string; value: PaymentCategory }[] = [
  { label: "Electricity", value: "electricity" },
  { label: "Internet", value: "internet" },
  { label: "Boarding Fee", value: "boarding_fee" },
  { label: "Others", value: "others" },
];

/** Falls back to the raw value so an unknown category still renders. */
export function categoryLabel(value: string): string {
  return CategoryOptions.find((option) => option.value === value)?.label ?? value;
}
