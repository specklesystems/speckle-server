<template>
  <div>
    <ClientOnly>
      <TourViewer />
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
// import { getOrInitViewer } from '~~/lib/viewer/composables/viewer'

definePageMeta({
  title: 'Onboarding Tour',
  layout: 'fullscreen'
})

onMounted(() => {
  // TODO
})

const { isLoggedIn } = useActiveUser()
</script>
