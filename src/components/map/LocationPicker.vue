<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const props = defineProps<{
  latitude: number | null
  longitude: number | null
  address?: string
  landmark?: string
}>()

const emit = defineEmits<{
  (event: 'location-change', value: { latitude: number; longitude: number; address: string; landmark: string }): void
}>()

const mapContainer = ref<HTMLElement | null>(null)
const map = ref<L.Map | null>(null)
const marker = ref<L.Marker | null>(null)

const hasInitialLocation = typeof props.latitude === 'number' && typeof props.longitude === 'number'

function setLocation(latitude: number, longitude: number, zoom = 15) {
  if (!map.value) return
  const coords = { lat: latitude, lng: longitude }
  if (marker.value) marker.value.setLatLng(coords)
  else marker.value = L.marker(coords).addTo(map.value)
  map.value.setView(coords, zoom)
  emit('location-change', {
    latitude,
    longitude,
    address: props.address ?? '',
    landmark: props.landmark ?? '',
  })
}

onMounted(() => {
  if (!mapContainer.value) return

  L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })
  map.value = L.map(mapContainer.value, { zoomControl: true }).setView(
    hasInitialLocation ? [props.latitude as number, props.longitude as number] : [20, 0],
    hasInitialLocation ? 14 : 2,
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map.value)

  if (hasInitialLocation) setLocation(props.latitude as number, props.longitude as number, 14)

  map.value.on('click', (event) => {
    setLocation(event.latlng.lat, event.latlng.lng)
  })
})

function useCurrentLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => setLocation(coords.latitude, coords.longitude),
  )
}

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
})

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (map.value && typeof lat === 'number' && typeof lng === 'number') {
      map.value.setView([lat, lng], map.value.getZoom())
      if (marker.value) marker.value.setLatLng([lat, lng])
      else marker.value = L.marker([lat, lng]).addTo(map.value)
    }
  },
)
</script>

<template>
  <div class="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
    <button type="button" class="absolute right-3 top-3 z-[1000] rounded-md bg-white px-3 py-2 text-sm font-medium shadow" @click="useCurrentLocation">Use my location</button>
    <div ref="mapContainer" class="h-64 w-full"></div>
  </div>
</template>
