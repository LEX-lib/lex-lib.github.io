import type { RecordModel } from "pocketbase";

export interface Expenses extends RecordModel {
  id: string;
  created: string;
  updated: string;
  user: string;
  amount: number;
  expense_date: string;   // ISO date YYYY-MM-DD
  category: string;       // denormalized name (not a relation — see 23-CONTEXT D-07)
  description: string;
  notes?: string;
  receipt?: string;       // filename returned by MaxSelect=1 file field
}

export type AddExpense = Omit<Expenses, "id" | "created" | "updated">;
