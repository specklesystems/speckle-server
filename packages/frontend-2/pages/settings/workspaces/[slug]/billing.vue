<template>
  <div>
    <SettingsWorkspacesBillingPage />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['require-valid-workspace'],
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Billing'
})
</script>
