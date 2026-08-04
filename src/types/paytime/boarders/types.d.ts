import type { RecordModel } from "pocketbase";

export interface PaytimeBoarder extends RecordModel {
  id: string;
  created: string;
  updated: string;
  name: string;
  tags: string[];
  /**
   * PocketBase returns the empty string for an unset single relation, never
   * null (confirmed against the live `paytime_boarders.user` field, 38-COLLECTION.md)
   * — do not add `=== null` checks here, they will never fire. Use `=== ""`
   * or truthiness to test for "no linked account".
   */
  user: string;
  is_active: boolean;
}

export type AddPaytimeBoarder = Omit<
  PaytimeBoarder,
  "id" | "created" | "updated"
>;
