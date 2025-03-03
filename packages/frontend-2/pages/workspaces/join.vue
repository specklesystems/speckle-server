<template>
  <div>
    <WorkspaceJoinPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled', 'auth'],
  layout: 'empty'
})
useHead({
  title: 'Join a workspace'
})
</script>
