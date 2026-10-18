import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSavedLobbyCode,
  getSavedLobbyCode,
  normalizeLobbyCode,
  resolveLobbyCode,
  saveLobbyCode,
} from "@/lib/lulon/lobbySession";

beforeEach(() => {
  sessionStorage.clear();
});

describe("normalizeLobbyCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeLobbyCode("  abcd12  ")).toBe("ABCD12");
  });

  it("maps nullish input to an empty string", () => {
    expect(normalizeLobbyCode(null)).toBe("");
    expect(normalizeLobbyCode(undefined)).toBe("");
  });
});

describe("saveLobbyCode / getSavedLobbyCode", () => {
  it("round-trips a code in normalized form", () => {
    saveLobbyCode("abcd12");
    expect(getSavedLobbyCode()).toBe("ABCD12");
  });

  it("ignores empty or whitespace-only codes", () => {
    saveLobbyCode("");
    saveLobbyCode("   ");
    saveLobbyCode(null);
    expect(getSavedLobbyCode()).toBe("");
  });

  it("returns an empty string when nothing was saved", () => {
    expect(getSavedLobbyCode()).toBe("");
  });
});

describe("clearSavedLobbyCode", () => {
  it("forgets the saved code", () => {
    saveLobbyCode("ABCD12");
    clearSavedLobbyCode();
    expect(getSavedLobbyCode()).toBe("");
  });
});

describe("resolveLobbyCode", () => {
  it("prefers and persists the URL code", () => {
    const resolved = resolveLobbyCode("?lobby=abcd12");
    expect(resolved).toBe("ABCD12");
    // Persisted, so the next page without a query still finds it.
    expect(getSavedLobbyCode()).toBe("ABCD12");
  });

  it("overwrites a previously saved code when the URL carries a new one", () => {
    saveLobbyCode("OLDCODE");
    expect(resolveLobbyCode("?lobby=NEWCODE")).toBe("NEWCODE");
    expect(getSavedLobbyCode()).toBe("NEWCODE");
  });

  it("falls back to the saved code when the URL has none", () => {
    saveLobbyCode("SAVED12");
    expect(resolveLobbyCode("")).toBe("SAVED12");
    expect(resolveLobbyCode("?other=1")).toBe("SAVED12");
  });

  it("returns an empty string when neither URL nor storage has a code", () => {
    expect(resolveLobbyCode("")).toBe("");
  });

  it("ignores a blank lobby query param", () => {
    saveLobbyCode("SAVED12");
    expect(resolveLobbyCode("?lobby=")).toBe("SAVED12");
  });
});
