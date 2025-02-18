<template>
  <DashboardPage />
</template>

<script setup lang="ts">
useHead({ title: 'Dashboard' })

definePageMeta({
  middleware: ['auth'],
  alias: ['/profile', '/dashboard']
})
</script>
