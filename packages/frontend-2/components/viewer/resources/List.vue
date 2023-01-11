<template>
  <div class="p-2 space-y-2">
    <div v-for="{ model, versionId } in modelsAndVersionIds" :key="model.id">
      <ViewerResourcesModelCard :model="model" :version-id="versionId" />
    </div>
    <!-- Basic object cards for now -->
    <div
      v-for="{ objectId } in objectResources"
      :key="objectId"
      class="px-1 py-2 flex flex-col items-center bg-foundation shadow-md rounded-md"
    >
      <div>Object w/ ID:</div>
      <span>{{ objectId }}</span>
    </div>
    <button
      class="group flex w-full rounded-md items-center text-primary text-xs px-2 py-1 transition hover:bg-foundation-focus dark:hover:bg-primary-muted"
    >
      +
      <span class="font-bold ml-1">Add Model</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import {
  useInjectedViewer,
  useResolvedViewerResources
} from '~~/lib/viewer/composables/viewer'
import { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { viewerModelCardsQuery } from '~~/lib/viewer/graphql/queries'

const { projectId } = useInjectedViewer()
const { resourceItems } = useResolvedViewerResources()
const nonObjectResources = computed(() =>
  resourceItems.value.filter(
    (r): r is ViewerResourceItem & { modelId: string; versionId: string } => !!r.modelId
  )
)

const objectResources = computed(() =>
  resourceItems.value.filter((i) => !i.modelId && !i.versionId)
)

const { result: modelsResult } = useQuery(viewerModelCardsQuery, () => ({
  projectId: projectId.value,
  modelIds: nonObjectResources.value.map((r) => r.modelId),
  versionIds: nonObjectResources.value.map((r) => r.versionId)
}))

const models = computed(() => modelsResult.value?.project?.models?.items || [])

const modelsAndVersionIds = computed(() =>
  models.value.map((m) => ({
    model: m,
    versionId: nonObjectResources.value.find((r) => r.modelId === m.id)?.versionId || ''
  }))
)
</script>
