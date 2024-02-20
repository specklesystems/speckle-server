<template>
  <ProjectsDashboard v-if="isLoggedIn" />
  <template v-else>
    <div class="mx-auto">
      <CommonLoadingIcon />
    </div>
  </template>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

useHead({
  title: 'Dashboard'
})

definePageMeta({
  middleware: ['dashboard-redirect'],
  alias: '/profile'
})

const { isLoggedIn } = useActiveUser()
</script>
