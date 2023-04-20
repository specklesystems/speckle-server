<template>
  <div>
    <p class="text-sm">
      You can easily navigate it by
      <b>rotating</b>
      (left mouse button),
      <b>zooming</b>
      (scroll) and
      <b>panning</b>
      (right mouse button). Give it a try now!
    </p>
    <p v-if="hasMovedCamera" class="mt-2 text-sm font-bold flex items-center">
      <CheckIcon class="w-4 h-4 text-success mr-2" />
      {{ encouragements[controlEndCounts] }}
    </p>
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
