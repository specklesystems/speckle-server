<template>
  <div class="absolute z-30 w-screen h-screen pointer-events-none overflow-hidden">
    <div
      v-for="(locationInfo, index) in locations"
      ref="comments"
      :key="index"
      class="absolute pointer-events-auto"
    >
      <div class="pointer-events-none">
        <!-- <span class="label">{{ index }}</span> -->
        <TourComment :index="index" :cam-pos="locationInfo.camPos" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { locations } from '~~/lib/tour/mockedComments'
import { Vector3 } from 'three'
import { Viewer } from '@speckle/viewer'

const comments = ref<HTMLElement[]>([])

onMounted(() => {
  const viewer = inject('viewer') as Viewer

  viewer.cameraHandler.controls.addEventListener('update', () => {
    const cam = viewer.cameraHandler.camera
    cam.updateProjectionMatrix()
    for (let i = 0; i < locations.length; i++) {
      const data = locations[i]
      const location = new Vector3(data.location.x, data.location.y, data.location.z)
      location.project(cam)
      const commentLocation = new Vector3(
        (location.x * 0.5 + 0.5) * window.innerWidth - 20,
        (location.y * -0.5 + 0.5) * window.innerHeight - 20,
        0
      )
      const commentEl = comments.value[i]
      commentEl.style.left = `${commentLocation.x}px`
      commentEl.style.top = `${commentLocation.y}px`
    }
  })
})

// const commentLocations = computed(() => locations)
</script>
