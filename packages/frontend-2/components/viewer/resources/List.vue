<template>
  <div class="p-2 flex justify-between">
    <div class="text-sm font-bold text-foreground-2">Models</div>
    <div>
      <FormButton size="sm" text :icon-left="PlusIcon">Add Model</FormButton>
    </div>
  </div>
  <div class="p-2 space-y-2">
    <template v-if="resourceItems.length">
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
    </template>
    <template v-else>No resources loaded</template>
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'
import {
  useInjectedViewer,
  useResolvedViewerResources
} from '~~/lib/viewer/composables/viewer'
import { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { viewerModelCardsQuery } from '~~/lib/viewer/graphql/queries'
import type { SetNonNullable } from 'type-fest'

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
  nonObjectResources.value
    .map((r) => ({
      versionId: r.versionId,
      model: models.value.find((m) => m.id === r.modelId)
    }))
    .filter((o): o is SetNonNullable<typeof o, 'model'> => !!(o.versionId && o.model))
)
</script>
