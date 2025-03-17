<template>
  <div>
    <WorkspaceCreatePage :workspace-id="workspaceId" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled', 'auth'],
  layout: 'empty'
})
useHead({
  title: 'Create a workspace'
})

const route = useRoute()
const workspaceId = computed(() => route.query.workspaceId as string)
</script>
