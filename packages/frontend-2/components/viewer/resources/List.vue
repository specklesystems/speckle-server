<template>
  <div class="p-2 flex justify-between">
    <div class="text-sm font-bold text-foreground-2">Models</div>
    <div>
      <FormButton size="sm" text :icon-left="PlusIcon">Add Model</FormButton>
    </div>
  </div>
  <div class="p-2 space-y-2">
    <div v-for="{ modelId, versionId } in nonObjectResources" :key="modelId">
      <ViewerResourcesModelCard :model-id="modelId" :version-id="versionId" />
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
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/24/solid'
import { useResolvedViewerResources } from '~~/lib/viewer/composables/viewer'
import { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'

const { resourceItems } = useResolvedViewerResources()
const nonObjectResources = computed(() =>
  resourceItems.value.filter(
    (r): r is ViewerResourceItem & { modelId: string; versionId: string } => !!r.modelId
  )
)

const objectResources = computed(() =>
  resourceItems.value.filter((i) => !i.modelId && !i.versionId)
)
</script>
