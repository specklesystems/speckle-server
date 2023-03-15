<template>
  <div>
    <div class="text-sm">There's much more to Speckle.</div>
    <div class="text-sm pl-5">
      <ul class="list-disc">
        <li>Test</li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
const state = useTourStageState()

state.value.showNavbar = true

state.value.showViewerControls = true
</script>
