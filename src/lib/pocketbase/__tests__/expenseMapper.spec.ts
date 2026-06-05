import { describe, it, expect } from "vitest";
import { mapToUpdateExpense } from "@/lib/pocketbase/expenseMapper";
import type { Expenses } from "@/types/wallecx/expenses/types";

const makeExpense = (overrides: Partial<Expenses> = {}): Expenses => ({
  id: "server-id-123",
  created: "2026-01-01T00:00:00.000Z",
  updated: "2026-01-02T00:00:00.000Z",
  collectionId: "exp",
  collectionName: "wallecx_expenses",
  user: "user-id-456",
  amount: 12.5,
  expense_date: "2026-05-19",
  category: "Food",
  description: "Coffee at café",
  notes: "Morning standup",
  receipt: "receipt.jpg",
  expand: {},
  ...overrides,
});

describe("mapToUpdateExpense strips server-managed fields", () => {
  const payload = mapToUpdateExpense(makeExpense());

  it("strips id, created, updated, user, receipt, collectionId, collectionName", () => {
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created");
    expect(payload).not.toHaveProperty("updated");
    expect(payload).not.toHaveProperty("user");
    expect(payload).not.toHaveProperty("receipt");
    expect(payload).not.toHaveProperty("collectionId");
    expect(payload).not.toHaveProperty("collectionName");
  });
});

describe("mapToUpdateExpense preserves writable fields", () => {
  const payload = mapToUpdateExpense(makeExpense());

  it("preserves amount", () => {
    expect(payload.amount).toBe(12.5);
  });

  it("preserves expense_date", () => {
    expect(payload.expense_date).toBe("2026-05-19");
  });

  it("preserves category", () => {
    expect(payload.category).toBe("Food");
  });

  it("preserves description", () => {
    expect(payload.description).toBe("Coffee at café");
  });

  it("preserves notes when present", () => {
    expect(payload.notes).toBe("Morning standup");
  });

  it("drops notes when undefined", () => {
    const minimal = makeExpense({ notes: undefined });
    const minimalPayload = mapToUpdateExpense(minimal);
    expect(minimalPayload).not.toHaveProperty("notes");
  });

  it("handles fractional amount values without loss of precision (2 decimal places)", () => {
    const fractional = makeExpense({ amount: 1234.56 });
    const fractionalPayload = mapToUpdateExpense(fractional);
    expect(fractionalPayload.amount).toBe(1234.56);
  });
});

describe("create-then-update id-refresh contract", () => {
  it("Object.assign propagates server id so second save PATCHes the same record", () => {
    const localItem = { amount: 9.99, expense_date: "2026-05-19", category: "Food", description: "x", id: "" };
    const serverRecord = makeExpense({ id: "server-id-789" });
    Object.assign(localItem, serverRecord);
    expect(localItem.id).toBe("server-id-789");
    expect(localItem.id).not.toBe("");
  });
});
