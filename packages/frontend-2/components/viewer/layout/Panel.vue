<template>
  <div class="viewer-layout-panel bg-foundation rounded-lg border border-outline-2">
    <slot />
  </div>
</template>

<style scoped>
.viewer-layout-panel {
  box-shadow: 0px 2px 4px -2px rgba(0, 0, 0, 0.02),
    0px 4px 6px -1px rgba(16, 16, 16, 0.02);
}
</style>
