<template>
  <div>
    <ProjectPageAutomationsHeader :has-automations="hasAutomations" class="mb-8" />
    <ProjectPageAutomationsEmptyState v-if="!hasAutomations" />
  </div>
</template>
<script setup lang="ts">
const hasAutomations = ref(false)
</script>
