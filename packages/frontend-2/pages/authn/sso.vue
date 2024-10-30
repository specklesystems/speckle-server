<template>
  <AuthLoginWithSso />
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

useHead({ title: 'Speckle SSO login' })

onMounted(() => {
  mixpanel.track('Visit SSO Log In')
})
</script>
