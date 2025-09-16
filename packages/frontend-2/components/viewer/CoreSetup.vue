<template>
  <div class="flex-1">
    <div
      id="viewer"
      class="viewer special-gradient absolute z-10 overflow-hidden w-screen"
      :class="viewerHostClasses"
    >
      <ClientOnly><ViewerBase /></ClientOnly>
      <slot name="after-viewer-base" />
    </div>

    <!-- Global loading bar -->
    <ViewerLoadingBar
      class="absolute left-0 w-full z-40 h-30"
      :class="loadingBarClasses"
    />
  </div>
</template>
<script setup lang="ts">
/**
 * Sets up the actual core viewer renderer (core UI that's shared across various viewer rendering pages like
 * the viewer, saved view presentations etc.)
 */

defineProps<{
  viewerHostClasses?: string
  loadingBarClasses?: string
}>()
</script>
