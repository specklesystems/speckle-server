<!-- eslint-disable vue/no-v-html -->
<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout name="default">
      <ErrorPageRenderer :error="error" />
    </NuxtLayout>
    <SingletonManagers />
  </div>
</template>
<script setup lang="ts">
import type { NuxtError } from '#app'
import { useTheme } from '~/lib/core/composables/theme'

/**
 * Any errors thrown while rendering this page will cause Nuxt to revert to the default
 * error page
 */

const props = defineProps<{
  error: NuxtError
}>()

const { isDarkTheme } = useTheme()

useHead({
  title: computed(() => `${props.error.statusCode} - ${props.error.message}`),
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  },
  htmlAttrs: {
    class: computed(() => (isDarkTheme.value ? `dark` : ``)),
    lang: 'en'
  }
})
</script>
