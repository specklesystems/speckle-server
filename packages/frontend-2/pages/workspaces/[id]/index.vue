<template>
  <div>
    <WorkspaceProjectList :workspace-id="workspaceId" />
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const workspaceId = computed(() => route.params.id as string)
definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace']
})
</script>
