<template>
  <div>
    <header class="default-width text-foreground">
      <h1 class="h4 font-bold leading-8 flex items-center">
        Project
        <span class="text-blue-500">Model</span>
        Route AKA 3D Viewer
      </h1>
      <NuxtLink :to="`/project/${$route.params.projectId}`">to stream home</NuxtLink>
    </header>
  </div>
</template>
<script setup lang="ts">
const route = useRoute()
const nav = useNav()

onMounted(() => {
  nav.value[2] = {
    to: `/project/${route.params.projectId as string}/model/${
      route.params.modelId as string
    }`,
    name: 'Model Name',
    separator: true
  }
})

onUnmounted(() => {
  nav.value.splice(2, 1)
})
</script>
