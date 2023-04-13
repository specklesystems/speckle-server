<template>
  <div>This page should only be accessible to authenticated users!</div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})
</script>
