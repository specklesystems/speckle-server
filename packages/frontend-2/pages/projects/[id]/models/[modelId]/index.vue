<template>
  <div :class="isTransparent ? 'viewer-transparent' : ''">
    <ClientOnly>
      <ViewerEmbedManualLoad v-if="isManualLoad" @play="isManualLoad = false" />
      <LazyViewerPreSetupWrapper
        v-else
        :init-params="initParams"
        @setup="state = $event"
      />
      <Component
        :is="state ? ViewerScope : 'div'"
        :state="state"
        wrapper
        class="main-viewer-scope fixed bottom-0 left-0 max-h-[65vh] overflow-hidden w-screen z-50 transition-all duration-300 empty:-bottom-[65vh]"
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
import { writableAsyncComputed } from '@speckle/ui-components'
import { resourceBuilder } from '@speckle/shared/viewer/route'
import type { UseSetupViewerParams } from '~/lib/viewer/composables/setup'

definePageMeta({
  layout: 'viewer',
  middleware: ['require-valid-project'],
  pageTransition: false, // NOTE: transitions fuck viewer up
  layoutTransition: false,
  key: '/projects/:id/models/resources', // To prevent controls flickering on resource url param changes
  name: 'model-viewer'
})

const ViewerScope = resolveComponent('ViewerScope')
const route = useRoute()
const router = useSafeRouter()

const isManualLoad = ref(false)
const isTransparent = ref(false)
const state = ref<InjectableViewerState>()

// Resolve viewer init params
const projectId = writableAsyncComputed({
  get: () => route.params.id as string,
  set: async (value: string) => {
    await router.push(() => ({
      params: { id: value }
    }))
  },
  initialState: route.params.id as string,
  asyncRead: false
})

const resourceIdString = writableAsyncComputed({
  get: () =>
    resourceBuilder()
      .addResources(route.params.modelId as string)
      .toString(),
  set: async (newVal) => {
    const newResources = resourceBuilder().addResources(newVal)
    const currentResources = resourceBuilder().addResources(
      route.params.modelId as string
    )
    if (newResources.toString() === currentResources.toString()) return

    const modelId = newResources.toString()
    await router.push(
      () => ({
        params: { modelId },
        query: route.query,
        hash: route.hash
      }),
      {
        skipIf: (to) => {
          if (to.params.modelId !== modelId) return false
          if (to.query !== route.query) return false
          if (to.hash !== route.hash) return false
          return true
        }
      }
    )
  },
  initialState: route.params.modelId as string,
  asyncRead: false
})

const initParams = computed(
  (): UseSetupViewerParams => ({
    projectId,
    resourceIdString
  })
)

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
