<template>
  <div class="presentation-viewer-wrapper">
    <ViewerPreSetupWrapper :init-params="initParams" />
  </div>
</template>
<script setup lang="ts">
import { resourceBuilder } from '@speckle/shared/viewer/route'
import { writableAsyncComputed } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { PresentationViewerWrapper_SavedViewGroupFragment } from '~/lib/common/generated/gql/graphql'
import type { UseSetupViewerParams } from '~/lib/viewer/composables/setup'
import { ViewerRenderPageType } from '~/lib/viewer/helpers/state'

graphql(`
  fragment PresentationViewerWrapper_SavedViewGroup on SavedViewGroup {
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

const props = defineProps<{
  group: PresentationViewerWrapper_SavedViewGroupFragment
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

// the real target to load based on active presentation & slides
const coreResourceIdString = computed(() =>
  resourceBuilder()
    .addResources(props.group.views.items[0]?.resourceIdString || '')
    .toString()
)

// Resolved from the presentation's views, but also has to be at least somewhat mutable
// cause some viewer internals try to change it
const resourceIdString = writableAsyncComputed({
  get: () => coreResourceIdString.value,
  set: async (newVal) => {
    const newResources = resourceBuilder().addResources(newVal)
    const currentResources = coreResourceIdString.value
    if (newResources.toString() === currentResources.toString()) return

    // what's triggering mutation? we don't want this to happen, so lets log it
    // to see the cause
    devTrace('resourceIdString mutation triggered', {
      newVal,
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
