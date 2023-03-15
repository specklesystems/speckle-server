<template>
  <div>
    <p class="text-sm">There's much more to Speckle.</p>
  </div>
</template>
<script setup lang="ts">
const state = useTourStageState()

state.value.showNavbar = true

state.value.showViewerControls = true
</script>
