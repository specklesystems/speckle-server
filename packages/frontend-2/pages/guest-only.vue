<template>
  <div>This page should only be accessible to unauthenticated users!</div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['guest']
})
</script>
