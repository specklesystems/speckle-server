<template>
  <div>
    <ClientOnly>
      <TourViewer />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
const { isLoggedIn } = useActiveUser()

definePageMeta({
  title: 'Onboarding Tour',
  layout: 'fullscreen'
})
</script>
