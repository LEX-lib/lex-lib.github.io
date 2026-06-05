import { describe, it, expect } from "vitest";
import { mapToUpdateMembership } from "@/lib/pocketbase/membershipMapper";
import type { Memberships } from "@/types/wallecx/memberships/types";

const makeMembership = (overrides: Partial<Memberships> = {}): Memberships => ({
  id: "server-id-123",
  created: "2026-01-01T00:00:00.000Z",
  updated: "2026-01-02T00:00:00.000Z",
  collectionId: "def",
  collectionName: "wallecx_memberships",
  user: "user-id-456",
  card_name: "Woolworths Rewards",
  issuer: "Woolworths",
  barcode_value: "9300675024861",
  barcode_type: "ean13",
  card_number: "6002 3456 7890",
  expiry_date: "2027-12-31",
  notes: "Gold tier",
  card_color: "00aa44",
  card_image: "card.jpg",
  expand: {},
  ...overrides,
});

describe("mapToUpdateMembership strips server-managed fields", () => {
  const payload = mapToUpdateMembership(makeMembership());

  it("strips id, created, updated, user, card_image", () => {
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created");
    expect(payload).not.toHaveProperty("updated");
    expect(payload).not.toHaveProperty("user");
    expect(payload).not.toHaveProperty("card_image");
  });
});

describe("mapToUpdateMembership preserves writable fields", () => {
  const payload = mapToUpdateMembership(makeMembership());

  it("preserves card_name", () => {
    expect(payload.card_name).toBe("Woolworths Rewards");
  });

  it("preserves issuer", () => {
    expect(payload.issuer).toBe("Woolworths");
  });

  it("preserves barcode_value", () => {
    expect(payload.barcode_value).toBe("9300675024861");
  });

  it("preserves barcode_type", () => {
    expect(payload.barcode_type).toBe("ean13");
  });

  it("preserves card_number", () => {
    expect(payload.card_number).toBe("6002 3456 7890");
  });

  it("preserves expiry_date", () => {
    expect(payload.expiry_date).toBe("2027-12-31");
  });

  it("preserves notes", () => {
    expect(payload.notes).toBe("Gold tier");
  });

  it("preserves card_color", () => {
    expect(payload.card_color).toBe("00aa44");
  });

  it("preserves optional fields as undefined when absent", () => {
    const minimal = makeMembership({ issuer: undefined, barcode_value: undefined, card_color: undefined });
    const minimalPayload = mapToUpdateMembership(minimal);
    expect(minimalPayload.issuer).toBeUndefined();
    expect(minimalPayload.barcode_value).toBeUndefined();
    expect(minimalPayload.card_color).toBeUndefined();
  });
});

describe("create-then-update id-refresh contract", () => {
  it("Object.assign propagates server id so second save PATCHes the same record", () => {
    const localItem = { card_name: "ALDI", id: "" };
    const serverRecord = makeMembership({ id: "server-id-789" });
    Object.assign(localItem, serverRecord);
    expect(localItem.id).toBe("server-id-789");
    expect(localItem.id).not.toBe("");
  });
});
