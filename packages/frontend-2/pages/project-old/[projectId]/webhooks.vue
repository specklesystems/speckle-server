<template>
  <div>
    <header class="default-width text-foreground">
      <h1 class="h4 font-bold leading-8 flex items-center">Project Webhook Route</h1>
      <NuxtLink :to="`/project/${$route.params.projectId}`">to stream home</NuxtLink>
    </header>
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const nav = useNav()

onMounted(() => {
  nav.value[1] = {
    to: `/project/${route.params.projectId as string}/webhooks`,
    name: 'Webhooks',
    separator: true
  }
})

onUnmounted(() => {
  nav.value.splice(1, 1)
})
</script>
