<template>
  <div id="speckle" class="bg-base-page">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useTheme } from '~~/lib/core/composables/theme'
const { isDarkTheme } = useTheme()

useHead({
  // Title suffix
  titleTemplate: (titleChunk) => (titleChunk ? `${titleChunk} - Speckle` : 'Speckle'),
  htmlAttrs: {
    class: computed(() => (isDarkTheme.value ? `dark` : ``)),
    lang: 'en'
  }
})
</script>
