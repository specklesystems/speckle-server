<template>
  <div />
</template>
<script setup lang="ts">
/**
 * Utility route that allows us to generate comment links w/o having to fully
 * resolve them from viewerResources first (which is a heavy operation)
 */

definePageMeta({
  middleware: 'thread'
})
</script>
