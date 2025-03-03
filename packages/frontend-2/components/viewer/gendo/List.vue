<template>
  <div
    v-if="renders.length"
    class="flex flex-col gap-y-2 max-h-[calc(100dvh-22rem)] overflow-y-auto overflow-x-hidden simple-scrollbar mb-3"
  >
    <ViewerGendoItem
      v-for="render in renders"
      :key="render?.id"
      :render-request="render"
      @reuse-prompt="$emit('reuse-prompt', $event)"
    />
  </div>
  <div v-else />
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

const { result, refetch } = useQuery(getGendoAIRenders, () => ({
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

const renders = computed(() => {
  return (result.value?.project?.version?.gendoAIRenders?.items ||
    []) as GendoAiRender[]
})
</script>
