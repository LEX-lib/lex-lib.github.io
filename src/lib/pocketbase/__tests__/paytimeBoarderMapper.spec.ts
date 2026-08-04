import { describe, expect, it } from "vitest";
import {
  mapToCreateBoarder,
  mapToUpdateBoarder,
} from "../paytimeBoarderMapper";
import type { BoarderInput } from "@/lib/paytime/boarderSchema";

describe("mapToCreateBoarder", () => {
  const base: BoarderInput = {
    name: "Probe A",
    tags: [],
    user: "",
    is_active: true,
  };

  // 38-COLLECTION.md deviation #1: PocketBase v0.23+ removed per-field bool
  // defaults, so the live is_active field carries none — an absent value
  // reads back as false. This mapper is the only place the true default is
  // enforced; there is no server-side backstop.
  it("sends is_active: true explicitly on create", () => {
    const payload = mapToCreateBoarder(base);
    expect(payload.is_active).toBe(true);
  });

  it("maps name, tags and user unlinked", () => {
    const payload = mapToCreateBoarder(base);
    expect(payload.name).toBe("Probe A");
    expect(payload.tags).toEqual([]);
    expect(payload.user).toBe("");
  });

  it("maps a linked user id", () => {
    const payload = mapToCreateBoarder({ ...base, user: "user123" });
    expect(payload.user).toBe("user123");
  });
});

describe("mapToUpdateBoarder", () => {
  it("excludes is_active — its only write path is the row-action menu (D-38-18)", () => {
    const payload = mapToUpdateBoarder({
      name: "Probe A",
      tags: ["tenant"],
      user: "user123",
    });
    expect(payload).not.toHaveProperty("is_active");
    expect(payload.name).toBe("Probe A");
    expect(payload.tags).toEqual(["tenant"]);
    expect(payload.user).toBe("user123");
  });
});
