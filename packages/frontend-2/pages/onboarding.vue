<template>
  <AuthOnboardingPanel />
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'empty'
})
</script>
