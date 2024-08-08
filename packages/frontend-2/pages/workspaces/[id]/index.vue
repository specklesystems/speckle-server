<template>
  <WorkspaceDashboard v-if="isLoggedIn" />
  <div v-else class="mx-auto">
    <CommonLoadingIcon />
  </div>
</template>
<script setup lang="ts">
const { isLoggedIn } = useActiveUser()

definePageMeta({
  middleware: ['auth', 'requires-workspaces-enabled']
})

useHead({
  title: 'Dashboard'
})
</script>
