<template>
  <ViewerStateSetup :init-params="initParams" @setup="(state) => emit('setup', state)">
    <PresentationViewerPostSetup>
      <PresentationViewerSetup />
    </PresentationViewerPostSetup>
  </ViewerStateSetup>
</template>
<script setup lang="ts">
import { resourceBuilder } from '@speckle/shared/viewer/route'
import { writableAsyncComputed } from '~/lib/common/composables/async'
import { graphql } from '~/lib/common/generated/gql/gql'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'
import type {
  InjectableViewerState,
  UseSetupViewerParams
} from '~~/lib/viewer/composables/setup'

/**
 * Don't put much logic here, the viewer state is unavailable here so do as much as u can in PresentationViewerSetup instead
 */

graphql(`
  fragment PresentationViewerPageWrapper_SavedViewGroup on SavedViewGroup {
    id
    views(input: $input) {
      totalCount
      items {
        id
        resourceIdString
      }
    }
  }
`)

const emit = defineEmits<{
  (e: 'setup', state: InjectableViewerState): void
}>()

const {
  projectId,
  viewer: { resourceIdString: coreResourceIdString },
  ui: { slide }
} = useInjectedPresentationState()
const route = useRoute()

// Resolved from the presentation's views, but also has to be at least somewhat mutable
// cause some viewer internals try to change it
const resourceIdString = writableAsyncComputed({
  get: () => coreResourceIdString.value,
  set: async (newVal) => {
    const newResources = resourceBuilder().addResources(newVal).toString()
    const currentResources = coreResourceIdString.value
    if (newResources === currentResources) return

    // we don't want this to happen, so lets log it
    // to see the cause and make it not do that
    devTrace('Unexpected resourceIdString mutation', {
      newVal: newResources,
      oldVal: currentResources
    })
  },
  initialState: route.params.modelId as string,
  asyncRead: false
})

const savedViewId = computed({
  get: () => slide.value?.id || null,
  set: (newVal) => {
    // we don't want this to happen, so lets log it
    // to see the cause and make it not do that
    devTrace('Unexpected savedViewId mutation', { newVal, oldVal: slide.value?.id })
  }
})

const loadOriginal = ref(false)

const initParams = computed(
  (): UseSetupViewerParams => ({
    projectId,
    resourceIdString,
    pageType: ViewerRenderPageType.Presentation,
    savedView: {
      id: savedViewId,
      loadOriginal
    }
  })
)
</script>
