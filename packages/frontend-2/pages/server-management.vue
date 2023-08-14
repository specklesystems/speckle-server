<template>
  <NuxtPage />
</template>
<script setup lang="ts">
/**
 * Marking all server-management/* pages as admin only
 */

definePageMeta({
  middleware: [
    'admin',
    () => {
      const { ssrContext } = useNuxtApp()
      if (ssrContext) {
        ssrContext.event.node.res.setHeader('x-frame-options', 'deny')
      }
    }
  ]
})
</script>
