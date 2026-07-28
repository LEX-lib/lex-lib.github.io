import { describe, expect, it } from "vitest";
import {
  mapToCreatePayment,
  mapToUpdatePayment,
} from "../paytimePaymentMapper";
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

describe("mapToUpdatePayment", () => {
  const base = {
    category: "electricity" as const,
    month: "2026-07",
    payment_date: "2026-07-28",
    amount: 5193.16,
  };

  // Sending an owner field on update would let the update rule (which is
  // evaluated against stored values) pass while reassigning the record.
  it("never sends user", () => {
    const formData = mapToUpdatePayment({ ...base, notes: "x" });
    expect(formData.has("user")).toBe(false);
  });

  it("maps the editable fields", () => {
    const formData = mapToUpdatePayment(base);
    expect(formData.get("category")).toBe("electricity");
    expect(formData.get("month")).toBe("2026-07");
    expect(formData.get("payment_date")).toBe("2026-07-28");
    expect(formData.get("amount")).toBe("5193.16");
  });

  // Empty string is what actually clears a note; omitting the key would keep
  // the old value.
  it("always sends notes, empty when cleared", () => {
    expect(mapToUpdatePayment(base).get("notes")).toBe("");
    expect(mapToUpdatePayment({ ...base, notes: "kept" }).get("notes")).toBe(
      "kept",
    );
  });

  // Opposite rule to notes: omitting screenshot preserves the attachment.
  it("only sends screenshot when a new file was picked", () => {
    expect(mapToUpdatePayment(base).has("screenshot")).toBe(false);
    const replacement = new File(["img"], "new.png", { type: "image/png" });
    expect(
      mapToUpdatePayment({ ...base, screenshot: replacement }).get("screenshot"),
    ).toBe(replacement);
  });
});
