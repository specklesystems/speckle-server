<template>
  <div>This page should only be accessible to admin users!</div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
})
</script>
