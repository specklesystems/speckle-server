<template>
  <div>
    <p class="text-sm">
      <strong>Navigate</strong>
      easily with hand gestures:
    </p>
    <div class="flex items-center justify-between gap-4 py-3 text-xs">
      <div class="flex gap-1 items-center">
        <IconHandRotate class="h-5 w-5" />
        rotate
      </div>
      <div class="flex gap-1 items-center">
        <IconHandSelect class="h-5 w-5" />
        select
      </div>
      <div class="flex gap-1 items-center">
        <IconHandZoom class="h-5 w-5" />
        zoom
      </div>
    </div>
    <div class="text-sm">
      <div v-if="hasMovedCamera" class="font-bold flex items-center">
        <CheckIcon class="w-4 h-4 text-success mr-2" />
        <p>{{ encouragements[controlEndCounts] }}</p>
      </div>
      <p v-else>Give it a try now!</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'
import { useViewerCameraControlEndTracker } from '~~/lib/viewer/composables/viewer'

const hasMovedCamera = ref(false)
const controlEndCounts = ref(-1)
const encouragements = [
  'Nicely done!',
  'Wow, you are a pro!',
  '3D is fun!',
  "Don't get dizzy!"
]

useViewerCameraControlEndTracker(() => {
  hasMovedCamera.value = true
  if (controlEndCounts.value === encouragements.length - 1) {
    controlEndCounts.value = 0
  } else {
    controlEndCounts.value++
  }
})
</script>
