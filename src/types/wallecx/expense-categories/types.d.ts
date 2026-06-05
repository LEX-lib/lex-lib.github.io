import type { RecordModel } from "pocketbase";

export interface ExpenseCategories extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  name: string;
}

export type AddExpenseCategory = Omit<ExpenseCategories, "id" | "created" | "updated">;
