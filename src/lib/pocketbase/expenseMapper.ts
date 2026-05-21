import type { Expenses } from "@/types/wallecx/expenses/types";

/**
 * Strip read-only PocketBase fields on PATCH.
 *
 * Read-only fields stripped: id, created, updated, user, collectionId, collectionName, expand, receipt.
 * `receipt` is a file field and is handled separately as FormData in Phase 24's ManageExpense.vue
 * (matches the existing vaccinations `card` / memberships `card_image` pattern).
 *
 * Downstream Phase 24/25 readers: when querying these collections, use distinct requestKeys
 * to prevent PocketBase auto-cancel (D-19):
 *   - pb.collection('wallecx_expenses').getFullList<Expenses>({ requestKey: 'expenses-getFullList' })
 *   - pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({ requestKey: 'expense-categories-getFullList' })
 * These keys must not collide with 'vaccinations-getFullList' / 'memberships-getFullList'.
 */
export function mapToUpdateExpense(record: Expenses): {
  amount: number;
  expense_date: string;
  category: string;
  description: string;
  notes?: string;
} {
  return {
    amount: record.amount,
    expense_date: record.expense_date,
    category: record.category,
    description: record.description,
    notes: record.notes,
  };
}
