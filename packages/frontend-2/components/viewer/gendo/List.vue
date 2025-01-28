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

const logger = useLogger()

const versionId = computed(() => {
  return resourceItems.value[0].versionId as string
})

const { result, subscribeToMore, refetch } = useQuery(getGendoAIRenders, () => {
  logger.debug('🔍 [GendoList] Query setup:', {
    projectId: projectId.value,
    versionId: versionId.value,
    timestamp: new Date().toISOString()
  })
  return {
    projectId: projectId.value,
    versionId: versionId.value
  }
})

const { onResult: onRenderCreated } = useSubscription(onGendoAiRenderCreated, () => {
  logger.debug('📡 [GendoList] Subscription setup:', {
    id: projectId.value,
    versionId: versionId.value,
    timestamp: new Date().toISOString()
  })
  return {
    id: projectId.value,
    versionId: versionId.value
  }
})

onMounted(() => {
  logger.debug('🎬 [GendoList] Component mounted', {
    timestamp: new Date().toISOString()
  })
})

onRenderCreated((result) => {
  logger.debug('🔔 [GendoList] onRenderCreated event:', {
    data: result.data,
    timestamp: new Date().toISOString()
  })
  refetch()
})

subscribeToMore(() => ({
  document: onGendoAiRenderCreated,
  variables: {
    id: projectId.value,
    versionId: versionId.value
  },
  updateQuery: (previousResult, { subscriptionData }) => {
    logger.debug('🔄 [GendoList] subscribeToMore updateQuery:', {
      subscriptionData,
      previousResult,
      timestamp: new Date().toISOString()
    })
    refetch()
    return previousResult
  }
}))

const renders = computed(() => {
  const items = result.value?.project?.version?.gendoAIRenders?.items
  logger.debug('📊 [GendoList] Renders computed:', {
    itemCount: items?.length || 0,
    items: items?.map((i) => i?.id),
    timestamp: new Date().toISOString()
  })
  return (items || []) as GendoAiRender[]
})
</script>
