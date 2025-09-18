<template>
  <div class="presentation-viewer-setup h-full">
    <ViewerCoreSetup
      viewer-host-classes="h-full"
      :disable-selection="disableSelection"
    />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  disableSelection?: boolean
}>()
</script>
