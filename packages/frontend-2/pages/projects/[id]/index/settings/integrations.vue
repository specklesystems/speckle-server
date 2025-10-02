<template>
  <ProjectPageSettingsAccTab :project-id="projectId" />
</template>
<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id as string)
</script>
