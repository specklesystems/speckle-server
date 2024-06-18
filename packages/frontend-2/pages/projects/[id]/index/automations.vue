<template>
  <div><NuxtPage /></div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'require-valid-automation']
})
</script>
