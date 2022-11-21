<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="mb-6 sm:mb-14" />
    <AuthLoginPanel />
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mixpanel'

const mixpanel = useMixpanel()

onMounted(() => {
  mixpanel.track('Visit Log In')
})
</script>
