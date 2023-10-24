<template>
  <AuthRegisterPanel />
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

useHead({ title: 'Register' })

onMounted(() => {
  mixpanel.track('Visit Sign Up')
})
</script>
