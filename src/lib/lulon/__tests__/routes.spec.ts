import { describe, it, expect } from "vitest";
import { legacyGiftExchangeRedirect } from "@/lib/lulon/routes";

describe("legacyGiftExchangeRedirect", () => {
  it("maps the bare legacy prefix to the Lulon landing", () => {
    expect(
      legacyGiftExchangeRedirect({
        path: "/projects/gift-exchange",
        query: {},
      }),
    ).toEqual({ path: "/projects/lulon", query: {} });
  });

  it("maps a subpath to its Lulon equivalent", () => {
    expect(
      legacyGiftExchangeRedirect({
        path: "/projects/gift-exchange/draw",
        query: {},
      }),
    ).toEqual({ path: "/projects/lulon/draw", query: {} });
  });

  it("preserves the lobby and code query params", () => {
    const query = { lobby: "ABC123", code: "WXYZ" };
    expect(
      legacyGiftExchangeRedirect({
        path: "/projects/gift-exchange/join",
        query,
      }),
    ).toEqual({ path: "/projects/lulon/join", query });
  });

  it("does not rewrite a non-legacy path", () => {
    expect(
      legacyGiftExchangeRedirect({ path: "/projects/lulon", query: {} }),
    ).toEqual({ path: "/projects/lulon", query: {} });
  });
});
