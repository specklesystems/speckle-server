<template>
  <div
    class="flex flex-col gap-y-2 max-h-56 overflow-y-scroll overflow-x-hidden simple-scroll"
  >
    <ViewerGendoItem
      v-for="render in renders"
      :key="render?.id"
      :render-request="render"
      @reuse-prompt="$emit('reuse-prompt', $event)"
    />
  </div>
</template>
<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import type { GendoAiRender } from '~/lib/common/generated/gql/graphql'
import {
  getGendoAIRenders,
  onGendoAiRenderCreated
} from '~/lib/gendo/graphql/queriesAndMutations'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

defineEmits<{
  (e: 'reuse-prompt', prompt: string): void
}>()

const {
  projectId,
  resources: {
    response: { resourceItems }
  }
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
  updateQuery: (previousResult) => {
    refetch()
    return previousResult
  }
}))

const renders = computed(() => {
  return (result.value?.project?.version?.gendoAIRenders?.items ||
    []) as GendoAiRender[]
})
</script>
