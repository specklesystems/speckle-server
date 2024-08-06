<template>
  <ProjectList :workspace-id="workspaceId" />
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const workspaceId = route.params.id
</script>
