<template>
  <div
    id="speckle"
    class="bg-foundation-page text-foreground has-[.viewer-transparent]:!bg-transparent"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <SingletonManagers />
  </div>
</template>
<script setup lang="ts">
import { useTheme } from '~~/lib/core/composables/theme'
import { useAuthManager } from '~~/lib/auth/composables/auth'
import { useMixpanelInitialization } from '~~/lib/core/composables/mp'

const { isDarkTheme } = useTheme()

useHead({
  // Title suffix
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - Speckle` : 'Speckle'),
  htmlAttrs: {
    class: computed(() => (isDarkTheme.value ? `dark` : ``)),
    lang: 'en'
  },
  bodyAttrs: {
    class:
      'simple-scrollbar bg-foundation-page text-foreground has-[.viewer-transparent]:!bg-transparent'
  }
})

const { watchAuthQueryString } = useAuthManager()
watchAuthQueryString()

// Awaiting to block the app from continuing until mixpanel tracking is fully initialized
await useMixpanelInitialization()
</script>
<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.1s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
