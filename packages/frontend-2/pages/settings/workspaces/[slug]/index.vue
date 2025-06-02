<template>
  <div>
    <!-- Redirecting to general settings... -->
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'settings',
  middleware: (to) => {
    const slug = to.params.slug as string
    return navigateTo(`/settings/workspaces/${slug}/general`, { redirectCode: 301 })
  }
})
</script>
