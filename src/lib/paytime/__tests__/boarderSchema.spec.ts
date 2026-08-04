import { describe, expect, it } from "vitest";
import {
  boarderSchema,
  collectFieldErrors,
  MaxTagLength,
  titleCaseTag,
} from "../boarderSchema";

const valid = {
  name: "Probe A",
  user: "",
  is_active: true,
};

describe("boarderSchema tags", () => {
  it("normalizes differently-spaced/cased spellings of the same tag to one stored value", () => {
    const result = boarderSchema.safeParse({
      ...valid,
      tags: ["Second Floor", "second  floor", "Second floor"],
    });
    expect(result.success).toBe(true);
    expect(result.data!.tags).toEqual(["second floor"]);
  });

  it("drops a whitespace-only tag rather than storing an empty string", () => {
    const result = boarderSchema.safeParse({ ...valid, tags: ["   "] });
    expect(result.success).toBe(true);
    expect(result.data!.tags).toEqual([]);
  });

  it("accepts an empty tags array (D-38-02's starting steady state)", () => {
    const result = boarderSchema.safeParse({ ...valid, tags: [] });
    expect(result.success).toBe(true);
    expect(result.data!.tags).toEqual([]);
  });

  it("rejects a tag longer than MaxTagLength with a field error keyed 'tags'", () => {
    const result = boarderSchema.safeParse({
      ...valid,
      tags: ["x".repeat(MaxTagLength + 1)],
    });
    expect(result.success).toBe(false);
    expect(collectFieldErrors(result.error!).tags).toMatch(/60 characters/);
  });

  it("does not mutate the input tags array", () => {
    const input = ["Second Floor", "second  floor"];
    const original = [...input];
    boarderSchema.safeParse({ ...valid, tags: input });
    expect(input).toEqual(original);
  });
});

describe("titleCaseTag", () => {
  it("upper-cases the first letter of each word", () => {
    expect(titleCaseTag("second floor")).toBe("Second Floor");
  });
});
