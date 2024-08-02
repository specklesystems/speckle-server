<template>
  <div id="speckle" class="bg-foundation-page text-foreground overflow-auto">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <SingletonToastManager />
  </div>
</template>
<script setup lang="ts">
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useConfigStore } from '~/store/config'
import { useAccountStore } from '~/store/accounts'
import { storeToRefs } from 'pinia'

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
  script: import.meta.dev ? ['http://localhost:8098'] : []
})

onMounted(() => {
  const { trackEvent, addConnectorToProfile, identifyProfile } = useMixpanel()
  // TODO: some host apps can open DUI3 automatically, with this case we shouldn't mark track event as `"type": "action"`,
  // we need to get this info from source app. (TBD which apps: Rhino opens automatically, not sure acad, sketchup and revit needs trigger button to init)
  trackEvent('DUI3 Action', { name: 'Launch' })

  const { accounts } = useAccountStore()

  const uniqueEmails = new Set<string>()
  accounts.forEach((account) => {
    const email = account?.accountInfo.userInfo.email
    if (email && !uniqueEmails.has(email)) {
      addConnectorToProfile(email)
      identifyProfile(email)
      uniqueEmails.add(email)
    }
  })
})
</script>
store/config
