<template>
  <div id="speckle" class="bg-foundation-page text-foreground overflow-auto">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup lang="ts">
import {
  useMixpanel,
  useMixpanelUserIdentification
} from '~/lib/core/composables/mixpanel'
import { DUIAccount, useAccountStore } from '~/store/accounts'
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
  const mp = useMixpanel()
  const { reidentify } = useMixpanelUserIdentification()
  const { selectedAccount } = useAccountStore()
  reidentify(selectedAccount as DUIAccount)
  mp.track('Connector Action', { name: 'Init DUI3' })
})
</script>
store/config
