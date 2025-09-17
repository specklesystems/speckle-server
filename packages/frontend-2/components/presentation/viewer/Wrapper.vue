<template>
  <ViewerStateSetup :init-params="initParams">
    <PresentationViewerSetup />
  </ViewerStateSetup>
</template>
<script setup lang="ts">
import { resourceBuilder } from '@speckle/shared/viewer/route'
import { writableAsyncComputed } from '~/lib/common/composables/async'
import { graphql } from '~/lib/common/generated/gql/gql'
import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'
import type { UseSetupViewerParams } from '~~/lib/viewer/composables/setup'

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

const {
  projectId,
  viewer: { resourceIdString: coreResourceIdString }
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

    // what's triggering mutation? we don't want this to happen, so lets log it
    // to see the cause
    devTrace('resourceIdString mutation triggered', {
      newVal: newResources,
      oldVal: currentResources
    })
  },
  initialState: route.params.modelId as string,
  asyncRead: false
})

const initParams = computed(
  (): UseSetupViewerParams => ({
    projectId,
    resourceIdString,
    pageType: ViewerRenderPageType.Presentation
  })
)
</script>
