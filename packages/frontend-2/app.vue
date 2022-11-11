<template>
  <div id="speckle" class="bg-foundation-page">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useTheme } from '~~/lib/core/composables/theme'
import { useAuthManager } from '~~/lib/auth/composables/auth'
const { isDarkTheme } = useTheme()

useHead({
  // Title suffix
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - Speckle` : 'Speckle'),
  htmlAttrs: {
    class: computed(() => (isDarkTheme.value ? `dark` : ``)),
    lang: 'en'
  }
})

const { watchLoginAccessCode } = useAuthManager()
watchLoginAccessCode()
</script>
