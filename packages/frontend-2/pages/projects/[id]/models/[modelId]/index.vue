<template>
  <div>
    <ViewerEmbedManualLoad v-if="isManualLoad" @play="isManualLoad = false" />
    <LazyViewerPreSetupWrapper v-else @setup="state = $event" />
    <ClientOnly>
      <Component
        :is="state ? ViewerScope : 'div'"
        :state="state"
        wrapper
        class="fixed shadow-t bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
      >
        <PortalTarget name="bottomPanel"></PortalTarget>
        <PortalTarget name="mobileComments"></PortalTarget>
      </Component>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup/core'

interface EmbedConfig {
  manualLoad: boolean
}

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources' // To prevent controls flickering on resource url param changes
})

const ViewerScope = resolveComponent('ViewerScope')
const logger = useLogger()

const isManualLoad = ref(false)
const route = useRoute()
const state = ref<InjectableViewerState>()

const checkUrlForEmbedManualLoad = () => {
  if (process.server) return

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash.substring(1))
    const embedParam = hashParams.get('embed')

    if (embedParam) {
      try {
        const embedConfig = JSON.parse(embedParam) as EmbedConfig
        isManualLoad.value = embedConfig.manualLoad === true
      } catch (e) {
        logger.error(e)
      }
    }
  }
}

watch(
  () => route.fullPath,
  () => {
    checkUrlForEmbedManualLoad()
  },
  { immediate: true }
)
</script>
