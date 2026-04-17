<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type * as LeafletType from 'leaflet';
import { route3, route10 } from "@/constants/routes";

import "leaflet/dist/leaflet.css";
import "leaflet-control-geocoder/dist/Control.Geocoder.css";

const latitude = ref<number>(0);
const longitude = ref<number>(0);
const selectedRoute = ref<string | null>(null);
const nearbyRoutes = ref<string[]>([]);

// Populated in onMounted via dynamic import
let L!: typeof LeafletType;
let geocoderFn!: (typeof import('leaflet-control-geocoder'))['geocoder'];


// Example bus routes (array of lat/lng pairs)
const busRoutes = [
  route10,
  route3
];

function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    } else {
      reject(new Error("Geolocation is not supported by your browser."));
    }
  });
}

// Fix: Use ASCII variable names in getDistance
function getDistance(latlng1: [number, number], latlng2: [number, number]) {
  const toRad = (x: number) => x * Math.PI / 180;
  const [lat1, lon1] = latlng1;
  const [lat2, lon2] = latlng2;
  const R = 6371e3; // metres
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);
  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function plotRoute(map: LeafletType.Map, route: typeof busRoutes[0]) {
  // Remove existing polylines and markers
  map.eachLayer(layer => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
  // Add tile layer back if removed
  if (!map.hasLayer(tileLayer)) {
    tileLayer.addTo(map);
  }
  // Plot selected route
  const polyline = L.polyline(route.stops.map(s => s.coords as [number, number]), { color: route.color }).addTo(map);
  polyline.bindPopup(`<b>${route.name}</b>`);
  // route.stops.forEach((stop) => {
  //   const marker = L.marker(stop.coords as [number, number]).addTo(map);
  //   marker.bindPopup(`${route.name} - ${stop.name}`);
  // });
}

let map!: LeafletType.Map;
let tileLayer!: LeafletType.TileLayer;

onMounted(async () => {
  const [leafletMod, geocoderMod] = await Promise.all([
    import('leaflet'),
    import('leaflet-control-geocoder'),
  ]);
  L = leafletMod;
  geocoderFn = geocoderMod.geocoder;

  try {
    //const position = await getCurrentLocation();
    latitude.value = 10.73057393205643;
    longitude.value = 122.55983587687814;
    //latitude.value = position.coords.latitude;
    //longitude.value = position.coords.longitude;

    map = L.map('map').setView([latitude.value, longitude.value], 15);
    // tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   maxZoom: 19,
    //   attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    // }).addTo(map);
    //tileLayer = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    tileLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Plot bus routes (initial)
    busRoutes.forEach(route => {
      const polyline = L.polyline(route.stops.map(s => s.coords as [number, number]), { color: route.color }).addTo(map);
      polyline.bindPopup(`<b>${route.name}</b>`);
      route.stops.forEach((stop) => {
        const marker = L.marker(stop.coords as [number, number]).addTo(map);
        marker.bindPopup(`${route.name} - ${stop.name}`);
      });
    });

    // Fix: Use correct geocoder import and usage
    // @ts-ignore (L.Control as any)
    // L.Control.geocoder({
    //   defaultMarkGeocode: false,
    //   //bounds : L.latLngBounds([10.680799927571027, 122.48585737549358], [10.794222130410443, 122.62574775929035])
    // })
    //     .on('markgeocode', function (e: any) {
    //       const center = e.geocode.center;
    //       L.marker([center.lat, center.lng]).addTo(map).bindPopup(e.geocode.name).openPopup();
    //       // Find nearby routes
    //       const foundRoutes: string[] = [];
    //       busRoutes.forEach(route => {
    //         if (route.stops.some(stop => getDistance(stop.coords as [number, number], [center.lat, center.lng]) < 300)) {
    //           foundRoutes.push(route.name);
    //         }
    //       });
    //       nearbyRoutes.value = foundRoutes;
    //     })
    //     .addTo(map);
// Format: minLon,minLat,maxLon,maxLat
    //[10.680799927571027, 122.48585737549358], [10.794222130410443, 122.62574775929035]
    const bbox = "122.48585737549358,10.680799927571027,122.62574775929035,10.794222130410443";
    geocoderFn({
      defaultMarkGeocode: false,
      geocoder: (L.Control as any).Geocoder.nominatim({
        geocodingQueryParams: {
          viewbox: bbox,
          bounded: 1   // ensures results are restricted inside the box
        }
      })
    }).on('markgeocode', function (e: any) {
      const center = e.geocode.center;
      L.marker([center.lat, center.lng]).addTo(map).bindPopup(e.geocode.name).openPopup();
      // Find nearby routes
      const foundRoutes: string[] = [];
      busRoutes.forEach(route => {
        if (route.stops.some(stop => getDistance(stop.coords as [number, number], [center.lat, center.lng]) < 300)) {
          foundRoutes.push(route.name);
        }
      });
      nearbyRoutes.value = foundRoutes;
    })
        .addTo(map);
  } catch (error) {
    console.error("Error getting location:", error);
  }
});

function handleRouteClick(routeName: string) {
  selectedRoute.value = routeName;
  const route = busRoutes.find(r => r.name === routeName);
  if (route && map) {
    plotRoute(map, route);
  }
}
</script>

<template>
  <Card>
    <template #title>Map</template>
    <template #content>
      <div style="margin-bottom: 1rem;">
        <Button
          v-for="route in busRoutes"
          :key="route.name"
          :label="route.name"
          :class="{ 'p-button-outlined': selectedRoute !== route.name }"
          @click="handleRouteClick(route.name)"
          style="margin-right: 0.5rem;"
        />
      </div>
      <div id="map"></div>
      <div v-if="nearbyRoutes.length" style="margin-top:1rem;">
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
</style>