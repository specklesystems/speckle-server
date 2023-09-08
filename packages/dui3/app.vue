<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useUiConfigStore } from '~/store/uiConfig'

const uiConfigStore = useUiConfigStore()
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
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  },
  // For standalone vue devtools see: https://devtools.vuejs.org/guide/installation.html#standalone
  script: process.dev ? ['http://localhost:8098'] : []
})
</script>
