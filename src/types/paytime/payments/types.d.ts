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
  /** The boarder this payment is for — the subject of the record. */
  boarder: string;
  /**
   * Who entered this payment. PocketBase returns the empty string for an
   * unset single relation, never null (confirmed against the live
   * `paytime_boarders.user` field, 38-COLLECTION.md) — do not add `=== null`
   * checks here, they will never fire. Use `=== ""` or truthiness to test
   * for "nobody recorded it yet" (should not occur post-migration, but the
   * relation is optional at the schema level per D-39-02).
   */
  recorded_by: string;
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
