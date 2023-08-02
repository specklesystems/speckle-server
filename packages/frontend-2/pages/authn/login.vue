<template>
  <AuthLoginPanel />
</template>
<script setup lang="ts">
import { useMixpanel } from '~~/lib/core/composables/mp'

const mixpanel = useMixpanel()

onMounted(() => {
  mixpanel.track('Visit Log In')
})
</script>
