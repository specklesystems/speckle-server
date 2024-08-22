<template>
  <WorkspacesPromoPage />
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled']
})
</script>
