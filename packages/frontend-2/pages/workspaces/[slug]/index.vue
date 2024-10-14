<template>
  <div>
    <WorkspaceProjectList :workspace-slug="workspaceSlug" />
  </div>
</template>
<script setup lang="ts">
import { useRoute } from 'vue-router'

definePageMeta({
  middleware: ['requires-workspaces-enabled', 'require-valid-workspace']
})

const route = useRoute()
const workspaceSlug = computed(() => route.params.slug as string)
</script>
