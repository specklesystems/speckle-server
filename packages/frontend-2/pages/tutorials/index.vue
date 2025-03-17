<template>
  <TutorialsPage />
</template>

<script setup lang="ts">
useHead({
  title: 'Tutorials'
})

definePageMeta({
  middleware: ['auth']
})
</script>
