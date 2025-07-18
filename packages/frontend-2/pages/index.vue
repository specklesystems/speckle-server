<template>
  <div />
</template>

<script setup lang="ts">
useHead({ title: 'Dashboard' })

definePageMeta({
  middleware: ['auth', 'dashboard-redirect']
})
</script>
