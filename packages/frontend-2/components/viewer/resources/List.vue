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
        v-for="{ objectId } in objectResourceItems"
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
import { useInjectLoadedViewerResources } from '~~/lib/viewer/composables/viewer'

const { resourceItems, objectResourceItems, modelsAndVersionIds } =
  useInjectLoadedViewerResources()
</script>
