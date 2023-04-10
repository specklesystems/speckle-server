<template>
  <AuthRegisterPanel />
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

onMounted(() => {
  mixpanel.track('Visit Sign Up')
})

definePageMeta({
  layout: 'login-or-register'
})
</script>
