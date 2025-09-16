<template>
  <ViewerStateSetup :init-params="initParams" @setup="emit('setup', $event)">
    <ViewerPageSetup />
  </ViewerStateSetup>
</template>
<script setup lang="ts">
import { resourceBuilder } from '@speckle/shared/viewer/route'
import { writableAsyncComputed } from '~/lib/common/composables/async'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'
import type {
  InjectableViewerState,
  UseSetupViewerParams
} from '~~/lib/viewer/composables/setup'

/**
 * Only point of this is to prepare state so that ViewerPageSetup can inject and use it properly
 */

const emit = defineEmits<{
  setup: [InjectableViewerState]
}>()

const route = useRoute()
const router = useSafeRouter()

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
    resourceIdString,
    pageType: ViewerRenderPageType.Viewer
  })
)
</script>
