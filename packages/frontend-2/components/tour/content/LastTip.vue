<template>
  <div>
    <p class="text-sm">There's much more to Speckle.</p>
  </div>
</template>
<script setup lang="ts">
import { useViewerTour } from '~/lib/viewer/composables/tour'

const state = useViewerTour()

state.showNavbar.value = true
state.showControls.value = true
</script>
