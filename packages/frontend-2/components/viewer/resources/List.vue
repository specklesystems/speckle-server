<template>
  <div class="p-2 space-y-2">
    <template v-if="resourceItems.length">
      <div v-for="{ model, versionId } in modelsAndVersionIds" :key="model.id">
        <ViewerResourcesModelCard :model="model" :version-id="versionId" />
      </div>
      <!-- Basic object cards for now -->
      <div
        v-for="{ objectId } in objects"
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
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

const { resourceItems, objects, modelsAndVersionIds } =
  useInjectedViewerLoadedResources()
</script>
