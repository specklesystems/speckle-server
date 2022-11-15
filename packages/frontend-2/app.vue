<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useTheme } from '~~/lib/core/composables/theme'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { useMixpanelInitialization } from '~~/lib/core/composables/mixpanel'
const { isDarkTheme } = useTheme()

useHead({
  // Title suffix
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - Speckle` : 'Speckle'),
  htmlAttrs: {
    class: computed(() => (isDarkTheme.value ? `dark` : ``)),
    lang: 'en'
  }
})

const { watchAuthQueryString } = useAuthManager()
watchAuthQueryString()

// Awaiting to block the app from continuing until mixpanel tracking is fully initialized
await useMixpanelInitialization()
</script>
