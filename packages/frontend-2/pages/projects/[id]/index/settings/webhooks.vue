<template>
  <ProjectPageSettingsWebhooks />
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['can-view-webhooks']
})
</script>
