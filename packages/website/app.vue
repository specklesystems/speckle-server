<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
const theme = useLocalStorage('dark-theme', { isDarkTheme: false })

useHead({
  htmlAttrs: {
    lang: 'en',
    class: computed(() => (theme.value.isDarkTheme ? `dark` : ``))
  },
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  }
})
</script>
