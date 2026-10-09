import { describe, expect, it } from "vitest";
import {
  dedupeConsecutiveStops,
  dedupeRoute,
  findRoutesNearPoint,
  getDistance,
  type PuvRoute,
  type PuvStop,
} from "@/lib/larga/routeUtils";

const stop = (name: string, coords: [number, number]): PuvStop => ({
  name,
  coords,
});
const route = (name: string, stops: PuvStop[]): PuvRoute => ({
  name,
  color: "red",
  stops,
});

describe("getDistance", () => {
  it("is zero for identical points", () => {
    expect(getDistance([10, 122], [10, 122])).toBe(0);
  });

  it("is symmetric", () => {
    const a: [number, number] = [10.73, 122.56];
    const b: [number, number] = [10.75, 122.54];
    expect(getDistance(a, b)).toBeCloseTo(getDistance(b, a), 6);
  });

  it("approximates one degree of latitude (~111 km)", () => {
    const d = getDistance([0, 0], [1, 0]);
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_500);
  });
});

describe("dedupeConsecutiveStops", () => {
  it("removes consecutive duplicate coordinates", () => {
    const stops = [
      stop("A", [1, 1]),
      stop("B", [2, 2]),
      stop("B again", [2, 2]),
      stop("C", [3, 3]),
    ];
    expect(dedupeConsecutiveStops(stops).map((s) => s.name)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });

  it("keeps non-consecutive revisits (out-and-back routes)", () => {
    const stops = [
      stop("Terminal", [1, 1]),
      stop("Far", [2, 2]),
      stop("Terminal", [1, 1]),
    ];
    expect(dedupeConsecutiveStops(stops)).toHaveLength(3);
  });

  it("handles empty and single-stop arrays", () => {
    expect(dedupeConsecutiveStops([])).toEqual([]);
    expect(dedupeConsecutiveStops([stop("A", [1, 1])])).toHaveLength(1);
  });
});

describe("dedupeRoute", () => {
  it("returns the same instance when nothing changes", () => {
    const r = route("R", [stop("A", [1, 1]), stop("B", [2, 2])]);
    expect(dedupeRoute(r)).toBe(r);
  });

  it("returns a new route with deduped stops when needed", () => {
    const out = dedupeRoute(route("R", [stop("A", [1, 1]), stop("A", [1, 1])]));
    expect(out.stops).toHaveLength(1);
    expect(out.name).toBe("R");
  });
});

describe("findRoutesNearPoint", () => {
  const routes = [
    route("R1", [stop("near", [10, 122])]),
    route("R2", [stop("far", [11, 123])]),
  ];

  it("returns routes with a stop within the threshold", () => {
    expect(findRoutesNearPoint(routes, [10, 122], 300)).toEqual(["R1"]);
  });

  it("treats the threshold as exclusive (~220 m inside, ~1.1 km outside)", () => {
    expect(findRoutesNearPoint(routes, [10, 122.002], 300)).toEqual(["R1"]);
    expect(findRoutesNearPoint(routes, [10, 122.01], 300)).toEqual([]);
  });
});
