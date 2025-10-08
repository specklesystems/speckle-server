<template>
  <ProjectPageSettingsTokens />
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['can-view-project-tokens']
})
</script>
