import type { ExpenseBudget } from "@/types/wallecx/expense-budgets/types";

/**
 * Strip read-only PocketBase fields on PATCH for wallecx_expense_budgets.
 *
 * Read-only fields stripped: id, created, updated, user, collectionId, collectionName, expand.
 * The writable field set is { category, budget_type, amount }.
 *
 * Downstream Phase 28 readers: when querying wallecx_expense_budgets, use the locked
 * distinct requestKey to prevent PocketBase auto-cancel (STATE.md invariant):
 *   - pb.collection('wallecx_expense_budgets').getFullList<ExpenseBudget>({ requestKey: 'expense-budgets-getFullList' })
 * This key must not collide with 'expenses-getFullList', 'expense-categories-getFullList',
 * 'vaccinations-getFullList', or 'memberships-getFullList'.
 */
export function mapToUpdateExpenseBudget(record: ExpenseBudget): {
  category: string;
  budget_type: "monthly" | "yearly";
  amount: number;
} {
  return {
    category: record.category,
    budget_type: record.budget_type,
    amount: record.amount,
  };
}
