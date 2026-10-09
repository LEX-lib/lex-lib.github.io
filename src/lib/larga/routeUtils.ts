export interface PuvStop {
  name: string;
  coords: [number, number];
}

export interface PuvRoute {
  name: string;
  color: string;
  stops: PuvStop[];
}

const EARTH_RADIUS_M = 6371e3;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres between two [lat, lng] points (Haversine). */
export function getDistance(a: [number, number], b: [number, number]): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const h =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Drop stops that repeat the previous stop's coordinates (zero-length segments).
 * Out-and-back routes legitimately revisit points, so only *consecutive*
 * duplicates are removed — a global dedupe would distort the polyline.
 */
export function dedupeConsecutiveStops(stops: PuvStop[]): PuvStop[] {
  const result: PuvStop[] = [];
  let prev: PuvStop | undefined;
  for (const stop of stops) {
    if (
      !prev ||
      stop.coords[0] !== prev.coords[0] ||
      stop.coords[1] !== prev.coords[1]
    ) {
      result.push(stop);
    }
    prev = stop;
  }
  return result;
}

/** Returns the same route instance when there is nothing to dedupe. */
export function dedupeRoute(route: PuvRoute): PuvRoute {
  const stops = dedupeConsecutiveStops(route.stops);
  return stops.length === route.stops.length ? route : { ...route, stops };
}

/** Names of routes with at least one stop within `thresholdMeters` of `point`. */
export function findRoutesNearPoint(
  routes: PuvRoute[],
  point: [number, number],
  thresholdMeters = 300,
): string[] {
  return routes
    .filter((route) =>
      route.stops.some(
        (stop) => getDistance(stop.coords, point) < thresholdMeters,
      ),
    )
    .map((route) => route.name);
}
