import type { RecordModel } from "pocketbase";

export type PaymentCategory =
  | "electricity"
  | "internet"
  | "boarding_fee"
  | "others";

export interface PaytimePayment extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  category: PaymentCategory;
  /** "YYYY-MM" — the month this payment covers */
  month: string;
  payment_date: string;
  amount?: number;
  notes?: string;
  screenshot?: string;
}

export type AddPaytimePayment = Omit<
  PaytimePayment,
  "id" | "created" | "updated" | "screenshot"
> & { screenshot?: File };
