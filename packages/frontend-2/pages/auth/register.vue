<template>
  <AuthRegisterPanel />
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mixpanel'

const mixpanel = useMixpanel()

onMounted(() => {
  mixpanel.track('Visit Sign Up')
})
</script>
