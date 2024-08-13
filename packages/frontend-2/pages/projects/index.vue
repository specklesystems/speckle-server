<template>
  <ProjectsDashboard v-if="isLoggedIn" />
  <div v-else class="mx-auto">
    <CommonLoadingIcon />
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

useHead({
  title: 'Projects'
})

definePageMeta({
  middleware: ['dashboard-redirect'],
  alias: '/profile'
})

const { isLoggedIn } = useActiveUser()
</script>
