<template>
  <WorkspaceCreatePage :workspace-id="workspaceId" />
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled', 'auth'],
  layout: 'empty'
})

useHead({
  title: 'Create new workspace'
})

const route = useRoute()
const workspaceId = computed(() => route.params.id as string)
</script>
