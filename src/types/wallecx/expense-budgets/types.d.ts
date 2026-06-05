import type { RecordModel } from "pocketbase";

export interface ExpenseBudget extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  category: string;
  budget_type: "monthly" | "yearly";
  amount: number;
}

export type AddExpenseBudget = Omit<ExpenseBudget, "id" | "created" | "updated">;
