<template>
  <ErrorLayout :error="error" />
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import type { NuxtError } from 'nuxt/dist/app/composables'
import ErrorLayout from '~/error.vue'

/**
 * Used for auth errors, but can be used to render any kind of error page
 */

definePageMeta({
  layout: false,
  name: 'generic-error'
})

const route = useRoute()
const message = computed(() => route.query.message as Optional<string>)
// const isVerificationError = computed(() =>
//   message.value?.toLowerCase().includes('verify the email on the existing user')
// )

const error = computed(
  (): NuxtError => ({
    statusCode: 500,
    message: message.value || 'Something went wrong',
    stack: '',
    fatal: true,
    unhandled: false,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    toJSON: () => ({})
  })
)
</script>
