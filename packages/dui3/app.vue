<template>
  <div id="speckle" class="bg-foundation-page text-foreground">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import { useAccountsSetup } from '~/lib/accounts/composables/setup'
import { useUiConfigStore } from '~/store/uiConfig'

const uiConfigStore = useUiConfigStore()
const { isDarkTheme } = storeToRefs(uiConfigStore)

useAccountsSetup()

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
  }
})
</script>
