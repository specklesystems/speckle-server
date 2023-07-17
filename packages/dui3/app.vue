<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useAccountsSetup } from '~/lib/accounts/composables/setup'
import { useDocumentInfoSetup } from '~/lib/document-info'

useAccountsSetup()
useDocumentInfoSetup()

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
</script>
