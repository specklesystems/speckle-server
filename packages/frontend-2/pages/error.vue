<template>
  <ErrorPageRenderer :error="error" is-generic-error-page />
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'

/**
 * Used for auth errors, but can be used to render any kind of error page
 */

definePageMeta({
  name: 'generic-error'
})

const route = useRoute()

const message = computed(() => route.query.message as Optional<string>)

const error = computed(() => ({
  statusCode: 500,
  message: message.value || 'Something went wrong'
}))

useHead({
  title: computed(() => `Error: ${error.value.message}`)
})
</script>
