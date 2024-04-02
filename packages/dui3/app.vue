<template>
  <div id="speckle" class="bg-foundation-page text-foreground overflow-auto">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useConfigStore } from '~/store/config'

const uiConfigStore = useConfigStore()
const { isDarkTheme } = storeToRefs(uiConfigStore)

useHead({
  // Title suffix
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk as string} - Speckle DUIv3` : 'Speckle DUIv3',
  htmlAttrs: {
    lang: 'en',
    class: computed(() => (isDarkTheme.value ? `dark` : ``))
  },
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground '
  },
  // For standalone vue devtools see: https://devtools.vuejs.org/guide/installation.html#standalone
  script: process.dev ? ['http://localhost:8098'] : []
})

onMounted(() => {
  const { trackEvent } = useMixpanel()
  trackEvent('Connector Action', { name: 'Launch' })
})
</script>
store/config
