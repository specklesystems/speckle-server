<template>
  <div>
    <SettingsWorkspacesBillingPageNew v-if="isWorkspaceNewPlansEnabled && !forceOld" />
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

const route = useRoute()
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
const forceOld = computed(() => route.query.old === 'true')
</script>
