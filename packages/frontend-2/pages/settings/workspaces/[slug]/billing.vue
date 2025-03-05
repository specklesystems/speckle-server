<template>
  <div>
    <SettingsWorkspacesBillingPageNew v-if="isWorkspaceNewPlansEnabled" />
    <SettingsWorkspacesBillingPage v-else />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'settings'
})

useHead({
  title: 'Settings | Workspace - Billing'
})

const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
</script>
