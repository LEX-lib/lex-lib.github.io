import { describe, expect, it } from "vitest";
import {
  collectFieldErrors,
  MaxScreenshotBytes,
  paymentSchema,
} from "../paymentSchema";

const valid = {
  category: "electricity" as const,
  month: "2026-07",
  payment_date: "2026-07-28",
  amount: 5193.16,
};

const errorsFor = (input: unknown) => {
  const result = paymentSchema.safeParse(input);
  expect(result.success).toBe(false);
  return collectFieldErrors(result.error!);
};

describe("paymentSchema", () => {
  it("accepts a minimal valid payment (notes and screenshot omitted)", () => {
    expect(paymentSchema.safeParse(valid).success).toBe(true);
  });

  it("requires amount", () => {
    expect(errorsFor({ ...valid, amount: undefined }).amount).toBe(
      "Amount is required.",
    );
  });

  it("rejects zero and negative amounts", () => {
    expect(errorsFor({ ...valid, amount: 0 }).amount).toMatch(/greater than zero/);
    expect(errorsFor({ ...valid, amount: -1 }).amount).toMatch(/greater than zero/);
  });

  it("rejects a malformed month", () => {
    expect(errorsFor({ ...valid, month: "2026-7" }).month).toMatch(/YYYY-MM/);
  });

  it("rejects an impossible calendar date", () => {
    expect(errorsFor({ ...valid, payment_date: "2026-02-31" }).payment_date).toMatch(
      /valid calendar date/,
    );
  });

  it("rejects an unknown category", () => {
    expect(errorsFor({ ...valid, category: "water" }).category).toBeTruthy();
  });

  it("accepts notes only up to 2000 chars", () => {
    expect(paymentSchema.safeParse({ ...valid, notes: "x".repeat(2000) }).success).toBe(
      true,
    );
    expect(errorsFor({ ...valid, notes: "x".repeat(2001) }).notes).toMatch(/2000/);
  });

  it("rejects an oversized screenshot", () => {
    const big = new File(["x"], "proof.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: MaxScreenshotBytes + 1 });
    expect(errorsFor({ ...valid, screenshot: big }).screenshot).toMatch(/5 MB/);
  });

  it("rejects a non-image screenshot", () => {
    const pdf = new File(["x"], "proof.pdf", { type: "application/pdf" });
    expect(errorsFor({ ...valid, screenshot: pdf }).screenshot).toMatch(/PNG, JPEG/);
  });

  it("accepts a HEIC screenshot", () => {
    const heic = new File(["x"], "proof.heic", { type: "image/heic" });
    expect(paymentSchema.safeParse({ ...valid, screenshot: heic }).success).toBe(true);
  });

  it("collectFieldErrors keeps the first message per field", () => {
    const errors = errorsFor({ category: "nope", month: "bad", amount: -1 });
    expect(Object.keys(errors).sort()).toEqual([
      "amount",
      "category",
      "month",
      "payment_date",
    ]);
  });
});
