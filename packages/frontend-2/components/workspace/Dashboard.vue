<template>
  <WorkspaceProjectList :workspace-id="workspaceId" />
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const workspaceId = computed(() => route.params.id)
</script>
