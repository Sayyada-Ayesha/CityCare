<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const defaultLat = props.latitude ?? 28.6139
const defaultLng = props.longitude ?? 77.209

onMounted(() => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value, { zoomControl: true }).setView([defaultLat, defaultLng], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map.value)

  const initial = { lat: defaultLat, lng: defaultLng }
  marker.value = L.marker(initial).addTo(map.value)

  map.value.on('click', (event) => {
    const coords = event.latlng
    marker.value?.setLatLng(coords)
    emit('location-change', {
      latitude: coords.lat,
      longitude: coords.lng,
      address: props.address ?? '',
      landmark: props.landmark ?? '',
    })
  })
})

watch(
  () => [props.latitude, props.longitude],
  ([lat, lng]) => {
    if (map.value && typeof lat === 'number' && typeof lng === 'number') {
      map.value.setView([lat, lng], map.value.getZoom())
      marker.value?.setLatLng([lat, lng])
    }
  },
)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
    <div ref="mapContainer" class="h-64 w-full"></div>
  </div>
</template>
