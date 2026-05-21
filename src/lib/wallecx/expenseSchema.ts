import { z } from 'zod';

// Default category set — locked. Phase 24's ManageExpense.vue lazily seeds these per-user
// on first dialog open by bulk-inserting one row per category into wallecx_expense_categories.
// Phase 23 only DEFINES the constant; it does NOT seed (no PocketBase signup hook — D-09).
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Health',
  'Shopping',
  'Entertainment',
  'Other',
] as const;

export const expenseSchema = z.object({
  amount: z.number().positive().max(99_999_999.99),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().min(1).max(60),
  description: z.string().min(1).max(120),
  notes: z.string().max(2000).optional(),
  // receipt is handled separately as FormData (matches vaccinations/memberships file-field pattern)
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1).max(60),
});

// Convenience inferred types (D-claude-discretion — removes type duplication)
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
