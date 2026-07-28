import { describe, expect, it } from "vitest";
import { mapToCreatePayment } from "../paytimePaymentMapper";
import type { AddPaytimePayment } from "@/types/paytime/payments/types";

describe("mapToCreatePayment", () => {
  const base: AddPaytimePayment = {
    user: "user123",
    category: "electricity",
    month: "2026-07",
    payment_date: "2026-07-28",
  };

  it("maps required fields", () => {
    const formData = mapToCreatePayment(base);
    expect(formData.get("user")).toBe("user123");
    expect(formData.get("category")).toBe("electricity");
    expect(formData.get("month")).toBe("2026-07");
    expect(formData.get("payment_date")).toBe("2026-07-28");
  });

  it("omits optional fields when absent", () => {
    const formData = mapToCreatePayment(base);
    expect(formData.has("amount")).toBe(false);
    expect(formData.has("notes")).toBe(false);
    expect(formData.has("screenshot")).toBe(false);
  });

  it("includes amount, notes and screenshot when set", () => {
    const screenshot = new File(["img"], "proof.png", { type: "image/png" });
    const formData = mapToCreatePayment({
      ...base,
      category: "others",
      amount: 1500,
      notes: "water bill",
      screenshot,
    });
    expect(formData.get("amount")).toBe("1500");
    expect(formData.get("notes")).toBe("water bill");
    expect(formData.get("screenshot")).toBe(screenshot);
  });
});
