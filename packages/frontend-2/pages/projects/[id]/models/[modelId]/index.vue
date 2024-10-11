<template>
  <div :class="isTransparent ? 'viewer-transparent' : ''">
    <ViewerEmbedManualLoad v-if="isManualLoad" @play="isManualLoad = false" />
    <LazyViewerPreSetupWrapper v-else @setup="state = $event" />
    <ClientOnly>
      <Component
        :is="state ? ViewerScope : 'div'"
        :state="state"
        wrapper
        class="main-viewer-scope fixed shadow-t bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
      >
        <PortalTarget name="bottomPanel"></PortalTarget>
        <PortalTarget name="mobileComments"></PortalTarget>
      </Component>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { deserializeEmbedOptions } from '~~/lib/viewer/composables/setup/embed'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup/core'

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources', // To prevent controls flickering on resource url param changes
  name: 'model-viewer'
})

const ViewerScope = resolveComponent('ViewerScope')

const isManualLoad = ref(false)
const isTransparent = ref(false)
const route = useRoute()
const state = ref<InjectableViewerState>()

const checkUrlForEmbedManualLoadSettings = () => {
  if (import.meta.server) return

  const hashParams = new URLSearchParams(route.hash.substring(1))
  const embedParam = hashParams.get('embed')

  const embedOptions = deserializeEmbedOptions(embedParam)
  isManualLoad.value = embedOptions.manualLoad === true
  isTransparent.value = embedOptions.isTransparent === true
}

watch(
  () => route.fullPath,
  () => {
    checkUrlForEmbedManualLoadSettings()
  },
  { immediate: true }
)
</script>
