<template>
  <ConnectorsPage />
</template>

<script setup lang="ts">
useHead({
  title: 'Connectors'
})

definePageMeta({
  middleware: ['auth']
})
</script>
