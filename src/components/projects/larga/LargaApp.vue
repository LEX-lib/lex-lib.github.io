<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type * as LeafletType from "leaflet";
import type { PuvRoute } from "@/lib/larga/routeUtils";
import { dedupeRoute, findRoutesNearPoint } from "@/lib/larga/routeUtils";
import { route3, route10 } from "@/constants/routes";

// Vite inlines Leaflet's default marker images as data URIs, which breaks
// Icon.Default's CSS path detection (every marker would point at a bare
// "marker-icon.png" → 404/HTML fallback). Point Leaflet at the bundled asset
// URLs explicitly so markers actually render.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

// A stop is "nearby" when it is within this radius of the searched place.
const NEARBY_THRESHOLD_M = 300;

// Populated in onMounted via dynamic import (keeps Leaflet out of the initial bundle).
let L!: typeof LeafletType;
let geocoderFn!: (typeof import("leaflet-control-geocoder"))["geocoder"];

let map: LeafletType.Map | undefined;
// Route polylines / stop markers are drawn together and cleared together; search
// markers are tracked separately so selecting a route never wipes a search result.
let routePolylines: LeafletType.Polyline[] = [];
let stopMarkers: LeafletType.Marker[] = [];
let searchMarkers: LeafletType.Marker[] = [];

const latitude = ref<number>(0);
const longitude = ref<number>(0);
const selectedRoute = ref<string | null>(null);
const nearbyRoutes = ref<string[]>([]);

const busRoutes: PuvRoute[] = [dedupeRoute(route10), dedupeRoute(route3)];

function drawRoute(route: PuvRoute) {
  if (!map) return;
  const polyline = L.polyline(
    route.stops.map((s) => s.coords),
    {
      color: route.color,
    },
  ).addTo(map);
  polyline.bindPopup(`<b>${route.name}</b>`);
  routePolylines.push(polyline);

  route.stops.forEach((stop) => {
    const marker = L.marker(stop.coords)
      .addTo(map!)
      .bindPopup(`${route.name} - ${stop.name}`);
    stopMarkers.push(marker);
  });
}

function clearRouteLayers() {
  if (!map) return;
  routePolylines.forEach((layer) => map!.removeLayer(layer));
  stopMarkers.forEach((marker) => map!.removeLayer(marker));
  routePolylines = [];
  stopMarkers = [];
}

function clearSearchMarkers() {
  if (!map) return;
  searchMarkers.forEach((marker) => map!.removeLayer(marker));
  searchMarkers = [];
}

function handleRouteClick(route: PuvRoute) {
  if (!map) return;
  // Toggle: clicking the active route again shows both routes.
  selectedRoute.value = selectedRoute.value === route.name ? null : route.name;

  clearRouteLayers();

  if (selectedRoute.value) {
    drawRoute(route);
    map.fitBounds(L.latLngBounds(route.stops.map((s) => s.coords)), {
      padding: [24, 24],
    });
  } else {
    busRoutes.forEach(drawRoute);
  }
}

onMounted(async () => {
  const [leafletMod, geocoderMod] = await Promise.all([
    import("leaflet"),
    import("leaflet-control-geocoder"),
  ]);
  L = leafletMod;
  geocoderFn = geocoderMod.geocoder;

  L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  });

  try {
    // TODO: swap the hardcoded point for real geolocation when ready.
    latitude.value = 10.73057393205643;
    longitude.value = 122.55983587687814;

    map = L.map("map").setView([latitude.value, longitude.value], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Plot every route, then frame the whole network.
    busRoutes.forEach(drawRoute);
    map.fitBounds(
      L.latLngBounds(busRoutes.flatMap((r) => r.stops.map((s) => s.coords))),
      { padding: [24, 24] },
    );

    // Format: minLon,minLat,maxLon,maxLat — restricts results to Greater Iloilo.
    const bbox =
      "122.48585737549358,10.680799927571027,122.62574775929035,10.794222130410443";
    geocoderFn({
      defaultMarkGeocode: false,
      geocoder: (L.Control as any).Geocoder.nominatim({
        geocodingQueryParams: {
          viewbox: bbox,
          bounded: 1, // ensures results are restricted inside the box
        },
      }),
    })
      .on("markgeocode", function (e: any) {
        if (!map) return;
        const center = e.geocode.center;
        clearSearchMarkers();
        const marker = L.marker([center.lat, center.lng])
          .addTo(map)
          .bindPopup(e.geocode.name)
          .openPopup();
        searchMarkers.push(marker);
        nearbyRoutes.value = findRoutesNearPoint(
          busRoutes,
          [center.lat, center.lng],
          NEARBY_THRESHOLD_M,
        );
      })
      .addTo(map);
  } catch (error) {
    console.error("Error initialising Larga map:", error);
  }
});

onBeforeUnmount(() => {
  // Leaflet attaches window/document listeners; drop them when leaving the route.
  map?.remove();
  map = undefined;
  routePolylines = [];
  stopMarkers = [];
  searchMarkers = [];
});
</script>

<template>
  <Card>
    <template #title>Map</template>
    <template #content>
      <div style="margin-bottom: 1rem">
        <Button
          v-for="route in busRoutes"
          :key="route.name"
          :label="route.name"
          :class="{ 'p-button-outlined': selectedRoute !== route.name }"
          @click="handleRouteClick(route)"
          style="margin-right: 0.5rem"
        />
      </div>
      <div id="map"></div>
      <div v-if="nearbyRoutes.length" style="margin-top: 1rem">
        <h4>Routes passing near searched place:</h4>
        <ul>
          <li v-for="route in nearbyRoutes" :key="route">{{ route }}</li>
        </ul>
      </div>
    </template>
  </Card>
</template>

<style scoped>
#map {
  height: 70vh;
  width: 100%;
}

/* Phase 21 / THEME-10 (D-09): Leaflet geocoder input is rendered outside Vue's
   scoped DOM and ships with a hardcoded light background in
   `leaflet-control-geocoder/dist/Control.Geocoder.css`. That stylesheet is
   locked (D-09) — instead we pierce scope with `:global(.my-app-dark)` and
   substitute dark-aware @theme tokens from base.css so the input stays legible
   when the site is in dark mode. The map tiles themselves intentionally stay
   light in both themes (D-07). */
:global(.my-app-dark) .leaflet-control-geocoder,
:global(.my-app-dark) .leaflet-control-geocoder-icon {
  background-color: var(--color-surface-card);
}
:global(.my-app-dark) .leaflet-control-geocoder-form input {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
  border-color: var(--color-surface-divider);
}
:global(.my-app-dark) .leaflet-control-geocoder-alternatives {
  background-color: var(--color-surface-card);
}
:global(.my-app-dark) .leaflet-control-geocoder-alternatives li {
  color: var(--color-typo-body);
  border-bottom-color: var(--color-surface-divider);
}
:global(.my-app-dark) .leaflet-control-geocoder-alternatives li:hover,
:global(.my-app-dark) .leaflet-control-geocoder-selected {
  background-color: var(--color-surface-page);
}
:global(.my-app-dark) .leaflet-control-geocoder-address-context {
  color: var(--color-typo-muted);
}
</style>
