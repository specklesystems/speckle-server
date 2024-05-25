<template>
  <div class="space-y-4 mt-4">
    <ViewerGendoItem
      v-for="render in renders"
      :key="render?.id"
      :render-request="render"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import {
  getGendoAIRenders,
  onGendoAiRenderCreated
} from '~/lib/gendo/graphql/queriesAndMutations'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
const {
  projectId,
  resources: {
    response: { resourceItems }
  },
  viewer: { instance: viewerInstance }
} = useInjectedViewerState()

const versionId = computed(() => {
  return resourceItems.value[0].versionId as string
})

const { result, subscribeToMore, refetch } = useQuery(getGendoAIRenders, () => ({
  projectId: projectId.value,
  versionId: versionId.value
}))

const { onResult: onRenderCreated } = useSubscription(onGendoAiRenderCreated, () => ({
  id: projectId.value,
  versionId: versionId.value
}))

onRenderCreated(() => {
  refetch()
})

subscribeToMore(() => ({
  document: onGendoAiRenderCreated,
  variables: {
    id: projectId.value,
    versionId: versionId.value
  },
  updateQuery: (previousResult, { subscriptionData }) => {
    refetch()
    return previousResult
  }
}))

const renders = computed(() => {
  return result.value?.project?.version?.gendoAIRenders?.items || []
})
</script>
