import { describe, it, expect } from "vitest";
import { mapToUpdateVaccination } from "@/lib/pocketbase/vaccinationMapper";
import type { Vaccinations } from "@/types/wallecx/vaccinations/types";

const makeVaccinations = (overrides: Partial<Vaccinations> = {}): Vaccinations => ({
  id: "server-id-123",
  created: "2026-01-01T00:00:00.000Z",
  updated: "2026-01-02T00:00:00.000Z",
  collectionId: "abc",
  collectionName: "wallecx_vaccinations",
  user: "user-id-456",
  vaccine_name: "Influenza",
  date_administered: "2026-01-01",
  dose_number: 1,
  lot_number: "LOT001",
  location: "Clinic A",
  manufacturer: "Acme",
  notes: "Arm sore after",
  card: "photo.jpg",
  expand: {},
  ...overrides,
});

describe("mapToUpdateVaccination strips server-managed fields", () => {
  const payload = mapToUpdateVaccination(makeVaccinations());

  it("strips id, created, updated, user, card", () => {
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created");
    expect(payload).not.toHaveProperty("updated");
    expect(payload).not.toHaveProperty("user");
    expect(payload).not.toHaveProperty("card");
  });
});

describe("mapToUpdateVaccination preserves writable fields", () => {
  const payload = mapToUpdateVaccination(makeVaccinations());

  it("preserves vaccine_name", () => {
    expect(payload.vaccine_name).toBe("Influenza");
  });

  it("preserves date_administered", () => {
    expect(payload.date_administered).toBe("2026-01-01");
  });

  it("preserves dose_number", () => {
    expect(payload.dose_number).toBe(1);
  });

  it("preserves lot_number", () => {
    expect(payload.lot_number).toBe("LOT001");
  });

  it("preserves location", () => {
    expect(payload.location).toBe("Clinic A");
  });

  it("preserves manufacturer", () => {
    expect(payload.manufacturer).toBe("Acme");
  });

  it("preserves notes", () => {
    expect(payload.notes).toBe("Arm sore after");
  });

  it("preserves optional fields as undefined when absent", () => {
    const minimal = makeVaccinations({ dose_number: undefined, lot_number: undefined });
    const minimalPayload = mapToUpdateVaccination(minimal);
    expect(minimalPayload.dose_number).toBeUndefined();
    expect(minimalPayload.lot_number).toBeUndefined();
  });
});

describe("create-then-update id-refresh contract", () => {
  it("Object.assign propagates server id so second save PATCHes the same record", () => {
    const localItem = { vaccine_name: "Flu", date_administered: "2026-01-01", id: "" };
    const serverRecord = makeVaccinations({ id: "server-id-789" });
    Object.assign(localItem, serverRecord);
    expect(localItem.id).toBe("server-id-789");
    expect(localItem.id).not.toBe("");
  });
});
