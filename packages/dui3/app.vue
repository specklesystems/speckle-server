<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { initLocalAccounts } from './commands/initLocalAccounts'
import { loadAccounts } from './handlers/loadAccounts'
import { execHost } from './types/execHost'

useHead({
  // Title suffix
  titleTemplate: (titleChunk) =>
    titleChunk ? `${titleChunk} - Speckle DUIv3` : 'Speckle DUIv3',
  htmlAttrs: {
    lang: 'en'
  },
  bodyAttrs: {
    class: 'simple-scrollbar bg-foundation-page text-foreground'
  }
})

onMounted(() => {
  // Call here empty function to make method available.
  loadAccounts([])
  execHost(initLocalAccounts)
})
</script>
