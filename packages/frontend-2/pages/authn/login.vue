<template>
  <AuthLoginPanel />
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

useHead({ title: 'Log in' })

onMounted(() => {
  mixpanel.track('Visit Log In')
})
</script>
