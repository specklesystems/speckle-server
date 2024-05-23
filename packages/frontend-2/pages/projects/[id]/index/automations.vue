<template>
  <div><NuxtPage /></div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['require-valid-automation']
})
</script>
